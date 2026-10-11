
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Welcome from "./pages/Welcome";

import Login from "./pages/Login";
import Register from "./pages/Register";

import EmployeeDashboard from "./pages/EmployeeDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminDepartments from "./pages/AdminDepartments";
import AdminLeaveTypes from "./pages/AdminLeaveTypes";
import AdminBalances from "./pages/AdminBalances";

import ApplyLeave from "./pages/ApplyLeave";
import MyLeaves from "./pages/MyLeaves";
import LeaveBalance from "./pages/LeaveBalance";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Welcome />} />
<Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Employee routes */}
                <Route
                    path="/employee"
                    element={
                        <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
                            <EmployeeDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/employee/apply-leave"
                    element={
                        <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
                            <ApplyLeave />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/employee/leaves"
                    element={
                        <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
                            <MyLeaves />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/employee/balance"
                    element={
                        <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
                            <LeaveBalance />
                        </ProtectedRoute>
                    }
                />

                {/* Manager route */}
                <Route
                    path="/manager"
                    element={
                        <ProtectedRoute allowedRoles={["MANAGER"]}>
                            <ManagerDashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Admin dashboard */}
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute allowedRoles={["ADMIN"]}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Admin users */}
                <Route
                    path="/admin/users"
                    element={
                        <ProtectedRoute allowedRoles={["ADMIN"]}>
                            <AdminUsers />
                        </ProtectedRoute>
                    }
                />

                {/* Admin departments */}
                <Route
                    path="/admin/departments"
                    element={
                        <ProtectedRoute allowedRoles={["ADMIN"]}>
                            <AdminDepartments />
                        </ProtectedRoute>
                    }
                />

                {/* Admin leave types */}
                <Route
                    path="/admin/leave-types"
                    element={
                        <ProtectedRoute allowedRoles={["ADMIN"]}>
                            <AdminLeaveTypes />
                        </ProtectedRoute>
                    }
                />

                {/* Admin leave balances */}
                <Route
                    path="/admin/balances"
                    element={
                        <ProtectedRoute allowedRoles={["ADMIN"]}>
                            <AdminBalances />
                        </ProtectedRoute>
                    }
                />

                {/* Unknown routes */}
                <Route
                    path="*"
                    element={<Navigate to="/" replace />}
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
