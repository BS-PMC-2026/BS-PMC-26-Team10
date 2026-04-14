import "./OwnerSidebar.css";

const actions = [
  { icon: "🌶️", label: "Add Tour" },
  { icon: "📦", label: "Add Product" },
  { icon: "👨‍🌾", label: "Add Worker" },
  { icon: "🕒", label: "Add Shift" },
  { icon: "🎟️", label: "Add Workshop" },
  { icon: "💬", label: "Reply to Reviews" },
];

function OwnerSidebar() {
  return (
    <aside className="owner-sidebar">
      <div className="owner-sidebar-top">
        <div className="owner-sidebar-badge">ChiliLand</div>
        <h2>Quick actions</h2>
        <p>Start tasks fast without digging through menus.</p>
      </div>

      <div className="owner-sidebar-actions">
        {actions.map((action) => (
          <button key={action.label} className="owner-action-btn">
            <span className="owner-action-icon">{action.icon}</span>
            <span className="owner-action-text">{action.label}</span>
            <span className="owner-action-arrow">→</span>
          </button>
        ))}
      </div>
    </aside>
  );
}

export default OwnerSidebar;