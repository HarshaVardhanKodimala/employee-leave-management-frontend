
import { useEffect, useMemo, useState } from "react";
import api from "../api/api";


function AdminDepartments() {
  const [departments, setDepartments] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadDepartments();
  }, []);

  function getError(err, fallback) {
    const data = err.response?.data;

    if (typeof data === "string") return data;
    if (data?.message) return data.message;
    if (data?.error) return data.error;

    return fallback;
  }

  async function loadDepartments() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/api/departments");

      setDepartments(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      setError(
        getError(
          err,
          "Unable to load departments. Please check the backend."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setName("");
    setDescription("");
    setEditingId(null);
    setError("");
    setMessage("");
  }

  function startEditing(department) {
    setEditingId(department.id);
    setName(department.name || "");
    setDescription(department.description || "");
    setError("");
    setMessage("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName) {
      setError("Department name is required.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const wasEditing = editingId !== null;

    try {
      const departmentData = {
        name: trimmedName,
        description: trimmedDescription,
      };

      if (wasEditing) {
        await api.put(
          `/api/departments/${editingId}`,
          departmentData
        );
      } else {
        await api.post("/api/departments", departmentData);
      }

      resetForm();
      setMessage(
        wasEditing
          ? "Department updated successfully."
          : "Department added successfully."
      );

      await loadDepartments();
    } catch (err) {
      setError(
        getError(
          err,
          wasEditing
            ? "Unable to update department. Check the backend API."
            : "Unable to add department. Check the backend API."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteDepartment(department) {
    const confirmed = window.confirm(
      `Delete department "${department.name}"? Only delete departments that are not assigned to employees.`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await api.delete(`/api/departments/${department.id}`);

      setDepartments((current) =>
        current.filter((item) => item.id !== department.id)
      );

      if (editingId === department.id) {
        resetForm();
      }

      setMessage("Department deleted successfully.");
    } catch (err) {
      setError(
        getError(
          err,
          "Unable to delete department. It may be assigned to employees, or the backend delete endpoint may not exist."
        )
      );
    }
  }

  const filteredDepartments = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return departments;

    return departments.filter((department) => {
      return (
        String(department.id).includes(query) ||
        (department.name || "").toLowerCase().includes(query) ||
        (department.description || "").toLowerCase().includes(query)
      );
    });
  }, [departments, search]);

  function initials(value) {
    return (value || "D")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("");
  }

  return (
    <main className="ad-page">
      <header className="ad-header">
        <div>
          <div className="ad-eyebrow">
            WORKFORCE ADMINISTRATION
          </div>

          <h1>Department Management</h1>

          <p>
            Organize your workforce and manage departments across
            your organization.
          </p>
        </div>

        <button
          type="button"
          className="ad-button ad-button-secondary"
          onClick={loadDepartments}
          disabled={loading}
        >
          <span aria-hidden="true">↻</span>
          {loading ? "Refreshing..." : "Refresh data"}
        </button>
      </header>

      {error && (
        <div className="ad-alert ad-alert-error" role="alert">
          <span>!</span>
          <div>{error}</div>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {message && (
        <div className="ad-alert ad-alert-success" role="status">
          <span>✓</span>
          <div>{message}</div>
          <button
            type="button"
            onClick={() => setMessage("")}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      <section className="ad-stats">
        <article className="ad-stat-card">
          <div className="ad-stat-icon ad-icon-blue">▦</div>
          <div>
            <p>Total departments</p>
            <h2>{departments.length}</h2>
            <span>Registered departments</span>
          </div>
        </article>

        <article className="ad-stat-card">
          <div className="ad-stat-icon ad-icon-green">✓</div>
          <div>
            <p>Listed departments</p>
            <h2>{filteredDepartments.length}</h2>
            <span>Matching current search</span>
          </div>
        </article>

        <article className="ad-stat-card">
          <div className="ad-stat-icon ad-icon-purple">＋</div>
          <div>
            <p>Department records</p>
            <h2>{departments.length}</h2>
            <span>Available for administration</span>
          </div>
        </article>
      </section>

      <section className="ad-panel ad-form-panel">
        <div className="ad-panel-heading">
          <div className="ad-heading-icon">
            {editingId !== null ? "✎" : "＋"}
          </div>

          <div>
            <h2>
              {editingId !== null
                ? "Edit department"
                : "Create a department"}
            </h2>

            <p>
              {editingId !== null
                ? "Update the department details below."
                : "Add a department and describe its responsibilities."}
            </p>
          </div>

          {editingId !== null && (
            <span className="ad-edit-badge">EDITING</span>
          )}
        </div>

        <form className="ad-form" onSubmit={handleSubmit}>
          <div className="ad-field">
            <label htmlFor="departmentName">
              Department name <span>*</span>
            </label>

            <input
              id="departmentName"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Human Resources"
              maxLength={100}
              required
            />

            <small>Maximum 100 characters.</small>
          </div>

          <div className="ad-field">
            <label htmlFor="departmentDescription">
              Description
            </label>

            <textarea
              id="departmentDescription"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="Describe the department's responsibilities..."
              rows={4}
            />

            <small>
              Add a short explanation of the department's purpose.
            </small>
          </div>

          <div className="ad-form-actions">
            <button
              type="submit"
              className="ad-button ad-button-primary"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId !== null
                  ? "Save changes"
                  : "＋ Create department"}
            </button>

            {editingId !== null && (
              <button
                type="button"
                className="ad-button ad-button-secondary"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="ad-panel ad-directory-panel">
        <div className="ad-directory-header">
          <div>
            <h2>Department directory</h2>
            <p>
              Search and manage your organization's department records.
            </p>
          </div>

          <span className="ad-count-badge">
            {filteredDepartments.length} of {departments.length}
          </span>
        </div>

        <div className="ad-toolbar">
          <div className="ad-search">
            <span aria-hidden="true">⌕</span>

            <input
              aria-label="Search departments"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search department name or description..."
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="ad-loading">
            <div className="ad-spinner" />
            <p>Loading departments...</p>
          </div>
        ) : (
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Department ID</th>
                  <th>Description</th>
                  <th className="ad-actions-heading">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredDepartments.map((department) => (
                  <tr key={department.id}>
                    <td>
                      <div className="ad-department-cell">
                        <div className="ad-avatar">
                          {initials(department.name)}
                        </div>

                        <div className="ad-department-info">
                          <strong>{department.name}</strong>
                          <span>Organization department</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="ad-id-badge">
                        #{department.id}
                      </span>
                    </td>

                    <td>
                      <div className="ad-description">
                        {department.description || (
                          <span className="ad-no-description">
                            No description provided
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="ad-row-actions">
                        <button
                          type="button"
                          className="ad-button ad-button-edit"
                          onClick={() => startEditing(department)}
                        >
                          ✎ Edit
                        </button>

                        <button
                          type="button"
                          className="ad-button ad-button-delete"
                          onClick={() => deleteDepartment(department)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredDepartments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="ad-empty">
                      <div className="ad-empty-icon">▦</div>
                      <strong>
                        {search
                          ? "No matching departments"
                          : "No departments yet"}
                      </strong>
                      <p>
                        {search
                          ? "Try a different search term."
                          : "Create your first department using the form above."}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <footer className="ad-table-footer">
          <span>
            Showing {filteredDepartments.length} department
            {filteredDepartments.length === 1 ? "" : "s"}
          </span>

          <span>Department administration</span>
        </footer>
      </section>
    </main>
  );
}

export default AdminDepartments;
