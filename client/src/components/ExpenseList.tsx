import { useState, useMemo } from "react";
import type { Account, CategoryColor, PlannedExpense } from "../types";
import { calcMonthlyTotal } from "../monthlyTotal";
import * as api from "../api";
import EntryForm from "./EntryForm";
import PriceSchedule from "./PriceSchedule";

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

function intervalLabel(interval: string): string {
  return interval.replace("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

function formatDate(dateStr: string): string {
  const dateOnly = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const d = new Date(dateOnly + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const UNCATEGORIZED = "Uncategorized";

const CATEGORY_PALETTE = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f43f5e",
];

function hashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CATEGORY_PALETTE[Math.abs(hash) % CATEGORY_PALETTE.length];
}

interface Props {
  accountId: string;
  accounts: Account[];
  categories: CategoryColor[];
  items: PlannedExpense[];
  onRefresh: () => void;
  onToggleOverride: (id: string, active: boolean) => void;
  categoryColors: Record<string, string>;
  onCategoryColorChange: (name: string, color: string) => void;
  onManageCategories: () => void;
  onHelp?: () => void;
}

export default function ExpenseList({
  accountId,
  accounts,
  categories,
  items,
  onRefresh,
  onToggleOverride,
  categoryColors,
  onCategoryColorChange,
  onManageCategories,
  onHelp,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedScheduleId, setExpandedScheduleId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const grouped = useMemo(() => {
    const map = new Map<string, PlannedExpense[]>();
    for (const item of items) {
      let key: string;
      if (item.isTransfer && item.transferToAccountId) {
        const target = accounts.find((a) => a.id === item.transferToAccountId);
        key = `Transfer To ${target?.name || "Unknown"}`;
      } else {
        key = item.category?.trim() || UNCATEGORIZED;
      }
      const list = map.get(key);
      if (list) {
        list.push(item);
      } else {
        map.set(key, [item]);
      }
    }
    // Sort category names alphabetically, but keep Uncategorized last
    const sorted = [...map.entries()].sort(([a], [b]) => {
      if (a === UNCATEGORIZED) return 1;
      if (b === UNCATEGORIZED) return -1;
      return a.localeCompare(b);
    });
    return sorted;
  }, [items]);

  function toggleCategory(category: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }

  const otherAccounts = accounts.filter((a) => a.id !== accountId);

  async function handleAdd(data: Record<string, unknown>) {
    await api.createExpense(accountId, {
      ...data,
      isVariable: (data.isVariable as boolean) ?? false,
      isTransfer: (data.isTransfer as boolean) ?? false,
      transferToAccountId: (data.transferToAccountId as string) || undefined,
      priceAdjustments: [],
    } as Omit<PlannedExpense, "id">);
    setShowForm(false);
    onRefresh();
  }

  async function handleUpdate(id: string, data: Partial<PlannedExpense>) {
    await api.updateExpense(accountId, id, data);
    setEditingId(null);
    onRefresh();
  }

  async function handleDelete(id: string) {
    await api.deleteExpense(accountId, id);
    onRefresh();
  }

  async function handleToggle(item: PlannedExpense) {
    await api.toggleExpense(accountId, item.id);
    onToggleOverride(item.id, !item.active);
    onRefresh();
  }

  function renderExpenseItem(item: PlannedExpense) {
    if (editingId === item.id) {
      return (
        <EntryForm
          key={item.id}
          mode="expense"
          initial={item}
          accounts={otherAccounts}
          categories={categories}
          onSubmit={(data) => handleUpdate(item.id, data)}
          onCancel={() => setEditingId(null)}
        />
      );
    }

    return (
      <div key={item.id} className="rounded-lg bg-base-200 overflow-hidden">
        <div
          className={`flex items-center gap-3 p-3 ${
            !item.active ? "opacity-50" : ""
          }`}
        >
          <input
            type="checkbox"
            className="toggle toggle-error toggle-sm"
            checked={item.active}
            onChange={() => handleToggle(item)}
            aria-label={`Toggle ${item.name}`}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium truncate">{item.name}</span>
              <span className="badge badge-sm badge-ghost">
                {intervalLabel(item.interval)}
              </span>
              {item.isVariable && (
                <span className="badge badge-sm badge-warning">
                  Variable
                </span>
              )}
              {item.isTransfer && (
                <span className="badge badge-sm badge-info">
                  Transfer{item.transferToAccountId && (() => {
                    const target = accounts.find((a) => a.id === item.transferToAccountId);
                    return target ? ` → ${target.name}` : "";
                  })()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-error font-semibold">
                {formatCurrency(item.amount)}
              </span>
              {item.endDate && (
                <span className="text-base-content/50 text-xs">
                  ends {formatDate(item.endDate)}
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-1">
            {item.isVariable && (
              <button
                className="btn btn-ghost btn-xs"
                onClick={() =>
                  setExpandedScheduleId(
                    expandedScheduleId === item.id ? null : item.id
                  )
                }
                aria-label={`${expandedScheduleId === item.id ? "Hide" : "Show"} price schedule for ${item.name}`}
                aria-expanded={expandedScheduleId === item.id}
              >
                {expandedScheduleId === item.id ? "▾ Prices" : "▸ Prices"}
              </button>
            )}
            <button
              className="btn btn-ghost btn-xs"
              onClick={() => {
                setEditingId(item.id);
                setShowForm(false);
              }}
              aria-label={`Edit ${item.name}`}
            >
              Edit
            </button>
            <button
              className="btn btn-ghost btn-xs text-error"
              onClick={() => handleDelete(item.id)}
              aria-label={`Delete ${item.name}`}
            >
              Del
            </button>
          </div>
        </div>

        {item.isVariable && expandedScheduleId === item.id && (
          <PriceSchedule accountId={accountId} expense={item} onRefresh={onRefresh} />
        )}
      </div>
    );
  }

  const monthlyTotal = calcMonthlyTotal(items);

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <button
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setCollapsed(!collapsed)}
            aria-expanded={!collapsed}
          >
            <span className="text-base-content/60 text-sm">
              {collapsed ? "▸" : "▾"}
            </span>
            <h2 className="card-title text-error">Forecast Expenses</h2>
            {collapsed && (
              <span className="text-error font-semibold text-sm ml-1">
                {formatCurrency(monthlyTotal)} this month
              </span>
            )}
          </button>
          <div className="flex gap-1 items-center">
            {onHelp && (
              <button className="btn btn-ghost btn-xs btn-circle opacity-40 hover:opacity-100" onClick={onHelp} aria-label="Help" title="Help">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/></svg>
              </button>
            )}
          {!collapsed && (
            <>
              <button
                className="btn btn-sm btn-ghost btn-xs"
                onClick={onManageCategories}
              >
                Categories
              </button>
              <button
                className="btn btn-sm btn-error btn-outline"
                onClick={() => {
                  setShowForm(true);
                  setEditingId(null);
                }}
              >
                + Add
              </button>
            </>
          )}
          </div>
        </div>

        {collapsed ? null : (
          <>
        {showForm && !editingId && (
          <EntryForm
            mode="expense"
            accounts={otherAccounts}
            categories={categories}
            onSubmit={handleAdd}
            onCancel={() => setShowForm(false)}
          />
        )}

        {items.length === 0 && !showForm && (
          <p className="text-base-content/50 text-sm py-4 text-center">
            No expenses yet. Add one to start tracking.
          </p>
        )}

        <div className="space-y-2 mt-2">
          {grouped.map(([category, categoryItems]) => {
            const isOpen = expandedCategories.has(category);
            const activeCount = categoryItems.filter((i) => i.active).length;
            const totalAmount = categoryItems
              .filter((i) => i.active)
              .reduce((sum, i) => sum + i.amount, 0);

            const effectiveColor = categoryColors[category] || hashColor(category);

            return (
              <div key={category} className="rounded-lg border border-base-300 overflow-hidden">
                <div className="flex items-center bg-base-200 hover:bg-base-300 transition-colors">
                  <button
                    className="flex-1 flex items-center gap-3 px-4 py-3 cursor-pointer"
                    onClick={() => toggleCategory(category)}
                    aria-expanded={isOpen}
                    aria-controls={`category-${category}`}
                  >
                    <span className="text-base-content/60 text-sm">
                      {isOpen ? "▾" : "▸"}
                    </span>
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: effectiveColor }}
                    />
                    <span className="font-semibold text-sm flex-1 text-left">
                      {category}
                    </span>
                    <span className="badge badge-sm badge-ghost">
                      {activeCount}/{categoryItems.length}
                    </span>
                    <span className="text-error font-semibold text-sm">
                      {formatCurrency(totalAmount)}
                    </span>
                  </button>
                  <label className="relative pr-3 cursor-pointer" aria-label={`Pick color for ${category}`}>
                    <input
                      type="color"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      value={effectiveColor}
                      onChange={(e) => onCategoryColorChange(category, e.target.value)}
                    />
                    <span
                      className="block w-5 h-5 rounded-full border-2 border-base-content/20"
                      style={{ backgroundColor: effectiveColor }}
                    />
                  </label>
                </div>

                {isOpen && (
                  <div
                    id={`category-${category}`}
                    className="space-y-2 p-2"
                  >
                    {categoryItems.map(renderExpenseItem)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
          </>
        )}
      </div>
    </div>
  );
}
