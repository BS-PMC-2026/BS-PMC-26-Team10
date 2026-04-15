import OwnerSidebar from "../components/OwnerSidebar/OwnerSidebar";
import OwnerCardsGrid from "../components/OwnerCardsGrid/OwnerCardsGrid";
import "../styles/OwnerMain.css";

function OwnerMain() {
  return (
    <div className="owner-layout">
      <div className="owner-bg-shape owner-bg-shape-1"></div>
      <div className="owner-bg-shape owner-bg-shape-2"></div>

      <OwnerSidebar />

      <main className="owner-content">
        <div className="owner-header">
          <p className="owner-overline">Owner Control Center</p>
          <h1>Farm overview</h1>
          <p className="owner-subtitle">
            Manage the daily work of ChiliLand in one place.
          </p>
        </div>

        <OwnerCardsGrid />
      </main>
    </div>
  );
}

export default OwnerMain;
