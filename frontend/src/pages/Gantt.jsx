import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import ViewSwitcher from "../components/ViewSwitcher";

const priorityColors = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#f97316",
  urgent: "#dc2626",
};

const ROW_HEIGHT = 36;
const LABEL_WIDTH = 260;
const HEADER_HEIGHT = 32;

export default function Gantt() {
  const [tickets, setTickets] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dayWidth, setDayWidth] = useState(30);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.get("/config/statuses"), api.get("/tickets")])
      .then(([statusRes, ticketRes]) => {
        setStatuses(statusRes.data);
        setTickets(ticketRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statusColorMap = useMemo(() => {
    const m = {};
    statuses.forEach((s) => {
      m[s.name] = s.color || "#6b7280";
    });
    return m;
  }, [statuses]);

  const now = new Date();

  const { minDate, maxDate, days } = useMemo(() => {
    if (tickets.length === 0)
      return { minDate: now, maxDate: now, days: [] };

    let min = Infinity;
    let max = -Infinity;
    tickets.forEach((t) => {
      const s = new Date(t.createdAt).getTime();
      const e = t.closedAt ? new Date(t.closedAt).getTime() : now.getTime();
      if (s < min) min = s;
      if (e > max) max = e;
    });

    const pad = 86400000;
    min -= pad;
    max += pad;

    const d = [];
    let cur = new Date(min);
    cur.setHours(0, 0, 0, 0);
    const end = new Date(max);
    end.setHours(0, 0, 0, 0);
    while (cur <= end) {
      d.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }

    return { minDate: new Date(min), maxDate: new Date(max), days: d };
  }, [tickets]);

  const dayToX = (date) => {
    const diff = (date.getTime() - minDate.getTime()) / 86400000;
    return LABEL_WIDTH + diff * dayWidth;
  };

  const chartWidth = LABEL_WIDTH + days.length * dayWidth;
  const chartHeight = HEADER_HEIGHT + tickets.length * ROW_HEIGHT + 20;

  const todayX = dayToX(now);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <h1>Tickets</h1>
          <ViewSwitcher />
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button
            className="btn btn-secondary"
            onClick={() => setDayWidth((w) => Math.max(15, w - 5))}
          >
            -
          </button>
          <span style={{ fontSize: "0.85rem", minWidth: 40, textAlign: "center" }}>
            {dayWidth}px
          </span>
          <button
            className="btn btn-secondary"
            onClick={() => setDayWidth((w) => Math.min(100, w + 5))}
          >
            +
          </button>
        </div>
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          flexWrap: "wrap",
          marginBottom: "1rem",
        }}
      >
        {statuses.map((s) => (
          <div
            key={s.id}
            style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.8rem" }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                background: s.color || "#6b7280",
                display: "inline-block",
              }}
            />
            {s.name}
          </div>
        ))}
      </div>

      <div className="card" style={{ overflowX: "auto", padding: "0.5rem" }}>
        <svg
          width={chartWidth}
          height={chartHeight}
          style={{ display: "block" }}
        >
          {/* Day headers */}
          {days.map((d, i) => {
            const x = LABEL_WIDTH + i * dayWidth;
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
            return (
              <g key={i}>
                {isWeekend && (
                  <rect
                    x={x}
                    y={0}
                    width={dayWidth}
                    height={chartHeight}
                    fill="#f9fafb"
                  />
                )}
                <line
                  x1={x}
                  y1={HEADER_HEIGHT}
                  x2={x}
                  y2={chartHeight}
                  stroke="#e5e7eb"
                  strokeWidth={0.5}
                />
                {dayWidth >= 25 && (
                  <text
                    x={x + dayWidth / 2}
                    y={HEADER_HEIGHT - 8}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#9ca3af"
                  >
                    {d.getDate()}/{d.getMonth() + 1}
                  </text>
                )}
              </g>
            );
          })}

          {/* Rows */}
          {tickets.map((t, idx) => {
            const y = HEADER_HEIGHT + idx * ROW_HEIGHT;
            const start = new Date(t.createdAt);
            const end = t.closedAt ? new Date(t.closedAt) : now;
            const x1 = dayToX(start);
            const x2 = dayToX(end);
            const barWidth = Math.max(x2 - x1, 4);
            const barColor = statusColorMap[t.status] || "#6b7280";

            return (
              <g key={t.id}>
                {/* Row stripe */}
                {idx % 2 === 1 && (
                  <rect
                    x={0}
                    y={y}
                    width={chartWidth}
                    height={ROW_HEIGHT}
                    fill="#fafafa"
                  />
                )}

                {/* Priority dot */}
                <circle
                  cx={10}
                  cy={y + ROW_HEIGHT / 2}
                  r={4}
                  fill={priorityColors[t.priority] || "#6b7280"}
                />

                {/* Label */}
                <text
                  x={22}
                  y={y + ROW_HEIGHT / 2 + 4}
                  fontSize={12}
                  fill="#111111"
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/tickets/${t.id}`)}
                >
                  #{t.id} {t.title?.length > 28 ? t.title.slice(0, 28) + "..." : t.title}
                </text>

                {/* Bar */}
                <rect
                  className="gantt-bar"
                  x={x1}
                  y={y + 6}
                  width={barWidth}
                  height={ROW_HEIGHT - 12}
                  rx={4}
                  fill={barColor}
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/tickets/${t.id}`)}
                >
                  <title>
                    #{t.id} {t.title} | {t.status} | {t.priority}
                    {"\n"}
                    {start.toLocaleDateString()} → {end.toLocaleDateString()}
                  </title>
                </rect>
              </g>
            );
          })}

          {/* Today line */}
          <line
            x1={todayX}
            y1={0}
            x2={todayX}
            y2={chartHeight}
            stroke="#d70f0a"
            strokeWidth={1.5}
            strokeDasharray="6 3"
          />
          <text
            x={todayX + 4}
            y={HEADER_HEIGHT - 2}
            fontSize={10}
            fill="#d70f0a"
            fontWeight={600}
          >
            Today
          </text>
        </svg>
      </div>
    </div>
  );
}
