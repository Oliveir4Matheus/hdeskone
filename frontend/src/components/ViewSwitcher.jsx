import { NavLink } from "react-router-dom";

const views = [
  { to: "/tickets", label: "Table" },
  { to: "/tickets/kanban", label: "Kanban" },
  { to: "/tickets/gantt", label: "Gantt" },
];

export default function ViewSwitcher() {
  return (
    <div className="view-switcher">
      {views.map((v) => (
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
