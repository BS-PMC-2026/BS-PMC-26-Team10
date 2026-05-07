import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import InventoryGrid from "../components/InventoryGrid/InventoryGrid";

describe("InventoryGrid", () => {
    test("renders multiple inventory items", () => {
        const mockItems = [
            {
                id: 1,
                name: "Pepper 1",
                description: "Spicy",
                price: 10,
                quantity: 5,
                image_url: "",
            },
            {
                id: 2,
                name: "Pepper 2",
                description: "Very spicy",
                price: 20,
                quantity: 0,
                image_url: "",
            },
        ];

        render(
            <InventoryGrid
                items={mockItems}
                onDeleteProduct={() => {}}
                onEditProduct={() => {}}
            />
        );

        expect(screen.getByText("Pepper 1")).toBeInTheDocument();
        expect(screen.getByText("Pepper 2")).toBeInTheDocument();
    });
});