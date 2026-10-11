
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const asArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  return [];
};

const statusOf = (leave) =>
  String(leave?.status || "PENDING").toUpperCase();

const formatDate = (value) => {
  if (!value) return "—";

  const parts = String(value).split("T")[0].split("-");

  if (parts.length === 3) {
    return new Date(
      Number(parts[0]),
      Number(parts[1]) - 1,
      Number(parts[2])
    ).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return String(value);
};

function EmployeeDashboard() {
  const { user, refreshKey } = useAuth();

  const [leaves, setLeaves] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [leaveResponse, balanceResponse] = await Promise.all([
        api.get("/api/leave-requests/my"),
        api.get("/api/leave-balances/my"),
      ]);

      setLeaves(asArray(leaveResponse.data));
      setBalances(asArray(balanceResponse.data));
    } catch (err) {
      console.error("Dashboard loading error:", err);

      setError(
        "Unable to load your dashboard. Please refresh or sign in again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload the dashboard when the shared refresh signal changes.
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard, refreshKey]);

  const pending = leaves.filter(
    (leave) => statusOf(leave) === "PENDING"
  ).length;

  const approved = leaves.filter(
    (leave) => statusOf(leave) === "APPROVED"
  ).length;

  const rejected = leaves.filter(
    (leave) => statusOf(leave) === "REJECTED"
  ).length;

  const totalRemaining = balances.reduce(
    (total, balance) =>
      total + (Number(balance.remainingDays) || 0),
    0
  );

  const totalUsed = balances.reduce(
    (total, balance) =>
      total + (Number(balance.usedDays) || 0),
    0
  );

  const recentLeaves = [...leaves]
    .sort((a, b) => {
      const dateA = new Date(a.appliedAt || 0).getTime();
      const dateB = new Date(b.appliedAt || 0).getTime();
      return dateB - dateA;
    })
    .slice(0, 5);

  return (
    <div className="app-layout">
      <Sidebar role="EMPLOYEE" />

      <div className="main-content">
        <Navbar />

        <main className="dashboard-content employee-dashboard">
          <header className="employee-welcome">
            <div>
              <p className="employee-eyebrow">EMPLOYEE PORTAL</p>

              <h1>
                Welcome back
                {user?.fullName ? `, ${user.fullName}` : ""}!
              </h1>

              <p>
                Here’s an overview of your leave and recent activity.
              </p>
            </div>

            <button
              className="employee-refresh"
              onClick={loadDashboard}
              disabled={loading}
              type="button"
            >
              {loading ? "Loading..." : "↻ Refresh"}
            </button>
          </header>

          {error && (
            <div className="employee-alert" role="alert">
              {error}
            </div>
          )}

          <section className="employee-stats-grid">
            <article className="employee-stat-card">
              <div className="employee-stat-icon blue">▦</div>
              <p>Remaining Leave Days</p>
              <h2>{loading ? "—" : totalRemaining}</h2>
              <span>Across your leave balances</span>
            </article>

            <article className="employee-stat-card">
              <div className="employee-stat-icon amber">◷</div>
              <p>Pending Requests</p>
              <h2>{loading ? "—" : pending}</h2>
              <span>Awaiting a decision</span>
            </article>

            <article className="employee-stat-card">
              <div className="employee-stat-icon green">✓</div>
              <p>Approved Requests</p>
              <h2>{loading ? "—" : approved}</h2>
              <span>Successfully approved</span>
            </article>

            <article className="employee-stat-card">
              <div className="employee-stat-icon red">▤</div>
              <p>Total Requests</p>
              <h2>{loading ? "—" : leaves.length}</h2>
              <span>{rejected} rejected</span>
            </article>
          </section>

          <section className="employee-quick-actions">
            <div>
              <h2>Quick Actions</h2>
              <p>Manage your leave in a few clicks.</p>
            </div>

            <div className="employee-action-links">
              <Link
                className="employee-primary-action"
                to="/employee/apply-leave"
              >
                <span>＋</span> Apply for Leave
              </Link>

              <Link to="/employee/leaves">
                View My Leaves <span>→</span>
              </Link>

              <Link to="/employee/balance">
                View Balances <span>→</span>
              </Link>
            </div>
          </section>

          <section className="employee-panel">
            <div className="employee-panel-heading">
              <div>
                <h2>My Leave Balances</h2>
                <p>Track your used and remaining leave days.</p>
              </div>

              <Link to="/employee/balance">View details →</Link>
            </div>

            {loading ? (
              <div className="employee-empty-state">
                Loading balances...
              </div>
            ) : balances.length === 0 ? (
              <div className="employee-empty-state">
                <strong>No leave balances found</strong>
                <p>
                  Your allocated leave balances will appear here.
                </p>
              </div>
            ) : (
              <>
                <div className="employee-balance-summary">
                  <div>
                    <span>Total Used</span>
                    <strong>{totalUsed} days</strong>
                  </div>

                  <div>
                    <span>Total Remaining</span>
                    <strong>{totalRemaining} days</strong>
                  </div>
                </div>

                <div className="employee-balance-grid">
                  {balances.map((balance) => {
                    const total = Number(balance.totalDays) || 0;
                    const remaining =
                      Number(balance.remainingDays) || 0;
                    const used = Number(balance.usedDays) || 0;

                    const remainingPercent =
                      total > 0
                        ? Math.max(
                            0,
                            Math.min(100, (remaining / total) * 100)
                          )
                        : 0;

                    return (
                      <article
                        className="employee-balance-card"
                        key={balance.id}
                      >
                        <div className="employee-balance-top">
                          <div>
                            <h3>
                              {balance.leaveType?.name ||
                                balance.leaveType?.leaveTypeName ||
                                "Leave"}
                            </h3>
                            <p>Leave allowance</p>
                          </div>

                          <strong>{remaining}</strong>
                        </div>

                        <div
                          className="employee-progress-track"
                          role="progressbar"
                          aria-label="Remaining leave percentage"
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={Math.round(remainingPercent)}
                        >
                          <div
                            className="employee-progress-fill"
                            style={{
                              width: `${remainingPercent}%`,
                            }}
                          />
                        </div>

                        <div className="employee-balance-details">
                          <span>Used: {used}</span>
                          <span>Total: {total}</span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </section>

          <section className="employee-panel employee-recent-panel">
            <div className="employee-panel-heading">
              <div>
                <h2>Recent Leave Requests</h2>
                <p>
                  Check the latest status of your applications.
                </p>
              </div>

              <Link to="/employee/leaves">View all →</Link>
            </div>

            {loading ? (
              <div className="employee-empty-state">
                Loading requests...
              </div>
            ) : recentLeaves.length === 0 ? (
              <div className="employee-empty-state">
                <strong>No leave requests yet</strong>
                <p>
                  When you apply for leave, your requests will appear here.
                </p>

                <Link to="/employee/apply-leave">
                  Apply for your first leave →
                </Link>
              </div>
            ) : (
              <div className="employee-table-wrapper">
                <table className="employee-recent-table">
                  <thead>
                    <tr>
                      <th>Leave Type</th>
                      <th>Leave Dates</th>
                      <th>Days</th>
                      <th>Applied On</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentLeaves.map((leave) => {
                      const status = statusOf(leave);

                      return (
                        <tr key={leave.id}>
                          <td>
                            <strong>
                              {leave.leaveType?.name ||
                                leave.leaveType?.leaveTypeName ||
                                "Leave"}
                            </strong>
                          </td>

                          <td>
                            <div className="employee-date-range">
                              <span>{formatDate(leave.startDate)}</span>
                              <span>to {formatDate(leave.endDate)}</span>
                            </div>
                          </td>

                          <td>{leave.numberOfDays ?? "—"}</td>
                          <td>{formatDate(leave.appliedAt)}</td>

                          <td>
                            <span
                              className={`employee-status-badge ${status.toLowerCase()}`}
                            >
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default EmployeeDashboard;
