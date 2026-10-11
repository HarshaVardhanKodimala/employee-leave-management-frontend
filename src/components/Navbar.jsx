
import { useAuth } from "../context/AuthContext";

function Navbar() {
    const { user, logout } = useAuth();

    const fullName = user?.fullName || "User";
    const initials = fullName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || "")
        .join("");

    const roleLabel = {
        EMPLOYEE: "Employee",
        MANAGER: "Manager",
        ADMIN: "Administrator"
    };

    return (
        <header className="navbar">
            <div className="navbar-heading">
                <span className="navbar-eyebrow">WORKSPACE</span>
                <h2>Employee Leave Management</h2>
            </div>

            <div className="navbar-user">
                <div className="navbar-user-details">
                    <strong>{fullName}</strong>
                    <span className={`role-badge ${(user?.role || "EMPLOYEE").toLowerCase()}`}>
                        {roleLabel[user?.role] || user?.role || "Employee"}
                    </span>
                </div>

                <div
                    className="navbar-avatar"
                    title={fullName}
                    aria-label={`User ${fullName}`}
                >
                    {initials || "U"}
                </div>

                <button
                    type="button"
                    className="logout-btn"
                    onClick={logout}
                >
                    <span aria-hidden="true">↪</span>
                    <span>Sign out</span>
                </button>
            </div>
        </header>
    );
}

export default Navbar;
