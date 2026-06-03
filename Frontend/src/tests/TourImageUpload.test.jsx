import { describe, test, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateTourPage from "../components/CreateTourPage/CreateTourPage";

const UPLOAD_URL = "http://127.0.0.1:8000/tours/upload-image";

function makeFile(name = "tour.jpg", type = "image/jpeg") {
  return new File(["img"], name, { type });
}

describe("TourImageUpload — CreateTourPage", () => {
  afterEach(() => vi.unstubAllGlobals());

  test("renders a file input labelled 'Tour image'", () => {
    render(<CreateTourPage onTourSaved={() => {}} onCancel={() => {}} />);
    expect(screen.getByLabelText(/tour image/i)).toBeInTheDocument();
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
});
