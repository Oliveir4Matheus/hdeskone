import { useState, useEffect } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import ViewSwitcher from "../components/ViewSwitcher";
import KanbanPanelToggle from "../components/KanbanPanelToggle";
import KanbanTicketPanel from "../components/KanbanTicketPanel";
import KanbanTicketModal from "../components/KanbanTicketModal";

const priorityColors = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#f97316",
  urgent: "#dc2626",
};

export default function Kanban() {
  const { user } = useAuth();
  const isStaff = user?.role === "admin" || user?.role === "support";

  const [tickets, setTickets] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragId, setDragId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);

  const [panelMode, setPanelMode] = useState(
    () => localStorage.getItem("kanban-panel-mode") || "split"
  );
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loadingTicket, setLoadingTicket] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    Promise.all([api.get("/config/statuses"), api.get("/tickets", { params: { limit: 100 } })])
      .then(([statusRes, ticketRes]) => {
        const sorted = [...statusRes.data].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setStatuses(sorted);
        setTickets(ticketRes.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const ticketsByStatus = (statusName) => tickets.filter((t) => t.status === statusName);

  const moveTicket = (ticketId, newStatus) => {
    const prev = tickets.map((t) => ({ ...t }));
    setTickets((ts) => ts.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t)));
    api.put(`/tickets/${ticketId}`, { status: newStatus }).catch(() => setTickets(prev));
  };

  const onDragStart = (e, id) => {
    e.dataTransfer.setData("text/plain", id);
    setDragId(id);
  };
  const onDragEnd = () => { setDragId(null); setDropTarget(null); };
  const onDragOver = (e, statusName) => { e.preventDefault(); setDropTarget(statusName); };
  const onDragLeave = () => setDropTarget(null);
  const onDrop = (e, statusName) => {
    e.preventDefault();
    const id = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (id) moveTicket(id, statusName);
    setDropTarget(null);
    setDragId(null);
  };

  const selectTicket = async (id) => {
    setLoadingTicket(true);
    try {
      const { data } = await api.get(`/tickets/${id}`);
      setSelectedTicket(data);
      if (isStaff && users.length === 0) {
        const { data: staffUsers } = await api.get("/users");
        setUsers(staffUsers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTicket(false);
    }
  };

  const onTicketUpdate = (updated) => {
    setTickets((ts) => ts.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
    setSelectedTicket((prev) => prev ? { ...prev, ...updated } : prev);
  };

  const closePanel = () => setSelectedTicket(null);

  if (loading) return <p>Loading...</p>;

  const board = (
    <div className="kanban-board">
      {statuses.map((s) => {
        const items = ticketsByStatus(s.name);
        return (
          <div
            key={s.id}
            className={`kanban-column${dropTarget === s.name ? " kanban-column-over" : ""}`}
            onDragOver={(e) => onDragOver(e, s.name)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, s.name)}
          >
            <div className="kanban-column-header">
              <span className="badge" style={{ background: s.color || "#6b7280", color: "#fff" }}>
                {s.name}
              </span>
              <span className="kanban-count">{items.length}</span>
            </div>

            <div className="kanban-cards">
              {items.map((t) => (
                <div
                  key={t.id}
                  className={`kanban-card${selectedTicket?.id === t.id ? " kanban-card-selected" : ""}`}
                  draggable
                  onDragStart={(e) => onDragStart(e, t.id)}
                  onDragEnd={onDragEnd}
                  onClick={() => selectTicket(t.id)}
                  style={{ opacity: dragId === t.id ? 0.5 : 1 }}
                >
                  <div className="kanban-card-title">
                    <span style={{ color: "#9ca3af" }}>#{t.id}</span>{" "}
                    {t.title}
                  </div>
                  <div className="kanban-card-meta">
                    <span
                      className="badge"
                      style={{
                        background: priorityColors[t.priority] || "#6b7280",
                        color: "#fff",
                        fontSize: "0.65rem",
                      }}
                    >
                      {t.priority}
                    </span>
                    {t.base && (
                      <span
                        className="badge"
                        style={{ background: "#fef3c7", color: "#92400e", fontSize: "0.65rem" }}
                      >
                        {t.base}
                      </span>
                    )}
                    <span className="kanban-card-user">{t.requester}</span>
                    {t.assignedTo?.name && (
                      <span className="kanban-card-assigned">→ {t.assignedTo.name}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <h1>Tickets</h1>
          <ViewSwitcher />
          <KanbanPanelToggle panelMode={panelMode} onChange={setPanelMode} />
          {loadingTicket && (
            <span style={{ fontSize: "0.78rem", color: "#8b919d" }}>Carregando…</span>
          )}
        </div>
      </div>

      <div
        className={`kanban-layout${selectedTicket && panelMode === "split" ? " kanban-layout-split" : ""}`}
      >
        <div className="kanban-board-wrap">{board}</div>
        {selectedTicket && panelMode === "split" && (
          <KanbanTicketPanel
            ticket={selectedTicket}
            statuses={statuses}
            users={users}
            onClose={closePanel}
            onTicketUpdate={onTicketUpdate}
            isStaff={isStaff}
          />
        )}
      </div>

      {selectedTicket && panelMode === "centered" && (
        <KanbanTicketModal
          ticket={selectedTicket}
          statuses={statuses}
          users={users}
          onClose={closePanel}
          onTicketUpdate={onTicketUpdate}
          isStaff={isStaff}
        />
      )}
    </div>
  );
}
