import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import TicketChat from "./TicketChat";

const priorityColors = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#f97316",
  urgent: "#dc2626",
};

const TYPE_LABELS = {
  incidente: "Incidente",
  duvida: "Dúvida",
  melhoria: "Melhoria",
  acesso: "Acesso/Permissão",
  bug: "Bug/Erro",
  configuracao: "Configuração",
  treinamento: "Treinamento",
};

const IMG_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"];
const PDF_EXTS = ["pdf"];
const VIDEO_EXTS = ["mp4", "webm", "ogg"];

function getExt(filename) {
  return (filename || "").split(".").pop().toLowerCase();
}
function isImage(f) { return IMG_EXTS.includes(getExt(f)); }
function isPdf(f) { return PDF_EXTS.includes(getExt(f)); }
function isVideo(f) { return VIDEO_EXTS.includes(getExt(f)); }

export default function TicketPanelContent({ ticket, statuses, users, onTicketUpdate, isStaff }) {
  const navigate = useNavigate();

  const [editStatus, setEditStatus] = useState(ticket.status);
  const [editPriority, setEditPriority] = useState(ticket.priority);
  const [editAssigned, setEditAssigned] = useState(ticket.assignedId ?? "");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const { data } = await api.put(`/tickets/${ticket.id}`, {
        status: editStatus,
        priority: editPriority,
        assignedId: editAssigned ? parseInt(editAssigned) : null,
      });
      onTicketUpdate(data);
      setSaveMsg("success");
    } catch {
      setSaveMsg("error");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 2500);
    }
  };

  const statusObj = statuses.find((s) => s.name === ticket.status);

  return (
    <>
      {/* Info grid */}
      <div className="panel-section">
        <div className="panel-section-title">Informações</div>
        <div className="panel-info-grid">
          <div>
            <div className="panel-info-label">Status</div>
            <div className="panel-info-value">
              <span
                className="badge"
                style={{
                  background: statusObj?.color || "#6b7280",
                  color: "#fff",
                  fontSize: "0.68rem",
                }}
              >
                {ticket.status}
              </span>
            </div>
          </div>
          <div>
            <div className="panel-info-label">Prioridade</div>
            <div className="panel-info-value">
              <span
                className="badge"
                style={{
                  background: priorityColors[ticket.priority] || "#6b7280",
                  color: "#fff",
                  fontSize: "0.68rem",
                }}
              >
                {ticket.priority}
              </span>
            </div>
          </div>
          <div>
            <div className="panel-info-label">Tipo</div>
            <div className="panel-info-value">{TYPE_LABELS[ticket.type] || ticket.type}</div>
          </div>
          <div>
            <div className="panel-info-label">Base</div>
            <div className="panel-info-value">{ticket.base || "—"}</div>
          </div>
          <div>
            <div className="panel-info-label">Solicitante</div>
            <div className="panel-info-value">{ticket.requester}</div>
          </div>
          <div>
            <div className="panel-info-label">Atribuído</div>
            <div className="panel-info-value">{ticket.assignedTo?.name || "—"}</div>
          </div>
        </div>
      </div>

      {/* Edit section (staff only) */}
      {isStaff && (
        <div className="panel-section">
          <div className="panel-section-title">Editar</div>
          <div className="panel-edit-grid">
            <div>
              <div className="panel-info-label" style={{ marginBottom: "0.25rem" }}>Status</div>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                style={{ padding: "0.3rem 0.5rem", fontSize: "0.78rem" }}
              >
                {statuses.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="panel-info-label" style={{ marginBottom: "0.25rem" }}>Prioridade</div>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
                style={{ padding: "0.3rem 0.5rem", fontSize: "0.78rem" }}
              >
                {["low", "medium", "high", "urgent"].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="panel-info-label" style={{ marginBottom: "0.25rem" }}>Atribuído</div>
              <select
                value={editAssigned}
                onChange={(e) => setEditAssigned(e.target.value)}
                style={{ padding: "0.3rem 0.5rem", fontSize: "0.78rem" }}
              >
                <option value="">—</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ marginTop: "0.6rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <button
              className="btn btn-primary"
              style={{ fontSize: "0.78rem", padding: "0.3rem 0.85rem" }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Salvando…" : "Salvar"}
            </button>
            {saveMsg === "success" && (
              <span style={{ fontSize: "0.75rem", color: "#22c55e" }}>Salvo!</span>
            )}
            {saveMsg === "error" && (
              <span style={{ fontSize: "0.75rem", color: "#dc2626" }}>Erro ao salvar</span>
            )}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="panel-section">
        <div className="panel-section-title">Descrição</div>
        <p style={{ fontSize: "0.82rem", color: "#3a3f47", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
          {ticket.description || "—"}
        </p>
      </div>

      {/* Attachments */}
      <div className="panel-section">
        <div className="panel-section-title">Anexos</div>
        {(!ticket.attachments || ticket.attachments.length === 0) ? (
          <p style={{ fontSize: "0.78rem", color: "#9ca3af" }}>Nenhum arquivo anexado</p>
        ) : (
          <div className="attachment-grid">
            {ticket.attachments.map((a) => {
              const url = `/uploads/${a.path}`;
              const ext = getExt(a.filename);
              return (
                <div
                  key={a.id}
                  className="attachment-item"
                  onClick={() => window.open(url, "_blank")}
                >
                  <div className="attachment-thumb">
                    {isImage(a.filename) ? (
                      <img src={url} alt={a.filename} />
                    ) : isPdf(a.filename) ? (
                      <div className="attachment-icon">PDF</div>
                    ) : isVideo(a.filename) ? (
                      <div className="attachment-icon">VID</div>
                    ) : (
                      <div className="attachment-icon">{ext.toUpperCase().slice(0, 4)}</div>
                    )}
                  </div>
                  <div className="attachment-name" title={a.filename}>{a.filename}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Chat */}
      <div className="panel-section" style={{ borderBottom: "none" }}>
        <div className="panel-section-title">Chat</div>
        <TicketChat ticketId={ticket.id} initialMessages={ticket.messages} />
      </div>

      {/* Footer link */}
      <div style={{ padding: "0.6rem 1rem", borderTop: "1px solid #f0f1f4", textAlign: "right" }}>
        <button
          className="btn btn-secondary"
          style={{ fontSize: "0.75rem", padding: "0.25rem 0.65rem" }}
          onClick={() => navigate(`/tickets/${ticket.id}`)}
        >
          ↗ Abrir em tela cheia
        </button>
      </div>
    </>
  );
}
