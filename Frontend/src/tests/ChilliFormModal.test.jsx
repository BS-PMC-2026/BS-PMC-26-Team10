import { describe, test, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChilliFormModal from "../components/ChilliFormModal/ChilliFormModal";

const noop = () => {};

function renderModal(props = {}) {
  return render(
    <ChilliFormModal
      isOpen={true}
      onClose={noop}
      onChilliAdded={noop}
      {...props}
    />
  );
}

describe("ChilliFormModal", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  test("renders the form when isOpen is true", () => {
    renderModal();
    expect(screen.getByRole("heading", { name: "Add Pepper" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Habanero")).toBeInTheDocument();
  });

  test("shows validation error when required fields are empty", async () => {
    renderModal();
    await userEvent.click(screen.getByRole("button", { name: "Add Pepper" }));
    expect(screen.getByText("Name, SHU min, and SHU max are required.")).toBeInTheDocument();
  });

  test("calls onChilliAdded and onClose after successful submit", async () => {
    const mockClose = vi.fn();
    const mockAdded = vi.fn();
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ image_url: "https://example.com/habanero.jpg" }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ message: "Chilli has been created!" }) })
    );

    renderModal({ onClose: mockClose, onChilliAdded: mockAdded });

    await userEvent.type(screen.getByPlaceholderText("Habanero"), "Test Pepper");
    await userEvent.type(screen.getByPlaceholderText("100000"), "10000");
    await userEvent.type(screen.getByPlaceholderText("350000"), "50000");

    const file = new File(["img"], "habanero.jpg", { type: "image/jpeg" });
    await userEvent.upload(document.querySelector('input[type="file"]'), file);

    await userEvent.click(screen.getByRole("button", { name: "Add Pepper" }));

    await waitFor(() => {
      expect(mockClose).toHaveBeenCalled();
      expect(mockAdded).toHaveBeenCalled();
    });
  });
});
