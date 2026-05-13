import { describe, test, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateTourPage from "../components/CreateTourPage/CreateTourPage";
import TourFormModal from "../components/TourFormModal/TourFormModal";

describe("tour confirmation message forms", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("sends confirmation message when creating a tour", async () => {
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
    vi.stubGlobal("fetch", fetchMock);

    render(<CreateTourPage onTourSaved={() => {}} onCancel={() => {}} />);

    await userEvent.type(screen.getByPlaceholderText("Sunset Field & Tasting Walk"), "Morning Field Walk");
    const messageField = screen.getByDisplayValue(/Your tour reservation was successful/);
    await userEvent.clear(messageField);
    await userEvent.type(messageField, "Meet us at the gate and keep your booking reference.");

    await userEvent.click(screen.getByText("Save draft"));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.confirmation_message).toBe("Meet us at the gate and keep your booking reference.");
  });

  test("sends confirmation message when editing a tour", async () => {
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <TourFormModal
        isOpen
        onClose={() => {}}
        onTourSaved={() => {}}
        selectedTour={{
          id: 7,
          title: "Field Walk",
          kind: "field-tasting",
          description: "A walk.",
          date: "2026-12-31",
          time: "10:00",
          duration: "90 min",
          capacity: 12,
          price: 28,
          meeting_point: "Main gate",
          includes: "Tastings",
          accessibility: "mostly-yes",
          visibility: "public",
          confirmation_message: "Original confirmation message.",
        }}
      />
    );

    const messageField = screen.getByDisplayValue("Original confirmation message.");
    await userEvent.clear(messageField);
    await userEvent.type(messageField, "Updated confirmation message for visitors.");

    await userEvent.click(screen.getByText("Save changes"));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.confirmation_message).toBe("Updated confirmation message for visitors.");
  });
});
