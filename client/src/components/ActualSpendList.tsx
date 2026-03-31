import { useState, useMemo } from "react";
import type { ActualSpend, PlannedExpense, CategoryColor } from "../types";
import * as api from "../api";

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

function formatDate(dateStr: string): string {
  const dateOnly = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const d = new Date(dateOnly + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

interface Props {
  accountId: string;
  items: ActualSpend[];
  expenses: PlannedExpense[];
  categories: CategoryColor[];
  onRefresh: () => void;
  onHelp?: () => void;
}

export default function ActualSpendList({
  accountId,
  items,
  expenses,
  categories,
  onRefresh,
  onHelp,
}: Props) {
  const [collapsed, setCollapsed] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formDate, setFormDate] = useState(todayString());
  const [formAmount, setFormAmount] = useState("");
  const [formNote, setFormNote] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formForecastId, setFormForecastId] = useState("");

  const activeExpenses = expenses.filter((e) => e.active && !e.isTransfer);

  const grouped = useMemo(() => {
    const map = new Map<string, ActualSpend[]>();
    for (const item of items) {
      const dateOnly = item.date.includes("T") ? item.date.split("T")[0] : item.date;
      const list = map.get(dateOnly);
      if (list) list.push(item);
      else map.set(dateOnly, [item]);
    }
    return [...map.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [items]);

  const totalAmount = items.reduce((s, i) => s + i.amount, 0);

  function resetForm() {
    setFormDate(todayString());
    setFormAmount("");
    setFormNote("");
    setFormCategory("");
    setFormForecastId("");
  }

  function startEdit(item: ActualSpend) {
    setEditingId(item.id);
    const dateOnly = item.date.includes("T") ? item.date.split("T")[0] : item.date;
    setFormDate(dateOnly);
    setFormAmount(item.amount.toString());
    setFormNote(item.note || "");
    setFormCategory(item.category || "");
    setFormForecastId(item.forecastExpenseId || "");
    setShowForm(false);
  }

  async function handleAdd() {
    const parsed = parseFloat(formAmount);
    if (isNaN(parsed) || !formDate) return;

    await api.createActual(accountId, {
      date: formDate,
      amount: parsed,
      note: formNote.trim() || undefined,
      category: formCategory.trim() || undefined,
      forecastExpenseId: formForecastId || undefined,
    });
    setShowForm(false);
    resetForm();
    onRefresh();
  }

  async function handleUpdate() {
    if (!editingId) return;
    const parsed = parseFloat(formAmount);
    if (isNaN(parsed) || !formDate) return;

    await api.updateActual(accountId, editingId, {
      date: formDate,
      amount: parsed,
      note: formNote.trim() || undefined,
      category: formCategory.trim() || undefined,
      forecastExpenseId: formForecastId || undefined,
    });
    setEditingId(null);
    resetForm();
    onRefresh();
  }

  async function handleDelete(id: string) {
    await api.deleteActual(accountId, id);
    onRefresh();
  }

  function handleForecastChange(forecastId: string) {
    setFormForecastId(forecastId);
    if (forecastId) {
      const expense = expenses.find((e) => e.id === forecastId);
      if (expense?.category) {
        setFormCategory(expense.category);
      }
    }
  }

  function renderForm(isEdit: boolean) {
    return (
      <div className="space-y-3 p-4 bg-base-200 rounded-lg">
        <div className="grid grid-cols-2 gap-3">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Date</span>
            </label>
            <input
              type="date"
              className="input input-bordered input-sm w-full"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              required
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Amount ($)</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input input-bordered input-sm w-full"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Linked Forecast (optional)</span>
          </label>
          <select
            className="select select-bordered select-sm w-full"
            value={formForecastId}
            onChange={(e) => handleForecastChange(e.target.value)}
          >
            <option value="">None (unlinked)</option>
            {activeExpenses.map((exp) => (
              <option key={exp.id} value={exp.id}>
                {exp.name} ({exp.interval.toLowerCase()}, {formatCurrency(exp.amount)})
              </option>
            ))}
          </select>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Note (optional)</span>
          </label>
          <input
            type="text"
            className="input input-bordered input-sm w-full"
            value={formNote}
            onChange={(e) => setFormNote(e.target.value)}
            placeholder="What was this for?"
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Category</span>
          </label>
          <input
            type="text"
            className="input input-bordered input-sm w-full"
            value={formCategory}
            onChange={(e) => setFormCategory(e.target.value)}
            placeholder={formForecastId ? "Inherited from forecast" : "Category..."}
          />
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => {
              if (isEdit) setEditingId(null);
              else setShowForm(false);
              resetForm();
            }}
          >
            Cancel
          </button>
          <button
            className="btn btn-sm btn-warning"
            onClick={isEdit ? handleUpdate : handleAdd}
            disabled={!formAmount || !formDate}
          >
            {isEdit ? "Update" : "Add"}
          </button>
        </div>
      </div>
    );
  }

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
              {collapsed ? ">" : "v"}
            </span>
            <h2 className="card-title text-warning">Actual Spending</h2>
            {collapsed && (
              <span className="text-warning font-semibold text-sm ml-1">
                {items.length} entries, {formatCurrency(totalAmount)}
              </span>
            )}
          </button>
          <div className="flex items-center gap-1">
            {onHelp && (
              <button className="btn btn-ghost btn-xs btn-circle opacity-40 hover:opacity-100" onClick={onHelp} aria-label="Help" title="Help">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/></svg>
              </button>
            )}
          {!collapsed && (
            <button
              className="btn btn-sm btn-warning btn-outline"
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                resetForm();
              }}
            >
              + Add
            </button>
          )}
          </div>
        </div>

        {collapsed ? null : (
          <>
            {showForm && !editingId && renderForm(false)}

            {items.length === 0 && !showForm && (
              <p className="text-base-content/50 text-sm py-4 text-center">
                No actual spending recorded yet. Add entries as expenses hit your account.
              </p>
            )}

            <div className="space-y-3 mt-2">
              {grouped.map(([dateStr, dayItems]) => (
                <div key={dateStr} className="rounded-lg border border-warning/20 overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-2 bg-warning/10">
                    <span className="font-semibold text-sm">{formatDate(dateStr)}</span>
                    <span className="text-warning font-semibold text-sm ml-auto">
                      {formatCurrency(dayItems.reduce((s, i) => s + i.amount, 0))}
                    </span>
                  </div>
                  <div className="space-y-1 p-2">
                    {dayItems.map((item) =>
                      editingId === item.id ? (
                        <div key={item.id}>{renderForm(true)}</div>
                      ) : (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-2 rounded-lg bg-base-200"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm truncate">
                                {item.note || (item.forecastExpense?.name ?? "Actual spend")}
                              </span>
                              {item.forecastExpense && (
                                <span className="badge badge-sm badge-outline badge-warning">
                                  {item.forecastExpense.name}
                                </span>
                              )}
                              {item.category && (
                                <span className="badge badge-sm badge-ghost">
                                  {item.category}
                                </span>
                              )}
                            </div>
                            <span className="text-warning font-semibold text-sm">
                              {formatCurrency(item.amount)}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <button
                              className="btn btn-ghost btn-xs"
                              onClick={() => startEdit(item)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-ghost btn-xs text-error"
                              onClick={() => handleDelete(item.id)}
                            >
                              Del
                            </button>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
