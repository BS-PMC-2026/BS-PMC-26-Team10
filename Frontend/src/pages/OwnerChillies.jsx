import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import ChilliFormModal from "../components/ChilliFormModal/ChilliFormModal";

const API_BASE_URL = import.meta.env.VITE_API_URL;

function OwnerChillies() {
  const { t } = useTranslation();
  const [chillies, setChillies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDelete = async (id) => {
    if (!window.confirm(t('owner.chillies.confirmDelete'))) return;
    try {
      const res = await fetch(`${API_BASE_URL}/chillies/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || t('owner.chillies.deleteFail'));
      }
      fetchChillies();
    } catch (err) {
      alert(err.message || t('owner.chillies.deleteFail'));
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
      setError(t('owner.chillies.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChillies();
  }, []);

  return (
    <div style={{ flex: 1, padding: "2rem" }}>
        <p style={{ color: "#888", margin: 0 }}>{t('owner.controlCenter')}</p>
        <h1 style={{ margin: "0.25rem 0 0.5rem" }}>{t('owner.chillies.title')}</h1>
        <p style={{ color: "#666", marginBottom: "1.5rem" }}>
          {t('owner.chillies.subtitle')}
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
          {t('owner.chillies.addPepper')}
        </button>

        {loading && <p>{t('owner.chillies.loading')}</p>}
        {!loading && error && <p style={{ color: "red" }}>{error}</p>}

        {!loading && !error && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #eee", textAlign: "left" }}>
                <th style={{ padding: "0.5rem 1rem" }}>{t('owner.chillies.colImage')}</th>
                <th style={{ padding: "0.5rem 1rem" }}>{t('owner.chillies.colName')}</th>
                <th style={{ padding: "0.5rem 1rem" }}>{t('owner.chillies.colOrigin')}</th>
                <th style={{ padding: "0.5rem 1rem" }}>{t('owner.chillies.colShu')}</th>
                <th style={{ padding: "0.5rem 1rem" }}>{t('owner.chillies.colColor')}</th>
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
                      {t('owner.chillies.delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && !error && chillies.length === 0 && (
          <p style={{ color: "#888" }}>{t('owner.chillies.empty')}</p>
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
