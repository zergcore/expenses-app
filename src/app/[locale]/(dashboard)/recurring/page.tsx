import { getRecurringRules } from "@/actions/recurring";
import { getCategories } from "@/actions/categories";
import { buildCategoryTree } from "@/lib/categories";
import { RecurringRuleForm } from "@/components/recurring/recurring-rule-form";
import { RecurringRulesList } from "@/components/recurring/recurring-rules-list";
import { getTranslations } from "next-intl/server";

export default async function RecurringPage() {
  const t = await getTranslations("Recurring");

  // Parallel fetching
  const [rules, categories] = await Promise.all([
    getRecurringRules(),
    getCategories(),
  ]);

  const categoryTree = buildCategoryTree(categories);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <RecurringRuleForm categories={categoryTree} />
      </div>

      {/* Rules List */}
      <RecurringRulesList rules={rules} categories={categoryTree} />
    </div>
  );
}
