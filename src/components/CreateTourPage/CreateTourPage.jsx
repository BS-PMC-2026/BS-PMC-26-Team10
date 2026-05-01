import { useState } from "react";
import "./CreateTourPage.css";

const KIND_OPTIONS = [
  { value: "field-tasting", label: "Field & Tasting" },
  { value: "workshop", label: "Workshop" },
  { value: "harvest", label: "Harvest day" },
  { value: "private", label: "Private booking" },
];

const DURATION_OPTIONS = ["45 min", "90 min", "2 hrs", "3 hrs", "5 hrs", "Full day"];

const today = new Date().toISOString().slice(0, 10);

function formatPreviewDate(dateStr) {
  if (!dateStr) return "—";
  try {
    const [y, m, d] = dateStr.split("-");
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
      weekday: "short", month: "short", day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function CreateTourPage({ onTourSaved, onCancel }) {
  const [form, setForm] = useState({
    title: "",
    kind: "field-tasting",
    description: "",
    date: today,
    time: "10:00",
    duration: "90 min",
    capacity: 12,
    price: "28",
    meeting_point: "Main farm gate",
    includes: "Guided walk · 5 pepper tastings · Hot sauce flight",
    accessibility: "mostly-yes",
    visibility: "draft",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e, visibility) => {
    e.preventDefault();

    if (!form.title.trim()) return setError("Please give the tour a title.");
    if (!form.date) return setError("Pick a date for the tour.");
    if (!form.time) return setError("Pick a start time.");
    if (Number(form.capacity) < 1) return setError("Capacity must be at least 1.");

    setError("");
    setLoading(true);

    try {
      const payload = {
        title: form.title.trim(),
        kind: form.kind,
        description: form.description.trim(),
        date: form.date,
        time: form.time,
        duration: form.duration,
        capacity: Number(form.capacity),
        price: Number(form.price) || 0,
        meeting_point: form.meeting_point.trim(),
        includes: form.includes.trim(),
        accessibility: form.accessibility,
        visibility: visibility ?? form.visibility,
      };

      const res = await fetch("http://127.0.0.1:8000/tours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create tour.");

      setToast("Tour saved successfully!");
      setTimeout(() => {
        setToast("");
        if (onTourSaved) onTourSaved();
      }, 2400);
    } catch (err) {
      console.error(err);
      setError("Could not save tour. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const kindLabel = KIND_OPTIONS.find((k) => k.value === form.kind)?.label ?? "";

  return (
    <div className="ctp-page">
      <div className="ctp-blob ctp-blob-1" />
      <div className="ctp-blob ctp-blob-2" />

      <div className="ctp-topbar">
        <div>
          <div className="ctp-crumbs">Tour guide · Create tour</div>
          <h1 className="ctp-title">New tour</h1>
          <p className="ctp-sub">
            Set the date, time and capacity. Visitors will see this once published.
          </p>
        </div>
        <div className="ctp-topbar-actions">
          <button type="button" className="ctp-btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="ctp-btn-secondary"
            disabled={loading}
            onClick={(e) => handleSubmit(e, "draft")}
          >
            Save draft
          </button>
          <button
            type="button"
            className="ctp-btn-primary"
            disabled={loading}
            onClick={(e) => handleSubmit(e, "public")}
          >
            {loading ? "Saving…" : "Publish tour"}
          </button>
        </div>
      </div>

      <div className="ctp-body">
        <div className="ctp-card">
          <div className="ctp-card-head">
            <h2 className="ctp-card-title">Tour details</h2>
            <p className="ctp-card-sub">Required: title, date, time, capacity.</p>
          </div>

          <form id="create-tour-form" className="ctp-form" onSubmit={(e) => handleSubmit(e, null)}>
            <div className="ctp-group">
              <label className="ctp-label">
                Tour title
                <span className="ctp-hint">{form.title.length}/60</span>
              </label>
              <input
                className="ctp-input"
                value={form.title}
                maxLength={60}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Sunset Field & Tasting Walk"
              />
            </div>

            <div className="ctp-group">
              <label className="ctp-label">Tour type</label>
              <div className="ctp-chips">
                {KIND_OPTIONS.map((k) => (
                  <button
                    key={k.value}
                    type="button"
                    className={`ctp-chip${form.kind === k.value ? " active" : ""}`}
                    onClick={() => set("kind", k.value)}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="ctp-row-3">
              <div className="ctp-group">
                <label className="ctp-label">Date</label>
                <input
                  type="date"
                  className="ctp-input"
                  value={form.date}
                  min={today}
                  onChange={(e) => set("date", e.target.value)}
                />
              </div>
              <div className="ctp-group">
                <label className="ctp-label">Start time</label>
                <input
                  type="time"
                  className="ctp-input"
                  value={form.time}
                  onChange={(e) => set("time", e.target.value)}
                />
              </div>
              <div className="ctp-group">
                <label className="ctp-label">Duration</label>
                <select
                  className="ctp-input"
                  value={form.duration}
                  onChange={(e) => set("duration", e.target.value)}
                >
                  {DURATION_OPTIONS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="ctp-row-2">
              <div className="ctp-group">
                <label className="ctp-label">
                  Capacity <span className="ctp-hint">visitors</span>
                </label>
                <div className="ctp-stepper">
                  <button
                    type="button"
                    className="ctp-step-btn"
                    onClick={() => set("capacity", Math.max(1, Number(form.capacity) - 1))}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    className="ctp-step-input"
                    min={1}
                    max={50}
                    value={form.capacity}
                    onChange={(e) => set("capacity", Number(e.target.value))}
                  />
                  <button
                    type="button"
                    className="ctp-step-btn"
                    onClick={() => set("capacity", Math.min(50, Number(form.capacity) + 1))}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="ctp-group">
                <label className="ctp-label">
                  Price per person <span className="ctp-hint">NIS</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  className="ctp-input"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                  placeholder="28"
                />
              </div>
            </div>

            <div className="ctp-group">
              <label className="ctp-label">Meeting point</label>
              <input
                className="ctp-input"
                value={form.meeting_point}
                onChange={(e) => set("meeting_point", e.target.value)}
                placeholder="Main farm gate, parking lot A"
              />
            </div>

            <div className="ctp-group">
              <label className="ctp-label">Description</label>
              <textarea
                className="ctp-textarea"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Walk the rows with a grower, learn how each variety grows, and taste fresh peppers."
              />
            </div>

            <div className="ctp-group">
              <label className="ctp-label">What's included</label>
              <input
                className="ctp-input"
                value={form.includes}
                onChange={(e) => set("includes", e.target.value)}
                placeholder="Guided walk · tastings · take-home"
              />
            </div>

            <div className="ctp-group">
              <label className="ctp-label">Accessibility</label>
              <select
                className="ctp-input"
                value={form.accessibility}
                onChange={(e) => set("accessibility", e.target.value)}
              >
                <option value="full">Wheelchair-accessible throughout</option>
                <option value="mostly-yes">Mostly accessible · uneven gravel</option>
                <option value="limited">Limited · field walking required</option>
              </select>
            </div>

            {error && <div className="ctp-error">⚠ {error}</div>}
          </form>
        </div>

        <div className="ctp-right-col">
          <div className="ctp-card">
            <div className="ctp-card-head">
              <h2 className="ctp-card-title">Live preview</h2>
              <p className="ctp-card-sub">How visitors will see this tour.</p>
            </div>
            <div className="ctp-preview">
              <div className="ctp-preview-cover">
                <div className="ctp-preview-pattern" />
                <span className="ctp-preview-badge">{kindLabel}</span>
              </div>
              <h3 className="ctp-preview-title">{form.title || "Untitled tour"}</h3>
              <p className="ctp-preview-desc">
                {form.description ||
                  "Add a description to give visitors a sense of what to expect."}
              </p>
              <div className="ctp-preview-meta">
                <div>
                  <div className="ctp-meta-label">When</div>
                  <div className="ctp-meta-value">
                    {formatPreviewDate(form.date)} · {form.time}
                  </div>
                </div>
                <div>
                  <div className="ctp-meta-label">Length</div>
                  <div className="ctp-meta-value">{form.duration}</div>
                </div>
                <div>
                  <div className="ctp-meta-label">Capacity</div>
                  <div className="ctp-meta-value">Up to {form.capacity}</div>
                </div>
              </div>
              <div className="ctp-preview-foot">
                <div>
                  <div className="ctp-preview-price">₪{form.price || "0"}</div>
                  <div className="ctp-price-unit">per person</div>
                </div>
                {form.meeting_point && (
                  <span className="ctp-meeting-point">📍 {form.meeting_point}</span>
                )}
              </div>
            </div>
          </div>

          <div className="ctp-tips">
            <div className="ctp-tips-head">Guide tips</div>
            Capacity is a hard cap — visitors can't book past it.
            <br />
            Drafts are private to you. Switch to <em>Publish to visitors</em> when ready to take bookings.
          </div>
        </div>
      </div>

      {toast && (
        <div className="ctp-toast">✓ {toast}</div>
      )}
    </div>
  );
}

export default CreateTourPage;
