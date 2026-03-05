import TicketPanelContent from "./TicketPanelContent";

export default function KanbanTicketPanel({ ticket, statuses, users, isStaff, onClose, onTicketUpdate }) {
  return (
    <div className="kanban-detail-panel">
      <div className="kanban-panel-header">
        <h3 style={{ fontSize: "0.95rem", fontWeight: 600, margin: 0 }}>
          <span style={{ color: "#9ca3af" }}>#{ticket.id}</span> {ticket.title}
        </h3>
        <button className="btn btn-secondary" onClick={onClose} aria-label="Fechar painel" style={{ padding: "0.25rem 0.6rem", fontSize: "0.8rem" }}>
          ✕
        </button>
      </div>
      <div className="kanban-panel-body">
        <TicketPanelContent ticket={ticket} statuses={statuses} users={users} isStaff={isStaff} onTicketUpdate={onTicketUpdate} />
      </div>
    </div>
  );
}
