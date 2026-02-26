import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../api";

const priorityColors = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#f97316",
  urgent: "#dc2626",
};

const statusColors = {
  open: "#22c55e",
  in_progress: "#3b82f6",
  waiting: "#f59e0b",
  closed: "#6b7280",
};

/* ── Donut Chart (Status) ── */
function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return (
      <svg viewBox="0 0 140 140" width="140" height="140">
        <circle cx="70" cy="70" r="54" fill="none" stroke="#eef0f3" strokeWidth="14" />
        <text x="70" y="74" textAnchor="middle" fontSize="13" fill="#b0b5bf">0</text>
      </svg>
    );
  }

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <svg viewBox="0 0 140 140" width="140" height="140">
      {data.map((d) => {
        const pct = d.value / total;
        const dash = pct * circumference;
        const gap = circumference - dash;
        const currentOffset = offset;
        offset += dash;
        return (
          <circle
            key={d.label}
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={d.color}
            strokeWidth="14"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-currentOffset}
            style={{ transition: "stroke-dasharray 0.4s, stroke-dashoffset 0.4s" }}
          />
        );
      })}
      <text x="70" y="67" textAnchor="middle" fontSize="22" fontWeight="700" fill="#111">
        {total}
      </text>
      <text x="70" y="82" textAnchor="middle" fontSize="10" fill="#8b919d">
        tickets
      </text>
    </svg>
  );
}

/* ── Bar Chart (Priority) ── */
function PriorityBarChart({ data }) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "0.6rem", height: 120 }}>
      {data.map((d) => {
        const h = Math.max((d.value / max) * 100, 4);
        return (
          <div key={d.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#3a3f47" }}>
              {d.value}
            </span>
            <div
              style={{
                width: "100%",
                height: h,
                background: d.color,
                borderRadius: "4px 4px 0 0",
                transition: "height 0.4s",
              }}
            />
            <span style={{ fontSize: "0.68rem", color: "#8b919d", textTransform: "capitalize" }}>
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Area Chart (Tickets over last 14 days) ── */
function TimelineChart({ tickets }) {
  const days = 14;
  const now = new Date();

  const buckets = useMemo(() => {
    const b = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      b.push({ date: new Date(d), count: 0 });
    }
    tickets.forEach((t) => {
      const created = new Date(t.createdAt);
      created.setHours(0, 0, 0, 0);
      const idx = b.findIndex((x) => x.date.getTime() === created.getTime());
      if (idx >= 0) b[idx].count++;
    });
    return b;
  }, [tickets]);

  const max = Math.max(...buckets.map((b) => b.count), 1);
  const W = 420;
  const H = 120;
  const padY = 20;
  const padX = 6;
  const graphW = W - padX * 2;
  const graphH = H - padY;

  const points = buckets.map((b, i) => ({
    x: padX + (i / (days - 1)) * graphW,
    y: padY + graphH - (b.count / max) * graphH,
  }));

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${line} L${points[points.length - 1].x},${H} L${points[0].x},${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: "block" }}>
      {/* grid lines */}
      {[0, 0.5, 1].map((pct) => {
        const y = padY + graphH - pct * graphH;
        return (
          <g key={pct}>
            <line x1={padX} y1={y} x2={W - padX} y2={y} stroke="#f0f1f4" strokeWidth={0.8} />
            <text x={0} y={y + 3} fontSize={8} fill="#b0b5bf">
              {Math.round(pct * max)}
            </text>
          </g>
        );
      })}
      {/* area */}
      <path d={area} fill="rgba(215, 15, 10, 0.08)" />
      {/* line */}
      <path d={line} fill="none" stroke="#d70f0a" strokeWidth={2} strokeLinejoin="round" />
      {/* dots */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3} fill="#fff" stroke="#d70f0a" strokeWidth={1.5} />
          <title>
            {buckets[i].date.toLocaleDateString()}: {buckets[i].count} tickets
          </title>
        </g>
      ))}
      {/* x labels */}
      {buckets.map((b, i) => {
        if (i % 2 !== 0 && i !== days - 1) return null;
        return (
          <text
            key={i}
            x={points[i].x}
            y={H - 2}
            textAnchor="middle"
            fontSize={8}
            fill="#b0b5bf"
          >
            {b.date.getDate()}/{b.date.getMonth() + 1}
          </text>
        );
      })}
    </svg>
  );
}

