import TicketPanelContent from "./TicketPanelContent";

export default function KanbanTicketPanel({ ticket, statuses, users, onClose, onTicketUpdate, isStaff }) {
  return (
    <div className="kanban-panel">
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
          aria-label="Fechar painel"
        >
          ×
        </button>
      </div>
      <div className="kanban-panel-body">
        <TicketPanelContent
          ticket={ticket}
          statuses={statuses}
          users={users}
          onTicketUpdate={onTicketUpdate}
          isStaff={isStaff}
        />
      </div>
    </div>
  );
}
