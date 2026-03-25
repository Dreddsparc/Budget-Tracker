import { useState } from "react";
import type { PlannedExpense } from "../types";
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
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface Props {
  items: PlannedExpense[];
  onRefresh: () => void;
  onToggleOverride: (id: string, active: boolean) => void;
}

export default function ExpenseList({ items, onRefresh, onToggleOverride }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedScheduleId, setExpandedScheduleId] = useState<string | null>(null);

  async function handleAdd(data: Record<string, unknown>) {
    await api.createExpense({
      ...data,
      isVariable: (data.isVariable as boolean) ?? false,
      priceAdjustments: [],
    } as Omit<PlannedExpense, "id">);
    setShowForm(false);
    onRefresh();
  }

  async function handleUpdate(id: string, data: Partial<PlannedExpense>) {
    await api.updateExpense(id, data);
    setEditingId(null);
    onRefresh();
  }

  async function handleDelete(id: string) {
    await api.deleteExpense(id);
    onRefresh();
  }

  async function handleToggle(item: PlannedExpense) {
    await api.toggleExpense(item.id);
    onToggleOverride(item.id, !item.active);
    onRefresh();
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <h2 className="card-title text-error">Expenses</h2>
          <button
            className="btn btn-sm btn-error btn-outline"
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
            }}
          >
            + Add
          </button>
        </div>

        {showForm && !editingId && (
          <EntryForm
            mode="expense"
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
          {items.map((item) =>
            editingId === item.id ? (
              <EntryForm
                key={item.id}
                mode="expense"
                initial={item}
                onSubmit={(data) => handleUpdate(item.id, data)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
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
                      {item.category && (
                        <span className="badge badge-sm badge-outline badge-info">
                          {item.category}
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
                  <PriceSchedule expense={item} onRefresh={onRefresh} />
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
