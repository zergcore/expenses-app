import { CategoryList } from "@/components/categories/category-list";
import { CategoryForm } from "@/components/categories/category-form";
import { buildCategoryTree } from "@/lib/categories";
import { getCategories } from "@/lib/api/categories";

export default async function CategoriesPage() {
  // Use Service Layer for data fetching
  const categories = await getCategories();

  // Pure transformation logic
  const categoryTree = buildCategoryTree(categories);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">
            Manage your budget categories and subcategories
          </p>
        </div>
        <CategoryForm categories={categories} />
      </div>

      <CategoryList categories={categoryTree} />
    </div>
  );
}
