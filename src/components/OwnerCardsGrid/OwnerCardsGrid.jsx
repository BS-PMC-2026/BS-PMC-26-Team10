import OwnerPanelCard from "../OwnerPanelCard/OwnerPanelCard";
import "./OwnerCardsGrid.css";

const panels = [
  {
    title: "Tours Overview",
    desc: "See active tours, upcoming groups and schedule status.",
    tag: "12 today",
  },
  {
  title: "Orders Overview",
  desc: "Track recent orders and delivery status.",
  tag: "Recent",
  route: "/owner/orders",
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
    title: "Pepper Catalogue",
    desc: "Add and manage the chilli collection shown to visitors.",
    tag: "Chillies",
    route: "/owner/chillies",
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
    title: "Promo Codes",
    desc: "Create and manage discount codes for customer orders.",
    tag: "Coupons",
    route: "/owner/promo-codes",
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