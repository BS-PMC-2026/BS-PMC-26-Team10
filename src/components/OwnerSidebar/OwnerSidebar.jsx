import { useNavigate } from "react-router-dom";
import "./OwnerSidebar.css";

const actions = [
  { icon: "🌶️", label: "Add Tour" },
  { icon: "📦", label: "Add Product" },
  { icon: "👨‍🌾", label: "Add Worker" },
  { icon: "🕒", label: "Add Shift" },
  { icon: "🎟️", label: "Add Workshop" },
  { icon: "🏷️", label: "Add Promo Code", route: "/owner/promo-codes" },
  { icon: "💬", label: "Reply to Reviews" },
];

function OwnerSidebar() {
  const navigate = useNavigate();

  return (
    <aside className="owner-sidebar">
      <div className="owner-sidebar-top">
        <div className="owner-sidebar-badge">ChiliLand</div>
        <h2>Quick actions</h2>
        <p>Start tasks fast without digging through menus.</p>
      </div>

      <div className="owner-sidebar-actions">
        {actions.map((action) => (
          <button
            key={action.label}
            className="owner-action-btn"
            onClick={() => action.route && navigate(action.route)}
          >
            <span className="owner-action-icon">{action.icon}</span>
            <span className="owner-action-text">{action.label}</span>
            <span className="owner-action-arrow">→</span>
          </button>
        ))}
      </div>

      <button className="owner-sidebar-view-site" onClick={() => navigate("/")}>
        <span>🌐</span>
        <span>View Site</span>
      </button>
    </aside>
  );
}

export default OwnerSidebar;