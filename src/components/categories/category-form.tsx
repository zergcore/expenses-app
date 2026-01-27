"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { createCategory, ActionState } from "@/actions/categories";
import { Category } from "@/lib/categories";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTranslations } from "next-intl";

const initialState: ActionState = {
  error: "",
};

interface CategoryFormProps {
  categories: Category[]; // Flat list of potential parents
}

export function CategoryForm({ categories }: CategoryFormProps) {
  const [open, setOpen] = useState(false);
  const [icon, setIcon] = useState("📁");
  const [state, formAction, isPending] = useActionState(
    createCategory,
    initialState,
  );
  const t = useTranslations("Categories");

  useEffect(() => {
    if (state.success) {
      const t = setTimeout(() => setOpen(false), 0);
      toast.success("Category created successfully");
      return () => clearTimeout(t);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  // Flatten the tree to get potential parents if passed hierarchical,
  // but for now we expect "categories" prop to be the eligible parents list.
  // Actually, we should probably pass the flattened list to this component.

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> {t("add_category")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("add_category")}</DialogTitle>
          <DialogDescription>{t("add_category_description")}</DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                placeholder={t("name_placeholder")}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="icon" className="text-right">
                Icon
              </Label>
              <div className="col-span-3">
                <input type="hidden" name="icon" value={icon} />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <span className="mr-2 text-lg">
                        {icon || t("icon_placeholder")}
                      </span>
                      {icon ? "Change Icon" : "Select Icon"}
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
                          onClick={() => setIcon(emoji)}
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
              <Label htmlFor="color" className="text-right">
                Color
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="color"
                  name="color"
                  type="color"
                  className="h-10 w-20 p-1"
                  defaultValue="#3b82f6"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="parent" className="text-right">
                Parent
              </Label>
              <Select name="parent_id">
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={t("none")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">{t("none")}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? t("creating") : t("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
