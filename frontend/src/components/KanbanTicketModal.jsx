import { useEffect } from "react";
import TicketPanelContent from "./TicketPanelContent";

export default function KanbanTicketModal({ ticket, statuses, users, onClose, onTicketUpdate, isStaff }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="kanban-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="kanban-modal">
        <div className="kanban-panel-header">
          <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>
            <span style={{ color: "#9ca3af" }}>#{ticket.id}</span>{" "}
            {ticket.title}
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "1.1rem",
              color: "#6b7280",
              lineHeight: 1,
              padding: "0.1rem 0.3rem",
              borderRadius: 4,
            }}
            aria-label="Fechar modal"
          >
            ×
          </button>
        </div>
        <div className="kanban-modal-body">
          <TicketPanelContent
            ticket={ticket}
            statuses={statuses}
            users={users}
            onTicketUpdate={onTicketUpdate}
            isStaff={isStaff}
          />
        </div>
      </div>
    </div>
  );
}
