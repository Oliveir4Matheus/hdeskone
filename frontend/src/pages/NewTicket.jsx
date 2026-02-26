import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";

export default function NewTicket() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    requester: "",
    requesterEmail: "",
    assignedId: "",
    message: "",
  });
  const [files, setFiles] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      api
        .get("/users")
        .then(({ data }) => setUsers(data))
        .catch(() => {});
    }
  }, [token]);

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("priority", form.priority);

      if (!token) {
        formData.append("requester", form.requester || "anonymous");
        if (form.requesterEmail) {
          formData.append("requesterEmail", form.requesterEmail);
        }
      }
      if (token && form.assignedId) {
        formData.append("assignedId", form.assignedId);
      }
      if (token && form.message.trim()) {
        formData.append("message", form.message.trim());
      }

      files.forEach((f) => formData.append("files", f));

      const { data } = await api.post("/tickets", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (token) {
        navigate(`/tickets/${data.id}`);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f5f5",
        }}
      >
        <div
          style={{
            fontSize: "1.5rem",
            fontWeight: 800,
            color: "#111111",
            letterSpacing: "-0.025em",
            marginBottom: "2rem",
          }}
        >
          <span style={{ color: "#d70f0a" }}>hdesk</span>one
        </div>
        <div className="card" style={{ textAlign: "center", maxWidth: 400 }}>
          <h2 style={{ color: "#22c55e", marginBottom: "0.5rem" }}>
            Ticket submitted!
          </h2>
          <p style={{ color: "#6b7280", marginBottom: "1rem" }}>
            Your ticket has been received. Our team will review it shortly.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => {
              setSuccess(false);
              setForm({
                title: "",
                description: "",
                priority: "medium",
                requester: "",
                requesterEmail: "",
                assignedId: "",
                message: "",
              });
              setFiles([]);
            }}
          >
            Submit another
          </button>
        </div>
      </div>
    );
  }

  const formContent = (
    <form onSubmit={handleSubmit}>
      {/* Requester - only for public (no auth) */}
      {!token && (
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Name *</label>
            <input
              value={form.requester}
              onChange={(e) =>
                setForm((f) => ({ ...f, requester: e.target.value }))
              }
              placeholder="Your name"
              required
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Email *</label>
            <input
              type="email"
              value={form.requesterEmail}
              onChange={(e) =>
                setForm((f) => ({ ...f, requesterEmail: e.target.value }))
              }
              placeholder="your@email.com"
              required
            />
          </div>
        </div>
      )}

      <div className="form-group">
        <label>Title *</label>
        <input
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          required
        />
      </div>

      <div className="form-group">
        <label>Description *</label>
        <textarea
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
          rows={5}
          required
        />
      </div>

      <div style={{ display: "flex", gap: "1rem" }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label>Priority</label>
          <select
            value={form.priority}
            onChange={(e) =>
              setForm((f) => ({ ...f, priority: e.target.value }))
            }
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        {/* Assignment - only for authenticated users */}
        {token && (
          <div className="form-group" style={{ flex: 1 }}>
            <label>Assign to</label>
            <select
              value={form.assignedId}
              onChange={(e) =>
                setForm((f) => ({ ...f, assignedId: e.target.value }))
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
        )}
      </div>

      {/* File upload */}
      <div className="form-group">
        <label>Attachments</label>
        <input
          type="file"
          multiple
          onChange={(e) =>
            setFiles((prev) => [...prev, ...Array.from(e.target.files)])
          }
        />
        {files.length > 0 && (
          <ul
            style={{
              listStyle: "none",
              marginTop: "0.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.35rem",
            }}
          >
            {files.map((f, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.35rem 0.5rem",
                  background: "#f5f5f5",
                  borderRadius: 4,
                  fontSize: "0.85rem",
                }}
              >
                <span>
                  {f.name}{" "}
                  <span style={{ color: "#9ca3af" }}>
                    ({(f.size / 1024).toFixed(1)} KB)
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#dc2626",
                    fontWeight: 600,
                    fontSize: "1rem",
                  }}
                >
                  x
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Initial message (chat) - only for authenticated users */}
      {token && (
        <div className="form-group">
          <label>Initial message (optional)</label>
          <textarea
            value={form.message}
            onChange={(e) =>
              setForm((f) => ({ ...f, message: e.target.value }))
            }
            rows={3}
            placeholder="Add an initial note or message to this ticket..."
          />
        </div>
      )}

      {error && <p className="error-msg">{error}</p>}
      <button
        className="btn btn-primary"
        style={{ width: "100%", marginTop: "0.5rem" }}
        disabled={loading}
      >
        {loading ? "Submitting..." : "Submit Ticket"}
      </button>
    </form>
  );

  // Public view — brand + form centered
  if (!token) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f5f5",
        }}
      >
        <div
          style={{
            fontSize: "1.5rem",
            fontWeight: 800,
            color: "#111111",
            letterSpacing: "-0.025em",
            marginBottom: "2rem",
          }}
        >
          <span style={{ color: "#d70f0a" }}>hdesk</span>one
        </div>
        <div className="card" style={{ width: 600, maxWidth: "90%" }}>
          {formContent}
        </div>
      </div>
    );
  }

  // Authenticated view — form centered in main area
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 4rem)",
      }}
    >
      <div
        style={{
          fontSize: "1.5rem",
          fontWeight: 800,
          color: "#111111",
          letterSpacing: "-0.025em",
          marginBottom: "2rem",
        }}
      >
        <span style={{ color: "#d70f0a" }}>hdesk</span>one
      </div>
      <div className="card" style={{ width: 600, maxWidth: "90%" }}>
        {formContent}
      </div>
    </div>
  );
}
