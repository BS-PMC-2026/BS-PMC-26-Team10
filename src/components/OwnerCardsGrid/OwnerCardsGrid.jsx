import OwnerPanelCard from "../OwnerPanelCard/OwnerPanelCard";
import "./OwnerCardsGrid.css";

const panels = [
  {
    title: "Tours Overview",
    desc: "See active tours, upcoming groups and schedule status.",
    tag: "12 today",
  },
  {
    title: "Booking Requests",
    desc: "Check new reservations and visitor activity.",
    tag: "5 pending",
  },
  {
    title: "Stock Status",
    desc: "Track products, low inventory and item availability.",
    tag: "2 low stock",
    route: "/owner/inventory",
  },
  {
    title: "Team Schedule",
    desc: "See who works today and upcoming shift coverage.",
    tag: "8 workers",
  },
  {
    title: "Recent Reviews",
    desc: "Read the newest visitor feedback from the site.",
    tag: "4 new",
  },
  {
    title: "View Public Site",
    desc: "Open the visitor-facing side and review the experience.",
    tag: "Live",
    route: "/",
  },
];

function OwnerCardsGrid() {
  return (
    <div className="owner-grid">
      {panels.map((panel, index) => (
        <OwnerPanelCard key={index} {...panel} />
      ))}
    </div>
  );
}

export default OwnerCardsGrid;