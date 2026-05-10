import { describe, test, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InventoryFormModal from "../components/InventoryFormModal/InventoryFormModal";

const noop = () => {};

function renderModal(props = {}) {
  return render(
    <InventoryFormModal
      isOpen={true}
      onClose={noop}
      onProductAdded={noop}
      selectedProduct={null}
      {...props}
    />
  );
}

describe("InventoryFormModal", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  test("does not render when isOpen is false", () => {
    render(<InventoryFormModal isOpen={false} onClose={noop} onProductAdded={noop} selectedProduct={null} />);
    expect(screen.queryByRole("heading", { name: "Add Product" })).not.toBeInTheDocument();
  });

  test("renders the form when isOpen is true", () => {
    renderModal();
    expect(screen.getByRole("heading", { name: "Add Product" })).toBeInTheDocument();
  });

  test("shows validation error when required fields are empty", async () => {
    renderModal();
    await userEvent.click(screen.getByRole("button", { name: "Add Product" }));
    expect(screen.getByText(/please fill in name, description, quantity, and price/i)).toBeInTheDocument();
  });

  test("shows error when no image is selected", async () => {
    renderModal();
    await userEvent.type(screen.getByPlaceholderText("Hot Sour Sauce"), "Test Product");
    await userEvent.type(screen.getByPlaceholderText(/write a short product description/i), "A great sauce");
    await userEvent.type(screen.getByPlaceholderText("10"), "5");
    await userEvent.type(screen.getByPlaceholderText("15"), "20");
    await userEvent.click(screen.getByRole("button", { name: "Add Product" }));
    expect(screen.getByText("Please select an image.")).toBeInTheDocument();
  });

  test("ingredients textarea shows by default (text mode)", () => {
    renderModal();
    expect(screen.getByPlaceholderText(/chili peppers, vinegar/i)).toBeInTheDocument();
  });

  test("switching to Image mode hides the ingredients textarea", async () => {
    renderModal();
    await userEvent.click(screen.getByRole("button", { name: "Image" }));
    expect(screen.queryByPlaceholderText(/chili peppers, vinegar/i)).not.toBeInTheDocument();
  });

  test("switching back to Text mode restores the ingredients textarea", async () => {
    renderModal();
    await userEvent.click(screen.getByRole("button", { name: "Image" }));
    await userEvent.click(screen.getByRole("button", { name: "Text" }));
    expect(screen.getByPlaceholderText(/chili peppers, vinegar/i)).toBeInTheDocument();
  });

  test("renders Edit Product heading when a product is selected", () => {
    const product = {
      id: 1, name: "Hot Sour Sauce", description: "Spicy sauce",
      quantity: 10, restock_date: "", price: 15,
      image_url: "", ingredients: "", ingredients_image_url: "",
    };
    renderModal({ selectedProduct: product });
    expect(screen.getByRole("heading", { name: "Edit Product" })).toBeInTheDocument();
  });

  test("pre-fills form fields when editing a product", () => {
    const product = {
      id: 1, name: "Hot Sour Sauce", description: "Spicy sauce",
      quantity: 10, restock_date: "", price: 15,
      image_url: "", ingredients: "Chili, vinegar, salt", ingredients_image_url: "",
    };
    renderModal({ selectedProduct: product });
    expect(screen.getByDisplayValue("Hot Sour Sauce")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Chili, vinegar, salt")).toBeInTheDocument();
  });

  test("calls onClose when Cancel is clicked", async () => {
    const mockClose = vi.fn();
    renderModal({ onClose: mockClose });
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mockClose).toHaveBeenCalled();
  });

  test("calls onProductAdded and onClose after successful submit", async () => {
    const mockClose = vi.fn();
    const mockAdded = vi.fn();
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ image_url: "https://example.com/product.jpg" }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ message: "Product has been created!" }) })
    );

    renderModal({ onClose: mockClose, onProductAdded: mockAdded });

    await userEvent.type(screen.getByPlaceholderText("Hot Sour Sauce"), "Test Product");
    await userEvent.type(screen.getByPlaceholderText(/write a short product description/i), "A great sauce");
    await userEvent.type(screen.getByPlaceholderText("10"), "5");
    await userEvent.type(screen.getByPlaceholderText("15"), "20");

    const file = new File(["img"], "product.jpg", { type: "image/jpeg" });
    const fileInputs = document.querySelectorAll('input[type="file"]');
    await userEvent.upload(fileInputs[0], file);

    await userEvent.click(screen.getByRole("button", { name: "Add Product" }));

    await waitFor(() => {
      expect(mockClose).toHaveBeenCalled();
      expect(mockAdded).toHaveBeenCalled();
    });
  });
});
