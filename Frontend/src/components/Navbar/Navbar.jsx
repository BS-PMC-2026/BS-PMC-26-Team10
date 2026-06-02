import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, ShoppingBag, Tractor, Info, MapPin, LogIn, Menu, X, Sun, Moon, Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CLMonogram } from "../ChiliMark/ChiliMark";
import { useTheme } from "../../context/ThemeContext";
import "./Navbar.css";

function Navbar() {
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const isHome = pathname === "/";

  const NAV_LINKS = [
    { to: "/",              label: t("nav.home"),     Icon: Home       },
    { to: "/products",      label: t("nav.products"), Icon: ShoppingBag },
    { to: "/tours",         label: t("nav.tours"),    Icon: Tractor    },
    { to: "/about",         label: t("nav.about"),    Icon: Info       },
    { to: "/farm-location", label: t("nav.location"), Icon: MapPin     },
  ];

  const [visible, setVisible] = useState(!isHome);

  useEffect(() => {
    setOpen(false); // eslint-disable-line react-hooks/set-state-in-effect

    if (!isHome) {
      setVisible(true);
      return;
    }

    setVisible(false);

    const hero = document.querySelector(".farm-header");
    if (!hero) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 }
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, [pathname]);

  function isActive(to) {
    if (to === "/") return pathname === "/";
    return pathname.startsWith(to);
  }

  function toggleLanguage() {
    i18n.changeLanguage(i18n.language === "he" ? "en" : "he");
  }

  const hiddenClass = visible ? "" : " navbar--hidden";
  const mobileMenuVisible = visible || open;

  return (
    <>
      <nav
        className={`navbar${open ? " navbar--open" : ""}${hiddenClass}`}
        aria-label="Site navigation"
        aria-hidden={!mobileMenuVisible}
      >
        <div className="navbar-brand">
          <CLMonogram
            className="navbar-brand-mark"
            size="1em"
            color="#bb3e22"
            stemColor="#fff4e6"
            title="ChiliLand"
          />
          <span className="navbar-brand-text">ChiliLand</span>
        </div>

        <ul className="navbar-links" role="list">
          {NAV_LINKS.map(({ to, label, Icon }) => ( // eslint-disable-line no-unused-vars
            <li key={to}>
              <Link
                to={to}
                className={`navbar-link${isActive(to) ? " navbar-link--active" : ""}`}
                onClick={() => setOpen(false)}
                aria-current={isActive(to) ? "page" : undefined}
                tabIndex={mobileMenuVisible ? undefined : -1}
              >
                <span className="navbar-link-icon" aria-hidden="true">
                  <Icon size="1em" strokeWidth={isActive(to) ? 2.2 : 1.6} />
                </span>
                <span className="navbar-link-label">{label}</span>
                {isActive(to) && <span className="navbar-link-indicator" aria-hidden="true" />}
              </Link>
            </li>
          ))}
        </ul>

        <Link
          to="/staffLogin"
          className="navbar-staff-btn"
          onClick={() => setOpen(false)}
          tabIndex={mobileMenuVisible ? undefined : -1}
        >
          <LogIn size="1em" strokeWidth={1.6} />
          <span className="navbar-staff-label">{t("nav.staff")}</span>
        </Link>

        <button
          className="navbar-theme-btn"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? t("nav.switchLight") : t("nav.switchDark")}
          tabIndex={mobileMenuVisible ? undefined : -1}
        >
          {theme === "dark"
            ? <Sun size="1em" strokeWidth={1.6} />
            : <Moon size="1em" strokeWidth={1.6} />
          }
          <span className="navbar-staff-label">
            {theme === "dark" ? t("nav.lightMode") : t("nav.darkMode")}
          </span>
        </button>

        <button
          className="navbar-lang-btn"
          onClick={toggleLanguage}
          aria-label={`Switch language to ${t("nav.language")}`}
          tabIndex={mobileMenuVisible ? undefined : -1}
        >
          <Languages size="1em" strokeWidth={1.6} />
          <span className="navbar-staff-label">{t("nav.language")}</span>
        </button>
      </nav>

      <button
        className={`navbar-toggle${open ? " navbar-toggle--open" : ""}${visible ? "" : " navbar-toggle--hidden"}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? t("nav.closeNav") : t("nav.openNav")}
        aria-expanded={open}
      >
        {open ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
      </button>

      {open && (
        <div className="navbar-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
      )}
    </>
  );
}

export default Navbar;
