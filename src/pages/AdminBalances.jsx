
import { useEffect, useMemo, useState } from "react";
import api from "../api/api";


function AdminBalances() {
  const [balances, setBalances] = useState([]);
  const [users, setUsers] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);

  const [userId, setUserId] = useState("");
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [totalDays, setTotalDays] = useState("12");

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  function getError(err, fallback) {
    const data = err.response?.data;

    if (typeof data === "string") return data;
    return data?.message || data?.error || fallback;
  }

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [balanceResponse, userResponse, typeResponse] =
        await Promise.all([
          api.get("/api/leave-balances"),
          api.get("/api/users"),
          api.get("/api/leave-types"),
        ]);

      setBalances(
        Array.isArray(balanceResponse.data)
          ? balanceResponse.data
          : []
      );

      setUsers(
        (Array.isArray(userResponse.data) ? userResponse.data : [])
          .filter((user) => user.role === "EMPLOYEE")
      );

      setLeaveTypes(
        Array.isArray(typeResponse.data) ? typeResponse.data : []
      );
    } catch (err) {
      setError(
        getError(
          err,
          "Unable to load balances. Check the API endpoints and admin permissions."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const days = Number(totalDays);

    if (!userId || !leaveTypeId) {
      setError("Please select an employee and leave type.");
      return;
    }

    if (!Number.isInteger(days) || days < 0 || days > 365) {
      setError(
        "Allocated days must be a whole number between 0 and 365."
      );
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await api.post("/api/leave-balances", {
        user: { id: Number(userId) },
        leaveType: { id: Number(leaveTypeId) },
        totalDays: days,
      });

      setMessage("Leave balance saved successfully.");
      setUserId("");
      setLeaveTypeId("");
      setTotalDays("12");

      await loadData();
    } catch (err) {
      setError(
        getError(
          err,
          "Unable to save the balance. Check the backend response."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  function getUserName(balance) {
    return (
      balance.user?.fullName ||
      balance.user?.name ||
      "Unknown employee"
    );
  }

  function getUserEmail(balance) {
    return balance.user?.email || "";
  }

  function getLeaveTypeName(balance) {
    return balance.leaveType?.name || "Unknown leave type";
  }

  function getUsedDays(balance) {
    return Number(balance.usedDays ?? balance.takenDays ?? 0);
  }

  function getTotalDays(balance) {
    return Number(balance.totalDays ?? balance.allocatedDays ?? 0);
  }

  function getRemainingDays(balance) {
    return Math.max(
      0,
      Number(
        balance.remainingDays ??
          getTotalDays(balance) - getUsedDays(balance)
      )
    );
  }

  function getUsagePercent(balance) {
    const total = getTotalDays(balance);

    if (total <= 0) return 0;

    return Math.min(
      100,
      Math.round((getUsedDays(balance) / total) * 100)
    );
  }

  function initials(value) {
    return (value || "U")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("");
  }

  const filteredBalances = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return balances;

    return balances.filter((balance) => {
      return (
        getUserName(balance).toLowerCase().includes(query) ||
        getUserEmail(balance).toLowerCase().includes(query) ||
        getLeaveTypeName(balance).toLowerCase().includes(query) ||
        String(getTotalDays(balance)).includes(query) ||
        String(getUsedDays(balance)).includes(query) ||
        String(getRemainingDays(balance)).includes(query)
      );
    });
  }, [balances, search]);

  const totalAllocated = balances.reduce(
    (sum, balance) => sum + getTotalDays(balance),
    0
  );

  const totalUsed = balances.reduce(
    (sum, balance) => sum + getUsedDays(balance),
    0
  );

  const totalRemaining = balances.reduce(
    (sum, balance) => sum + getRemainingDays(balance),
    0
  );

  return (
    <main className="ab-page">
      <header className="ab-header">
        <div>
          <div className="ab-eyebrow">WORKFORCE BENEFITS ADMINISTRATION</div>
          <h1>Leave Balance Management</h1>
          <p>
            Allocate leave allowances and monitor employee leave
            consumption across your organization.
          </p>
        </div>

        <button
          type="button"
          className="ab-button ab-button-secondary"
          onClick={loadData}
          disabled={loading}
        >
          <span aria-hidden="true">↻</span>
          {loading ? "Refreshing..." : "Refresh data"}
        </button>
      </header>

      {error && (
        <div className="ab-alert ab-alert-error" role="alert">
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
        <div className="ab-alert ab-alert-success" role="status">
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

      <section className="ab-stats">
        <article className="ab-stat-card">
          <div className="ab-stat-icon ab-icon-blue">▤</div>
          <div>
            <p>Total allocations</p>
            <h2>{balances.length}</h2>
            <span>Employee leave records</span>
          </div>
        </article>

        <article className="ab-stat-card">
          <div className="ab-stat-icon ab-icon-purple">◫</div>
          <div>
            <p>Days allocated</p>
            <h2>{totalAllocated}</h2>
            <span>Total allowance across records</span>
          </div>
        </article>

        <article className="ab-stat-card">
          <div className="ab-stat-icon ab-icon-orange">◷</div>
          <div>
            <p>Days used</p>
            <h2>{totalUsed}</h2>
            <span>Recorded leave consumption</span>
          </div>
        </article>

        <article className="ab-stat-card">
          <div className="ab-stat-icon ab-icon-green">✓</div>
          <div>
            <p>Days remaining</p>
            <h2>{totalRemaining}</h2>
            <span>Available across allocations</span>
          </div>
        </article>
      </section>

      <section className="ab-panel ab-form-panel">
        <div className="ab-panel-heading">
          <div className="ab-heading-icon">＋</div>
          <div>
            <h2>Allocate employee leave</h2>
            <p>
              Select an employee, choose a leave category, and set the
              allowance.
            </p>
          </div>
        </div>

        <form className="ab-form" onSubmit={handleSubmit}>
          <div className="ab-field">
            <label htmlFor="ab-employee">
              Employee <span>*</span>
            </label>

            <select
              id="ab-employee"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              required
            >
              <option value="">Select an employee</option>

              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName || user.name || user.email}
                  {user.email ? ` (${user.email})` : ""}
                </option>
              ))}
            </select>

            <small>Only employees are listed here.</small>
          </div>

          <div className="ab-field">
            <label htmlFor="ab-leave-type">
              Leave category <span>*</span>
            </label>

            <select
              id="ab-leave-type"
              value={leaveTypeId}
              onChange={(event) => setLeaveTypeId(event.target.value)}
              required
            >
              <option value="">Select a leave type</option>

              {leaveTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                  {type.paid ? " · Paid" : " · Unpaid"}
                </option>
              ))}
            </select>

            <small>Choose the policy for this allocation.</small>
          </div>

          <div className="ab-field">
            <label htmlFor="ab-total-days">
              Allocated days <span>*</span>
            </label>

            <div className="ab-number-input">
              <input
                id="ab-total-days"
                type="number"
                min="0"
                max="365"
                step="1"
                value={totalDays}
                onChange={(event) => setTotalDays(event.target.value)}
                required
              />
              <span>days</span>
            </div>

            <small>Enter a whole number from 0 to 365.</small>
          </div>

          <div className="ab-allocation-note">
            <span className="ab-note-icon">i</span>
            <p>
              <strong>Allocation note</strong>
              <br />
              Check the existing balance before assigning days. Your
              backend determines whether a repeated employee and leave
              type combination creates a new record or updates an existing
              one.
            </p>
          </div>

          <div className="ab-form-actions">
            <button
              type="submit"
              className="ab-button ab-button-primary"
              disabled={saving}
            >
              {saving ? "Saving allocation..." : "＋ Assign leave balance"}
            </button>
          </div>
        </form>
      </section>

      <section className="ab-panel ab-directory-panel">
        <div className="ab-directory-header">
          <div>
            <h2>Employee balance directory</h2>
            <p>
              Review employee allowances, leave usage, and remaining days.
            </p>
          </div>

          <span className="ab-count-badge">
            {filteredBalances.length} of {balances.length} records
          </span>
        </div>

        <div className="ab-toolbar">
          <div className="ab-search">
            <span aria-hidden="true">⌕</span>
            <input
              aria-label="Search employee balances"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search employees, email, leave type..."
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
          <div className="ab-loading">
            <div className="ab-spinner" />
            <p>Loading employee balances...</p>
          </div>
        ) : (
          <div className="ab-table-wrap">
            <table className="ab-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave category</th>
                  <th>Allocated</th>
                  <th>Used</th>
                  <th>Remaining</th>
                  <th>Utilization</th>
                </tr>
              </thead>

              <tbody>
                {filteredBalances.map((balance) => {
                  const used = getUsedDays(balance);
                  const total = getTotalDays(balance);
                  const remaining = getRemainingDays(balance);
                  const percent = getUsagePercent(balance);

                  return (
                    <tr key={balance.id}>
                      <td>
                        <div className="ab-employee-cell">
                          <div className="ab-avatar">
                            {initials(getUserName(balance))}
                          </div>

                          <div className="ab-employee-info">
                            <strong>{getUserName(balance)}</strong>
                            <span>
                              {getUserEmail(balance) ||
                                `Balance ID: #${balance.id}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="ab-type-cell">
                          <span className="ab-type-icon">▤</span>
                          <strong>{getLeaveTypeName(balance)}</strong>
                        </div>
                      </td>

                      <td>
                        <span className="ab-days-value">{total}</span>
                        <span className="ab-days-unit"> days</span>
                      </td>

                      <td>
                        <span className="ab-used-value">{used}</span>
                        <span className="ab-days-unit"> days</span>
                      </td>

                      <td>
                        <span
                          className={`ab-remaining-value ${
                            remaining === 0
                              ? "ab-remaining-empty"
                              : "ab-remaining-available"
                          }`}
                        >
                          {remaining}
                        </span>
                        <span className="ab-days-unit"> days</span>
                      </td>

                      <td>
                        <div className="ab-usage">
                          <div className="ab-usage-label">
                            <span>{percent}%</span>
                            <span>
                              {used} / {total}
                            </span>
                          </div>

                          <div
                            className="ab-usage-track"
                            role="progressbar"
                            aria-label={`${getUserName(balance)} leave usage`}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={percent}
                          >
                            <div
                              className={`ab-usage-fill ${
                                percent >= 90
                                  ? "ab-usage-high"
                                  : percent >= 60
                                    ? "ab-usage-medium"
                                    : "ab-usage-low"
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredBalances.length === 0 && (
                  <tr>
                    <td colSpan={6} className="ab-empty">
                      <div className="ab-empty-icon">▤</div>
                      <strong>
                        {search
                          ? "No matching balance records"
                          : "No employee balances found"}
                      </strong>
                      <p>
                        {search
                          ? "Try a different search term."
                          : "Assign an employee leave balance using the form above."}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <footer className="ab-table-footer">
          <span>
            Showing {filteredBalances.length} balance
            {filteredBalances.length === 1 ? "" : " records"}
          </span>
          <span>Employee leave administration</span>
        </footer>
      </section>
    </main>
  );
}

export default AdminBalances;
