import { useState, useEffect } from "react";
import api from "../api";

export default function Config() {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", color: "#6b7280", order: 0 });
  const [editing, setEditing] = useState(null);

  const fetchStatuses = () => {
    api
      .get("/config/statuses")
      .then(({ data }) => setStatuses(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/config/statuses/${editing}`, form);
      } else {
        await api.post("/config/statuses", form);
      }
      setForm({ name: "", color: "#6b7280", order: 0 });
      setEditing(null);
      fetchStatuses();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to save status");
    }
  };

  const startEdit = (s) => {
    setEditing(s.id);
    setForm({ name: s.name, color: s.color, order: s.order });
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm({ name: "", color: "#6b7280", order: 0 });
  };

  const deleteStatus = async (id) => {
    if (!confirm("Delete this status?")) return;
    try {
      await api.delete(`/config/statuses/${id}`);
      fetchStatuses();
    } catch {
      alert("Failed to delete status");
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Ticket Statuses</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "1.5rem" }}>
        <div className="card">
          {loading ? (
            <p>Loading...</p>
          ) : statuses.length === 0 ? (
            <p style={{ color: "#9ca3af" }}>No statuses configured</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Name</th>
                  <th>Color</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {statuses.map((s) => (
                  <tr key={s.id}>
                    <td>{s.order}</td>
                    <td>
                      <span
                        className="badge"
                        style={{ background: s.color, color: "#fff" }}
                      >
                        {s.name}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-block",
                          width: 20,
                          height: 20,
                          background: s.color,
                          borderRadius: 4,
                          verticalAlign: "middle",
                        }}
                      />{" "}
                      {s.color}
                    </td>
                    <td style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => startEdit(s)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => deleteStatus(s.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontSize: "1rem", marginBottom: "1rem" }}>
            {editing ? "Edit Status" : "New Status"}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Color</label>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  style={{ width: 50, height: 36, padding: 2 }}
                />
                <input
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  style={{ flex: 1 }}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Order</label>
              <input
                type="number"
                value={form.order}
                onChange={(e) =>
                  setForm((f) => ({ ...f, order: parseInt(e.target.value) || 0 }))
                }
              />
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button className="btn btn-primary" style={{ flex: 1 }}>
                {editing ? "Update" : "Create"}
              </button>
              {editing && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
