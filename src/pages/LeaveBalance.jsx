
import { useEffect, useState } from "react";
import api from "../api/api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

function LeaveBalance() {
    const [balances, setBalances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadBalances = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get("/api/leave-balances/my");
            setBalances(response.data);
        } catch (err) {
            console.error("Failed to load leave balances:", err);
            setError("Unable to load leave balances. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBalances();
    }, []);

    const totalAllowed = balances.reduce(
        (sum, balance) => sum + (balance.totalDays || 0), 0
    );

    const totalUsed = balances.reduce(
        (sum, balance) => sum + (balance.usedDays || 0), 0
    );

    const totalRemaining = balances.reduce(
        (sum, balance) => sum + (balance.remainingDays || 0), 0
    );

    return (
        <div className="app-layout">
            <Sidebar role="EMPLOYEE" />

            <div className="main-content">
                <Navbar />

                <main className="dashboard-content">
                    <div className="page-heading">
                        <div>
                            <h1>Leave Balance</h1>
                            <p>Track your leave allowance and remaining days.</p>
                        </div>

                        <button className="refresh-btn" onClick={loadBalances}>
                            ↻ Refresh
                        </button>
                    </div>

                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon total">📅</div>
                            <div>
                                <h3>{totalAllowed}</h3>
                                <p>Total Allowed Days</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon pending">⏳</div>
                            <div>
                                <h3>{totalUsed}</h3>
                                <p>Days Used</p>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon approved">✓</div>
                            <div>
                                <h3>{totalRemaining}</h3>
                                <p>Days Remaining</p>
                            </div>
                        </div>
                    </div>

                    <div className="content-card">
                        <div className="card-header">
                            <div>
                                <h2>Balance by Leave Type</h2>
                                <p>Your current allowance for each leave category</p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="empty-state">Loading balances...</div>
                        ) : error ? (
                            <div className="empty-state">
                                <p>{error}</p>
                                <button className="refresh-btn" onClick={loadBalances}>
                                    Try Again
                                </button>
                            </div>
                        ) : balances.length === 0 ? (
                            <div className="empty-state">
                                No leave balances found for your account.
                            </div>
                        ) : (
                            <div className="balance-grid">
                                {balances.map((balance) => {
                                    const percentage = balance.totalDays > 0
                                        ? Math.min(
                                            100,
                                            (balance.remainingDays / balance.totalDays) * 100
                                        )
                                        : 0;

                                    return (
                                        <div className="balance-card" key={balance.id}>
                                            <div className="balance-top">
                                                <div>
                                                    <h3>{balance.leaveType?.name || "Leave"}</h3>
                                                    <p>Annual allowance</p>
                                                </div>
                                                <span>{balance.remainingDays}</span>
                                            </div>

                                            <div className="balance-bar">
                                                <div
                                                    className="balance-progress"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>

                                            <div className="balance-details">
                                                <span>Used: {balance.usedDays}</span>
                                                <span>Total: {balance.totalDays}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default LeaveBalance;
