import { useState, useEffect, useRef } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function TicketChat({ ticketId, initialMessages }) {
  const [messages, setMessages] = useState(initialMessages || []);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    setMessages(initialMessages || []);
  }, [initialMessages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      const { data } = await api.post(`/tickets/${ticketId}/messages`, {
        content: text.trim(),
      });
      setMessages((prev) => [...prev, data]);
      setText("");
    } catch (err) {
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: 300 }}>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1rem",
          background: "#f9fafb",
          borderRadius: "6px 6px 0 0",
          border: "1px solid #e5e7eb",
          borderBottom: "none",
        }}
      >
        {messages.length === 0 && (
          <p style={{ color: "#9ca3af", textAlign: "center", marginTop: "2rem" }}>
            No messages yet
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              marginBottom: "0.75rem",
              display: "flex",
              flexDirection: "column",
              alignItems: msg.userId === user?.id ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                background: msg.userId === user?.id ? "#d70f0a" : "#fff",
                color: msg.userId === user?.id ? "#fff" : "#111827",
                padding: "0.5rem 0.75rem",
                borderRadius: 8,
                maxWidth: "70%",
                border: msg.userId === user?.id ? "none" : "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  marginBottom: "0.15rem",
                  opacity: 0.8,
                }}
              >
                {msg.user?.name}
              </div>
              <div style={{ fontSize: "0.9rem" }}>{msg.content}</div>
            </div>
            <div style={{ fontSize: "0.7rem", color: "#9ca3af", marginTop: 2 }}>
              {new Date(msg.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form
        onSubmit={send}
        style={{
          display: "flex",
          gap: "0.5rem",
          padding: "0.75rem",
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: "0 0 6px 6px",
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          style={{ flex: 1 }}
        />
        <button className="btn btn-primary" disabled={sending}>
          Send
        </button>
      </form>
    </div>
  );
}