export default function Dashboard() {
  const [tickets, setTickets] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/tickets", { params: { limit: 100 } }), api.get("/config/statuses")])
      .then(([tRes, sRes]) => {
        setTickets(tRes.data.data);
        setStatuses(sRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const counts = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    closed: tickets.filter((t) => t.status === "closed").length,
  };

  const statusData = useMemo(() => {
    const map = {};
    statuses.forEach((s) => { map[s.name] = s.color; });
    const groups = {};
    tickets.forEach((t) => { groups[t.status] = (groups[t.status] || 0) + 1; });
    return Object.entries(groups).map(([label, value]) => ({
      label,
      value,
      color: map[label] || statusColors[label] || "#6b7280",
    }));
  }, [tickets, statuses]);

  const priorityData = useMemo(() => {
    const groups = {};
    tickets.forEach((t) => { groups[t.priority] = (groups[t.priority] || 0) + 1; });
    return ["low", "medium", "high", "urgent"].map((p) => ({
      label: p,
      value: groups[p] || 0,
      color: priorityColors[p],
    }));
  }, [tickets]);

  const recent = tickets.slice(0, 5);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <Link to="/tickets/new" className="btn btn-primary">
          New Ticket
        </Link>
      </div>

      {/* KPI cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "0.75rem",
          marginBottom: "1rem",
        }}
      >
        {[
          { label: "Total", value: counts.total, color: "#d70f0a" },
          { label: "Open", value: counts.open, color: "#22c55e" },
          { label: "In Progress", value: counts.in_progress, color: "#3b82f6" },
          { label: "Closed", value: counts.closed, color: "#6b7280" },
        ].map((c) => (
          <div
            key={c.label}
            className="card"
            style={{ borderLeft: `4px solid ${c.color}`, padding: "0.85rem 1.25rem" }}
          >
            <div style={{ fontSize: "0.78rem", color: "#8b919d" }}>{c.label}</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "0.75rem",
          marginBottom: "1rem",
        }}
      >
        {/* Donut – Status */}
        <div className="card" style={{ padding: "0.85rem 1.25rem" }}>
          <h3 style={{ fontSize: "0.9rem", marginBottom: "0.65rem" }}>By Status</h3>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <DonutChart data={statusData} />
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              {statusData.map((d) => (
                <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem" }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                  <span style={{ color: "#3a3f47", textTransform: "capitalize" }}>{d.label}</span>
                  <span style={{ color: "#b0b5bf", marginLeft: "auto" }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar – Priority */}
        <div className="card" style={{ padding: "0.85rem 1.25rem" }}>
          <h3 style={{ fontSize: "0.9rem", marginBottom: "0.65rem" }}>By Priority</h3>
          <PriorityBarChart data={priorityData} />
        </div>

        {/* Area – Timeline */}
        <div className="card" style={{ padding: "0.85rem 1.25rem" }}>
          <h3 style={{ fontSize: "0.9rem", marginBottom: "0.65rem" }}>Last 14 Days</h3>
          <TimelineChart tickets={tickets} />
        </div>
      </div>

      {/* Recent tickets */}
      <div className="card" style={{ padding: "0.85rem 1.25rem" }}>
        <h2 style={{ fontSize: "0.95rem", marginBottom: "0.65rem" }}>
          Recent Tickets
        </h2>
        {recent.length === 0 ? (
          <p style={{ color: "#9ca3af" }}>No tickets yet</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Requester</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>
                    <Link to={`/tickets/${t.id}`}>{t.title}</Link>
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
                  <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
