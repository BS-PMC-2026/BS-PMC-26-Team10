import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InventoryCard from "./InventoryCard";


describe("InventoryCard", () => {
    const mockItem = {
        id: 1,
        name: "Hot Pepper",
        description: "Spicy and fresh",
        price: 25,
        quantity: 12,
        restock_date: "2026-04-25",
        last_updated: "2026-04-20",
        image_url: "http://example.com/image.jpg",
    };

    test("renders item name, description, price and quantity", () => {
        render(
            <InventoryCard
                item={mockItem}
                onDeleteProduct={() => { }}
                onEditProduct={() => { }}
            />
        );

        expect(screen.getByText("Hot Pepper")).toBeInTheDocument();
        expect(screen.getByText("Spicy and fresh")).toBeInTheDocument();
        expect(screen.getByText("₪25")).toBeInTheDocument();
        expect(screen.getByText("12 units")).toBeInTheDocument();
    });

    test("shows fallback description when none is provided", () => {
        const itemWithoutDescription = {
            ...mockItem,
            description: "",
        };

        render(
            <InventoryCard
                item={itemWithoutDescription}
                onDeleteProduct={() => { }}
                onEditProduct={() => { }}
            />
        );

        expect(screen.getByText("No description yet.")).toBeInTheDocument();
    });

    test("shows correct stock label for low stock", () => {
        const lowStockItem = {
            ...mockItem,
            quantity: 5,
        };

        render(
            <InventoryCard
                item={lowStockItem}
                onDeleteProduct={() => { }}
                onEditProduct={() => { }}
            />
        );

        expect(screen.getByText("Low stock")).toBeInTheDocument();
    });

    test("shows correct stock label for out of stock", () => {
        const outOfStockItem = {
            ...mockItem,
            quantity: 0,
        };

        render(
            <InventoryCard
                item={outOfStockItem}
                onDeleteProduct={() => { }}
                onEditProduct={() => { }}
            />
        );

        expect(screen.getByText("Out of stock")).toBeInTheDocument();
    });

    test("calls onDeleteProduct when delete button is clicked", async () => {
        const mockDelete = vi.fn();

        render(
            <InventoryCard
                item={mockItem}
                onDeleteProduct={mockDelete}
                onEditProduct={() => { }}
            />
        );

        const deleteButton = screen.getByText("Delete");
        await userEvent.click(deleteButton);

        expect(mockDelete).toHaveBeenCalledWith(1);
    });
});