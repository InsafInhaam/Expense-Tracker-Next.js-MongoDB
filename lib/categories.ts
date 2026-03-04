export const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Investment",
  "Business",
  "Gift",
  "Refund",
  "Other",
] as const;

export const EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Transport",
  "Shopping",
  "Bills & Utilities",
  "Entertainment",
  "Healthcare",
  "Education",
  "Groceries",
  "Other",
] as const;

export type TransactionType = "income" | "expense";

export function getAllowedCategories(type: TransactionType): readonly string[] {
  return type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

export function resolveAllowedCategory(
  type: TransactionType,
  input?: string,
): string | null {
  if (!input) return null;

  const normalized = input.trim().toLowerCase();
  if (!normalized) return null;

  const allowed = getAllowedCategories(type);
  const found = allowed.find(
    (category) => category.toLowerCase() === normalized,
  );

  return found ?? null;
}

export function formatAllowedCategories(type: TransactionType): string {
  return getAllowedCategories(type).join(", ");
}
