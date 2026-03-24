import { useState } from "react";
import type { IncomeSource } from "../types";
import * as api from "../api";
import EntryForm from "./EntryForm";

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

interface Props {
  items: IncomeSource[];
  onRefresh: () => void;
  onToggleOverride: (id: string, active: boolean) => void;
}

export default function IncomeList({ items, onRefresh, onToggleOverride }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleAdd(data: Omit<IncomeSource, "id">) {
    await api.createIncome(data);
    setShowForm(false);
    onRefresh();
  }

  async function handleUpdate(id: string, data: Partial<IncomeSource>) {
    await api.updateIncome(id, data);
    setEditingId(null);
    onRefresh();
  }

  async function handleDelete(id: string) {
    await api.deleteIncome(id);
    onRefresh();
  }

  async function handleToggle(item: IncomeSource) {
    await api.toggleIncome(item.id);
    onToggleOverride(item.id, !item.active);
    onRefresh();
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <h2 className="card-title text-success">Income</h2>
          <button
            className="btn btn-sm btn-success btn-outline"
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
            mode="income"
            onSubmit={handleAdd}
            onCancel={() => setShowForm(false)}
          />
        )}

        {items.length === 0 && !showForm && (
          <p className="text-base-content/50 text-sm py-4 text-center">
            No income sources yet. Add one to get started.
          </p>
        )}

        <div className="space-y-2 mt-2">
          {items.map((item) =>
            editingId === item.id ? (
              <EntryForm
                key={item.id}
                mode="income"
                initial={item}
                onSubmit={(data) => handleUpdate(item.id, data)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-3 rounded-lg bg-base-200 ${
                  !item.active ? "opacity-50" : ""
                }`}
              >
                <input
                  type="checkbox"
                  className="toggle toggle-success toggle-sm"
                  checked={item.active}
                  onChange={() => handleToggle(item)}
                  aria-label={`Toggle ${item.name}`}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{item.name}</span>
                    <span className="badge badge-sm badge-ghost">
                      {intervalLabel(item.interval)}
                    </span>
                  </div>
                  <span className="text-success font-semibold text-sm">
                    {formatCurrency(item.amount)}
                  </span>
                </div>

                <div className="flex gap-1">
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
            )
          )}
        </div>
      </div>
    </div>
  );
}
