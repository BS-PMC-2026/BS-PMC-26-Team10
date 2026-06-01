import { useNavigate } from "react-router-dom";
import { LayoutDashboard, ClipboardList, Package, Leaf, Tag, Flame, Calendar, Users, MessageSquare, Globe, LogOut, Sun, Moon, Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CLMonogram } from "../ChiliMark/ChiliMark";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import "./OwnerSidebar.css";

const NAV_IDS = [
  { id: "dashboard",   icon: <LayoutDashboard size={16} />, key: "dashboard"  },
  { id: "orders",      icon: <ClipboardList size={16} />,   key: "orders"     },
  { id: "inventory",   icon: <Package size={16} />,         key: "inventory"  },
  { id: "chillies",    icon: <Leaf size={16} />,            key: "chillies"   },
  { id: "promo-codes", icon: <Tag size={16} />,             key: "promoCodes" },
  { id: "tours",       icon: <Flame size={16} />,           key: "tours"      },
  { id: "bookings",    icon: <Calendar size={16} />,        key: "bookings"   },
  { id: "team",        icon: <Users size={16} />,           key: "team"       },
  { id: "reviews",     icon: <MessageSquare size={16} />,   key: "reviews"    },
];

function OwnerSidebar({ activeSection }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();

  function handleLogout() {
    logout();
    navigate("/staffLogin", { replace: true });
  }

  return (
    <aside className="owner-sidebar">
      <div className="owner-sidebar-top">
        <div className="owner-sidebar-badge">
          <CLMonogram size={18} color="#ffffff" stemColor="#ffd6d6" />
          <span>{t("owner.sidebar.brand")}</span>
        </div>
        <h2>{t("owner.sidebar.title")}</h2>
        <p>{t("owner.sidebar.subtitle")}</p>
      </div>

      <nav className="owner-sidebar-nav">
        {NAV_IDS.map((item) => {
          const isActive = activeSection === item.id || (!activeSection && item.id === "dashboard");
          return (
            <button
              key={item.id}
              className={`owner-nav-btn${isActive ? " owner-nav-btn--active" : ""}`}
              onClick={() => navigate(`/owner/${item.id}`)}
            >
              <span className="owner-nav-icon">{item.icon}</span>
              <span className="owner-nav-label">{t(`owner.sidebar.nav.${item.key}`)}</span>
              {isActive && <span className="owner-nav-indicator" />}
            </button>
          );
        })}
      </nav>

      <div className="owner-sidebar-bottom">
        <button className="owner-sidebar-theme-btn" onClick={toggleTheme}>
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          <span>{theme === "dark" ? t("owner.sidebar.lightMode") : t("owner.sidebar.darkMode")}</span>
        </button>
        <button
          className="owner-sidebar-lang-btn"
          onClick={() => i18n.changeLanguage(i18n.language === "he" ? "en" : "he")}
        >
          <Languages size={16} />
          <span>{t("owner.sidebar.language")}</span>
        </button>
        <button className="owner-sidebar-view-site" onClick={() => navigate("/")}>
          <Globe size={16} />
          <span>{t("owner.sidebar.viewSite")}</span>
        </button>
        <button className="owner-sidebar-logout" onClick={handleLogout}>
          <LogOut size={16} />
          <span>{t("owner.sidebar.logOut")}</span>
        </button>
      </div>
    </aside>
  );
}

export default OwnerSidebar;
