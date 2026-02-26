import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import ViewSwitcher from "../components/ViewSwitcher";

const priorityColors = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#f97316",
  urgent: "#dc2626",
};

const TICKET_TYPES = [
  { value: "incidente", label: "Incidente" },
  { value: "duvida", label: "Dúvida" },
  { value: "melhoria", label: "Melhoria" },
  { value: "acesso", label: "Acesso/Permissão" },
  { value: "bug", label: "Bug/Erro" },
  { value: "configuracao", label: "Configuração" },
  { value: "treinamento", label: "Treinamento" },
];

const TYPE_LABELS = Object.fromEntries(TICKET_TYPES.map((t) => [t.value, t.label]));

const BASES = [
  "CGH", "GRU", "BSB", "GIG", "SDU", "CNF", "CWB", "POA",
  "SSA", "REC", "FOR", "VCP", "MAO", "BEL", "FLN", "NAT",
  "MCZ", "AJU", "SLZ", "THE", "CGB", "GYN", "BPS", "CFB",
];

export default function Tickets() {
  const { user } = useAuth();
  const isStaff = user?.role === "admin" || user?.role === "support";
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    type: "",
    base: "",
    search: "",
  });
  const [page, setPage] = useState(1);

  const fetchTickets = () => {
    setLoading(true);
    const params = { page, limit: 50 };
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    if (filters.type) params.type = filters.type;
    if (filters.base) params.base = filters.base;
    if (filters.search) params.search = filters.search;

    api
      .get("/tickets", { params })
      .then(({ data }) => {
        setTickets(data.data);
        setPagination(data.pagination);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTickets();
  }, [filters.status, filters.priority, filters.type, filters.base, page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTickets();
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <h1>Tickets</h1>
          <ViewSwitcher />
        </div>
        <Link to="/tickets/new" className="btn btn-primary">
          New Ticket
        </Link>
      </div>

      <div
        className="card"
        style={{
          marginBottom: "1rem",
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          alignItems: "flex-end",
        }}
      >
        <div>
          <label style={{ fontSize: "0.8rem", display: "block", marginBottom: 4 }}>
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((f) => ({ ...f, status: e.target.value }))
            }
            style={{ width: 150 }}
          >
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting">Waiting</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: "0.8rem", display: "block", marginBottom: 4 }}>
            Priority
          </label>
          <select
            value={filters.priority}
            onChange={(e) =>
              setFilters((f) => ({ ...f, priority: e.target.value }))
            }
            style={{ width: 150 }}
          >
            <option value="">All</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: "0.8rem", display: "block", marginBottom: 4 }}>
            Tipo
          </label>
          <select
            value={filters.type}
            onChange={(e) =>
              setFilters((f) => ({ ...f, type: e.target.value }))
            }
            style={{ width: 180 }}
          >
            <option value="">All</option>
            {TICKET_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: "0.8rem", display: "block", marginBottom: 4 }}>
            Base
          </label>
          <select
            value={filters.base}
            onChange={(e) =>
              setFilters((f) => ({ ...f, base: e.target.value }))
            }
            style={{ width: 100 }}
          >
            <option value="">All</option>
            {BASES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem" }}>
          <input
            placeholder="Search..."
            value={filters.search}
            onChange={(e) =>
              setFilters((f) => ({ ...f, search: e.target.value }))
            }
            style={{ width: 200 }}
          />
          <button className="btn btn-secondary">Search</button>
        </form>
      </div>

      <div className="card">
        {loading ? (
          <p>Loading...</p>
        ) : tickets.length === 0 ? (
          <p style={{ color: "#9ca3af" }}>No tickets found</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Tipo</th>
                <th>Base</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Requester</th>
                {isStaff && <th>Assigned</th>}
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>
                    <Link to={`/tickets/${t.id}`}>{t.title}</Link>
                  </td>
                  <td>
                    <span className="badge" style={{ background: "#e0e7ff", color: "#3730a3", fontSize: "0.75rem" }}>
                      {TYPE_LABELS[t.type] || t.type}
                    </span>
                  </td>
                  <td>
                    <span className="badge" style={{ background: "#fef3c7", color: "#92400e", fontSize: "0.75rem" }}>
                      {t.base}
                    </span>
                  </td>
                  <td>
                    <span className="badge" style={{ background: "#e5e7eb" }}>
                      {t.status}
                    </span>
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background: priorityColors[t.priority] || "#6b7280",
                        color: "#fff",
                      }}
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td>{t.requester}</td>
                  {isStaff && <td>{t.assignedTo?.name || "-"}</td>}
                  <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "1rem",
              fontSize: "0.85rem",
              color: "#6b7280",
            }}
          >
            <span>{pagination.total} tickets</span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                className="btn btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span style={{ display: "flex", alignItems: "center" }}>
                {pagination.page} / {pagination.pages}
              </span>
              <button
                className="btn btn-secondary"
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
