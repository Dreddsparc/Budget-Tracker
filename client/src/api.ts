import type {
  BalanceSnapshot,
  IncomeSource,
  PlannedExpense,
  ProjectionDay,
  Override,
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

// Projections
export function getProjections(
  days: number,
  overrides?: Override[]
): Promise<ProjectionDay[]> {
  const params = new URLSearchParams({ days: String(days) });
  if (overrides && overrides.length > 0) {
    params.set("overrides", JSON.stringify(overrides));
  }
  return request<ProjectionDay[]>(
    `/api/projections?${params.toString()}`
  );
}
