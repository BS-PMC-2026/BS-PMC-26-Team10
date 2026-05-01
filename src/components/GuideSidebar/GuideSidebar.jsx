import "./GuideSidebar.css";

const NAV = [
  {
    group: "My work",
    items: [
      { key: "my-tours", label: "My tours", icon: "🗓" },
      { key: "create", label: "Create tour", icon: "＋" },
      { key: "bookings", label: "Bookings", icon: "📋" },
    ],
  },
  {
    group: "Account",
    items: [{ key: "settings", label: "Settings", icon: "⚙" }],
  },
];

function GuideSidebar({ current, onNav }) {
  return (
    <aside className="guide-sidebar">
      <div className="guide-sidebar-brand">
        <span className="guide-sidebar-pepper">🌶️</span>
        <span className="guide-sidebar-logo">ChiliLand</span>
        <span className="guide-sidebar-badge">Guide</span>
      </div>

      {NAV.map((g) => (
        <div key={g.group} className="guide-sidebar-group">
          <div className="guide-sidebar-group-head">{g.group}</div>
          {g.items.map((it) => (
            <button
              key={it.key}
              className={`guide-sidebar-item${current === it.key ? " active" : ""}`}
              onClick={() => onNav(it.key)}
            >
              <span className="guide-sidebar-icon">{it.icon}</span>
              {it.label}
            </button>
          ))}
        </div>
      ))}

      <div className="guide-sidebar-user">
        <div className="guide-sidebar-avatar">Y</div>
        <div>
          <div className="guide-sidebar-name">Yael Levi</div>
          <div className="guide-sidebar-role">Tour guide</div>
        </div>
      </div>
    </aside>
  );
}

export default GuideSidebar;
