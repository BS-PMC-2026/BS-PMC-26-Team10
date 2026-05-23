import { useEffect, useMemo, useState } from "react";
import GuideSidebar from "../components/GuideSidebar/GuideSidebar";
import TourGrid from "../components/TourGrid/TourGrid";
import TourFormModal from "../components/TourFormModal/TourFormModal";
import CreateTourPage from "../components/CreateTourPage/CreateTourPage";
import "../styles/TourguideMain.css";

export function MyToursView({ onCreateNew }) {
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
      const res = await fetch("http://127.0.0.1:8000/tours");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTours(Array.isArray(data) ? data : []);
    } catch {
      setError("Could not load tours from the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTours(); }, []);

  const filtered = useMemo(
    () => tours.filter((t) => t.title.toLowerCase().includes(searchTerm.toLowerCase())),
    [tours, searchTerm]
  );

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this tour?")) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/tours/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      fetchTours();
    } catch {
      alert("Could not delete tour.");
    }
  };

  return (
    <main className="tourguide-content">
      <div className="tourguide-bg-shape tourguide-bg-shape-1" />
      <div className="tourguide-bg-shape tourguide-bg-shape-2" />

      <div className="tourguide-header">
        <p className="tourguide-overline">Tour guide · My tours</p>
        <h1>My tours</h1>
        <p className="tourguide-subtitle">
          Your scheduled tours. Edit, delete, or create a new one.
        </p>
      </div>

      <div className="tourguide-toolbar">
        <input
          type="text"
          placeholder="Search tours..."
          className="tourguide-search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="tourguide-add-btn" onClick={onCreateNew}>
          + New tour
        </button>
      </div>

      {loading && <div className="tourguide-message">Loading tours…</div>}
      {!loading && error && <div className="tourguide-message error">{error}</div>}
      {!loading && !error && filtered.length === 0 && (
        <div className="tourguide-empty">
          <h2>No tours yet</h2>
          <p>Create your first tour using the button above.</p>
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
