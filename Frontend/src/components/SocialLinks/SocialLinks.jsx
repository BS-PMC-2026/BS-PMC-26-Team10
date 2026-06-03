import { FaInstagram, FaFacebook, FaWhatsapp } from "react-icons/fa";
import "./SocialLinks.css";

const LINKS = [
  {
    href: "https://www.instagram.com/spicy_with_dinars/",
    icon: <FaInstagram />,
    label: "Instagram",
    color: "#E1306C",
  },
  {
    href: "https://www.facebook.com/p/%D7%94%D7%93%D7%99%D7%A0%D7%A8%D7%99%D7%9D-%D7%91%D7%99%D7%AA-%D7%A9%D7%9C-%D7%97%D7%A8%D7%99%D7%A3-100080427739369/",
    icon: <FaFacebook />,
    label: "Facebook",
    color: "#1877F2",
  },
  {
    href: "https://wa.me/972523244448",
    icon: <FaWhatsapp />,
    label: "WhatsApp",
    color: "#25D366",
  },
];

// variant="floating" → sticky sidebar on the right
// variant="inline"   → horizontal row of icons
export default function SocialLinks({ variant = "inline" }) {
  if (variant === "floating") {
    return (
      <div className="sl-floating">
        {LINKS.map(({ href, icon, label, color }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="sl-floating-btn"
            aria-label={label}
            style={{ "--sl-color": color }}
          >
            {icon}
          </a>
        ))}
      </div>
    );
  }

  return (
    <div className="sl-inline">
      {LINKS.map(({ href, icon, label, color }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="sl-inline-btn"
          aria-label={label}
          style={{ "--sl-color": color }}
        >
          {icon}
        </a>
      ))}
    </div>
  );
}
