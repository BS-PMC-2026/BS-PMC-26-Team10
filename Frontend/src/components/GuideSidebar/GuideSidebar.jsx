import { LayoutDashboard, CalendarDays, Map, Plus, ClipboardList, MessageSquare, Settings, Sun, Moon, Globe, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import "./GuideSidebar.css";

const NAV = [
  {
    group: "Overview",
    items: [
      { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
      { key: "calendar", label: "Calendar", icon: <CalendarDays size={16} /> },
    ],
  },
  {
    group: "My work",
    items: [
      { key: "my-tours", label: "My tours", icon: <Map size={16} /> },
      { key: "create", label: "Create tour", icon: <Plus size={16} /> },
      { key: "bookings", label: "Bookings", icon: <ClipboardList size={16} /> },
      { key: "reviews", label: "Reviews", icon: <MessageSquare size={16} /> },
    ],
  },
  {
    group: "Account",
    items: [{ key: "settings", label: "Settings", icon: <Settings size={16} /> }],
  },
];

function GuideSidebar({ current, onNav, guideName }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const initials = guideName
    ? guideName.trim().split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "TG";
  const displayName = guideName || "Tour Guide";

  function handleLogout() {
    logout();
    navigate("/staffLogin", { replace: true });
  }

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
        <div className="guide-sidebar-avatar">{initials}</div>
        <div>
          <div className="guide-sidebar-name">{displayName}</div>
          <div className="guide-sidebar-role">Tour guide</div>
        </div>
      </div>

      <div className="guide-sidebar-bottom">
        <button className="guide-sidebar-theme-btn" onClick={toggleTheme}>
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
        </button>
        <button className="guide-sidebar-view-site" onClick={() => navigate("/")}>
          <Globe size={15} />
          <span>View site</span>
        </button>
        <button className="guide-sidebar-logout" onClick={handleLogout}>
          <LogOut size={15} />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}

export default GuideSidebar;
