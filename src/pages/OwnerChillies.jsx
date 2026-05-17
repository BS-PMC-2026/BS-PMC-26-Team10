import { useEffect, useState } from "react";
import ChilliFormModal from "../components/ChilliFormModal/ChilliFormModal";

const API_BASE_URL = "http://127.0.0.1:8000";

function OwnerChillies() {
  const [chillies, setChillies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this pepper?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/chillies/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to delete pepper.");
      }
      fetchChillies();
    } catch (err) {
      alert(err.message || "Could not delete pepper.");
    }
  };

  const fetchChillies = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_BASE_URL}/chillies`);
      if (!res.ok) throw new Error("Failed to load chillies");
      const data = await res.json();
      setChillies(Array.isArray(data) ? data : []);
    } catch {
      setError("Could not load chillies from the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChillies();
  }, []);

  return (
    <div style={{ flex: 1, padding: "2rem" }}>
        <p style={{ color: "#888", margin: 0 }}>Owner Control Center</p>
        <h1 style={{ margin: "0.25rem 0 0.5rem" }}>Peppers</h1>
        <p style={{ color: "#666", marginBottom: "1.5rem" }}>
          Manage the chilli catalogue — add new peppers to the collection.
        </p>

        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            background: "#c0392b", color: "#fff", border: "none",
            borderRadius: "6px", padding: "0.6rem 1.4rem",
            fontSize: "0.95rem", fontWeight: 600, cursor: "pointer",
            marginBottom: "1.5rem",
          }}
        >
          + Add Pepper
        </button>

        {loading && <p>Loading peppers...</p>}
        {!loading && error && <p style={{ color: "red" }}>{error}</p>}

        {!loading && !error && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #eee", textAlign: "left" }}>
                <th style={{ padding: "0.5rem 1rem" }}>Image</th>
                <th style={{ padding: "0.5rem 1rem" }}>Name</th>
                <th style={{ padding: "0.5rem 1rem" }}>Origin</th>
                <th style={{ padding: "0.5rem 1rem" }}>SHU Range</th>
                <th style={{ padding: "0.5rem 1rem" }}>Color</th>
                <th style={{ padding: "0.5rem 1rem" }}></th>
              </tr>
            </thead>
            <tbody>
              {chillies.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "0.5rem 1rem" }}>
                    {c.image_url && (
                      <img src={c.image_url} alt={c.name} style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 4 }} />
                    )}
                  </td>
                  <td style={{ padding: "0.5rem 1rem", fontWeight: 600 }}>{c.name}</td>
                  <td style={{ padding: "0.5rem 1rem" }}>{c.origin || "—"}</td>
                  <td style={{ padding: "0.5rem 1rem" }}>{c.shu_min?.toLocaleString()} – {c.shu_max?.toLocaleString()}</td>
                  <td style={{ padding: "0.5rem 1rem" }}>{c.color || "—"}</td>
                  <td style={{ padding: "0.5rem 1rem" }}>
                    <button
                      onClick={() => handleDelete(c.id)}
                      style={{
                        background: "none", border: "1px solid #e74c3c", color: "#e74c3c",
                        borderRadius: "4px", padding: "0.25rem 0.6rem", cursor: "pointer",
                        fontSize: "0.8rem",
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && !error && chillies.length === 0 && (
          <p style={{ color: "#888" }}>No peppers yet. Add the first one!</p>
        )}

        <ChilliFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onChilliAdded={fetchChillies}
        />
    </div>
  );
}

export default OwnerChillies;
