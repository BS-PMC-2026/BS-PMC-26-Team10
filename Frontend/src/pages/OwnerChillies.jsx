import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { QRCodeSVG } from "qrcode.react";
import ChilliFormModal from "../components/ChilliFormModal/ChilliFormModal";

const SITE_URL = import.meta.env.VITE_SITE_URL || window.location.origin;

const API_BASE_URL = import.meta.env.VITE_API_URL;

function OwnerChillies() {
  const { t } = useTranslation();
  const [chillies, setChillies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [printChilli, setPrintChilli] = useState(null);

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
                  <td style={{ padding: "0.5rem 1rem", display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => setPrintChilli(c)}
                      style={{
                        background: "none", border: "1px solid #2980b9", color: "#2980b9",
                        borderRadius: "4px", padding: "0.25rem 0.6rem", cursor: "pointer",
                        fontSize: "0.8rem",
                      }}
                    >
                      🖨 Print QR
                    </button>
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

        {printChilli && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          }}>
            <div style={{
              background: "#fff", borderRadius: "12px", padding: "2rem",
              textAlign: "center", minWidth: "300px", boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
            }}>
              <h2 style={{ margin: "0 0 0.25rem" }}>{printChilli.name}</h2>
              <p style={{ color: "#888", margin: "0 0 1.5rem", fontSize: "0.85rem" }}>
                {printChilli.shu_min?.toLocaleString()} – {printChilli.shu_max?.toLocaleString()} SHU
              </p>
              <div id="qr-print-area" style={{ display: "inline-block", padding: "1rem", border: "1px solid #eee", borderRadius: "8px" }}>
                <QRCodeSVG
                  value={`${SITE_URL}/pepper/${printChilli.id}`}
                  size={200}
                  includeMargin={true}
                />
                <p style={{ margin: "0.75rem 0 0", fontWeight: 700, fontSize: "1rem" }}>{printChilli.name}</p>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "#666" }}>
                  {printChilli.shu_min?.toLocaleString()} – {printChilli.shu_max?.toLocaleString()} SHU
                </p>
              </div>
              <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", justifyContent: "center" }}>
                <button
                  onClick={() => {
                    const svgEl = document.getElementById("qr-print-area").querySelector("svg");
                    const svgHTML = svgEl ? svgEl.outerHTML : "";
                    const win = window.open("", "_blank");
                    win.document.write(`
                      <!DOCTYPE html>
                      <html>
                      <head>
                        <title>ChilliLand — ${printChilli.name}</title>
                        <style>
                          * { box-sizing: border-box; margin: 0; padding: 0; }
                          body {
                            font-family: 'Segoe UI', system-ui, sans-serif;
                            background: #fdf7f0;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                          }
                          .card {
                            background: #fff;
                            border-radius: 16px;
                            overflow: hidden;
                            width: 340px;
                            box-shadow: 0 8px 32px rgba(74,42,31,0.15);
                            border: 2px solid #4a2a1f;
                          }
                          .card-header {
                            background: #4a2a1f;
                            padding: 1.2rem 1.5rem;
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                          }
                          .card-header .brand {
                            color: #fff;
                            font-size: 1.1rem;
                            font-weight: 700;
                            letter-spacing: 1px;
                          }
                          .card-header .emoji { font-size: 1.4rem; }
                          .card-body {
                            padding: 1.5rem;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            gap: 1rem;
                          }
                          .pepper-name {
                            font-size: 1.4rem;
                            font-weight: 800;
                            color: #4a2a1f;
                            text-align: center;
                          }
                          .qr-wrapper {
                            background: #fdf7f0;
                            border-radius: 12px;
                            padding: 1rem;
                            border: 1.5px solid #e8d5c4;
                          }
                          .info-grid {
                            width: 100%;
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 0.5rem;
                          }
                          .info-item {
                            background: #fdf7f0;
                            border-radius: 8px;
                            padding: 0.5rem 0.75rem;
                            border: 1px solid #e8d5c4;
                          }
                          .info-label {
                            font-size: 0.65rem;
                            color: #a07860;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                            font-weight: 600;
                          }
                          .info-value {
                            font-size: 0.85rem;
                            color: #4a2a1f;
                            font-weight: 700;
                            margin-top: 2px;
                          }
                          .shu-badge {
                            background: #c0392b;
                            color: #fff;
                            border-radius: 20px;
                            padding: 0.3rem 1rem;
                            font-size: 0.8rem;
                            font-weight: 700;
                            letter-spacing: 0.5px;
                          }
                          .card-footer {
                            background: #fdf7f0;
                            border-top: 1px solid #e8d5c4;
                            padding: 0.75rem;
                            text-align: center;
                            font-size: 0.7rem;
                            color: #a07860;
                          }
                        </style>
                      </head>
                      <body>
                        <div class="card">
                          <div class="card-header">
                            <span class="brand">🌶 ChilliLand</span>
                            <span class="emoji">🔥</span>
                          </div>
                          <div class="card-body">
                            <div class="pepper-name">${printChilli.name}</div>
                            <div class="qr-wrapper">${svgHTML}</div>
                            <div class="shu-badge">${printChilli.shu_min?.toLocaleString()} – ${printChilli.shu_max?.toLocaleString()} SHU</div>
                            <div class="info-grid">
                              ${printChilli.origin ? `<div class="info-item"><div class="info-label">Origin</div><div class="info-value">${printChilli.origin}</div></div>` : ""}
                              ${printChilli.color ? `<div class="info-item"><div class="info-label">Color</div><div class="info-value">${printChilli.color}</div></div>` : ""}
                              ${printChilli.season ? `<div class="info-item"><div class="info-label">Season</div><div class="info-value">${printChilli.season}</div></div>` : ""}
                            </div>
                          </div>
                          <div class="card-footer">Scan QR to learn more • chilliland.farm</div>
                        </div>
                        <script>window.onload = () => { window.print(); }</script>
                      </body>
                      </html>
                    `);
                    win.document.close();
                  }}
                  style={{
                    background: "#2980b9", color: "#fff", border: "none",
                    borderRadius: "6px", padding: "0.6rem 1.4rem",
                    fontSize: "0.95rem", fontWeight: 600, cursor: "pointer",
                  }}
                >
                  🖨 Print
                </button>
                <button
                  onClick={() => setPrintChilli(null)}
                  style={{
                    background: "none", border: "1px solid #ccc", color: "#666",
                    borderRadius: "6px", padding: "0.6rem 1.4rem",
                    fontSize: "0.95rem", cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

export default OwnerChillies;
