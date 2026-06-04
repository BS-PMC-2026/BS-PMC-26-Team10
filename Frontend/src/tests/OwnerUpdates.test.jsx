import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OwnerUpdates from "../pages/OwnerUpdates";

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ getToken: () => "mock-admin-token" }),
}));

describe("OwnerUpdates", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  test("loads subscriber statistics", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ active_subscribers: 6, events: 4, discounts: 3, new_products: 2 }),
    }));

    render(<OwnerUpdates />);

    await waitFor(() => expect(screen.getByText("6")).toBeInTheDocument());
    expect(screen.getByText("Active subscribers")).toBeInTheDocument();
  });

  test("sends an update to the selected category", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ active_subscribers: 6, events: 4, discounts: 3, new_products: 2 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ recipients: 4, sent: 4, failed: 0 }),
      });
    vi.stubGlobal("fetch", fetchMock);
    render(<OwnerUpdates />);

    await userEvent.type(screen.getByLabelText("Email subject"), "Friday farm event");
    await userEvent.type(screen.getByLabelText("Message"), "Join us this Friday.");
    await userEvent.click(screen.getByRole("button", { name: "Send update" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1][0]).toBe("http://127.0.0.1:8000/subscriptions/send-update");
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe("Bearer mock-admin-token");
    expect(screen.getByText("Sent 4 of 4 emails. Failed: 0.")).toBeInTheDocument();
  });
});
