import { useNavigate } from "react-router-dom";
import "./OwnerSidebar.css";

const navItems = [
  { id: "dashboard",  icon: "📊", label: "Dashboard" },
  { id: "orders",     icon: "📋", label: "Orders" },
  { id: "inventory",  icon: "📦", label: "Stock & Inventory" },
  { id: "chillies",   icon: "🌿", label: "Pepper Catalogue" },
  { id: "promo-codes",icon: "🏷️", label: "Promo Codes" },
  { id: "tours",      icon: "🌶️", label: "Tours Overview" },
  { id: "bookings",   icon: "📅", label: "Booking Requests" },
  { id: "team",       icon: "👨‍🌾", label: "Team Schedule" },
  { id: "reviews",    icon: "💬", label: "Reviews" },
];

function OwnerSidebar({ activeSection }) {
  const navigate = useNavigate();

  return (
    <aside className="owner-sidebar">
      <div className="owner-sidebar-top">
        <div className="owner-sidebar-badge">ChiliLand</div>
        <h2>Owner Panel</h2>
        <p>Manage every part of the farm from one place.</p>
      </div>

      <nav className="owner-sidebar-nav">
        {navItems.map((item) => {
          const isActive = activeSection === item.id || (!activeSection && item.id === "dashboard");
          return (
            <button
              key={item.id}
              className={`owner-nav-btn${isActive ? " owner-nav-btn--active" : ""}`}
              onClick={() => navigate(`/owner/${item.id}`)}
            >
              <span className="owner-nav-label">{item.label}</span>
              {isActive && <span className="owner-nav-indicator" />}
            </button>
          );
        })}
      </nav>

      <button className="owner-sidebar-view-site" onClick={() => navigate("/")}>
        <span>🌐</span>
        <span>View Site</span>
      </button>
    </aside>
  );
}

export default OwnerSidebar;
