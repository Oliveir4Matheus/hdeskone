import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";

const TICKET_TYPES = [
  { value: "incidente", label: "Incidente" },
  { value: "duvida", label: "Dúvida" },
  { value: "melhoria", label: "Melhoria" },
  { value: "acesso", label: "Acesso/Permissão" },
  { value: "bug", label: "Bug/Erro" },
  { value: "configuracao", label: "Configuração" },
  { value: "treinamento", label: "Treinamento" },
];

const BASES = [
  "CGH", "GRU", "BSB", "GIG", "SDU", "CNF", "CWB", "POA",
  "SSA", "REC", "FOR", "VCP", "MAO", "BEL", "FLN", "NAT",
  "MCZ", "AJU", "SLZ", "THE", "CGB", "GYN", "BPS", "CFB",
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initialForm = {
  title: "",
  description: "",
  type: "",
  base: "",
  requester: "",
  requesterEmail: "",
  message: "",
};

function EmailSuggestionDropdown({ input, isValid, onConfirm }) {
  return (
    <div
      style={{
        position: "absolute",
        top: "100%",
        left: 0,
        right: 0,
        marginTop: 2,
        background: "#fff",
        border: "1px solid #d1d5db",
        borderRadius: 6,
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        zIndex: 10,
        overflow: "hidden",
      }}
    >
      {isValid ? (
        <div
          onMouseDown={(e) => { e.preventDefault(); onConfirm(); }}
          style={{
            padding: "0.6rem 0.8rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.88rem",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f0ff")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
        >
          <span style={{
            background: "#22c55e",
            color: "#fff",
            borderRadius: "50%",
            width: 20,
            height: 20,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.75rem",
            fontWeight: 700,
            flexShrink: 0,
          }}>+</span>
          <span>Confirmar <strong>{input.trim()}</strong></span>
        </div>
      ) : (
        <div style={{ padding: "0.6rem 0.8rem", color: "#9ca3af", fontSize: "0.85rem" }}>
          Digite um e-mail válido (ex: nome@empresa.com)
        </div>
      )}
    </div>
  );
}

function EmailSingleInput({ value, onChange, placeholder, required, formRef }) {
  const [input, setInput] = useState(value || "");
  const [confirmed, setConfirmed] = useState(!!value);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const isValid = EMAIL_REGEX.test(input.trim());

  const confirm = () => {
    if (isValid) {
      const email = input.trim();
      setConfirmed(true);
      setShowSuggestion(false);
      setError("");
      onChange(email);
    }
  };

  const clear = () => {
    setInput("");
    setConfirmed(false);
    setError("");
    onChange("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (isValid) confirm();
    }
  };

  // Expose validate method so parent form can auto-confirm or show error
  useRef(() => {});
  // We use a ref callback approach: parent passes formRef
  if (formRef) {
    formRef.current = {
      validate: () => {
        if (confirmed) return true;
        if (isValid) { confirm(); return true; }
        setError("Confirme o e-mail clicando na sugestão abaixo");
        inputRef.current?.focus();
        return false;
      },
    };
  }

  return (
    <div style={{ position: "relative" }}>
      {confirmed ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.4rem 0.6rem",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            background: "#fff",
            minHeight: 40,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              background: "#e0e7ff",
              color: "#3730a3",
              padding: "0.2rem 0.5rem",
              borderRadius: 4,
              fontSize: "0.82rem",
              wordBreak: "break-all",
            }}
          >
            {input}
            <button
              type="button"
              onClick={clear}
              style={{
                background: "none",
                border: "none",
                color: "#6366f1",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: "pointer",
                padding: 0,
                lineHeight: 1,
              }}
            >
              x
            </button>
          </span>
        </div>
      ) : (
        <>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setShowSuggestion(e.target.value.trim().length > 0);
              setError("");
              onChange("");
            }}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setShowSuggestion(false), 150)}
            onFocus={() => { if (input.trim()) setShowSuggestion(true); }}
            placeholder={placeholder}
            autoComplete="off"
            data-lpignore="true"
            data-form-type="other"
            style={{ width: "100%", borderColor: error ? "#dc2626" : undefined }}
          />
          {error && (
            <p style={{ color: "#dc2626", fontSize: "0.78rem", marginTop: "0.25rem", marginBottom: 0 }}>
              {error}
            </p>
          )}
        </>
      )}

      {showSuggestion && input.trim() && !confirmed && (
        <EmailSuggestionDropdown input={input} isValid={isValid} onConfirm={confirm} />
      )}
    </div>
  );
}

