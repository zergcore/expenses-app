export type Category = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  is_default: boolean;
  parent_id: string | null;
  subcategories?: Category[];
};

/**
 * Pure function to transform flat categories list into a hierarchical tree.
 * Does NOT perform any database operations.
 */
export function buildCategoryTree(categories: Category[]): Category[] {
  if (!categories || categories.length === 0) return [];

  const categoryMap = new Map<string, Category>();
  const rootCategories: Category[] = [];

  // 1. Create shallow copies maps to avoid mutation side-effects on source
  categories.forEach((cat) => {
    categoryMap.set(cat.id, { ...cat, subcategories: [] });
  });

  // 2. Build tree structure
  categories.forEach((cat) => {
    const current = categoryMap.get(cat.id)!;

    if (cat.parent_id) {
      const parent = categoryMap.get(cat.parent_id);
      if (parent) {
        // Add to parent's subcategories
        parent.subcategories?.push(current);
      } else {
        // Orphaned categories (parent deleted/missing) treated as root
        rootCategories.push(current);
      }
    } else {
      rootCategories.push(current);
    }
  });

  // 3. Sort logic: Default first, then Alphabetical
  const sortFn = (a: Category, b: Category): number => {
    if (a.is_default !== b.is_default) {
      return a.is_default ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  };

  const recursiveSort = (nodes: Category[]) => {
    nodes.sort(sortFn);
    nodes.forEach((node) => {
      if (node.subcategories && node.subcategories.length > 0) {
        recursiveSort(node.subcategories);
      }
    });
  };

  recursiveSort(rootCategories);
  return rootCategories;
}
