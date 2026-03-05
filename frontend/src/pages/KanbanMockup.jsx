import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ViewSwitcher from "../components/ViewSwitcher";

const STORAGE_KEY = "kanban-panel-mode";

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

const MOCK_STATUSES = [
  { id: 1, name: "Aberto",       color: "#22c55e" },
  { id: 2, name: "Em Andamento", color: "#3b82f6" },
  { id: 3, name: "Aguardando",   color: "#f59e0b" },
  { id: 4, name: "Fechado",      color: "#6b7280" },
];

const MOCK_TICKETS = [
  {
    id: 42,
    title: "Deploy com erro em produção",
    status: "Aberto",
    priority: "urgent",
    type: "incidente",
    base: "GRU",
    requester: "Ana Silva",
    requesterEmail: "ana@swissport.com",
    assignedTo: { name: "Bob Lima" },
    description:
      "Ao realizar o deploy do ambiente de produção, o serviço retornou erro 502. Os logs indicam falha na conexão com o banco de dados após a migração da versão 3.4.",
    createdAt: "2026-03-01T10:30:00Z",
    messages: [
      {
        id: 1,
        content: "O erro acontece desde ontem às 18h, tentei rollback mas não resolveu.",
        user: { name: "Ana Silva" },
        createdAt: "2026-03-01T11:00:00Z",
      },
      {
        id: 2,
        content: "Estamos verificando os logs de conexão. Consegue enviar o stack trace completo?",
        user: { name: "Bob Lima" },
        createdAt: "2026-03-01T11:15:00Z",
      },
    ],
  },
  {
    id: 39,
    title: "Falha no login de colaboradores",
    status: "Aberto",
    priority: "medium",
    type: "bug",
    base: "CGH",
    requester: "Carlos Mota",
    requesterEmail: "carlos@swissport.com",
    assignedTo: null,
    description:
      "Colaboradores da base CGH não conseguem fazer login desde a última atualização. A mensagem de erro é 'credenciais inválidas' mesmo com a senha correta.",
    createdAt: "2026-03-02T08:15:00Z",
    messages: [
      {
        id: 3,
        content: "Já tentei redefinir a senha mas o problema persiste.",
        user: { name: "Carlos Mota" },
        createdAt: "2026-03-02T08:30:00Z",
      },
    ],
  },
  {
    id: 38,
    title: "Configuração do nginx reverso",
    status: "Em Andamento",
    priority: "high",
    type: "configuracao",
    base: "BSB",
    requester: "Fernanda Lopes",
    requesterEmail: "fernanda@swissport.com",
    assignedTo: { name: "Tom Souza" },
    description:
      "Necessário configurar o proxy reverso no nginx para redirecionar o tráfego do domínio interno para o novo servidor de aplicação na porta 8080.",
    createdAt: "2026-02-28T14:00:00Z",
    messages: [],
  },
  {
    id: 40,
    title: "Permissão de acesso ao sistema",
    status: "Em Andamento",
    priority: "low",
    type: "acesso",
    base: "GRU",
    requester: "Lia Santos",
    requesterEmail: "lia@swissport.com",
    assignedTo: { name: "Bob Lima" },
    description:
      "Solicitação de acesso ao módulo de relatórios para o perfil colaborador. O usuário precisa de permissão de leitura somente.",
    createdAt: "2026-03-01T16:45:00Z",
    messages: [],
  },
  {
    id: 41,
    title: "VPN sem conexão na base",
    status: "Aguardando",
    priority: "medium",
    type: "incidente",
    base: "GIG",
    requester: "Pedro Cruz",
    requesterEmail: "pedro@swissport.com",
    assignedTo: { name: "Tom Souza" },
    description:
      "A VPN corporativa não conecta na base GIG. Os usuários estão sem acesso aos sistemas internos. Aguardando retorno da equipe de infraestrutura sobre a janela de manutenção.",
    createdAt: "2026-03-03T09:00:00Z",
    messages: [
      {
        id: 4,
        content: "Já abri chamado junto à equipe de infra, aguardando confirmação da janela de manutenção.",
        user: { name: "Tom Souza" },
        createdAt: "2026-03-03T10:00:00Z",
      },
    ],
  },
  {
    id: 35,
    title: "Atualização material EHS",
    status: "Fechado",
    priority: "low",
    type: "treinamento",
    base: "CWB",
    requester: "Marcia Lima",
    requesterEmail: "marcia@swissport.com",
    assignedTo: { name: "Bob Lima" },
    description:
      "Solicitação de atualização do material de treinamento EHS para os colaboradores da base CWB. Material atualizado e disponibilizado no portal.",
    createdAt: "2026-02-20T10:00:00Z",
    messages: [
      {
        id: 5,
        content: "Material atualizado e enviado por e-mail para todos os colaboradores da base.",
        user: { name: "Bob Lima" },
        createdAt: "2026-02-21T14:00:00Z",
      },
    ],
  },
];

// ─── Conteúdo do painel/modal ────────────────────────────────────────────────

