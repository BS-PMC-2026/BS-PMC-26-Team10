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

  test("does not render when isOpen is false", () => {
    render(<ChilliFormModal isOpen={false} onClose={noop} onChilliAdded={noop} />);
    expect(screen.queryByRole("heading", { name: "Add Pepper" })).not.toBeInTheDocument();
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

  test("shows error when no image is selected", async () => {
    renderModal();
    await userEvent.type(screen.getByPlaceholderText("Habanero"), "Test Pepper");
    await userEvent.type(screen.getByPlaceholderText("100000"), "10000");
    await userEvent.type(screen.getByPlaceholderText("350000"), "50000");
    await userEvent.click(screen.getByRole("button", { name: "Add Pepper" }));
    expect(screen.getByText("Please select an image.")).toBeInTheDocument();
  });

  test("auto-fills filename input when a file is selected", async () => {
    renderModal();
    const file = new File(["img"], "habanero.jpg", { type: "image/jpeg" });
    const fileInput = document.querySelector('input[type="file"]');
    await userEvent.upload(fileInput, file);
    expect(screen.getByPlaceholderText("File name (optional)")).toHaveValue("habanero");
  });

  test("calls onClose when cancel button is clicked", async () => {
    const mockClose = vi.fn();
    renderModal({ onClose: mockClose });
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mockClose).toHaveBeenCalled();
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

  describe("price field", () => {
    test("renders the price label and input placeholder", () => {
      renderModal();
      expect(screen.getByText(/price per pack/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText("e.g. 25")).toBeInTheDocument();
    });

    test("price value is sent in submit payload when filled in", async () => {
      const fetchMock = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ image_url: "https://example.com/img.jpg" }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
      vi.stubGlobal("fetch", fetchMock);

      renderModal({ onClose: vi.fn(), onChilliAdded: vi.fn() });

      await userEvent.type(screen.getByPlaceholderText("Habanero"), "Test Pepper");
      await userEvent.type(screen.getByPlaceholderText("100000"), "10000");
      await userEvent.type(screen.getByPlaceholderText("350000"), "50000");
      await userEvent.type(screen.getByPlaceholderText("e.g. 25"), "18.5");

      const file = new File(["img"], "pepper.jpg", { type: "image/jpeg" });
      await userEvent.upload(document.querySelector('input[type="file"]'), file);

      await userEvent.click(screen.getByRole("button", { name: "Add Pepper" }));

      await waitFor(() => {
        const body = JSON.parse(fetchMock.mock.calls[1][1].body);
        expect(body.price).toBe(18.5);
      });
    });

    test("price is null in payload when left empty", async () => {
      const fetchMock = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ image_url: "https://example.com/img.jpg" }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
      vi.stubGlobal("fetch", fetchMock);

      renderModal({ onClose: vi.fn(), onChilliAdded: vi.fn() });

      await userEvent.type(screen.getByPlaceholderText("Habanero"), "Test Pepper");
      await userEvent.type(screen.getByPlaceholderText("100000"), "10000");
      await userEvent.type(screen.getByPlaceholderText("350000"), "50000");
      // leave price blank

      const file = new File(["img"], "pepper.jpg", { type: "image/jpeg" });
      await userEvent.upload(document.querySelector('input[type="file"]'), file);

      await userEvent.click(screen.getByRole("button", { name: "Add Pepper" }));

      await waitFor(() => {
        const body = JSON.parse(fetchMock.mock.calls[1][1].body);
        expect(body.price).toBeNull();
      });
    });
  });

  test("shows error message when submit fails", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ image_url: "https://example.com/img.jpg" }) })
      .mockResolvedValueOnce({ ok: false })
    );

    renderModal();

    await userEvent.type(screen.getByPlaceholderText("Habanero"), "Test Pepper");
    await userEvent.type(screen.getByPlaceholderText("100000"), "10000");
    await userEvent.type(screen.getByPlaceholderText("350000"), "50000");

    const file = new File(["img"], "pepper.jpg", { type: "image/jpeg" });
    await userEvent.upload(document.querySelector('input[type="file"]'), file);

    await userEvent.click(screen.getByRole("button", { name: "Add Pepper" }));

    await waitFor(() =>
      expect(screen.getByText("Failed to add pepper.")).toBeInTheDocument()
    );
  });
});
