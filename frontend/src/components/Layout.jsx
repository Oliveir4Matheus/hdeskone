import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/tickets", label: "Tickets" },
  { to: "/tickets/new", label: "Novo Ticket" },
  { to: "/tickets/kanban", label: "Kanban", staffOnly: true },
  { to: "/users", label: "Usuários", adminOnly: true },
  { to: "/config", label: "Config", adminOnly: true },
  { to: "/profile", label: "Perfil" },
];

const ROLE_LABELS = { admin: "Admin", support: "Support", colaborador: "Colaborador" };

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside
        style={{
          width: 220,
          background: "#111111",
          color: "#fff",
          padding: "1.5rem 0",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "0 1.25rem 1.25rem",
            borderBottom: "1px solid #333333",
            marginBottom: "1rem",
          }}
        >
          <h2 style={{ fontSize: "1.15rem", fontWeight: 800, letterSpacing: "-0.025em" }}>
            <span style={{ color: "#d70f0a" }}>hdesk</span>one
          </h2>
        </div>
        <nav style={{ flex: 1 }}>
          {navItems
            .filter((item) => {
              if (item.adminOnly && user?.role !== "admin") return false;
              if (item.staffOnly && user?.role !== "admin" && user?.role !== "support") return false;
              return true;
            })
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `sidebar-link${isActive ? " active" : ""}`
                }
              >
                {item.label}
              </NavLink>
            ))}
        </nav>
        <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid #333333" }}>
          <div style={{ fontSize: "0.85rem", color: "#999999", marginBottom: "0.5rem" }}>
            {user?.name} ({ROLE_LABELS[user?.role] || user?.role})
          </div>
          <button onClick={handleLogout} className="sidebar-logout">
            Logout
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: "2rem" }}>
        <Outlet />
      </main>
    </div>
  );
}
