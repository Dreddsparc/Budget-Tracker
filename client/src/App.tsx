import { useState, useEffect, useCallback } from "react";
import type { IncomeSource, PlannedExpense, Override, DateRange } from "./types";
import * as api from "./api";
import DateRangeBar from "./components/DateRangeBar";
import ProjectionChart from "./components/ProjectionChart";
import LedgerView from "./components/LedgerView";
import IncomeList from "./components/IncomeList";
import ExpenseList from "./components/ExpenseList";
import SetBalanceModal from "./components/SetBalanceModal";

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
  const [dateRange, setDateRange] = useState<DateRange>({ kind: "preset", days: 90 });
  const [categoryColors, setCategoryColors] = useState<Record<string, string>>({});

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

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

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
        <div className="navbar-end px-4">
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
        {/* Controls bar: view toggle + date range */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="tabs tabs-boxed w-fit shrink-0">
            <button
              className={`tab ${viewMode === "chart" ? "tab-active" : ""}`}
              onClick={() => setViewMode("chart")}
            >
              Chart
            </button>
            <button
              className={`tab ${viewMode === "ledger" ? "tab-active" : ""}`}
              onClick={() => setViewMode("ledger")}
            >
              Ledger
            </button>
          </div>
          <DateRangeBar value={dateRange} onChange={setDateRange} />
        </div>

        {/* Projection Chart or Ledger */}
        {viewMode === "chart" ? (
          <ProjectionChart
            dateRange={dateRange}
            overrides={overrides}
            refreshKey={refreshKey}
            categoryColors={categoryColors}
          />
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
