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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Category } from "@/lib/categories";
import {
  useState,
  useTransition,
  Fragment,
  useActionState,
  useEffect,
} from "react";
import { cn } from "@/lib/utils";
import {
  deleteCategory,
  updateCategory,
  ActionState,
} from "@/actions/categories";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { getCategoryName } from "@/lib/utils";

interface CategoryListProps {
  categories: Category[];
}

const initialState: ActionState = { error: "" };

export function CategoryList({ categories }: CategoryListProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editIcon, setEditIcon] = useState("📁");
  const [state, formAction, isUpdating] = useActionState(
    updateCategory,
    initialState,
  );
  const t = useTranslations();

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Handle successful update - use setTimeout to avoid cascading render
  useEffect(() => {
    if (state.success) {
      const timeout = setTimeout(() => setEditingCategory(null), 0);
      toast.success(t("Categories.category_updated"));
      return () => clearTimeout(timeout);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, t]);

  const handleEdit = (category: Category) => {
    setEditIcon(category.icon || "📁");
    setEditingCategory(category);
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
        loading: t("Categories.deleting"),
        success: t("Categories.category_deleted"),
        error: t("Categories.delete_failed"),
      },
    );
  };

  // Get flat list of eligible parents (exclude the category being edited and its children)
  const getEligibleParents = (excludeId: string) => {
    return categories.filter(
      (c) => c.id !== excludeId && c.parent_id !== excludeId,
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
                  <DropdownMenuItem onClick={() => handleEdit(category)}>
                    {t("edit")}
                  </DropdownMenuItem>
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
    <>
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

      {/* Edit Category Dialog */}
      <Dialog
        open={!!editingCategory}
        onOpenChange={(open) => !open && setEditingCategory(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("Categories.edit_category")}</DialogTitle>
            <DialogDescription>
              {t("Categories.edit_category_description")}
            </DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <form action={formAction}>
              <input type="hidden" name="id" value={editingCategory.id} />
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-name" className="text-right">
                    {t("Name")}
                  </Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={editingCategory.name}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-icon" className="text-right">
                    {t("Categories.icon")}
                  </Label>
                  <div className="col-span-3">
                    <input type="hidden" name="icon" value={editIcon} />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                          type="button"
                        >
                          <span className="mr-2 text-lg">{editIcon}</span>
                          {t("Categories.change_icon")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64">
                        <div className="grid grid-cols-5 gap-2">
                          {[
                            "🏠",
                            "🍔",
                            "🚗",
                            "🛒",
                            "💊",
                            "🎓",
                            "✈️",
                            "👔",
                            "🎁",
                            "💡",
                            "📶",
                            "🎮",
                            "🏋️",
                            "🐾",
                            "💰",
                            "💸",
                            "🏦",
                            "💳",
                            "🧾",
                            "🔧",
                          ].map((emoji) => (
                            <Button
                              key={emoji}
                              variant="ghost"
                              className="h-8 w-8 p-0 text-xl"
                              onClick={() => setEditIcon(emoji)}
                              type="button"
                            >
                              {emoji}
                            </Button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-color" className="text-right">
                    {t("Categories.color")}
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input
                      id="edit-color"
                      name="color"
                      type="color"
                      className="h-10 w-20 p-1"
                      defaultValue={editingCategory.color || "#3b82f6"}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-parent" className="text-right">
                    {t("Categories.parent")}
                  </Label>
                  <Select
                    name="parent_id"
                    defaultValue={editingCategory.parent_id || "root"}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder={t("Categories.none")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="root">
                        {t("Categories.none")}
                      </SelectItem>
                      {getEligibleParents(editingCategory.id).map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? t("Categories.saving") : t("Categories.save")}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
