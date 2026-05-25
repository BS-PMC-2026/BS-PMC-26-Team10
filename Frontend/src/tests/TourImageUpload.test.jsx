import { describe, test, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateTourPage from "../components/CreateTourPage/CreateTourPage";
import TourFormModal from "../components/TourFormModal/TourFormModal";

const UPLOAD_URL = "http://127.0.0.1:8000/tours/upload-image";
const TOURS_URL = "http://127.0.0.1:8000/tours";

const baseTour = {
  id: 5,
  title: "Field Walk",
  kind: "field-tasting",
  description: "",
  date: "2026-12-31",
  time: "10:00",
  duration: "90 min",
  capacity: 12,
  price: 28,
  meeting_point: "",
  includes: "",
  accessibility: "mostly-yes",
  visibility: "public",
  confirmation_message: "",
  picture: "",
};

function makeFile(name = "tour.jpg", type = "image/jpeg") {
  return new File(["img"], name, { type });
}

// ── CreateTourPage ─────────────────────────────────────────────────────────

describe("TourImageUpload — CreateTourPage", () => {
  afterEach(() => vi.unstubAllGlobals());

  test("renders a file input labelled 'Tour image'", () => {
    render(<CreateTourPage onTourSaved={() => {}} onCancel={() => {}} />);
    expect(screen.getByLabelText(/tour image/i)).toBeInTheDocument();
  });

  test("file input accepts only images", () => {
    render(<CreateTourPage onTourSaved={() => {}} onCancel={() => {}} />);
    expect(screen.getByLabelText(/tour image/i)).toHaveAttribute("accept", "image/*");
  });

  test("selecting a file posts to the upload endpoint", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ image_url: "https://example.com/tour.jpg" }) })
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    vi.stubGlobal("fetch", fetchMock);

    render(<CreateTourPage onTourSaved={() => {}} onCancel={() => {}} />);
    await userEvent.upload(screen.getByLabelText(/tour image/i), makeFile());

    await waitFor(() => {
      const uploadCall = fetchMock.mock.calls.find(([url]) => url === UPLOAD_URL);
      expect(uploadCall).toBeDefined();
    });
  });

  test("shows image preview after successful upload", async () => {
    const url = "https://example.com/tour.jpg";
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ image_url: url }) })
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({}) })
    );

    render(<CreateTourPage onTourSaved={() => {}} onCancel={() => {}} />);
    await userEvent.upload(screen.getByLabelText(/tour image/i), makeFile());

    await waitFor(() => {
      const img = screen.getByAltText("Tour preview");
      expect(img).toHaveAttribute("src", url);
    });
  });

  test("includes picture URL in POST payload when publishing", async () => {
    const url = "https://example.com/tour.jpg";
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ image_url: url }) })
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    vi.stubGlobal("fetch", fetchMock);

    render(<CreateTourPage onTourSaved={() => {}} onCancel={() => {}} />);
    await userEvent.type(screen.getByPlaceholderText("Sunset Field & Tasting Walk"), "My Tour");
    await userEvent.upload(screen.getByLabelText(/tour image/i), makeFile());
    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([u]) => u === UPLOAD_URL)).toBe(true)
    );

    await userEvent.click(screen.getByText("Publish tour"));

    await waitFor(() => {
      const submitCall = fetchMock.mock.calls.find(
        ([u, opts]) => u === TOURS_URL && opts?.method === "POST"
      );
      expect(submitCall).toBeDefined();
      const payload = JSON.parse(submitCall[1].body);
      expect(payload.picture).toBe(url);
    });
  });

  test("includes empty picture in payload when no image selected", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    vi.stubGlobal("fetch", fetchMock);

    render(<CreateTourPage onTourSaved={() => {}} onCancel={() => {}} />);
    await userEvent.type(screen.getByPlaceholderText("Sunset Field & Tasting Walk"), "My Tour");
    await userEvent.click(screen.getByText("Save draft"));

    await waitFor(() => {
      const submitCall = fetchMock.mock.calls.find(
        ([u, opts]) => u === TOURS_URL && opts?.method === "POST"
      );
      expect(submitCall).toBeDefined();
      const payload = JSON.parse(submitCall[1].body);
      expect(payload.picture).toBe("");
    });
  });

  test("shows error message when image upload fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    render(<CreateTourPage onTourSaved={() => {}} onCancel={() => {}} />);
    await userEvent.upload(screen.getByLabelText(/tour image/i), makeFile());

    await waitFor(() =>
      expect(screen.getByText(/image upload failed/i)).toBeInTheDocument()
    );
  });

  test("shows error message when network throws during upload", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

    render(<CreateTourPage onTourSaved={() => {}} onCancel={() => {}} />);
    await userEvent.upload(screen.getByLabelText(/tour image/i), makeFile());

    await waitFor(() =>
      expect(screen.getByText(/image upload failed/i)).toBeInTheDocument()
    );
  });
});

