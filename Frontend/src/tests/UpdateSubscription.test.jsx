import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UpdateSubscription from "../components/UpdateSubscription/UpdateSubscription";

describe("UpdateSubscription", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  test("renders the subscription choices", () => {
    render(<UpdateSubscription />);
    expect(screen.getByText("Fresh updates from the farm")).toBeInTheDocument();
    expect(screen.getByText("Events")).toBeInTheDocument();
    expect(screen.getByText("Special discounts")).toBeInTheDocument();
    expect(screen.getByText("New products")).toBeInTheDocument();
  });

  test("submits selected preferences", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: "saved" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<UpdateSubscription />);

    await userEvent.type(screen.getByPlaceholderText("you@example.com"), "visitor@example.com");
    await userEvent.click(screen.getByText(/I agree to receive email updates/i));
    await userEvent.click(screen.getByRole("button", { name: "Save my preferences" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    const [, options] = fetchMock.mock.calls[0];
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toMatchObject({
      email: "visitor@example.com",
      consent_given: true,
      events_enabled: true,
    });
    expect(screen.getByText("Your update preferences were saved.")).toBeInTheDocument();
  });

  test("keeps unsubscribe out of the signup call to action", () => {
    render(<UpdateSubscription />);
    expect(screen.queryByRole("button", { name: "Unsubscribe" })).not.toBeInTheDocument();
  });
});
