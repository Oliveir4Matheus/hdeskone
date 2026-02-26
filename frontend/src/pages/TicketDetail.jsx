import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import TicketChat from "../components/TicketChat";

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

function isImage(filename) {
  return IMG_EXTS.includes(getExt(filename));
}

function isPdf(filename) {
  return PDF_EXTS.includes(getExt(filename));
}

function isVideo(filename) {
  return VIDEO_EXTS.includes(getExt(filename));
}

function isPreviewable(filename) {
  return isImage(filename) || isPdf(filename) || isVideo(filename);
}

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState([]);
  const [preview, setPreview] = useState(null);

  const isStaff = user?.role === "admin" || user?.role === "support";

  useEffect(() => {
    const requests = [api.get(`/tickets/${id}`)];
    if (isStaff) {
      requests.push(api.get("/users"), api.get("/config/statuses"));
    }
    Promise.all(requests)
      .then((results) => {
        setTicket(results[0].data);
        if (isStaff) {
          setUsers(results[1].data);
          setStatuses(results[2].data);
        }
      })
      .catch((err) => {
        console.error(err);
        if (err.response?.status === 404 || err.response?.status === 403) navigate("/tickets");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const update = async (data) => {
    try {
      const { data: updated } = await api.put(`/tickets/${id}`, data);
      setTicket((prev) => ({ ...prev, ...updated }));
    } catch (err) {
      alert("Failed to update ticket");
    }
  };

  const deleteTicket = async () => {
    if (!confirm("Are you sure you want to delete this ticket?")) return;
    try {
      await api.delete(`/tickets/${id}`);
      navigate("/tickets");
    } catch {
      alert("Failed to delete ticket");
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setPreview(null);
    };
    if (preview) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [preview]);

  const uploadFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const { data } = await api.post(`/tickets/${id}/attachments`, formData);
      setTicket((prev) => ({
        ...prev,
        attachments: [...prev.attachments, data],
      }));
    } catch {
      alert("Failed to upload file");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!ticket) return <p>Ticket not found</p>;

  return (
    <div>
      <div className="page-header">
        <h1>Ticket #{ticket.id}</h1>
        {user?.role === "admin" && (
          <button className="btn btn-danger" onClick={deleteTicket}>
            Delete
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isStaff ? "1fr 350px" : "1fr", gap: "0.75rem" }}>
        <div>
          <div className="card" style={{ marginBottom: "0.75rem", padding: "0.85rem 1.25rem" }}>
            <h2 style={{ fontSize: "1.1rem", marginBottom: "0.3rem" }}>
              {ticket.title}
            </h2>
            <p style={{ color: "#6b7280", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
              {ticket.description}
            </p>
            <div style={{ fontSize: "0.78rem", color: "#9ca3af", display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
              <span>Requester: {ticket.requester}{ticket.requesterEmail && ` (${ticket.requesterEmail})`}</span>
              <span>|</span>
              <span>Tipo: {TYPE_LABELS[ticket.type] || ticket.type}</span>
              <span>|</span>
              <span>Base: {ticket.base}</span>
              <span>|</span>
              <span>Created: {new Date(ticket.createdAt).toLocaleString()}</span>
            </div>
            {ticket.ccEmails && (
              <div style={{ fontSize: "0.78rem", color: "#9ca3af", marginTop: "0.25rem" }}>
                Em Cópia: {ticket.ccEmails}
              </div>
            )}
          </div>

          <div className="card" style={{ marginBottom: "0.75rem", padding: "0.85rem 1.25rem" }}>
            <h3 style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>Chat</h3>
            <TicketChat ticketId={ticket.id} initialMessages={ticket.messages} />
          </div>

          <div className="card" style={{ padding: "0.85rem 1.25rem" }}>
            <h3 style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>
              Attachments
            </h3>
            {ticket.attachments.length === 0 && (
              <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>No attachments</p>
            )}

            {ticket.attachments.length > 0 && (
              <div className="attachment-grid">
                {ticket.attachments.map((a) => {
                  const url = `/uploads/${a.path}`;
                  const ext = getExt(a.filename);

                  return (
                    <div
                      key={a.id}
                      className="attachment-item"
                      onClick={() =>
                        isPreviewable(a.filename)
                          ? setPreview(a)
                          : window.open(url, "_blank")
                      }
                    >
                      <div className="attachment-thumb">
                        {isImage(a.filename) ? (
                          <img src={url} alt={a.filename} />
                        ) : isPdf(a.filename) ? (
                          <div className="attachment-icon">PDF</div>
                        ) : isVideo(a.filename) ? (
                          <div className="attachment-icon">VID</div>
                        ) : (
                          <div className="attachment-icon">
                            {ext.toUpperCase().slice(0, 4)}
                          </div>
                        )}
                      </div>
                      <div className="attachment-name" title={a.filename}>
                        {a.filename}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ marginTop: "0.5rem" }}>
              <input type="file" onChange={uploadFile} />
            </div>
          </div>

          {/* Preview overlay */}
          {preview && (
            <div
              className="preview-overlay"
              onClick={(e) => {
                if (e.target === e.currentTarget) setPreview(null);
              }}
            >
              <div className="preview-container">
                <div className="preview-header">
                  <span className="preview-filename">{preview.filename}</span>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <a
                      href={`/uploads/${preview.path}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary"
                      style={{ fontSize: "0.78rem", padding: "0.3rem 0.7rem" }}
                    >
                      Open
                    </a>
                    <button
                      className="btn btn-danger"
                      style={{ fontSize: "0.78rem", padding: "0.3rem 0.7rem" }}
                      onClick={() => setPreview(null)}
                    >
                      Close
                    </button>
                  </div>
                </div>
                <div className="preview-body">
                  {isImage(preview.filename) && (
                    <img
                      src={`/uploads/${preview.path}`}
                      alt={preview.filename}
                      style={{
                        maxWidth: "100%",
                        maxHeight: "75vh",
                        objectFit: "contain",
                        borderRadius: 6,
                      }}
                    />
                  )}
                  {isPdf(preview.filename) && (
                    <iframe
                      src={`/uploads/${preview.path}`}
                      title={preview.filename}
                      style={{
                        width: "100%",
                        height: "75vh",
                        border: "none",
                        borderRadius: 6,
                      }}
                    />
                  )}
                  {isVideo(preview.filename) && (
                    <video
                      src={`/uploads/${preview.path}`}
                      controls
                      style={{
                        maxWidth: "100%",
                        maxHeight: "75vh",
                        borderRadius: 6,
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {isStaff && (
          <div>
            <div className="card" style={{ padding: "0.85rem 1.25rem" }}>
              <h3 style={{ fontSize: "0.9rem", marginBottom: "0.65rem" }}>Properties</h3>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={ticket.status}
                  onChange={(e) => update({ status: e.target.value })}
                >
                  {statuses.length > 0
                    ? statuses.map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name}
                        </option>
                      ))
                    : ["open", "in_progress", "waiting", "closed"].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                </select>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select
                  value={ticket.priority}
                  onChange={(e) => update({ priority: e.target.value })}
                >
                  {["low", "medium", "high", "urgent"].map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Assigned To</label>
                <select
                  value={ticket.assignedId || ""}
                  onChange={(e) =>
                    update({
                      assignedId: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
