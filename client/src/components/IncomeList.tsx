import { useState, useMemo } from "react";
import type { IncomeSource, IncomingTransfer } from "../types";
import { calcMonthlyTotal } from "../monthlyTotal";
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
  accountId: string;
  items: IncomeSource[];
  incomingTransfers: IncomingTransfer[];
  onRefresh: () => void;
  onToggleOverride: (id: string, active: boolean) => void;
  onHelp?: () => void;
}

export default function IncomeList({ accountId, items, incomingTransfers, onRefresh, onToggleOverride, onHelp }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Group transfers by source account
  const transferGroups = useMemo(() => {
    const groups = new Map<string, IncomingTransfer[]>();
    for (const t of incomingTransfers) {
      const key = `Transfer from ${t.sourceAccountName}`;
      const list = groups.get(key);
      if (list) {
        list.push(t);
      } else {
        groups.set(key, [t]);
      }
    }
    return [...groups.entries()];
  }, [incomingTransfers]);

  async function handleAdd(data: Omit<IncomeSource, "id">) {
    await api.createIncome(accountId, data);
    setShowForm(false);
    onRefresh();
  }

  async function handleUpdate(id: string, data: Partial<IncomeSource>) {
    await api.updateIncome(accountId, id, data);
    setEditingId(null);
    onRefresh();
  }

  async function handleDelete(id: string) {
    await api.deleteIncome(accountId, id);
    onRefresh();
  }

  async function handleToggle(item: IncomeSource) {
    await api.toggleIncome(accountId, item.id);
    onToggleOverride(item.id, !item.active);
    onRefresh();
  }

  const monthlyTotal = calcMonthlyTotal([
    ...items,
    ...incomingTransfers,
  ]);

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
            <h2 className="card-title text-success">Forecast Income</h2>
            {collapsed && (
              <span className="text-success font-semibold text-sm ml-1">
                {formatCurrency(monthlyTotal)} this month
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
              className="btn btn-sm btn-success btn-outline"
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
              }}
            >
              + Add
            </button>
          )}
          </div>
        </div>

        {collapsed ? null : (
          <>
        {showForm && !editingId && (
          <EntryForm
            mode="income"
            onSubmit={handleAdd}
            onCancel={() => setShowForm(false)}
          />
        )}

        {items.length === 0 && incomingTransfers.length === 0 && !showForm && (
          <p className="text-base-content/50 text-sm py-4 text-center">
            No income sources yet. Add one to get started.
          </p>
        )}

        <div className="space-y-2 mt-2">
          {/* Regular income items */}
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

          {/* Incoming transfers grouped by source account */}
          {transferGroups.map(([groupName, transfers]) => (
            <div key={groupName} className="rounded-lg border border-info/30 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-2 bg-info/10">
                <span className="badge badge-sm badge-info">Transfer</span>
                <span className="font-semibold text-sm flex-1">{groupName}</span>
                <span className="text-success font-semibold text-sm">
                  {formatCurrency(transfers.filter((t) => t.active).reduce((s, t) => s + t.amount, 0))}
                </span>
              </div>
              <div className="space-y-1 p-2">
                {transfers.map((t) => (
                  <div
                    key={t.id}
                    className={`flex items-center gap-3 p-2 rounded-lg bg-base-200 ${
                      !t.active ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate text-sm">{t.name}</span>
                        <span className="badge badge-sm badge-ghost">
                          {intervalLabel(t.interval)}
                        </span>
                      </div>
                      <span className="text-success font-semibold text-sm">
                        {formatCurrency(t.amount)}
                      </span>
                    </div>
                    <span className="text-xs text-base-content/50">
                      read-only
                    </span>
                  </div>
                ))}
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