// ── TourFormModal ──────────────────────────────────────────────────────────

describe("TourImageUpload — TourFormModal", () => {
  afterEach(() => vi.unstubAllGlobals());

  test("renders a file input labelled 'Tour image'", () => {
    render(
      <TourFormModal isOpen onClose={() => {}} onTourSaved={() => {}} selectedTour={baseTour} />
    );
    expect(screen.getByLabelText(/tour image/i)).toBeInTheDocument();
  });

  test("shows existing picture as a preview when tour already has one", () => {
    render(
      <TourFormModal
        isOpen onClose={() => {}} onTourSaved={() => {}}
        selectedTour={{ ...baseTour, picture: "https://example.com/existing.jpg" }}
      />
    );
    expect(screen.getByAltText("Tour")).toHaveAttribute("src", "https://example.com/existing.jpg");
  });

  test("does not show preview when tour has no picture", () => {
    render(
      <TourFormModal isOpen onClose={() => {}} onTourSaved={() => {}} selectedTour={baseTour} />
    );
    expect(screen.queryByAltText("Tour")).not.toBeInTheDocument();
  });

  test("includes existing picture in PUT payload without re-uploading", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <TourFormModal
        isOpen onClose={() => {}} onTourSaved={() => {}}
        selectedTour={{ ...baseTour, picture: "https://example.com/existing.jpg" }}
      />
    );
    await userEvent.click(screen.getByText("Save changes"));

    await waitFor(() => {
      const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(payload.picture).toBe("https://example.com/existing.jpg");
    });
  });

  test("uploads new file and updates the preview", async () => {
    const newUrl = "https://example.com/new.jpg";
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ image_url: newUrl }) })
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <TourFormModal
        isOpen onClose={() => {}} onTourSaved={() => {}}
        selectedTour={{ ...baseTour, picture: "https://example.com/old.jpg" }}
      />
    );
    await userEvent.upload(screen.getByLabelText(/tour image/i), makeFile("new.jpg"));

    await waitFor(() =>
      expect(screen.getByAltText("Tour")).toHaveAttribute("src", newUrl)
    );
  });

  test("sends newly uploaded picture URL in PUT payload", async () => {
    const newUrl = "https://example.com/new.jpg";
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ image_url: newUrl }) })
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <TourFormModal
        isOpen onClose={() => {}} onTourSaved={() => {}}
        selectedTour={{ ...baseTour, picture: "https://example.com/old.jpg" }}
      />
    );
    await userEvent.upload(screen.getByLabelText(/tour image/i), makeFile("new.jpg"));
    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([u]) => u === UPLOAD_URL)).toBe(true)
    );

    await userEvent.click(screen.getByText("Save changes"));

    await waitFor(() => {
      const submitCall = fetchMock.mock.calls.find(
        ([u, opts]) => u === `http://127.0.0.1:8000/tours/${baseTour.id}` && opts?.method === "PUT"
      );
      expect(submitCall).toBeDefined();
      const payload = JSON.parse(submitCall[1].body);
      expect(payload.picture).toBe(newUrl);
    });
  });

  test("shows error when image upload fails in edit modal", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    render(
      <TourFormModal isOpen onClose={() => {}} onTourSaved={() => {}} selectedTour={baseTour} />
    );
    await userEvent.upload(screen.getByLabelText(/tour image/i), makeFile());

    await waitFor(() =>
      expect(screen.getByText(/image upload failed/i)).toBeInTheDocument()
    );
  });
});
