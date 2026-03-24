export enum Interval {
  ONE_TIME = "ONE_TIME",
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  BIWEEKLY = "BIWEEKLY",
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  YEARLY = "YEARLY",
}

export interface BalanceSnapshot {
  id: string;
  amount: number;
  date: string;
}

export interface IncomeSource {
  id: string;
  name: string;
  amount: number;
  interval: Interval;
  startDate: string;
  active: boolean;
}

export interface PlannedExpense {
  id: string;
  name: string;
  amount: number;
  interval: Interval;
  startDate: string;
  endDate?: string;
  active: boolean;
  category?: string;
}

export interface ProjectionEvent {
  name: string;
  amount: number;
  type: "income" | "expense";
}

export interface ProjectionDay {
  date: string;
  balance: number;
  events: ProjectionEvent[];
}

export interface Override {
  id: string;
  type: "income" | "expense";
  active: boolean;
}
