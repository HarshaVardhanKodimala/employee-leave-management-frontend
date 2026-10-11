
import { useEffect, useState } from "react";
import api from "../api/api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

function MyLeaves() {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const loadLeaves = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get("/api/leave-requests/my");
            setLeaves(response.data);
        } catch (err) {
            console.error("Failed to load leaves:", err);
            setError("Unable to load your leave history. Please refresh.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLeaves();
    }, []);

    const pendingCount = leaves.filter(l => l.status === "PENDING").length;
    const approvedCount = leaves.filter(l => l.status === "APPROVED").length;
    const rejectedCount = leaves.filter(l => l.status === "REJECTED").length;

    const filteredLeaves = leaves.filter(leave => {
        const text = search.toLowerCase().trim();

        const matchesSearch =
            (leave.leaveType?.name || "").toLowerCase().includes(text) ||
            (leave.reason || "").toLowerCase().includes(text) ||
            (leave.managerRemarks || "").toLowerCase().includes(text);

        const matchesStatus =
            statusFilter === "ALL" || leave.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="app-layout">
            <Sidebar role="EMPLOYEE" />

            <div className="main-content">
                <Navbar />

                <main className="dashboard-content">
                    <div className="page-heading">
                        <div>
                            <h1>My Leaves</h1>
                            <p>View and track all your leave applications.</p>
                        </div>

                        <button
                            className="refresh-btn"
                            onClick={loadLeaves}
                            disabled={loading}
                        >
                            {loading ? "Loading..." : "↻ Refresh"}
                        </button>
                    </div>

                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon total">📋</div>
                            <div>
                                <h3>{leaves.length}</h3>
                                <p>Total Applications</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon pending">⏳</div>
                            <div>
                                <h3>{pendingCount}</h3>
                                <p>Pending</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon approved">✓</div>
                            <div>
                                <h3>{approvedCount}</h3>
                                <p>Approved</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon rejected">✕</div>
                            <div>
                                <h3>{rejectedCount}</h3>
                                <p>Rejected</p>
                            </div>
                        </div>
                    </div>

                    <div className="content-card">
                        <div className="card-header">
                            <div>
                                <h2>Leave History</h2>
                                <p>Your applications and their current status</p>
                            </div>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "12px",
                                padding: "16px 20px"
                            }}
                        >
                            <input
                                type="text"
                                placeholder="Search leave type, reason or remarks..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{
                                    flex: "1",
                                    minWidth: "220px",
                                    padding: "11px 14px",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "8px"
                                }}
                            />

                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                style={{
                                    minWidth: "160px",
                                    padding: "11px 14px",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "8px",
                                    background: "white"
                                }}
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="PENDING">Pending</option>
                                <option value="APPROVED">Approved</option>
                                <option value="REJECTED">Rejected</option>
                            </select>
                        </div>

                        {loading ? (
                            <div className="empty-state">
                                Loading leave history...
                            </div>
                        ) : error ? (
                            <div className="empty-state">
                                <p>{error}</p>
                                <button
                                    className="refresh-btn"
                                    onClick={loadLeaves}
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : filteredLeaves.length === 0 ? (
                            <div className="empty-state">
                                {leaves.length === 0
                                    ? "No leave applications yet. Apply for leave to see it here."
                                    : "No leave applications match your search or filter."}
                            </div>
                        ) : (
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Leave Type</th>
                                            <th>Start Date</th>
                                            <th>End Date</th>
                                            <th>Days</th>
                                            <th>Reason</th>
                                            <th>Status</th>
                                            <th>Manager Remarks</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filteredLeaves.map(leave => (
                                            <tr key={leave.id}>
                                                <td>
                                                    <strong>
                                                        {leave.leaveType?.name || "Leave"}
                                                    </strong>
                                                </td>

                                                <td>{leave.startDate}</td>
                                                <td>{leave.endDate}</td>
                                                <td>{leave.numberOfDays}</td>
                                                <td>{leave.reason || "-"}</td>

                                                <td>
                                                    <span
                                                        className={`status-badge ${(leave.status || "PENDING").toLowerCase()}`}
                                                    >
                                                        {leave.status || "PENDING"}
                                                    </span>
                                                </td>

                                                <td>
                                                    {leave.managerRemarks ? (
                                                        <span
                                                            title={leave.managerRemarks}
                                                            style={{
                                                                display: "inline-block",
                                                                maxWidth: "240px",
                                                                whiteSpace: "normal",
                                                                overflowWrap: "anywhere"
                                                            }}
                                                        >
                                                            {leave.managerRemarks}
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: "#64748b" }}>
                                                            {leave.status === "PENDING"
                                                                ? "Awaiting review"
                                                                : "No remarks"}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {!loading && !error && (
                            <p style={{ padding: "12px 20px", color: "#64748b" }}>
                                Showing {filteredLeaves.length} of {leaves.length} applications
                            </p>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default MyLeaves;
