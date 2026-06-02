import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import GuideSidebar from "../components/GuideSidebar/GuideSidebar";
import TourGrid from "../components/TourGrid/TourGrid";
import TourFormModal from "../components/TourFormModal/TourFormModal";
import CreateTourPage from "../components/CreateTourPage/CreateTourPage";
import TourGuideDashboard from "./TourGuideDashboard";
import TourGuideCalendar from "./TourGuideCalendar";
import TourGuideBookings from "./TourGuideBookings";
import TourGuideReviews from "./TourGuideReviews";
import "../styles/TourguideMain.css";

export function MyToursView({ onCreateNew }) {
  const { t } = useTranslation();
  const [tours, setTours] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTour, setSelectedTour] = useState(null);

  const fetchTours = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/tours`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTours(Array.isArray(data) ? data : []);
    } catch {
      setError(t("owner.tours.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTours(); }, []);

  const filtered = useMemo(
    () => tours.filter((tour) => tour.title.toLowerCase().includes(searchTerm.toLowerCase())),
    [tours, searchTerm]
  );

  const handleDelete = async (id) => {
    if (!window.confirm(t("owner.tours.confirmDelete"))) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/tours/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      fetchTours();
    } catch {
      alert(t("owner.tours.deleteFail"));
    }
  };

  return (
    <main className="tourguide-content">
      <div className="tourguide-bg-shape tourguide-bg-shape-1" />
      <div className="tourguide-bg-shape tourguide-bg-shape-2" />

      <div className="tourguide-header">
        <p className="tourguide-overline">{t("owner.tours.overline")}</p>
        <h1>{t("owner.tours.title")}</h1>
        <p className="tourguide-subtitle">{t("owner.tours.subtitle")}</p>
      </div>

      <div className="tourguide-toolbar">
        <input
          type="text"
          placeholder={t("owner.tours.searchPlaceholder")}
          className="tourguide-search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="tourguide-add-btn" onClick={onCreateNew}>
          {t("owner.tours.newTour")}
        </button>
      </div>

      {loading && <div className="tourguide-message">{t("owner.tours.loading")}</div>}
      {!loading && error && <div className="tourguide-message error">{error}</div>}
      {!loading && !error && filtered.length === 0 && (
        <div className="tourguide-empty">
          <h2>{t("owner.tours.emptyTitle")}</h2>
          <p>{t("owner.tours.emptyDesc")}</p>
        </div>
      )}
      {!loading && !error && filtered.length > 0 && (
        <TourGrid
          tours={filtered}
          onEdit={(tour) => { setSelectedTour(tour); setIsModalOpen(true); }}
          onDelete={handleDelete}
        />
      )}

      <TourFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedTour(null); }}
        onTourSaved={fetchTours}
        selectedTour={selectedTour}
      />
    </main>
  );
}

function SettingsView() {
  return (
    <main style={{
      flex: 1,
      padding: "3vw",
      background: "linear-gradient(180deg,#fffaf5,#fffdf8)",
      fontFamily: "var(--font-body, Arial, sans-serif)",
    }}>
      <p style={{ fontSize: "0.88vw", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1vw", color: "#a14d2a", marginBottom: "0.4vw" }}>
        Tour Guide Portal
      </p>
      <h2 style={{ fontWeight: 800, fontSize: "2.4vw", color: "#4a2a1f", margin: "0 0 0.4vw" }}>Settings</h2>
      <p style={{ color: "#6d5447", fontSize: "1vw" }}>Account settings coming soon.</p>
    </main>
  );
}

function TourguideMain() {
  const [route, setRoute] = useState("dashboard");
  const { admin } = useAuth();
  const guideName = admin ? `${admin.first_name} ${admin.last_name}` : undefined;

  return (
    <div className="tourguide-layout">
      <GuideSidebar current={route} onNav={setRoute} guideName={guideName} />

      {route === "dashboard" && (
        <TourGuideDashboard onNav={setRoute} />
      )}
      {route === "calendar" && <TourGuideCalendar />}
      {route === "my-tours" && (
        <MyToursView onCreateNew={() => setRoute("create")} />
      )}
      {route === "create" && (
        <CreateTourPage
          onTourSaved={() => setRoute("my-tours")}
          onCancel={() => setRoute("my-tours")}
        />
      )}
      {route === "bookings" && <TourGuideBookings />}
      {route === "reviews"  && <TourGuideReviews />}
      {route === "settings" && <SettingsView />}
    </div>
  );
}

export default TourguideMain;
