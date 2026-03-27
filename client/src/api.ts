import type {
  BalanceSnapshot,
  IncomeSource,
  PlannedExpense,
  PriceAdjustment,
  ProjectionDay,
  Override,
  CategoryColor,
} from "./types";

const BASE = "";

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Balance
export function getBalance(): Promise<BalanceSnapshot | null> {
  return request<BalanceSnapshot | null>("/api/balance");
}

export function setBalance(amount: number): Promise<BalanceSnapshot> {
  return request<BalanceSnapshot>("/api/balance", {
    method: "POST",
    body: JSON.stringify({ amount, date: new Date().toISOString().split("T")[0] }),
  });
}

// Income
export function getIncome(): Promise<IncomeSource[]> {
  return request<IncomeSource[]>("/api/income");
}

export function createIncome(
  data: Omit<IncomeSource, "id">
): Promise<IncomeSource> {
  return request<IncomeSource>("/api/income", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateIncome(
  id: string,
  data: Partial<IncomeSource>
): Promise<IncomeSource> {
  return request<IncomeSource>(`/api/income/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteIncome(id: string): Promise<void> {
  return request<void>(`/api/income/${id}`, { method: "DELETE" });
}

export function toggleIncome(id: string): Promise<IncomeSource> {
  return request<IncomeSource>(`/api/income/${id}/toggle`, {
    method: "PATCH",
  });
}

// Expenses
export function getExpenses(): Promise<PlannedExpense[]> {
  return request<PlannedExpense[]>("/api/expenses");
}

export function createExpense(
  data: Omit<PlannedExpense, "id">
): Promise<PlannedExpense> {
  return request<PlannedExpense>("/api/expenses", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateExpense(
  id: string,
  data: Partial<PlannedExpense>
): Promise<PlannedExpense> {
  return request<PlannedExpense>(`/api/expenses/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteExpense(id: string): Promise<void> {
  return request<void>(`/api/expenses/${id}`, { method: "DELETE" });
}

export function toggleExpense(id: string): Promise<PlannedExpense> {
  return request<PlannedExpense>(`/api/expenses/${id}/toggle`, {
    method: "PATCH",
  });
}

// Price Adjustments
export function getPriceAdjustments(
  expenseId: string
): Promise<PriceAdjustment[]> {
  return request<PriceAdjustment[]>(
    `/api/expenses/${expenseId}/prices`
  );
}

export function addPriceAdjustment(
  expenseId: string,
  data: { amount: number; startDate: string; note?: string }
): Promise<PriceAdjustment> {
  return request<PriceAdjustment>(
    `/api/expenses/${expenseId}/prices`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

export function updatePriceAdjustment(
  expenseId: string,
  priceId: string,
  data: { amount?: number; startDate?: string; note?: string }
): Promise<PriceAdjustment> {
  return request<PriceAdjustment>(
    `/api/expenses/${expenseId}/prices/${priceId}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
}

export function deletePriceAdjustment(
  expenseId: string,
  priceId: string
): Promise<void> {
  return request<void>(
    `/api/expenses/${expenseId}/prices/${priceId}`,
    { method: "DELETE" }
  );
}

// Category Colors
export function getCategoryColors(): Promise<CategoryColor[]> {
  return request<CategoryColor[]>("/api/categories");
}

export function setCategoryColor(
  name: string,
  color: string
): Promise<CategoryColor> {
  return request<CategoryColor>(`/api/categories/${encodeURIComponent(name)}`, {
    method: "PUT",
    body: JSON.stringify({ color }),
  });
}

// Spreadsheet
export function exportSpreadsheet(): Promise<Blob> {
  return fetch(`${BASE}/api/spreadsheet/export`).then((res) => {
    if (!res.ok) throw new Error(`Export failed: ${res.status}`);
    return res.blob();
  });
}

export async function importSpreadsheet(
  file: File
): Promise<{ message: string; results: Record<string, unknown> }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/api/spreadsheet/import`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Import failed: ${text}`);
  }
  return res.json();
}

// Projections
export function getProjections(
  range: { startDate: string; endDate: string } | { days: number },
  overrides?: Override[]
): Promise<ProjectionDay[]> {
  const params = new URLSearchParams();
  if ("days" in range) {
    params.set("days", String(range.days));
  } else {
    params.set("startDate", range.startDate);
    params.set("endDate", range.endDate);
  }
  if (overrides && overrides.length > 0) {
    params.set("overrides", JSON.stringify(overrides));
  }
  return request<ProjectionDay[]>(
    `/api/projections?${params.toString()}`
  );
}
