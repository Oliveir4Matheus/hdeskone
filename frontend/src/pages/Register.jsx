import { useState, useEffect } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

const ROLE_LABELS = {
  admin: "Admin",
  support: "Support",
  colaborador: "Colaborador",
};

function EditUserModal({ editUser, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: editUser.name,
    email: editUser.email,
    role: editUser.role,
    password: "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const payload = { name: form.name, email: form.email, role: form.role };
      if (form.password.trim()) payload.password = form.password;
      await api.put(`/users/${editUser.id}`, payload);
      onSaved();
    } catch (err) {
      setMsg(err.response?.data?.error || "Falha ao salvar");
      setSaving(false);
    }
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        className="card"
        style={{
          width: 420,
          maxWidth: "90%",
          position: "relative",
          animation: "fadeIn 0.15s ease",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 style={{ fontSize: "1rem", margin: 0 }}>Editar Usuário</h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.2rem",
              cursor: "pointer",
              color: "#6b7280",
              fontWeight: 700,
            }}
          >
            X
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>Nome</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label>Tipo de Acesso</label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            >
              <option value="colaborador">Colaborador</option>
              <option value="support">Support</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="form-group">
            <label>Nova Senha (deixe em branco para manter)</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Mínimo 6 caracteres"
              minLength={6}
            />
          </div>

          {msg && (
            <p style={{ color: "#dc2626", fontSize: "0.82rem", marginBottom: "0.5rem" }}>
              {msg}
            </p>
          )}

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={saving}
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={onClose}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Register() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "colaborador" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const fetchUsers = () => {
    api.get("/users").then(({ data }) => setUsers(data)).catch(() => {});
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await api.post("/auth/register", form);
      setSuccess("Usuário criado com sucesso");
      setForm({ name: "", email: "", password: "", role: "colaborador" });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || "Falha ao criar usuário");
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== "admin") {
    return <p style={{ color: "#9ca3af" }}>Acesso restrito ao administrador</p>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Gerenciar Usuários</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "1.5rem" }}>
        <div className="card">
          {users.length === 0 ? (
            <p style={{ color: "#9ca3af" }}>Nenhum usuário encontrado</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Tipo</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: u.role === "admin" ? "#d70f0a" : u.role === "support" ? "#f59e0b" : "#3b82f6",
                          color: "#fff",
                        }}
                      >
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}
                        onClick={() => setEditUser(u)}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontSize: "1rem", marginBottom: "1rem" }}>Novo Usuário</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nome</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Senha</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label>Tipo</label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              >
                <option value="colaborador">Colaborador</option>
                <option value="support">Support</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {error && <p className="error-msg">{error}</p>}
            {success && (
              <p style={{ color: "#22c55e", fontSize: "0.82rem", marginBottom: "0.5rem" }}>
                {success}
              </p>
            )}
            <button
              className="btn btn-primary"
              style={{ width: "100%" }}
              disabled={loading}
            >
              {loading ? "Criando..." : "Criar Usuário"}
            </button>
          </form>
        </div>
      </div>

      {editUser && (
        <EditUserModal
          editUser={editUser}
          onClose={() => setEditUser(null)}
          onSaved={() => {
            setEditUser(null);
            fetchUsers();
          }}
        />
      )}
    </div>
  );
}
