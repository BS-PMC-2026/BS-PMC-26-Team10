import { describe, test, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
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

  test("renders the form when isOpen is true", () => {
    renderModal();
    expect(screen.getByRole("heading", { name: "Add Product" })).toBeInTheDocument();
  });

  test("shows validation error when required fields are empty", async () => {
    renderModal();
    await userEvent.click(screen.getByRole("button", { name: "Add Product" }));
    expect(screen.getByText(/please fill in name, description, quantity, and price/i)).toBeInTheDocument();
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
});