function EmailChipInput({ emails, setEmails }) {
  const [input, setInput] = useState("");
  const [showSuggestion, setShowSuggestion] = useState(false);
  const inputRef = useRef(null);

  const isValidEmail = EMAIL_REGEX.test(input.trim());

  const addEmail = () => {
    const email = input.trim();
    if (email && isValidEmail && !emails.includes(email)) {
      setEmails([...emails, email]);
      setInput("");
      setShowSuggestion(false);
    }
  };

  const removeEmail = (index) => {
    setEmails(emails.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (isValidEmail) addEmail();
    }
    if (e.key === "Backspace" && input === "" && emails.length > 0) {
      removeEmail(emails.length - 1);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <div
        onClick={() => inputRef.current?.focus()}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.35rem",
          padding: "0.4rem 0.6rem",
          border: "1px solid #d1d5db",
          borderRadius: 6,
          background: "#fff",
          minHeight: 40,
          alignItems: "center",
          cursor: "text",
        }}
      >
        {emails.map((email, i) => (
          <span
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              background: "#e0e7ff",
              color: "#3730a3",
              padding: "0.2rem 0.5rem",
              borderRadius: 4,
              fontSize: "0.82rem",
              maxWidth: "100%",
              wordBreak: "break-all",
            }}
          >
            {email}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeEmail(i); }}
              style={{
                background: "none",
                border: "none",
                color: "#6366f1",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: "pointer",
                padding: 0,
                lineHeight: 1,
              }}
            >
              x
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestion(e.target.value.trim().length > 0);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => setTimeout(() => setShowSuggestion(false), 150)}
          onFocus={() => { if (input.trim()) setShowSuggestion(true); }}
          placeholder={emails.length === 0 ? "Digite um e-mail e clique para adicionar..." : ""}
          autoComplete="off"
          data-lpignore="true"
          data-form-type="other"
          style={{
            border: "none",
            outline: "none",
            flex: 1,
            minWidth: 180,
            fontSize: "0.9rem",
            padding: "0.15rem 0",
            background: "transparent",
          }}
        />
      </div>

      {showSuggestion && input.trim() && (
        <EmailSuggestionDropdown input={input} isValid={isValidEmail} onConfirm={addEmail} />
      )}
    </div>
  );
}

export default function NewTicket() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [ccEmails, setCcEmails] = useState([]);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const emailInputRef = useRef(null);

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate email field (auto-confirm if valid but not yet confirmed)
    if (!token && emailInputRef.current) {
      if (!emailInputRef.current.validate()) return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("type", form.type);
      formData.append("base", form.base);

      if (ccEmails.length > 0) {
        formData.append("ccEmails", ccEmails.join(", "));
      }

      if (!token) {
        formData.append("requester", form.requester || "anonymous");
        if (form.requesterEmail) {
          formData.append("requesterEmail", form.requesterEmail);
        }
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
              setForm(initialForm);
              setCcEmails([]);
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
            <label>Nome *</label>
            <input
              value={form.requester}
              onChange={(e) =>
                setForm((f) => ({ ...f, requester: e.target.value }))
              }
              placeholder="Seu nome"
              required
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Email *</label>
            <EmailSingleInput
              value={form.requesterEmail}
              onChange={(val) => setForm((f) => ({ ...f, requesterEmail: val }))}
              placeholder="seu@email.com"
              required
              formRef={emailInputRef}
            />
          </div>
        </div>
      )}

      <div className="form-group">
        <label>Título *</label>
        <input
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          required
        />
      </div>

      <div className="form-group">
        <label>Descrição *</label>
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
          <label>Tipo de Chamado *</label>
          <select
            value={form.type}
            onChange={(e) =>
              setForm((f) => ({ ...f, type: e.target.value }))
            }
            required
          >
            <option value="" disabled>Selecione...</option>
            {TICKET_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ flex: 1 }}>
          <label>Base *</label>
          <select
            value={form.base}
            onChange={(e) =>
              setForm((f) => ({ ...f, base: e.target.value }))
            }
            required
          >
            <option value="" disabled>Selecione...</option>
            {BASES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>Em Cópia</label>
        <EmailChipInput emails={ccEmails} setEmails={setCcEmails} />
      </div>

      {/* File upload */}
      <div className="form-group">
        <label>Anexos</label>
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
          <label>Mensagem inicial (opcional)</label>
          <textarea
            value={form.message}
            onChange={(e) =>
              setForm((f) => ({ ...f, message: e.target.value }))
            }
            rows={3}
            placeholder="Adicione uma nota ou mensagem inicial ao ticket..."
          />
        </div>
      )}

      {error && <p className="error-msg">{error}</p>}
      <button
        className="btn btn-primary"
        style={{ width: "100%", marginTop: "0.5rem" }}
        disabled={loading}
      >
        {loading ? "Enviando..." : "Enviar Ticket"}
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
