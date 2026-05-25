import { describe, test, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import OwnerChillies from "../pages/OwnerChillies";

const mockChillies = [
  {
    id: 1,
    name: "Habanero",
    origin: "Mexico",
    color: "Orange",
    shu_min: 100000,
    shu_max: 350000,
    image_url: "https://example.com/habanero.jpg",
  },
  {
    id: 2,
    name: "Jalapeño",
    origin: "Mexico",
    color: "Green",
    shu_min: 2500,
    shu_max: 8000,
    image_url: "https://example.com/jalapeno.jpg",
  },
];

function renderPage(fetchImpl = null) {
  vi.stubGlobal(
    "fetch",
    fetchImpl ??
      vi.fn(() =>
        Promise.resolve({ ok: true, json: () => Promise.resolve(mockChillies) })
      )
  );
  return render(
    <MemoryRouter>
      <OwnerChillies />
    </MemoryRouter>
  );
}

describe("OwnerChillies", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  test("shows loading state initially", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));
    render(
      <MemoryRouter>
        <OwnerChillies />
      </MemoryRouter>
    );
    expect(screen.getByText("Loading peppers...")).toBeInTheDocument();
  });

  test("renders pepper names after loading", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText("Habanero")).toBeInTheDocument());
    expect(screen.getByText("Jalapeño")).toBeInTheDocument();
  });

  test("shows empty state when no peppers returned", async () => {
    renderPage(
      vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }))
    );
    await waitFor(() =>
      expect(screen.getByText("No peppers yet. Add the first one!")).toBeInTheDocument()
    );
  });

  test("shows error message when fetch fails", async () => {
    renderPage(vi.fn(() => Promise.resolve({ ok: false })));
    await waitFor(() =>
      expect(
        screen.getByText("Could not load chillies from the server.")
      ).toBeInTheDocument()
    );
  });

  test("opens Add Pepper modal when button is clicked", async () => {
    renderPage();
    await waitFor(() => screen.getByText("Habanero"));
    await userEvent.click(screen.getByText("+ Add Pepper"));
    expect(screen.getByRole("heading", { name: "Add Pepper" })).toBeInTheDocument();
  });

  test("calls DELETE endpoint when delete is confirmed", async () => {
    vi.stubGlobal("confirm", vi.fn(() => true));
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockChillies) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ message: "deleted" }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([mockChillies[1]]) });
    vi.stubGlobal("fetch", mockFetch);

    render(<MemoryRouter><OwnerChillies /></MemoryRouter>);
    await waitFor(() => screen.getByText("Habanero"));

    await userEvent.click(screen.getAllByText("Delete")[0]);

    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith(
        "http://127.0.0.1:8000/chillies/1",
        { method: "DELETE" }
      )
    );
  });

  test("does not call DELETE when confirm is cancelled", async () => {
    vi.stubGlobal("confirm", vi.fn(() => false));
    const mockFetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(mockChillies) })
    );
    vi.stubGlobal("fetch", mockFetch);

    render(<MemoryRouter><OwnerChillies /></MemoryRouter>);
    await waitFor(() => screen.getByText("Habanero"));

    await userEvent.click(screen.getAllByText("Delete")[0]);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
