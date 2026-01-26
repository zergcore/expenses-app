import { CategoryList } from "@/components/categories/category-list";
import { CategoryForm } from "@/components/categories/category-form";
import { buildCategoryTree } from "@/lib/categories";
import { getCategories } from "@/actions/categories";
import { CategoriesTitle } from "@/components/categories/categories-title";

export default async function CategoriesPage() {
  // Use Service Layer for data fetching
  const categories = await getCategories();

  // Pure transformation logic
  const categoryTree = buildCategoryTree(categories);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <CategoriesTitle />
        <CategoryForm categories={categories} />
      </div>

      <CategoryList categories={categoryTree} />
    </div>
  );
}
