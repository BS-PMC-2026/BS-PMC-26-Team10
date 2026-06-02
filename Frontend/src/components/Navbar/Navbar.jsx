import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, ShoppingBag, Tractor, Info, MapPin, LogIn, Menu, X, Sun, Moon } from "lucide-react";
import { CLMonogram } from "../ChiliMark/ChiliMark";
import { useTheme } from "../../context/ThemeContext";
import "./Navbar.css";

const NAV_LINKS = [
  { to: "/",              label: "Home",     Icon: Home       },
  { to: "/products",      label: "Products", Icon: ShoppingBag },
  { to: "/tours",         label: "Tours",    Icon: Tractor    },
  { to: "/about",         label: "About",    Icon: Info       },
  { to: "/farm-location", label: "Location", Icon: MapPin     },
];

function Navbar() {
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const isHome = pathname === "/";

  // On the landing page, hide the navbar until the hero video has scrolled out of view.
  // On every other page the navbar is always visible.
  const [visible, setVisible] = useState(!isHome);

  useEffect(() => {
    setOpen(false);

    if (!isHome) {
      setVisible(true);
      return;
    }

    // Start hidden whenever we land on the home route
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
  }, [pathname]); // re-run on every navigation so state resets correctly

  function isActive(to) {
    if (to === "/") return pathname === "/";
    return pathname.startsWith(to);
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
          {NAV_LINKS.map(({ to, label, Icon }) => (
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
          <span className="navbar-staff-label">Staff</span>
        </Link>

        <button
          className="navbar-theme-btn"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          tabIndex={mobileMenuVisible ? undefined : -1}
        >
          {theme === "dark"
            ? <Sun size="1em" strokeWidth={1.6} />
            : <Moon size="1em" strokeWidth={1.6} />
          }
          <span className="navbar-staff-label">
            {theme === "dark" ? "Light" : "Dark"}
          </span>
        </button>
      </nav>

      <button
        className={`navbar-toggle${open ? " navbar-toggle--open" : ""}${visible ? "" : " navbar-toggle--hidden"}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close navigation" : "Open navigation"}
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
