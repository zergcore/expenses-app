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
import {
  createCategory,
  ActionState,
} from "@/app/(dashboard)/categories/actions";
import { Category } from "@/lib/categories";
import { Plus } from "lucide-react";
import { toast } from "sonner";

const initialState: ActionState = {
  error: "",
};

interface CategoryFormProps {
  categories: Category[]; // Flat list of potential parents
}

export function CategoryForm({ categories }: CategoryFormProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    createCategory,
    initialState
  );

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      toast.success("Category created successfully");
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
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Category</DialogTitle>
          <DialogDescription>
            Create a new category to organize your expenses.
          </DialogDescription>
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
                placeholder="e.g. Groceries"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="icon" className="text-right">
                Icon
              </Label>
              <Input
                id="icon"
                name="icon"
                placeholder="🍔"
                className="col-span-3"
                maxLength={2}
              />
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
                  <SelectValue placeholder="None (Root Category)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">None (Root Category)</SelectItem>
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
              {isPending ? "Creating..." : "Create Category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
