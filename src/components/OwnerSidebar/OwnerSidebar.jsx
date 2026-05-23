import { useNavigate } from "react-router-dom";
import { LayoutDashboard, ClipboardList, Package, Leaf, Tag, Flame, Calendar, Users, MessageSquare, Globe } from "lucide-react";
import { CLMonogram } from "../ChiliMark/ChiliMark";
import "./OwnerSidebar.css";

const navItems = [
  { id: "dashboard",   icon: <LayoutDashboard size={16} />, label: "Dashboard" },
  { id: "orders",      icon: <ClipboardList size={16} />,   label: "Orders" },
  { id: "inventory",   icon: <Package size={16} />,          label: "Stock & Inventory" },
  { id: "chillies",    icon: <Leaf size={16} />,             label: "Pepper Catalogue" },
  { id: "promo-codes", icon: <Tag size={16} />,              label: "Promo Codes" },
  { id: "tours",       icon: <Flame size={16} />,            label: "Tours Overview" },
  { id: "bookings",    icon: <Calendar size={16} />,         label: "Booking Requests" },
  { id: "team",        icon: <Users size={16} />,            label: "Team Schedule" },
  { id: "reviews",     icon: <MessageSquare size={16} />,    label: "Reviews" },
];

function OwnerSidebar({ activeSection }) {
  const navigate = useNavigate();

  return (
    <aside className="owner-sidebar">
      <div className="owner-sidebar-top">
        <div className="owner-sidebar-badge">
          <CLMonogram size={18} color="#ffffff" stemColor="#ffd6d6" />
          <span>ChiliLand</span>
        </div>
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
              <span className="owner-nav-icon">{item.icon}</span>
              <span className="owner-nav-label">{item.label}</span>
              {isActive && <span className="owner-nav-indicator" />}
            </button>
          );
        })}
      </nav>

      <button className="owner-sidebar-view-site" onClick={() => navigate("/")}>
        <Globe size={16} />
        <span>View Site</span>
      </button>
    </aside>
  );
}

export default OwnerSidebar;
