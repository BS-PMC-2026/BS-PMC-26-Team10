import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import GuideSidebar from "../components/GuideSidebar/GuideSidebar";
import TourGrid from "../components/TourGrid/TourGrid";
import TourFormModal from "../components/TourFormModal/TourFormModal";
import CreateTourPage from "../components/CreateTourPage/CreateTourPage";
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

function PlaceholderView({ name }) {
  return (
    <main style={{ flex: 1, padding: "60px 40px", background: "linear-gradient(180deg,#fff8f8,#fff1ee)", fontFamily: "Arial, sans-serif" }}>
      <h2 style={{ fontWeight: 800, fontSize: 28, color: "#7a1111", letterSpacing: "-0.02em" }}>{name}</h2>
      <p style={{ color: "#8a4a4a" }}>This section isn't implemented yet.</p>
    </main>
  );
}

function TourguideMain() {
  const [route, setRoute] = useState("my-tours");

  return (
    <div className="tourguide-layout">
      <GuideSidebar current={route} onNav={setRoute} />

      {route === "my-tours" && (
        <MyToursView onCreateNew={() => setRoute("create")} />
      )}
      {route === "create" && (
        <CreateTourPage
          onTourSaved={() => setRoute("my-tours")}
          onCancel={() => setRoute("my-tours")}
        />
      )}
      {route === "bookings" && <PlaceholderView name="Bookings" />}
      {route === "settings" && <PlaceholderView name="Settings" />}
    </div>
  );
}

export default TourguideMain;
