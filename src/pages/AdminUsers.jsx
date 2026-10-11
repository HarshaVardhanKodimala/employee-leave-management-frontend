
import { useEffect, useState } from "react";
import api from "../api/api";


const roles = ["EMPLOYEE", "MANAGER", "ADMIN"];

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "EMPLOYEE",
  });

  useEffect(() => {
    loadData();
  }, []);

  function getError(err, fallback) {
    const data = err.response?.data;
    if (typeof data === "string") return data;
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    return fallback;
  }

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [usersResponse, departmentsResponse] =
        await Promise.all([
          api.get("/api/users"),
          api.get("/api/departments"),
        ]);

      setUsers(
        Array.isArray(usersResponse.data)
          ? usersResponse.data
          : []
      );

      setDepartments(
        Array.isArray(departmentsResponse.data)
          ? departmentsResponse.data
          : []
      );
    } catch (err) {
      setError(
        getError(err, "Could not load users or departments.")
      );
    } finally {
      setLoading(false);
    }
  }

  function handleFormChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function createUser(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (
      !form.fullName.trim() ||
      !form.email.trim() ||
      !form.password
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    setSaving(true);

    try {
      await api.post("/api/users", {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });

      setForm({
        fullName: "",
        email: "",
        password: "",
        role: "EMPLOYEE",
      });

      setMessage("User created successfully.");
      await loadData();
    } catch (err) {
      setError(getError(err, "Could not create the user."));
    } finally {
      setSaving(false);
    }
  }

  async function updateRole(user, role) {
    if (user.role === role) return;

    setError("");
    setMessage("");

    try {
      await api.put(
        `/api/users/${user.id}/role`,
        null,
        { params: { role } }
      );

      setMessage(`Role updated for ${user.fullName}.`);
      await loadData();
    } catch (err) {
      setError(
        getError(err, "Could not update the user's role.")
      );
      await loadData();
    }
  }

  async function updateDepartment(user, departmentId) {
    setError("");
    setMessage("");

    try {
      if (departmentId === "") {
        if (user.departmentId == null) return;

        await api.delete(
          `/api/users/${user.id}/department`
        );
      } else {
        if (String(user.departmentId) === departmentId) return;

        await api.put(
          `/api/users/${user.id}/department`,
          null,
          { params: { departmentId } }
        );
      }

      setMessage(`Department updated for ${user.fullName}.`);
      await loadData();
    } catch (err) {
      setError(
        getError(err, "Could not update the department.")
      );
      await loadData();
    }
  }

  async function updateManager(user, managerId) {
    setError("");
    setMessage("");

    try {
      if (managerId === "") {
        if (user.managerId == null) return;

        await api.delete(
          `/api/users/${user.id}/manager`
        );
      } else {
        if (String(user.managerId) === managerId) return;

        await api.put(
          `/api/users/${user.id}/manager`,
          null,
          { params: { managerId } }
        );
      }

      setMessage(
        `Reporting manager updated for ${user.fullName}.`
      );
      await loadData();
    } catch (err) {
      setError(
        getError(err, "Could not update the reporting manager.")
      );
      await loadData();
    }
  }

  async function deleteUser(user) {
    const confirmed = window.confirm(
      `Delete ${user.fullName} (${user.email})? This will remove the user's account and related leave records.`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await api.delete(`/api/users/${user.id}`);
      setMessage(`${user.fullName} deleted successfully.`);
      await loadData();
    } catch (err) {
      setError(
        getError(
          err,
          "Could not delete this user. They may have related leave records."
        )
      );
    }
  }

  const filteredUsers = users.filter((user) => {
    const query = search.toLowerCase();

    const matchesSearch =
      String(user.id).includes(query) ||
      (user.fullName || "").toLowerCase().includes(query) ||
      (user.email || "").toLowerCase().includes(query) ||
      (user.role || "").toLowerCase().includes(query) ||
      (user.departmentName || "").toLowerCase().includes(query) ||
      (user.managerName || "").toLowerCase().includes(query);

    const matchesRole =
      roleFilter === "ALL" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const employeeCount = users.filter(
    (user) => user.role === "EMPLOYEE"
  ).length;

  const managerCount = users.filter(
    (user) => user.role === "MANAGER"
  ).length;

  const adminCount = users.filter(
    (user) => user.role === "ADMIN"
  ).length;

  const managers = users.filter(
    (user) => ["MANAGER", "ADMIN"].includes(user.role)
  );

  function initials(name) {
    return (name || "U")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("");
  }

  return (
    <div className="au-page">
      <header className="au-page-header">
        <div>
          <div className="au-eyebrow">
            WORKFORCE ADMINISTRATION
          </div>
          <h1>User Management</h1>
          <p>
            Create employee accounts, manage permissions, and
            organize reporting relationships.
          </p>
        </div>

        <button
          type="button"
          className="au-button au-button-secondary"
          onClick={loadData}
          disabled={loading}
        >
          <span aria-hidden="true">↻</span>
          {loading ? "Refreshing..." : "Refresh data"}
        </button>
      </header>

      {error && (
        <div className="au-alert au-alert-error" role="alert">
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
        <div className="au-alert au-alert-success" role="status">
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

      <section className="au-stats">
        <article className="au-stat-card">
          <div className="au-stat-icon au-icon-blue">♙</div>
          <div>
            <p>Total users</p>
            <h2>{users.length}</h2>
            <span>Registered accounts</span>
          </div>
        </article>

        <article className="au-stat-card">
          <div className="au-stat-icon au-icon-green">♧</div>
          <div>
            <p>Employees</p>
            <h2>{employeeCount}</h2>
            <span>Employee accounts</span>
          </div>
        </article>

        <article className="au-stat-card">
          <div className="au-stat-icon au-icon-purple">♙</div>
          <div>
            <p>Managers</p>
            <h2>{managerCount}</h2>
            <span>Management accounts</span>
          </div>
        </article>

        <article className="au-stat-card">
          <div className="au-stat-icon au-icon-orange">⚙</div>
          <div>
            <p>Administrators</p>
            <h2>{adminCount}</h2>
            <span>Administrative accounts</span>
          </div>
        </article>
      </section>

      <section className="au-panel au-create-panel">
        <div className="au-panel-heading">
          <div className="au-heading-icon">＋</div>
          <div>
            <h2>Create new user</h2>
            <p>
              Add an account and assign its initial access role.
            </p>
          </div>
        </div>

        <form className="au-create-form" onSubmit={createUser}>
          <div className="au-field">
            <label htmlFor="fullName">Full name</label>
            <input
              id="fullName"
              name="fullName"
              value={form.fullName}
              onChange={handleFormChange}
              placeholder="e.g. Harsha Vardhan"
              autoComplete="name"
              required
            />
          </div>

          <div className="au-field">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleFormChange}
              placeholder="name@company.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="au-field">
            <label htmlFor="password">Temporary password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleFormChange}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          <div className="au-field">
            <label htmlFor="role">Initial role</label>
            <select
              id="role"
              name="role"
              value={form.role}
              onChange={handleFormChange}
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div className="au-form-action">
            <button
              type="submit"
              className="au-button au-button-primary"
              disabled={saving}
            >
              {saving ? "Creating account..." : "＋ Create user"}
            </button>
          </div>
        </form>

        <div className="au-security-note">
          <span aria-hidden="true">ⓘ</span>
          Share temporary passwords securely. Passwords are not
          displayed in the user directory.
        </div>
      </section>

      <section className="au-panel au-directory-panel">
        <div className="au-directory-header">
          <div>
            <h2>Employee directory</h2>
            <p>
              View accounts and manage roles, departments, and
              reporting managers.
            </p>
          </div>

          <span className="au-count-badge">
            {filteredUsers.length} of {users.length} users
          </span>
        </div>

        <div className="au-toolbar">
          <div className="au-search">
            <span aria-hidden="true">⌕</span>
            <input
              aria-label="Search users"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, role or department..."
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

          <select
            className="au-filter"
            aria-label="Filter users by role"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
          >
            <option value="ALL">All roles</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="au-loading">
            <div className="au-spinner" />
            <p>Loading employee directory...</p>
          </div>
        ) : (
          <div className="au-table-wrap">
            <table className="au-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Reporting manager</th>
                  <th className="au-actions-heading">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="au-person">
                        <div className="au-avatar">
                          {initials(user.fullName)}
                        </div>
                        <div className="au-person-info">
                          <strong>{user.fullName}</strong>
                          <span>{user.email}</span>
                          <small>Employee ID: {user.id}</small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="au-role-cell">
                        <span
                          className={`au-role-badge au-role-${(
                            user.role || "EMPLOYEE"
                          ).toLowerCase()}`}
                        >
                          {user.role || "EMPLOYEE"}
                        </span>
                        <select
                          aria-label={`Change role for ${user.fullName}`}
                          value={user.role || "EMPLOYEE"}
                          onChange={(event) =>
                            updateRole(user, event.target.value)
                          }
                        >
                          {roles.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>

                    <td>
                      <select
                        aria-label={`Department for ${user.fullName}`}
                        className="au-table-select"
                        value={user.departmentId ?? ""}
                        onChange={(event) =>
                          updateDepartment(user, event.target.value)
                        }
                      >
                        <option value="">Unassigned</option>
                        {departments.map((department) => (
                          <option
                            key={department.id}
                            value={department.id}
                          >
                            {department.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>
                      <select
                        aria-label={`Manager for ${user.fullName}`}
                        className="au-table-select"
                        value={user.managerId ?? ""}
                        onChange={(event) =>
                          updateManager(user, event.target.value)
                        }
                      >
                        <option value="">Unassigned</option>
                        {managers
                          .filter((manager) => manager.id !== user.id)
                          .map((manager) => (
                            <option
                              key={manager.id}
                              value={manager.id}
                            >
                              {manager.fullName}
                            </option>
                          ))}
                      </select>
                    </td>

                    <td className="au-actions-cell">
                      <button
                        type="button"
                        className="au-button au-button-danger"
                        onClick={() => deleteUser(user)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="au-empty">
                      <div className="au-empty-icon">⌕</div>
                      <strong>No users found</strong>
                      <p>
                        Try another search term or change the role filter.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="au-table-footer">
          <span>
            Showing {filteredUsers.length} of {users.length} accounts
          </span>
          <span>Employee account administration</span>
        </div>
      </section>
    </div>
  );
}

export default AdminUsers;
