import { useState, useEffect, useCallback } from "react";
import type { IncomeSource, PlannedExpense, Override, DateRange, ProjectionDay } from "./types";
import * as api from "./api";
import DateRangeBar from "./components/DateRangeBar";
import ProjectionChart from "./components/ProjectionChart";
import SpendingPieChart from "./components/SpendingPieChart";
import IncomeExpenseBarChart from "./components/IncomeExpenseBarChart";
import CashFlowChart from "./components/CashFlowChart";
import ExpenseTrendChart from "./components/ExpenseTrendChart";
import LedgerView from "./components/LedgerView";
import IncomeList from "./components/IncomeList";
import ExpenseList from "./components/ExpenseList";
import SetBalanceModal from "./components/SetBalanceModal";
import SpreadsheetControls from "./components/SpreadsheetControls";

type ChartType = "projection" | "spending" | "income-vs-expenses" | "cash-flow" | "expense-trend";

const CHART_OPTIONS: { value: ChartType; label: string }[] = [
  { value: "projection", label: "Projection" },
  { value: "spending", label: "Spending by Category" },
  { value: "income-vs-expenses", label: "Income vs Expenses" },
  { value: "cash-flow", label: "Cash Flow" },
  { value: "expense-trend", label: "Expense Trends" },
];

type ViewMode = "chart" | "ledger";

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

export default function App() {
  const [balance, setBalance] = useState<number | null>(null);
  const [income, setIncome] = useState<IncomeSource[]>([]);
  const [expenses, setExpenses] = useState<PlannedExpense[]>([]);
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("chart");
  const [chartType, setChartType] = useState<ChartType>("projection");
  const [dateRange, setDateRange] = useState<DateRange>({ kind: "preset", days: 90 });
  const [categoryColors, setCategoryColors] = useState<Record<string, string>>({});
  const [projections, setProjections] = useState<ProjectionDay[]>([]);
  const [projectionsLoading, setProjectionsLoading] = useState(false);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [balRes, incRes, expRes, colorsRes] = await Promise.all([
        api.getBalance(),
        api.getIncome(),
        api.getExpenses(),
        api.getCategoryColors(),
      ]);

      if (balRes) {
        setBalance(balRes.amount);
      } else {
        setBalance(null);
        setShowBalanceModal(true);
      }

      setIncome(incRes);
      setExpenses(expRes);

      const colorMap: Record<string, string> = {};
      for (const c of colorsRes) {
        colorMap[c.name] = c.color;
      }
      setCategoryColors(colorMap);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch projection data (shared across all charts)
  const fetchProjections = useCallback(async () => {
    setProjectionsLoading(true);
    try {
      const activeOverrides = overrides.length > 0 ? overrides : undefined;
      const range =
        dateRange.kind === "preset"
          ? { days: dateRange.days }
          : { startDate: dateRange.startDate, endDate: dateRange.endDate };
      const result = await api.getProjections(range, activeOverrides);
      setProjections(result);
    } catch (err) {
      console.error("Failed to fetch projections:", err);
    } finally {
      setProjectionsLoading(false);
    }
  }, [dateRange, overrides, refreshKey]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    fetchProjections();
  }, [fetchProjections]);

  async function handleSaveBalance(amount: number) {
    await api.setBalance(amount);
    setBalance(amount);
    setShowBalanceModal(false);
    refresh();
  }

  function handleIncomeRefresh() {
    api.getIncome().then(setIncome).catch(console.error);
    refresh();
  }

  function handleExpenseRefresh() {
    api.getExpenses().then(setExpenses).catch(console.error);
    refresh();
  }

  async function handleCategoryColorChange(name: string, color: string) {
    setCategoryColors((prev) => ({ ...prev, [name]: color }));
    await api.setCategoryColor(name, color);
  }

  function handleToggleOverride(id: string, active: boolean, type: "income" | "expense") {
    setOverrides((prev) => {
      const filtered = prev.filter((o) => o.id !== id);
      return [...filtered, { id, type, active }];
    });
  }

  function renderChart() {
    if (projectionsLoading && projections.length === 0) {
      return (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body items-center justify-center h-[430px]">
            <span className="loading loading-spinner loading-lg" />
          </div>
        </div>
      );
    }

    switch (chartType) {
      case "projection":
        return (
          <ProjectionChart
            projections={projections}
            categoryColors={categoryColors}
          />
        );
      case "spending":
        return (
          <SpendingPieChart
            projections={projections}
            categoryColors={categoryColors}
          />
        );
      case "income-vs-expenses":
        return <IncomeExpenseBarChart projections={projections} />;
      case "cash-flow":
        return <CashFlowChart projections={projections} />;
      case "expense-trend":
        return (
          <ExpenseTrendChart
            projections={projections}
            categoryColors={categoryColors}
          />
        );
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      {/* Navbar */}
      <div className="navbar bg-base-100 shadow-lg sticky top-0 z-50">
        <div className="navbar-start">
          <h1 className="text-xl font-bold px-4">Budget Tracker</h1>
        </div>
        <div className="navbar-end px-4 gap-2">
          <SpreadsheetControls onImportComplete={fetchAll} />
          <button
            className="btn btn-ghost"
            onClick={() => setShowBalanceModal(true)}
            aria-label="Set balance"
          >
            <div className="stat p-0">
              <div className="stat-title text-xs">Balance</div>
              <div
                className={`stat-value text-lg ${
                  balance !== null && balance >= 0 ? "text-success" : "text-error"
                }`}
              >
                {balance !== null ? formatCurrency(balance) : "--"}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto p-4 max-w-6xl space-y-6">
        {/* Controls bar: view toggle + chart type + date range */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <div className="tabs tabs-boxed w-fit">
              <button
                className={`tab ${viewMode === "chart" ? "tab-active" : ""}`}
                onClick={() => setViewMode("chart")}
              >
                Charts
              </button>
              <button
                className={`tab ${viewMode === "ledger" ? "tab-active" : ""}`}
                onClick={() => setViewMode("ledger")}
              >
                Ledger
              </button>
            </div>

            {viewMode === "chart" && (
              <select
                className="select select-bordered select-sm"
                value={chartType}
                onChange={(e) => setChartType(e.target.value as ChartType)}
              >
                {CHART_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
          </div>
          <DateRangeBar value={dateRange} onChange={setDateRange} />
        </div>

        {/* Chart or Ledger */}
        {viewMode === "chart" ? (
          renderChart()
        ) : (
          <LedgerView
            dateRange={dateRange}
            overrides={overrides}
            refreshKey={refreshKey}
          />
        )}

        {/* Income and Expenses Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <IncomeList
            items={income}
            onRefresh={handleIncomeRefresh}
            onToggleOverride={(id, active) =>
              handleToggleOverride(id, active, "income")
            }
          />
          <ExpenseList
            items={expenses}
            onRefresh={handleExpenseRefresh}
            onToggleOverride={(id, active) =>
              handleToggleOverride(id, active, "expense")
            }
            categoryColors={categoryColors}
            onCategoryColorChange={handleCategoryColorChange}
          />
        </div>
      </main>

      {/* Balance Modal */}
      <SetBalanceModal
        open={showBalanceModal}
        currentBalance={balance}
        onSave={handleSaveBalance}
        onClose={() => setShowBalanceModal(false)}
      />
    </div>
  );
}
