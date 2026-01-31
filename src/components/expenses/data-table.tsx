"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
  ColumnFiltersState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";
import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Category } from "@/lib/categories";
import { getCategoryName } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  totalAmount?: number;
  categories?: Category[];
}

export function DataTable<TData, TValue>(props: DataTableProps<TData, TValue>) {
  const { columns, data, categories } = props;
  const t = useTranslations();
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get unique root categories for filter pills
  const rootCategories = useMemo(() => {
    if (!categories) return [];
    return categories.filter((c) => !c.parent_id).slice(0, 5);
  }, [categories]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    globalFilterFn: "includesString",
    state: {
      globalFilter,
      columnFilters,
    },
  });

  const handleCategoryFilter = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    if (categoryId === null) {
      setColumnFilters([]);
    } else {
      setColumnFilters([{ id: "category", value: categoryId }]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex flex-col gap-3">
        {/* Search input - full width on all screens for better UX */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("Expenses.search_expenses")}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9 h-9 w-full"
          />
        </div>

        {/* Category filter pills - scrollable on mobile */}
        {rootCategories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs shrink-0"
              onClick={() => handleCategoryFilter(null)}
            >
              {t("Expenses.all_categories")}
            </Button>
            {rootCategories.map((category) => (
              <Button
                key={category.id}
                variant={
                  selectedCategory === category.id ? "default" : "outline"
                }
                size="sm"
                className="h-8 text-xs gap-1.5 shrink-0"
                onClick={() => handleCategoryFilter(category.id)}
              >
                <span>{category.icon}</span>
                <span>{getCategoryName(category, t)}</span>
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Table with sticky header */}
      <div className="rounded-md border max-h-[60vh] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="bg-background">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="group hover:bg-muted/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {t("Expenses.table.no_expenses_yet")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {/* Footer for Total */}
          {typeof props.totalAmount === "number" && (
            <TableFooter className="sticky bottom-0 bg-background">
              <TableRow>
                <TableCell colSpan={columns.length - 2}>
                  {t("Expenses.table.total")}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(props.totalAmount)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {t("Expenses.table.previous")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {t("Expenses.table.next")}
        </Button>
      </div>
    </div>
  );
}
