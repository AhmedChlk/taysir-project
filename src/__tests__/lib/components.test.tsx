import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import DataTable, { Column } from "@/components/ui/DataTable";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "fr",
}));

describe("DataTable", () => {
  type TestData = { id: string; name: string; value: number };
  
  const columns: Column<TestData>[] = [
    { header: "Name", accessor: "name" },
    { header: "Value", accessor: (item) => `Val: ${item.value}` },
  ];
  const data: TestData[] = [
    { id: "1", name: "Item 1", value: 10 },
    { id: "2", name: "Item 2", value: 20 },
  ];

  it("renders data correctly", () => {
    render(<DataTable data={data} columns={columns} />);
    expect(screen.getByText("Item 1")).toBeDefined();
    expect(screen.getByText("Val: 10")).toBeDefined();
    expect(screen.getByText("Item 2")).toBeDefined();
    expect(screen.getByText("Val: 20")).toBeDefined();
  });

  it("calls onAction when action button is clicked", () => {
    const onAction = vi.fn();
    render(<DataTable data={data} columns={columns} onAction={onAction} />);
    
    // Find action buttons (they have MoreVertical icon, usually rendered as svg)
    // In our implementation, it's a button with MoreVertical icon
    const actionButtons = screen.getAllByRole("button");
    // The first button might be the global "Add" button if onAdd is provided, 
    // but here we only have row action buttons.
    
    if (actionButtons[0]) {
      fireEvent.click(actionButtons[0]);
      expect(onAction).toHaveBeenCalledWith(data[0]);
    }
  });

  it("filters data based on search", () => {
    render(<DataTable data={data} columns={columns} />);
    // DataTable search input has a placeholder. Let's find it.
    const search = screen.getByPlaceholderText("search");
    
    fireEvent.change(search, { target: { value: "Item 2" } });
    
    expect(screen.queryByText("Item 1")).toBeNull();
    expect(screen.getByText("Item 2")).toBeDefined();
  });
});
