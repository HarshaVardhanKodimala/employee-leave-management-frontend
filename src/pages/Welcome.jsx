
import { Link } from "react-router-dom";

function Welcome() {
    return (
        <div className="elms-landing">
            <header className="landing-header">
                <Link to="/" className="landing-brand">
                    <span className="brand-icon">▦</span>
                    <span>ELMS</span>
                </Link>

                <span className="brand-tagline">
                    Better Leave Management <span>•</span> Happier Teams
                </span>
            </header>

            <main className="landing-main">
                <section className="landing-hero">
                    <div className="hero-visual">
                        <div className="hero-orbit orbit-one" />
                        <div className="hero-orbit orbit-two" />

                        <div className="hero-calendar">
                            <div className="calendar-top">
                                <span />
                                <span />
                            </div>
                            <div className="calendar-grid">
                                {Array.from({ length: 12 }, (_, i) => (
                                    <span key={i} className={i === 5 ? "calendar-check" : ""}>
                                        {i === 5 ? "✓" : ""}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="hero-clock">◷</div>
                        <div className="hero-plant">✦</div>
                    </div>

                    <div className="hero-content">
                        <span className="hero-eyebrow">
                            EMPLOYEE SELF-SERVICE PORTAL
                        </span>

                        <h1>
                            Employee Leave
                            <span>Management System</span>
                        </h1>

                        <p>
                            Manage leave requests, track leave balances,
                            and simplify employee leave management—all
                            in one place.
                        </p>

                        <div className="hero-actions">
                            <Link to="/register" className="hero-btn hero-primary">
                                Create an Account <span>→</span>
                            </Link>

                            <Link to="/login" className="hero-btn hero-secondary">
                                Sign In
                            </Link>
                        </div>

                        <div className="hero-note">
                            Secure access for employees, managers and administrators
                        </div>
                    </div>
                </section>

                <section className="landing-features">
                    <article className="feature-item">
                        <span className="feature-icon">▤</span>
                        <div>
                            <h3>Easy Leave Requests</h3>
                            <p>Apply and track requests in one place.</p>
                        </div>
                    </article>

                    <article className="feature-item">
                        <span className="feature-icon">◷</span>
                        <div>
                            <h3>Clear Leave Balances</h3>
                            <p>Know your available leave days.</p>
                        </div>
                    </article>

                    <article className="feature-item">
                        <span className="feature-icon">✓</span>
                        <div>
                            <h3>Streamlined Approvals</h3>
                            <p>Keep reviews and decisions organized.</p>
                        </div>
                    </article>
                </section>

                <footer className="landing-footer">
                    Employee Leave Management System
                    <span>Built for a better workplace</span>
                </footer>
            </main>
        </div>
    );
}

export default Welcome;
