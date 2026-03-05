import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import TicketChat from "./TicketChat";

const PRIORITY_LABELS = { low: "Baixa", medium: "Média", high: "Alta", urgent: "Urgente" };
const PRIORITY_COLORS = { low: "#22c55e", medium: "#f59e0b", high: "#f97316", urgent: "#dc2626" };

const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"];

function fileExt(name) {
  return (name || "").split(".").pop().toLowerCase();
}

export default function TicketPanelContent({ ticket, statuses, users, isStaff, onTicketUpdate }) {
  const [editStatus, setEditStatus] = useState(ticket.status);
  const [editPriority, setEditPriority] = useState(ticket.priority);
  const [editAssigned, setEditAssigned] = useState(ticket.assignedId || "");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  const save = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const { data } = await api.put(`/tickets/${ticket.id}`, {
        status: editStatus,
        priority: editPriority,
        assignedId: editAssigned || null,
      });
      setSaveMsg({ type: "ok", text: "Salvo" });
      if (onTicketUpdate) onTicketUpdate(data);
      setTimeout(() => setSaveMsg(null), 2500);
    } catch {
      setSaveMsg({ type: "err", text: "Erro ao salvar" });
    } finally {
      setSaving(false);
    }
  };

  const apiBase = import.meta.env.VITE_API_URL?.replace("/api", "") || "";

  return (
    <div className="kanban-panel-content">
      {/* Info grid */}
      <div className="kanban-panel-section">
        <div className="kanban-panel-grid">
          <div>
            <span className="kanban-panel-label">Status</span>
            <span className="badge" style={{ background: statuses.find((s) => s.name === ticket.status)?.color || "#6b7280", color: "#fff" }}>
              {ticket.status}
            </span>
          </div>
          <div>
            <span className="kanban-panel-label">Prioridade</span>
            <span className="badge" style={{ background: PRIORITY_COLORS[ticket.priority] || "#6b7280", color: "#fff" }}>
              {PRIORITY_LABELS[ticket.priority] || ticket.priority}
            </span>
          </div>
          <div>
            <span className="kanban-panel-label">Tipo</span>
            <span>{ticket.type}</span>
          </div>
          <div>
            <span className="kanban-panel-label">Base</span>
            <span className="badge" style={{ background: "#fef3c7", color: "#92400e" }}>{ticket.base}</span>
          </div>
          <div>
            <span className="kanban-panel-label">Solicitante</span>
            <span>{ticket.requester}</span>
          </div>
          <div>
            <span className="kanban-panel-label">Responsável</span>
            <span>{ticket.assignedTo?.name || "Não atribuído"}</span>
          </div>
        </div>
      </div>

      {/* Edit section (staff only) */}
      {isStaff && (
        <div className="kanban-panel-section">
          <h4 className="kanban-panel-section-title">Editar</h4>
          <div className="kanban-panel-edit-grid">
            <div className="form-group">
              <label>Status</label>
              <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                {statuses.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Prioridade</label>
              <select value={editPriority} onChange={(e) => setEditPriority(e.target.value)}>
                {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Responsável</label>
              <select value={editAssigned} onChange={(e) => setEditAssigned(e.target.value)}>
                <option value="">Não atribuído</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </button>
            {saveMsg && (
              <span style={{ fontSize: "0.8rem", color: saveMsg.type === "ok" ? "#16a34a" : "#dc2626" }}>
                {saveMsg.text}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Description */}
      {ticket.description && (
        <div className="kanban-panel-section">
          <h4 className="kanban-panel-section-title">Descrição</h4>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.85rem", color: "#3a3f47", margin: 0, background: "#f4f5f7", padding: "0.75rem", borderRadius: "8px", border: "1px solid #eef0f3" }}>
            {ticket.description}
          </pre>
        </div>
      )}

      {/* Attachments */}
      {ticket.attachments?.length > 0 && (
        <div className="kanban-panel-section">
          <h4 className="kanban-panel-section-title">Anexos</h4>
          <div className="attachment-grid">
            {ticket.attachments.map((a) => {
              const ext = fileExt(a.filename);
              const isImg = IMAGE_EXTS.includes(ext);
              return (
                <a key={a.id} href={`${apiBase}/uploads/${a.path}`} target="_blank" rel="noopener noreferrer" className="attachment-item">
                  <div className="attachment-thumb">
                    {isImg ? (
                      <img src={`${apiBase}/uploads/${a.path}`} alt={a.filename} />
                    ) : (
                      <span className="attachment-icon">{ext.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="attachment-name">{a.filename}</div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Chat */}
      <div className="kanban-panel-section">
        <h4 className="kanban-panel-section-title">Chat</h4>
        <TicketChat ticketId={ticket.id} initialMessages={ticket.messages || []} />
      </div>

      {/* Footer link */}
      <div className="kanban-panel-section" style={{ textAlign: "center" }}>
        <Link to={`/tickets/${ticket.id}`} className="btn btn-secondary">
          Abrir detalhes completos
        </Link>
      </div>
    </div>
  );
}