function TicketPanelContent({ ticket, onClose }) {
  const statusColor =
    MOCK_STATUSES.find((s) => s.name === ticket.status)?.color || "#6b7280";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Cabeçalho */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "0.75rem",
          padding: "1rem",
          borderBottom: "1px solid #f0f1f4",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <span style={{ fontSize: "0.72rem", color: "#9ca3af", fontWeight: 600 }}>
            #{ticket.id}
          </span>
          <h3
            style={{
              fontSize: "0.95rem",
              fontWeight: 700,
              color: "#111",
              lineHeight: 1.4,
              marginTop: "0.15rem",
            }}
          >
            {ticket.title}
          </h3>
        </div>
        <button
          onClick={onClose}
          title="Fechar"
          style={{
            background: "none",
            border: "none",
            fontSize: "1.25rem",
            color: "#8b919d",
            cursor: "pointer",
            flexShrink: 0,
            lineHeight: 1,
            padding: "2px 4px",
            borderRadius: 4,
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.target.style.color = "#111")}
          onMouseLeave={(e) => (e.target.style.color = "#8b919d")}
        >
          ×
        </button>
      </div>

      {/* Corpo com scroll */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
        {/* Grid de metadados */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.65rem 1.25rem",
            marginBottom: "1.1rem",
          }}
        >
          {[
            {
              label: "Status",
              value: (
                <span
                  className="badge"
                  style={{ background: statusColor, color: "#fff", fontSize: "0.7rem" }}
                >
                  {ticket.status}
                </span>
              ),
            },
            {
              label: "Prioridade",
              value: (
                <span
                  className="badge"
                  style={{
                    background: priorityColors[ticket.priority],
                    color: "#fff",
                    fontSize: "0.7rem",
                  }}
                >
                  {ticket.priority}
                </span>
              ),
            },
            {
              label: "Tipo",
              value: (
                <span style={{ fontSize: "0.8rem", color: "#3a3f47" }}>
                  {TYPE_LABELS[ticket.type] || ticket.type}
                </span>
              ),
            },
            {
              label: "Base",
              value: ticket.base ? (
                <span
                  className="badge"
                  style={{ background: "#fef3c7", color: "#92400e", fontSize: "0.7rem" }}
                >
                  {ticket.base}
                </span>
              ) : (
                <span style={{ color: "#b0b5bf" }}>—</span>
              ),
            },
            {
              label: "Solicitante",
              value: <span style={{ fontSize: "0.8rem", color: "#3a3f47" }}>{ticket.requester}</span>,
            },
            {
              label: "Atribuído",
              value: ticket.assignedTo ? (
                <span style={{ fontSize: "0.8rem", color: "#3a3f47" }}>{ticket.assignedTo.name}</span>
              ) : (
                <span style={{ color: "#b0b5bf", fontSize: "0.8rem" }}>—</span>
              ),
            },
          ].map(({ label, value }) => (
            <div key={label}>
              <div
                style={{
                  fontSize: "0.67rem",
                  color: "#8b919d",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: "0.25rem",
                }}
              >
                {label}
              </div>
              {value}
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px solid #f0f1f4", marginBottom: "1rem" }} />

        {/* Descrição */}
        <div style={{ marginBottom: "1.1rem" }}>
          <div
            style={{
              fontSize: "0.67rem",
              color: "#8b919d",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: "0.4rem",
            }}
          >
            Descrição
          </div>
          <p style={{ fontSize: "0.82rem", color: "#3a3f47", lineHeight: 1.65 }}>
            {ticket.description}
          </p>
        </div>

        {/* Mensagens */}
        {ticket.messages.length > 0 && (
          <>
            <div style={{ borderTop: "1px solid #f0f1f4", marginBottom: "1rem" }} />
            <div>
              <div
                style={{
                  fontSize: "0.67rem",
                  color: "#8b919d",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: "0.6rem",
                }}
              >
                Mensagens ({ticket.messages.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {ticket.messages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      background: "#f8f9fb",
                      border: "1px solid #eef0f3",
                      borderRadius: 8,
                      padding: "0.6rem 0.75rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "0.25rem",
                      }}
                    >
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#3a3f47" }}>
                        {msg.user.name}
                      </span>
                      <span style={{ fontSize: "0.7rem", color: "#b0b5bf" }}>
                        {new Date(msg.createdAt).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "#3a3f47", lineHeight: 1.55 }}>
                      {msg.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Rodapé */}
      <div
        style={{
          padding: "0.75rem 1rem",
          borderTop: "1px solid #f0f1f4",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Link
          to={`/tickets/${ticket.id}`}
          style={{
            fontSize: "0.8rem",
            color: "#d70f0a",
            fontWeight: 550,
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
          }}
        >
          ↗ Abrir em tela cheia
        </Link>
      </div>
    </div>
  );
}

// ─── Página principal do mockup ──────────────────────────────────────────────

export default function KanbanMockup() {
  const [panelMode, setPanelMode] = useState(
    () => localStorage.getItem(STORAGE_KEY) || "split"
  );
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Fechar com Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") setSelectedTicket(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const switchMode = (mode) => {
    setPanelMode(mode);
    localStorage.setItem(STORAGE_KEY, mode);
    setSelectedTicket(null);
  };

  const handleCardClick = (ticket) => {
    setSelectedTicket((prev) => (prev?.id === ticket.id ? null : ticket));
  };

  const ticketsByStatus = (statusName) =>
    MOCK_TICKETS.filter((t) => t.status === statusName);

  const isSplitOpen = panelMode === "split" && selectedTicket;

  return (
    <div>
      {/* ── Cabeçalho ── */}
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <h1>Tickets</h1>
          <ViewSwitcher />
        </div>

        {/* Toggle split / centralizado */}
        <div
          style={{
            display: "inline-flex",
            gap: 2,
            background: "#eef0f3",
            borderRadius: 8,
            padding: 3,
          }}
        >
          {[
            { id: "split",    icon: "⊞", label: "Lado a lado" },
            { id: "centered", icon: "⊡", label: "Centralizado" },
          ].map(({ id, icon, label }) => (
            <button
              key={id}
              onClick={() => switchMode(id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.3rem 0.85rem",
                fontSize: "0.78rem",
                fontWeight: 550,
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s",
                background: panelMode === id ? "#fff" : "transparent",
                color: panelMode === id ? "#111" : "#8b919d",
                boxShadow:
                  panelMode === id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              <span style={{ fontSize: "1rem", lineHeight: 1 }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Layout principal ── */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          alignItems: "flex-start",
        }}
      >
        {/* Board */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            gap: "1rem",
            overflowX: "auto",
            alignItems: "flex-start",
            paddingBottom: "1rem",
            transition: "all 0.25s",
          }}
        >
          {MOCK_STATUSES.map((s) => {
            const items = ticketsByStatus(s.name);
            return (
              <div
                key={s.id}
                className="kanban-column"
                style={{
                  minWidth: isSplitOpen ? 210 : 260,
                  maxWidth: isSplitOpen ? 250 : 300,
                  transition: "min-width 0.25s, max-width 0.25s",
                }}
              >
                <div className="kanban-column-header">
                  <span
                    className="badge"
                    style={{ background: s.color, color: "#fff" }}
                  >
                    {s.name}
                  </span>
                  <span className="kanban-count">{items.length}</span>
                </div>

                <div className="kanban-cards">
                  {items.map((t) => {
                    const isSelected = selectedTicket?.id === t.id;
                    return (
                      <div
                        key={t.id}
                        className="kanban-card"
                        onClick={() => handleCardClick(t)}
                        style={{
                          cursor: "pointer",
                          border: isSelected
                            ? "2px solid #d70f0a"
                            : "1px solid #eef0f3",
                          background: isSelected ? "#fff7f7" : "#f8f9fb",
                          transition: "border 0.15s, background 0.15s",
                        }}
                      >
                        <div className="kanban-card-title">
                          <span style={{ color: "#9ca3af" }}>#{t.id}</span>{" "}
                          {t.title}
                        </div>
                        <div className="kanban-card-meta">
                          <span
                            className="badge"
                            style={{
                              background: priorityColors[t.priority],
                              color: "#fff",
                              fontSize: "0.65rem",
                            }}
                          >
                            {t.priority}
                          </span>
                          {t.base && (
                            <span
                              className="badge"
                              style={{
                                background: "#fef3c7",
                                color: "#92400e",
                                fontSize: "0.65rem",
                              }}
                            >
                              {t.base}
                            </span>
                          )}
                          <span className="kanban-card-user">
                            {t.requester}
                          </span>
                          {t.assignedTo?.name && (
                            <span className="kanban-card-assigned">
                              → {t.assignedTo.name}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Painel lateral (split) ── */}
        {isSplitOpen && (
          <div
            style={{
              width: 380,
              flexShrink: 0,
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #eef0f3",
              boxShadow: "0 4px 24px rgba(0,0,0,0.09)",
              display: "flex",
              flexDirection: "column",
              maxHeight: "calc(100vh - 160px)",
              position: "sticky",
              top: "1rem",
              animation: "slideInPanel 0.2s ease",
            }}
          >
            <TicketPanelContent
              ticket={selectedTicket}
              onClose={() => setSelectedTicket(null)}
            />
          </div>
        )}
      </div>

      {/* ── Modal centralizado ── */}
      {panelMode === "centered" && selectedTicket && (
        <div
          onClick={() => setSelectedTicket(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(3px)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            animation: "fadeOverlay 0.18s ease",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 16,
              boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
              width: "100%",
              maxWidth: 660,
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              animation: "slideInModal 0.2s ease",
            }}
          >
            <TicketPanelContent
              ticket={selectedTicket}
              onClose={() => setSelectedTicket(null)}
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInPanel {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInModal {
          from { opacity: 0; transform: scale(0.96) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes fadeOverlay {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
