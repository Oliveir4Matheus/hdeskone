export default function KanbanPanelToggle({ panelMode, onChange }) {
  const set = (mode) => {
    onChange(mode);
    localStorage.setItem("kanban-panel-mode", mode);
  };

  return (
    <div className="panel-toggle">
      <button
        className={`panel-toggle-btn${panelMode === "split" ? " active" : ""}`}
        onClick={() => set("split")}
        title="Lado a lado"
      >
        Lado a lado
      </button>
      <button
        className={`panel-toggle-btn${panelMode === "centered" ? " active" : ""}`}
        onClick={() => set("centered")}
        title="Centralizado"
      >
        Centralizado
      </button>
    </div>
  );
}
