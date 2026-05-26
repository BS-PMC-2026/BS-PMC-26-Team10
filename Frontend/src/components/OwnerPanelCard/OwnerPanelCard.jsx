import { useNavigate } from "react-router-dom";
import "./OwnerPanelCard.css";

function OwnerPanelCard({ title, desc, tag, route }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (route) {
      navigate(route);
    }
  };

  return (
    <div
      className={`owner-panel-card ${route ? "clickable" : ""}`}
      onClick={handleClick}
    >
      <div className="owner-panel-top">
        <span className="owner-panel-tag">{tag}</span>
      </div>

      <h3>{title}</h3>
      <p>{desc}</p>

      {route && <span className="owner-panel-link">Open view →</span>}
    </div>
  );
}

export default OwnerPanelCard;