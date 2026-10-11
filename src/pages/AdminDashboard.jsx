
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

const getArray = (response) => {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  return [];
};

const getStatus = (request) =>
  String(request?.status || "PENDING").toUpperCase();

const getEmployeeName = (request) =>
  request?.user?.fullName ||
  request?.user?.name ||
  request?.user?.email ||
  "Unknown employee";

const getLeaveType = (request) => {
  const type = request?.leaveType;
  if (typeof type === "string") return type;
  return type?.name || type?.leaveTypeName || type?.typeName || "Leave";
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const navItems = [
  { to: "/admin/users", icon: "♙", title: "User Management", text: "Manage employees and roles" },
  { to: "/admin/departments", icon: "▦", title: "Departments", text: "Organize your workforce" },
  { to: "/admin/leave-types", icon: "▤", title: "Leave Types", text: "Configure leave policies" },
  { to: "/admin/balances", icon: "◷", title: "Leave Balances", text: "Allocate employee leave" },
];

function AdminDashboard() {
  const { refreshKey } = useAuth();

  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    const results = await Promise.allSettled([
      api.get("/api/users"),
      api.get("/api/departments"),
      api.get("/api/leave-types"),
      api.get("/api/leave-requests"),
    ]);

    const setters = [
      [results[0], setUsers],
      [results[1], setDepartments],
      [results[2], setLeaveTypes],
      [results[3], setRequests],
    ];

    setters.forEach(([result, setter]) => {
      if (result.status === "fulfilled") {
        setter(getArray(result.value));
      }
    });

    if (results.some((result) => result.status === "rejected")) {
      setError("Some information could not be loaded. Try refreshing the dashboard.");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard, refreshKey]);

  const pending = requests.filter((r) => getStatus(r) === "PENDING").length;
  const approved = requests.filter((r) => getStatus(r) === "APPROVED").length;
  const rejected = requests.filter((r) => getStatus(r) === "REJECTED").length;

  const recentRequests = [...requests]
    .sort((a, b) =>
      new Date(b.appliedAt || 0).getTime() -
      new Date(a.appliedAt || 0).getTime()
    )
    .slice(0, 6);

  const stats = [
    { title: "Total Employees & Users", value: users.length, icon: "♙", tone: "blue", link: "/admin/users", action: "Manage users" },
    { title: "Departments", value: departments.length, icon: "▦", tone: "violet", link: "/admin/departments", action: "View departments" },
    { title: "Leave Policies", value: leaveTypes.length, icon: "▤", tone: "amber", link: "/admin/leave-types", action: "Manage policies" },
    { title: "Leave Applications", value: requests.length, icon: "▣", tone: "green", link: "/admin/balances", action: "Manage balances" },
  ];

  const statusItems = [
    { title: "Pending review", count: pending, tone: "pending" },
    { title: "Approved", count: approved, tone: "approved" },
    { title: "Rejected", count: rejected, tone: "rejected" },
  ];

  const totalForBar = pending + approved + rejected;

  return (
    <main className="pro-admin">
      <header className="pro-admin-header">
        <div>
          <div className="pro-admin-breadcrumb">WORKSPACE / ADMINISTRATION</div>
          <h1>Overview</h1>
          <p>Monitor your workforce, leave activity, and organization settings.</p>
        </div>

        <button
          className="pro-admin-refresh"
          type="button"
          onClick={loadDashboard}
          disabled={loading}
        >
          <span>↻</span> {loading ? "Refreshing…" : "Refresh data"}
        </button>
      </header>

      {error && (
        <div className="pro-admin-alert" role="alert">
          <span>!</span> {error}
        </div>
      )}

      <section className="pro-admin-welcome">
        <div>
          <span className="pro-admin-welcome-tag">ADMIN CONTROL CENTER</span>
          <h2>Your organization at a glance</h2>
          <p>Everything you need to manage employees and leave operations in one place.</p>
        </div>
        <div className="pro-admin-welcome-icon" aria-hidden="true">✳</div>
      </section>

      <section className="pro-admin-stats" aria-label="Organization statistics">
        {stats.map((stat) => (
          <article className="pro-admin-stat" key={stat.title}>
            <div className="pro-admin-stat-top">
              <span>{stat.title}</span>
              <span className={`pro-admin-stat-icon ${stat.tone}`}>{stat.icon}</span>
            </div>
            <strong>{loading ? "—" : stat.value}</strong>
            <Link to={stat.link}>{stat.action} <span>↗</span></Link>
          </article>
        ))}
      </section>

      <div className="pro-admin-main-grid">
        <section className="pro-admin-panel pro-admin-status-panel">
          <div className="pro-admin-panel-heading">
            <div>
              <span className="pro-admin-section-kicker">LEAVE OPERATIONS</span>
              <h2>Request overview</h2>
              <p>Current status of submitted applications.</p>
            </div>
            <span className="pro-admin-live-dot">Live summary</span>
          </div>

          <div className="pro-admin-status-list">
            {statusItems.map((item) => (
              <div className="pro-admin-status-row" key={item.title}>
                <span className={`pro-admin-status-mark ${item.tone}`} />
                <span className="pro-admin-status-title">{item.title}</span>
                <strong>{loading ? "—" : item.count}</strong>
              </div>
            ))}
          </div>

          <div className="pro-admin-progress">
            <div className="pro-admin-progress-label">
              <span>Request distribution</span>
              <span>{loading ? "—" : totalForBar}</span>
            </div>
            <div className="pro-admin-progress-track">
              {totalForBar > 0 && (
                <>
                  <span className="pending-bar" style={{ width: `${(pending / totalForBar) * 100}%` }} />
                  <span className="approved-bar" style={{ width: `${(approved / totalForBar) * 100}%` }} />
                  <span className="rejected-bar" style={{ width: `${(rejected / totalForBar) * 100}%` }} />
                </>
              )}
            </div>
            <div className="pro-admin-progress-legend">
              <span><i className="pending-legend" /> Pending</span>
              <span><i className="approved-legend" /> Approved</span>
              <span><i className="rejected-legend" /> Rejected</span>
            </div>
          </div>
        </section>

        <section className="pro-admin-panel pro-admin-shortcuts">
          <div className="pro-admin-panel-heading">
            <div>
              <span className="pro-admin-section-kicker">QUICK ACCESS</span>
              <h2>Administration</h2>
              <p>Jump into a management area.</p>
            </div>
          </div>

          <div className="pro-admin-shortcut-list">
            {navItems.map((item) => (
              <Link to={item.to} className="pro-admin-shortcut" key={item.to}>
                <span className="pro-admin-shortcut-icon">{item.icon}</span>
                <span className="pro-admin-shortcut-copy">
                  <strong>{item.title}</strong>
                  <small>{item.text}</small>
                </span>
                <span className="pro-admin-shortcut-arrow">↗</span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className="pro-admin-panel pro-admin-recent">
        <div className="pro-admin-panel-heading pro-admin-recent-heading">
          <div>
            <span className="pro-admin-section-kicker">LATEST ACTIVITY</span>
            <h2>Recent leave applications</h2>
            <p>The six most recently submitted requests.</p>
          </div>
          <span className="pro-admin-total-pill">{requests.length} total requests</span>
        </div>

        {loading ? (
          <div className="pro-admin-empty">Loading recent applications…</div>
        ) : recentRequests.length === 0 ? (
          <div className="pro-admin-empty">
            <span>▤</span>
            <strong>No leave applications yet</strong>
            <p>Employee applications will appear here when submitted.</p>
          </div>
        ) : (
          <div className="pro-admin-table-scroll">
            <table className="pro-admin-table">
              <thead>
                <tr>
                  <th>EMPLOYEE</th>
                  <th>LEAVE TYPE</th>
                  <th>LEAVE PERIOD</th>
                  <th>DURATION</th>
                  <th>SUBMITTED</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.map((request) => {
                  const status = getStatus(request);
                  const name = getEmployeeName(request);

                  return (
                    <tr key={request.id}>
                      <td>
                        <div className="pro-admin-employee">
                          <span className="pro-admin-avatar">
                            {name.charAt(0).toUpperCase()}
                          </span>
                          <span>
                            <strong>{name}</strong>
                            <small>{request.user?.email || "Employee account"}</small>
                          </span>
                        </div>
                      </td>
                      <td><span className="pro-admin-leave-type">{getLeaveType(request)}</span></td>
                      <td>
                        <span className="pro-admin-period">
                          {formatDate(request.startDate)} – {formatDate(request.endDate)}
                        </span>
                      </td>
                      <td><strong>{request.numberOfDays ?? "—"}</strong> <small>days</small></td>
                      <td>{formatDate(request.appliedAt)}</td>
                      <td>
                        <span className={`pro-admin-badge ${status.toLowerCase()}`}>
                          <i />{status}
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

      <footer className="pro-admin-footer">
        <span>ELMS · Employee Leave Management System</span>
        <span>Administration workspace</span>
      </footer>
    </main>
  );
}

export default AdminDashboard;
