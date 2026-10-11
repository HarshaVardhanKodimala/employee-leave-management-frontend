
import { useEffect, useMemo, useState } from "react";
import api from "../api/api";

function AdminLeaveTypes() {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [name, setName] = useState("");
  const [defaultDays, setDefaultDays] = useState("12");
  const [paid, setPaid] = useState(true);
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadLeaveTypes();
  }, []);

  function getError(err, fallback) {
    const data = err.response?.data;

    if (typeof data === "string") return data;
    return data?.message || data?.error || fallback;
  }

  async function loadLeaveTypes() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/api/leave-types");

      setLeaveTypes(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      setError(
        getError(err, "Unable to load leave types. Check the backend.")
      );
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setName("");
    setDefaultDays("12");
    setPaid(true);
    setDescription("");
    setEditingId(null);
  }

  function handleEdit(item) {
    setEditingId(item.id);
    setName(item.name || "");
    setDefaultDays(String(item.defaultDays ?? 12));
    setPaid(Boolean(item.paid));
    setDescription(item.description || "");
    setError("");
    setMessage("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedName = name.trim();
    const days = Number(defaultDays);

    if (!trimmedName) {
      setError("Leave type name is required.");
      return;
    }

    if (!Number.isInteger(days) || days < 0 || days > 365) {
      setError("Default days must be a whole number between 0 and 365.");
      return;
    }

    const isEditing = editingId !== null;

    const data = {
      name: trimmedName,
      defaultDays: days,
      paid,
      description: description.trim(),
    };

    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (isEditing) {
        await api.put(`/api/leave-types/${editingId}`, data);
      } else {
        await api.post("/api/leave-types", data);
      }

      resetForm();
      await loadLeaveTypes();

      setMessage(
        isEditing
          ? "Leave type updated successfully."
          : "Leave type added successfully."
      );
    } catch (err) {
      setError(
        getError(
          err,
          isEditing
            ? "Unable to update leave type. Check the backend API."
            : "Unable to add leave type. Check the backend API."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(
      `Delete "${item.name}"? Existing leave requests or balances may depend on this type.`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await api.delete(`/api/leave-types/${item.id}`);

      setLeaveTypes((current) =>
        current.filter((type) => type.id !== item.id)
      );

      if (editingId === item.id) {
        resetForm();
      }

      setMessage("Leave type deleted successfully.");
    } catch (err) {
      setError(
        getError(
          err,
          "Unable to delete this leave type. It may be used by existing records, or the backend delete endpoint may not exist."
        )
      );
    }
  }

  const filteredLeaveTypes = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return leaveTypes;

    return leaveTypes.filter((item) => {
      return (
        String(item.id).includes(query) ||
        (item.name || "").toLowerCase().includes(query) ||
        (item.description || "").toLowerCase().includes(query) ||
        (item.paid ? "paid" : "unpaid").includes(query) ||
        String(item.defaultDays).includes(query)
      );
    });
  }, [leaveTypes, search]);

  const paidCount = leaveTypes.filter((item) => item.paid).length;
  const unpaidCount = leaveTypes.length - paidCount;

  function initials(value) {
    return (value || "L")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("");
  }

  return (
    <main className="alt-page">
      <header className="alt-header">
        <div>
          <div className="alt-eyebrow">LEAVE POLICY ADMINISTRATION</div>
          <h1>Leave Type Management</h1>
          <p>
            Configure leave categories, yearly allowances, and paid or
            unpaid leave policies.
          </p>
        </div>

        <button
          type="button"
          className="alt-button alt-button-secondary"
          onClick={loadLeaveTypes}
          disabled={loading}
        >
          <span aria-hidden="true">↻</span>
          {loading ? "Refreshing..." : "Refresh data"}
        </button>
      </header>

      {error && (
        <div className="alt-alert alt-alert-error" role="alert">
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
        <div className="alt-alert alt-alert-success" role="status">
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

      <section className="alt-stats">
        <article className="alt-stat-card">
          <div className="alt-stat-icon alt-stat-blue">▤</div>
          <div>
            <p>Total leave types</p>
            <h2>{leaveTypes.length}</h2>
            <span>Configured leave policies</span>
          </div>
        </article>

        <article className="alt-stat-card">
          <div className="alt-stat-icon alt-stat-green">✓</div>
          <div>
            <p>Paid leave types</p>
            <h2>{paidCount}</h2>
            <span>Policies marked as paid</span>
          </div>
        </article>

        <article className="alt-stat-card">
          <div className="alt-stat-icon alt-stat-orange">◷</div>
          <div>
            <p>Unpaid leave types</p>
            <h2>{unpaidCount}</h2>
            <span>Policies marked as unpaid</span>
          </div>
        </article>
      </section>

      <section className="alt-panel alt-form-panel">
        <div className="alt-panel-heading">
          <div className="alt-heading-icon">
            {editingId !== null ? "✎" : "＋"}
          </div>

          <div>
            <h2>
              {editingId !== null
                ? "Edit leave policy"
                : "Create a leave policy"}
            </h2>
            <p>
              {editingId !== null
                ? "Update the settings for this leave type."
                : "Define a leave category and its default annual allowance."}
            </p>
          </div>

          {editingId !== null && (
            <span className="alt-edit-badge">EDITING</span>
          )}
        </div>

        <form className="alt-form" onSubmit={handleSubmit}>
          <div className="alt-field">
            <label htmlFor="leaveName">
              Leave type name <span>*</span>
            </label>
            <input
              id="leaveName"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Sick Leave"
              maxLength={100}
              required
            />
            <small>Use a clear, recognizable policy name.</small>
          </div>

          <div className="alt-field">
            <label htmlFor="defaultDays">
              Default annual allowance <span>*</span>
            </label>

            <div className="alt-number-input">
              <input
                id="defaultDays"
                type="number"
                min="0"
                max="365"
                step="1"
                value={defaultDays}
                onChange={(event) => setDefaultDays(event.target.value)}
                required
              />
              <span>days / year</span>
            </div>

            <small>
              Between 0 and 365 days. This is the default policy value.
            </small>
          </div>

          <div className="alt-field alt-description-field">
            <label htmlFor="leaveDescription">Policy description</label>
            <textarea
              id="leaveDescription"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe when employees can use this leave..."
              rows={3}
            />
            <small>Explain the purpose or eligibility of this leave.</small>
          </div>

          <div className="alt-paid-setting">
            <div className="alt-paid-copy">
              <div className="alt-paid-icon">₹</div>
              <div>
                <strong>Paid leave policy</strong>
                <p>
                  {paid
                    ? "This leave type is marked as paid."
                    : "This leave type is marked as unpaid."}
                </p>
              </div>
            </div>

            <label className="alt-switch" htmlFor="paidLeave">
              <input
                id="paidLeave"
                type="checkbox"
                checked={paid}
                onChange={(event) => setPaid(event.target.checked)}
              />
              <span className="alt-switch-track" />
              <span className="alt-switch-label">
                {paid ? "Paid" : "Unpaid"}
              </span>
            </label>
          </div>

          <div className="alt-form-actions">
            <button
              type="submit"
              className="alt-button alt-button-primary"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId !== null
                  ? "Save changes"
                  : "＋ Create leave type"}
            </button>

            {editingId !== null && (
              <button
                type="button"
                className="alt-button alt-button-secondary"
                onClick={() => {
                  resetForm();
                  setError("");
                  setMessage("");
                }}
                disabled={saving}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="alt-panel alt-directory-panel">
        <div className="alt-directory-header">
          <div>
            <h2>Leave policy directory</h2>
            <p>
              Review, search, and manage configured leave categories.
            </p>
          </div>

          <span className="alt-count-badge">
            {filteredLeaveTypes.length} of {leaveTypes.length}
          </span>
        </div>

        <div className="alt-toolbar">
          <div className="alt-search">
            <span aria-hidden="true">⌕</span>
            <input
              aria-label="Search leave types"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, description, allowance, or paid status..."
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
          <div className="alt-loading">
            <div className="alt-spinner" />
            <p>Loading leave policies...</p>
          </div>
        ) : (
          <div className="alt-table-wrap">
            <table className="alt-table">
              <thead>
                <tr>
                  <th>Leave type</th>
                  <th>Annual allowance</th>
                  <th>Payment status</th>
                  <th>Description</th>
                  <th className="alt-actions-heading">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredLeaveTypes.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="alt-leave-cell">
                        <div className="alt-avatar">
                          {initials(item.name)}
                        </div>

                        <div className="alt-leave-info">
                          <strong>{item.name}</strong>
                          <span>Policy ID: #{item.id}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="alt-days-cell">
                        <strong>{item.defaultDays ?? 0}</strong>
                        <span>days / year</span>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`alt-status ${
                          item.paid ? "alt-status-paid" : "alt-status-unpaid"
                        }`}
                      >
                        <span className="alt-status-dot" />
                        {item.paid ? "Paid leave" : "Unpaid leave"}
                      </span>
                    </td>

                    <td>
                      <div className="alt-description">
                        {item.description || (
                          <span className="alt-no-description">
                            No description provided
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="alt-row-actions">
                        <button
                          type="button"
                          className="alt-button alt-button-edit"
                          onClick={() => handleEdit(item)}
                        >
                          ✎ Edit
                        </button>

                        <button
                          type="button"
                          className="alt-button alt-button-delete"
                          onClick={() => handleDelete(item)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredLeaveTypes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="alt-empty">
                      <div className="alt-empty-icon">▤</div>
                      <strong>
                        {search
                          ? "No matching leave policies"
                          : "No leave types configured"}
                      </strong>
                      <p>
                        {search
                          ? "Try a different search term."
                          : "Create your first leave type using the form above."}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <footer className="alt-table-footer">
          <span>
            Showing {filteredLeaveTypes.length} leave type
            {filteredLeaveTypes.length === 1 ? "" : "s"}
          </span>
          <span>Leave policy administration</span>
        </footer>
      </section>
    </main>
  );
}

export default AdminLeaveTypes;
