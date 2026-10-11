
import { useCallback, useEffect, useState } from "react";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const getArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  return [];
};

const getStatus = (request) =>
  String(request?.status || "PENDING").toUpperCase();

const formatDate = (value) => {
  if (!value) return "—";

  const parts = String(value).split("T")[0].split("-");
  if (parts.length !== 3) return String(value);

  return new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    Number(parts[2])
  ).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function ManagerDashboard() {
  const { user, refreshKey, refreshData } = useAuth();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadRequests = useCallback(async () => {
    setRefreshing(true);
    setError("");

    try {
      const response = await api.get("/api/leave-requests");
      setRequests(getArray(response.data));
    } catch (err) {
      console.error("Failed to load leave requests:", err);

      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Could not load leave requests. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setSuccess("");
    setError("");
    loadRequests();
  }, [loadRequests, refreshKey]);

  const handleAction = async (action) => {
    if (!selectedRequest || actionLoading) return;

    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.put(
        `/api/leave-requests/${selectedRequest.id}/${action}`,
        { remarks: remarks.trim() }
      );

      setSuccess(
        action === "approve"
          ? "Leave request approved successfully."
          : "Leave request rejected successfully."
      );

      setSelectedRequest(null);
      setRemarks("");

      // Notify other connected dashboards that data has changed.
      refreshData();

      // Reload this manager's request list.
      await loadRequests();
    } catch (err) {
      console.error(`Failed to ${action} request:`, err);

      const status = err.response?.status;
      const data = err.response?.data;

      let message =
        (typeof data === "string" && data.trim()) ||
        data?.message ||
        data?.detail ||
        data?.error ||
        data?.title;

      if (!message && status === 400) {
        message =
          "The request could not be processed. Check the leave balance and request details.";
      } else if (!message && status === 403) {
        message = "You are not authorized to perform this action.";
      } else if (!message && status === 404) {
        message = "Leave request not found.";
      } else if (!message) {
        message =
          `Failed to ${action} the leave request. Please try again.`;
      }

      setError(String(message));
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = requests.filter(
    (request) => getStatus(request) === "PENDING"
  ).length;

  const approvedCount = requests.filter(
    (request) => getStatus(request) === "APPROVED"
  ).length;

  const rejectedCount = requests.filter(
    (request) => getStatus(request) === "REJECTED"
  ).length;

  const searchText = search.trim().toLowerCase();

  const filteredRequests = requests.filter((request) => {
    const name = request.user?.fullName || "";
    const email = request.user?.email || "";
    const leaveType =
      request.leaveType?.name ||
      request.leaveType?.leaveTypeName ||
      "";

    const matchesSearch =
      name.toLowerCase().includes(searchText) ||
      email.toLowerCase().includes(searchText) ||
      leaveType.toLowerCase().includes(searchText);

    const matchesStatus =
      statusFilter === "ALL" ||
      getStatus(request) === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const openReview = (request) => {
    setSelectedRequest(request);
    setRemarks("");
    setError("");
    setSuccess("");
  };

  const closeReview = () => {
    if (actionLoading) return;

    setSelectedRequest(null);
    setRemarks("");
    setError("");
  };

  const modalErrorTitle =
    error.toLowerCase().includes("insufficient") ||
    error.toLowerCase().includes("balance")
      ? "Insufficient leave balance"
      : "Unable to process request";

  return (
    <div className="app-layout">
      <Sidebar role="MANAGER" />

      <div className="main-content">
        <Navbar />

        <main className="dashboard-content manager-dashboard">
          <header className="manager-page-header">
            <div>
              <p className="manager-eyebrow">MANAGEMENT PORTAL</p>
              <h1>Manager Dashboard</h1>
              <p>
                Welcome back
                {user?.fullName ? `, ${user.fullName}` : ""}.
                {" "}Review your team's leave applications.
              </p>
            </div>

            <button
              className="manager-refresh-btn"
              type="button"
              onClick={loadRequests}
              disabled={refreshing}
            >
              {refreshing ? "Refreshing..." : "↻ Refresh"}
            </button>
          </header>

          {error && !selectedRequest && (
            <div className="manager-alert error" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="manager-alert success" role="status">
              {success}
            </div>
          )}

          <section className="manager-stats-grid">
            <article className="manager-stat-card">
              <span className="manager-stat-icon pending">◷</span>
              <p>Pending Requests</p>
              <h2>{loading ? "—" : pendingCount}</h2>
              <span className="manager-stat-note">Require review</span>
            </article>

            <article className="manager-stat-card">
              <span className="manager-stat-icon approved">✓</span>
              <p>Approved Requests</p>
              <h2>{loading ? "—" : approvedCount}</h2>
              <span className="manager-stat-note">
                Approved applications
              </span>
            </article>

            <article className="manager-stat-card">
              <span className="manager-stat-icon rejected">×</span>
              <p>Rejected Requests</p>
              <h2>{loading ? "—" : rejectedCount}</h2>
              <span className="manager-stat-note">
                Rejected applications
              </span>
            </article>

            <article className="manager-stat-card">
              <span className="manager-stat-icon total">▤</span>
              <p>Total Requests</p>
              <h2>{loading ? "—" : requests.length}</h2>
              <span className="manager-stat-note">
                Requests visible to you
              </span>
            </article>
          </section>

          <section className="manager-requests-panel">
            <div className="manager-panel-heading">
              <div>
                <h2>Leave Requests</h2>
                <p>
                  Search, filter, and review employee applications.
                </p>
              </div>

              <span className="manager-request-count">
                {filteredRequests.length} shown
              </span>
            </div>

            <div className="manager-filters">
              <input
                type="search"
                aria-label="Search leave requests"
                placeholder="Search employee, email or leave type..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              <select
                aria-label="Filter by request status"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
              >
                <option value="ALL">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {loading ? (
              <div className="manager-empty-state">
                Loading requests...
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="manager-empty-state">
                <strong>
                  {requests.length === 0
                    ? "No leave requests found"
                    : "No matching requests"}
                </strong>
                <p>
                  {requests.length === 0
                    ? "Employee applications will appear here."
                    : "Try changing your search or status filter."}
                </p>
              </div>
            ) : (
              <div className="manager-table-wrapper">
                <table className="manager-requests-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Leave Type</th>
                      <th>Dates</th>
                      <th>Days</th>
                    
<th>Reason</th>
<th>Status</th>
<th>Manager Remarks</th>
<th>Action</th>

                    </tr>
                  </thead>

                  <tbody>
                    {filteredRequests.map((request) => {
                      const status = getStatus(request);
                      const employeeName =
                        request.user?.fullName || "Employee";

                      return (
                        <tr key={request.id}>
                          <td>
                            <div className="manager-employee">
                              <span className="manager-avatar">
                                {employeeName.charAt(0).toUpperCase()}
                              </span>

                              <div>
                                <strong>{employeeName}</strong>
                                <span>
                                  {request.user?.email || "—"}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            {request.leaveType?.name ||
                              request.leaveType?.leaveTypeName ||
                              "Leave"}
                          </td>

                          <td>
                            <div className="manager-date-range">
                              <span>
                                {formatDate(request.startDate)}
                              </span>
                              <span>
                                to {formatDate(request.endDate)}
                              </span>
                            </div>
                          </td>

                          <td>{request.numberOfDays ?? "—"}</td>

                          <td>
                            <span
                              className="manager-reason"
                              title={request.reason || ""}
                            >
                              {request.reason || "—"}
                            </span>
                          </td>

                         
<td>
  <span
    className="manager-reason"
    title={request.managerRemarks || ""}
  >
    {request.managerRemarks || "—"}
  </span>
</td>


                          <td>
                            {status === "PENDING" ? (
                              <button
                                className="manager-review-btn"
                                type="button"
                                onClick={() => openReview(request)}
                              >
                                Review
                              </button>
                            ) : (
                              <span className="manager-completed">
                                Completed
                              </span>
                            )}
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

      {selectedRequest && (
        <div
          className="manager-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !actionLoading
            ) {
              closeReview();
            }
          }}
        >
          <section
            className="manager-review-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="manager-review-title"
          >
            <header className="manager-modal-header">
              <div>
                <p className="manager-eyebrow">LEAVE APPROVAL</p>
                <h2 id="manager-review-title">Review Request</h2>
                <p>
                  {selectedRequest.user?.fullName || "Employee"}
                </p>
              </div>

              <button
                className="manager-modal-close"
                type="button"
                aria-label="Close review"
                disabled={actionLoading}
                onClick={closeReview}
              >
                ×
              </button>
            </header>

            <div className="manager-request-summary">
              <div>
                <span>Leave Type</span>
                <strong>
                  {selectedRequest.leaveType?.name ||
                    selectedRequest.leaveType?.leaveTypeName ||
                    "Leave"}
                </strong>
              </div>

              <div>
                <span>Duration</span>
                <strong>
                  {selectedRequest.numberOfDays ?? "—"} days
                </strong>
              </div>

              <div>
                <span>Start Date</span>
                <strong>
                  {formatDate(selectedRequest.startDate)}
                </strong>
              </div>

              <div>
                <span>End Date</span>
                <strong>
                  {formatDate(selectedRequest.endDate)}
                </strong>
              </div>
            </div>

            <div className="manager-reason-box">
              <strong>Employee's Reason</strong>
              <p>
                {selectedRequest.reason || "No reason provided."}
              </p>
            </div>

            <label htmlFor="manager-remarks">
              Manager Remarks
            </label>

            <textarea
              id="manager-remarks"
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              placeholder="Add a note for this decision (optional)..."
              rows={3}
              maxLength={1000}
              disabled={actionLoading}
            />

            <span className="manager-character-count">
              {remarks.length}/1000
            </span>

            {error && (
              <div
                className="manager-modal-error"
                role="alert"
                aria-live="assertive"
              >
                <strong>{modalErrorTitle}</strong>
                <p>{error}</p>
              </div>
            )}

            <div className="manager-modal-actions">
              <button
                className="manager-reject-action"
                type="button"
                disabled={actionLoading}
                onClick={() => handleAction("reject")}
              >
                {actionLoading ? "Processing..." : "Reject Request"}
              </button>

              <button
                className="manager-approve-action"
                type="button"
                disabled={actionLoading}
                onClick={() => handleAction("approve")}
              >
                {actionLoading ? "Processing..." : "Approve Request"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default ManagerDashboard;
