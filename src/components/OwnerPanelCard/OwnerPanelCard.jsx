import "./OwnerPanelCard.css";

export default function OwnerPanelCard({ title, desc, tag }) {
  return (
    <div className="owner-panel-card">
      <div className="owner-panel-top">
        <span className="owner-panel-tag">{tag}</span>
      </div>

      <h3>{title}</h3>
      <p>{desc}</p>

      <div className="owner-panel-link">
        View details <span>→</span>
      </div>
    </div>
  );
}