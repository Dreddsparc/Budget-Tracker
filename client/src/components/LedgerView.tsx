import { useState, useEffect, useCallback, useMemo } from "react";
import type { Override, ProjectionDay } from "../types";
import * as api from "../api";

interface Props {
  overrides: Override[];
  refreshKey: number;
}

const DAY_OPTIONS = [30, 60, 90, 180, 365];

type FilterType = "all" | "income" | "expense" | "events-only";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function LedgerView({ overrides, refreshKey }: Props) {
  const [days, setDays] = useState(90);
  const [projections, setProjections] = useState<ProjectionDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");

  const fetchProjections = useCallback(async () => {
    setLoading(true);
    try {
      const activeOverrides = overrides.length > 0 ? overrides : undefined;
      const result = await api.getProjections(days, activeOverrides);
      setProjections(result);
    } catch (err) {
      console.error("Failed to fetch projections:", err);
    } finally {
      setLoading(false);
    }
  }, [days, overrides, refreshKey]);

  useEffect(() => {
    fetchProjections();
  }, [fetchProjections]);

  const ledgerRows = useMemo(() => {
    const rows: {
      date: string;
      name: string;
      type: "income" | "expense" | "balance";
      amount: number;
      balance: number;
    }[] = [];

    for (const day of projections) {
      if (day.events.length === 0) {
        if (filter === "all") {
          rows.push({
            date: day.date,
            name: "",
            type: "balance",
            amount: 0,
            balance: day.balance,
          });
        }
        continue;
      }

      for (const event of day.events) {
        const matchesFilter =
          filter === "all" ||
          filter === "events-only" ||
          filter === event.type;

        const matchesSearch =
          !search ||
          event.name.toLowerCase().includes(search.toLowerCase());

        if (matchesFilter && matchesSearch) {
          rows.push({
            date: day.date,
            name: event.name,
            type: event.type,
            amount: event.amount,
            balance: day.balance,
          });
        }
      }
    }

    return rows;
  }, [projections, filter, search]);

  const summary = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    for (const day of projections) {
      for (const event of day.events) {
        if (event.type === "income") {
          totalIncome += event.amount;
          incomeCount++;
        } else {
          totalExpenses += event.amount;
          expenseCount++;
        }
      }
    }

    return {
      totalIncome,
      totalExpenses,
      net: totalIncome - totalExpenses,
      incomeCount,
      expenseCount,
      startBalance: projections[0]?.balance ?? 0,
      endBalance: projections[projections.length - 1]?.balance ?? 0,
    };
  }, [projections]);

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body p-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <h2 className="card-title">Ledger</h2>
          <div className="flex gap-1">
            {DAY_OPTIONS.map((d) => (
              <button
                key={d}
                className={`btn btn-xs ${days === d ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setDays(d)}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <div className="stat bg-base-200 rounded-lg p-3">
            <div className="stat-title text-xs">Total Income</div>
            <div className="stat-value text-sm text-success">
              {formatCurrency(summary.totalIncome)}
            </div>
            <div className="stat-desc">{summary.incomeCount} transactions</div>
          </div>
          <div className="stat bg-base-200 rounded-lg p-3">
            <div className="stat-title text-xs">Total Expenses</div>
            <div className="stat-value text-sm text-error">
              {formatCurrency(summary.totalExpenses)}
            </div>
            <div className="stat-desc">{summary.expenseCount} transactions</div>
          </div>
          <div className="stat bg-base-200 rounded-lg p-3">
            <div className="stat-title text-xs">Net Cash Flow</div>
            <div
              className={`stat-value text-sm ${
                summary.net >= 0 ? "text-success" : "text-error"
              }`}
            >
              {formatCurrency(summary.net)}
            </div>
            <div className="stat-desc">over {days} days</div>
          </div>
          <div className="stat bg-base-200 rounded-lg p-3">
            <div className="stat-title text-xs">Ending Balance</div>
            <div
              className={`stat-value text-sm ${
                summary.endBalance >= 0 ? "text-success" : "text-error"
              }`}
            >
              {formatCurrency(summary.endBalance)}
            </div>
            <div className="stat-desc">
              from {formatDateShort(projections[0]?.date ?? "")}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="flex gap-1">
            {(
              [
                ["all", "All Days"],
                ["events-only", "Events Only"],
                ["income", "Income"],
                ["expense", "Expenses"],
              ] as [FilterType, string][]
            ).map(([val, label]) => (
              <button
                key={val}
                className={`btn btn-xs ${filter === val ? "btn-secondary" : "btn-ghost"}`}
                onClick={() => setFilter(val)}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            type="text"
            className="input input-bordered input-xs flex-1 min-w-[150px]"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="text-xs text-base-content/50">
            {ledgerRows.length} rows
          </span>
        </div>

        {/* Table */}
        {loading && projections.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="table table-xs table-pin-rows">
              <thead>
                <tr>
                  <th className="w-32">Date</th>
                  <th>Description</th>
                  <th className="text-right w-24">Income</th>
                  <th className="text-right w-24">Expense</th>
                  <th className="text-right w-28">Balance</th>
                </tr>
              </thead>
              <tbody>
                {ledgerRows.map((row, i) => (
                  <tr
                    key={`${row.date}-${row.name}-${i}`}
                    className={
                      row.type === "balance"
                        ? "opacity-40"
                        : row.balance < 0
                          ? "bg-error/5"
                          : ""
                    }
                  >
                    <td className="font-mono text-xs">
                      {i === 0 ||
                      ledgerRows[i - 1].date !== row.date
                        ? formatDate(row.date)
                        : ""}
                    </td>
                    <td>
                      {row.name && (
                        <span className="flex items-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full inline-block ${
                              row.type === "income"
                                ? "bg-success"
                                : "bg-error"
                            }`}
                          />
                          {row.name}
                        </span>
                      )}
                    </td>
                    <td className="text-right font-mono text-success">
                      {row.type === "income"
                        ? formatCurrency(row.amount)
                        : ""}
                    </td>
                    <td className="text-right font-mono text-error">
                      {row.type === "expense"
                        ? formatCurrency(row.amount)
                        : ""}
                    </td>
                    <td
                      className={`text-right font-mono font-semibold ${
                        row.balance >= 0 ? "text-success" : "text-error"
                      }`}
                    >
                      {formatCurrency(row.balance)}
                    </td>
                  </tr>
                ))}
                {ledgerRows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-base-content/50">
                      {search
                        ? "No transactions match your search."
                        : "No data for this period."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
