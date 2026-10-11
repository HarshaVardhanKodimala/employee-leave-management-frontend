
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const menuItems = {
    EMPLOYEE: [
        { label: "Dashboard", path: "/employee", icon: "⌂" },
        { label: "Apply Leave", path: "/employee/apply-leave", icon: "+" },
        { label: "My Leaves", path: "/employee/leaves", icon: "▤" },
        { label: "Leave Balance", path: "/employee/balance", icon: "◷" }
    ],
    MANAGER: [
        { label: "Dashboard", path: "/manager", icon: "⌂" }
    ],
    ADMIN: [
        { label: "Dashboard", path: "/admin", icon: "⌂" },
        { label: "User Management", path: "/admin/users", icon: "♙" },
        { label: "Departments", path: "/admin/departments", icon: "▦" },
        { label: "Leave Types", path: "/admin/leave-types", icon: "▤" },
        { label: "Leave Balances", path: "/admin/balances", icon: "◷" }
    ]
};

function Sidebar({ role }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const currentRole = role || user?.role || "EMPLOYEE";
    const items = menuItems[currentRole] || menuItems.EMPLOYEE;

    const isActive = (path) => location.pathname === path;

    return (
        <aside className="sidebar">
            <button
                type="button"
                className="sidebar-brand"
                onClick={() => navigate(
                    currentRole === "ADMIN"
                        ? "/admin"
                        : currentRole === "MANAGER"
                            ? "/manager"
                            : "/employee"
                )}
                aria-label="Go to dashboard"
            >
                <span className="brand-mark">E</span>
                <span className="brand-copy">
                    <strong>ELMS</strong>
                    <small>People & Leave</small>
                </span>
            </button>

            <div className="sidebar-section-label">WORKSPACE</div>

            <nav className="sidebar-nav" aria-label="Main navigation">
                {items.map((item) => (
                    <button
                        key={item.path}
                        type="button"
                        className={`sidebar-link ${
                            isActive(item.path) ? "active" : ""
                        }`}
                        onClick={() => navigate(item.path)}
                        aria-current={
                            isActive(item.path) ? "page" : undefined
                        }
                        title={item.label}
                    >
                        <span className="sidebar-link-icon" aria-hidden="true">
                            {item.icon}
                        </span>
                        <span className="sidebar-link-label">
                            {item.label}
                        </span>
                        {isActive(item.path) && (
                            <span className="sidebar-active-dot" />
                        )}
                    </button>
                ))}
            </nav>

            <div className="sidebar-spacer" />

            <div className="sidebar-help">
                <div className="sidebar-help-icon">i</div>
                <div>
                    <strong>Need assistance?</strong>
                    <p>Contact your HR administrator.</p>
                </div>
            </div>

            <div className="sidebar-footer">
                <span className="sidebar-footer-mark">E</span>
                <div>
                    <strong>ELMS Portal</strong>
                    <small>{currentRole} workspace</small>
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;
