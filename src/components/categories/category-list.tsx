"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Plus, ChevronRight, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Category } from "@/lib/categories";
import { useState, useTransition, Fragment } from "react";
import { cn } from "@/lib/utils";
import { deleteCategory } from "@/actions/categories";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { getCategoryName } from "@/lib/utils";

interface CategoryListProps {
  categories: Category[];
}

export function CategoryList({ categories }: CategoryListProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();
  const t = useTranslations();

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDelete = (id: string) => {
    toast.promise(
      new Promise((resolve, reject) => {
        startTransition(async () => {
          try {
            await deleteCategory(id);
            resolve(true);
          } catch (error) {
            reject(error);
          }
        });
      }),
      {
        loading: "Deleting category...",
        success: "Category deleted",
        error: "Failed to delete category",
      },
    );
  };

  const renderRow = (
    category: Category,
    level: number = 0,
  ): React.ReactNode => {
    const hasChildren =
      category.subcategories && category.subcategories.length > 0;
    const isExpanded = expanded[category.id];

    return (
      <Fragment key={category.id}>
        <TableRow className="group">
          <TableCell className="font-medium">
            <div
              className="flex items-center gap-2"
              style={{ paddingLeft: `${level * 1.5}rem` }}
            >
              {hasChildren ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 p-0"
                  onClick={() => toggleExpand(category.id)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              ) : (
                <div className="h-6 w-6" /> // Spacer
              )}
              <div
                className="flex h-8 w-8 items-center justify-center rounded-md text-lg"
                style={{
                  backgroundColor: category.color
                    ? `${category.color}20`
                    : undefined,
                }}
              >
                {category.icon || "📁"}
              </div>
              <span className={cn(level === 0 && "font-semibold")}>
                {getCategoryName(category, t)}
              </span>
            </div>
          </TableCell>
          <TableCell>
            {category.is_default && (
              <Badge variant="secondary">{t("system")}</Badge>
            )}
          </TableCell>
          <TableCell className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">{t("open_menu")}</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
                <DropdownMenuItem>{t("permissions")}</DropdownMenuItem>
                {!category.is_default && (
                  <DropdownMenuItem>{t("edit")}</DropdownMenuItem>
                )}
                {!category.is_default && (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => handleDelete(category.id)}
                    disabled={isPending}
                  >
                    {t("delete")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>{t("add_subcategory")}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
        {isExpanded &&
          category.subcategories?.map((sub: Category) =>
            renderRow(sub, level + 1),
          )}
      </Fragment>
    );
  };

  if (categories.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-4 rounded-md border border-dashed text-center">
        <p className="text-muted-foreground">{t("no_categories_found")}</p>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> {t("add_category")}
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("Name")}</TableHead>
            <TableHead>{t("Type")}</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{categories.map((cat) => renderRow(cat))}</TableBody>
      </Table>
    </div>
  );
}
