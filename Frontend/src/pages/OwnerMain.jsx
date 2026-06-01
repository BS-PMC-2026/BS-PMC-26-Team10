import { useState } from "react";
import { useParams } from "react-router-dom";
import OwnerSidebar from "../components/OwnerSidebar/OwnerSidebar";
import OwnerDashboard from "../components/OwnerDashboard/OwnerDashboard";
import OwnerOrders from "./OwnerOrders";
import OwnerInventory from "./OwnerInventory";
import OwnerChillies from "./OwnerChillies";
import OwnerPromoCodes from "./OwnerPromoCodes";
import { MyToursView } from "./TourguideMain";
import CreateTourPage from "../components/CreateTourPage/CreateTourPage";
import OwnerBookings from "./OwnerBookings";
import OwnerReviews from "./OwnerReviews";
import "../styles/OwnerMain.css";

function ComingSoon({ section }) {
  const labels = {
    tours:    { icon: "🌶️", title: "Tours Overview",     desc: "See active tours, upcoming groups and schedule status." },
    bookings: { icon: "📅", title: "Booking Requests",   desc: "Check new reservations and visitor activity." },
    team:     { icon: "👨‍🌾", title: "Team Schedule",      desc: "See who works today and upcoming shift coverage." },
    reviews:  { icon: "💬", title: "Reviews",             desc: "Read the newest visitor feedback from the site." },
  };
  const info = labels[section] ?? { icon: "🚧", title: section, desc: "This section is coming soon." };

  return (
    <div className="owner-coming-soon">
      <span className="owner-coming-soon-icon">{info.icon}</span>
      <h2>{info.title}</h2>
      <p>{info.desc}</p>
      <span className="owner-coming-soon-tag">Coming soon</span>
    </div>
  );
}

function OwnerToursView() {
  const [creating, setCreating] = useState(false);
  if (creating) {
    return (
      <CreateTourPage
        onTourSaved={() => setCreating(false)}
        onCancel={() => setCreating(false)}
      />
    );
  }
  return <MyToursView onCreateNew={() => setCreating(true)} />;
}

function OwnerMain() {
  const { section } = useParams();
  const activeSection = section ?? "dashboard";

  function renderContent() {
    switch (activeSection) {
      case "dashboard":   return <OwnerDashboard />;
      case "orders":      return <OwnerOrders />;
      case "inventory":   return <OwnerInventory />;
      case "chillies":    return <OwnerChillies />;
      case "promo-codes": return <OwnerPromoCodes />;
      case "tours":       return <OwnerToursView />;
      case "bookings":    return <OwnerBookings />;
      case "reviews":     return <OwnerReviews />;
      default:            return <ComingSoon section={activeSection} />;
    }
  }

  return (
    <div className="owner-layout">
      <div className="owner-bg-shape owner-bg-shape-1" />
      <div className="owner-bg-shape owner-bg-shape-2" />

      <OwnerSidebar activeSection={activeSection} />

      <main className="owner-content">
        {renderContent()}
      </main>
    </div>
  );
}

export default OwnerMain;
