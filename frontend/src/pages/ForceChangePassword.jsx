import { useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function ForceChangePassword() {
  const { updateUser, logout } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      return setError("As senhas não coincidem");
    }

    const rules = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!rules.test(password)) {
      return setError("A senha deve ter no mínimo 8 caracteres, 1 maiúscula, 1 número e 1 caractere especial");
    }

    setLoading(true);
    try {
      const { data } = await api.put("/profile", { password });
      updateUser(data);
    } catch (err) {
      setError(err.response?.data?.error || "Falha ao alterar senha");
    } finally {
      setLoading(false);
    }
  };

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
      <div className="card" style={{ width: 420, maxWidth: "90%" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.25rem" }}>Troca de Senha Obrigatória</h2>
        <p style={{ color: "#6b7280", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
          Por segurança, defina uma nova senha antes de continuar.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nova Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Mín. 8 caracteres"
            />
            <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>
              Mín. 8 caracteres, 1 maiúscula, 1 número, 1 especial
            </span>
          </div>
          <div className="form-group">
            <label>Confirmar Senha</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
              placeholder="Repita a senha"
            />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "0.5rem" }}
            disabled={loading}
          >
            {loading ? "Salvando..." : "Alterar Senha"}
          </button>
        </form>
        <button
          onClick={logout}
          style={{
            width: "100%",
            marginTop: "0.75rem",
            background: "none",
            border: "none",
            color: "#9ca3af",
            fontSize: "0.82rem",
            cursor: "pointer",
          }}
        >
          Sair
        </button>
      </div>
    </div>
  );
}
