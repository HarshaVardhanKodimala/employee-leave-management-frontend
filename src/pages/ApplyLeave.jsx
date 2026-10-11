
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

function ApplyLeave() {
    const { user, refreshData } = useAuth();
    const navigate = useNavigate();

    const [leaveTypes, setLeaveTypes] = useState([]);
    const [form, setForm] = useState({
        leaveTypeId: "",
        startDate: "",
        endDate: "",
        reason: ""
    });

    const [days, setDays] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        const loadLeaveTypes = async () => {
            try {
                const response = await api.get("/api/leave-types");
                setLeaveTypes(response.data);
            } catch (error) {
                console.error("Failed to load leave types:", error);
                setMessage("Failed to load leave types.");
            } finally {
                setLoading(false);
            }
        };

        loadLeaveTypes();
    }, []);

    const calculateDays = (start, end) => {
        if (!start || !end) {
            setDays(0);
            return;
        }

        const startDate = new Date(start);
        const endDate = new Date(end);

        if (endDate < startDate) {
            setDays(0);
            return;
        }

        const difference =
            Math.floor(
                (endDate - startDate) / (1000 * 60 * 60 * 24)
            ) + 1;

        setDays(difference);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        const updatedForm = {
            ...form,
            [name]: value
        };

        setForm(updatedForm);

        if (name === "startDate") {
            calculateDays(value, updatedForm.endDate);
        }

        if (name === "endDate") {
            calculateDays(updatedForm.startDate, value);
        }

        setMessage("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.leaveTypeId) {
            setMessage("Please select a leave type.");
            return;
        }

        if (!form.startDate || !form.endDate) {
            setMessage("Please select start and end dates.");
            return;
        }

        if (form.endDate < form.startDate) {
            setMessage("End date cannot be before start date.");
            return;
        }

        if (!form.reason.trim()) {
            setMessage("Please enter a reason.");
            return;
        }

        try {
            setSubmitting(true);
            setMessage("");

            await api.post("/api/leave-requests", {
                user: {
                    id: user.id
                },
                leaveType: {
                    id: Number(form.leaveTypeId)
                },
                startDate: form.startDate,
                endDate: form.endDate,
                reason: form.reason.trim()
            });

            setMessage("Leave request submitted successfully! 🎉");

            setForm({
                leaveTypeId: "",
                startDate: "",
                endDate: "",
                reason: ""
            });

            setDays(0);

            // Notify other pages to refresh their data.
            refreshData();
        } catch (error) {
            console.error("Leave submission error:", error);

            const errorData = error.response?.data;
            setMessage(
                typeof errorData === "string"
                    ? errorData
                    : errorData?.message ||
                      "Failed to submit leave request."
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="app-layout">
            <Sidebar role="EMPLOYEE" />

            <div className="main-content">
                <Navbar />

                <main className="dashboard-content">
                    <div className="page-heading">
                        <div>
                            <h1>Apply for Leave</h1>
                            <p>
                                Submit a new leave request for approval
                            </p>
                        </div>
                    </div>

                    <div className="content-card apply-card">
                        <div className="card-header">
                            <div>
                                <h2>Leave Request</h2>
                                <p>Fill in the details below</p>
                            </div>
                        </div>

                        {message && (
                            <div
                                className="form-message"
                                role="status"
                            >
                                {message}
                            </div>
                        )}

                        {loading ? (
                            <div className="empty-state">
                                Loading leave types...
                            </div>
                        ) : (
                            <form
                                className="leave-form"
                                onSubmit={handleSubmit}
                            >
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="leaveTypeId">
                                            Leave Type
                                        </label>

                                        <select
                                            id="leaveTypeId"
                                            name="leaveTypeId"
                                            value={form.leaveTypeId}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">
                                                Select Leave Type
                                            </option>

                                            {leaveTypes.map((type) => (
                                                <option
                                                    key={type.id}
                                                    value={type.id}
                                                >
                                                    {type.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Number of Days</label>

                                        <div className="days-display">
                                            {days > 0
                                                ? `${days} day${days > 1 ? "s" : ""}`
                                                : "0 days"}
                                        </div>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="startDate">
                                            Start Date
                                        </label>

                                        <input
                                            id="startDate"
                                            type="date"
                                            name="startDate"
                                            value={form.startDate}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="endDate">
                                            End Date
                                        </label>

                                        <input
                                            id="endDate"
                                            type="date"
                                            name="endDate"
                                            value={form.endDate}
                                            min={form.startDate || undefined}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="reason">Reason</label>

                                    <textarea
                                        id="reason"
                                        name="reason"
                                        value={form.reason}
                                        onChange={handleChange}
                                        placeholder="Enter the reason for your leave..."
                                        rows="5"
                                        required
                                    />
                                </div>

                                <div className="form-actions">
                                    <button
                                        type="button"
                                        className="cancel-btn"
                                        onClick={() => navigate("/employee")}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="submit-btn"
                                        disabled={submitting || loading}
                                    >
                                        {submitting
                                            ? "Submitting..."
                                            : "Submit Leave Request"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default ApplyLeave;
