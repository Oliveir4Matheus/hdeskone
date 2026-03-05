import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const views = [
  { to: "/tickets", label: "Table" },
  { to: "/tickets/kanban", label: "Kanban", staffOnly: true },
  { to: "/tickets/gantt", label: "Gantt", staffOnly: true },
  { to: "/tickets/kanban-mockup", label: "Kanban v2", staffOnly: true },
];

export default function ViewSwitcher() {
  const { user } = useAuth();
  const isStaff = user?.role === "admin" || user?.role === "support";

  return (
    <div className="view-switcher">
      {views
        .filter((v) => !v.staffOnly || isStaff)
        .map((v) => (
          <NavLink
            key={v.to}
            to={v.to}
            end
            className={({ isActive }) =>
              `view-switcher-btn${isActive ? " active" : ""}`
            }
          >
            {v.label}
          </NavLink>
        ))}
    </div>
  );
}
