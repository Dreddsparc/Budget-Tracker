import { useState } from "react";
import type { PlannedExpense } from "../types";
import * as api from "../api";

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

interface Props {
  expense: PlannedExpense;
  onRefresh: () => void;
}

export default function PriceSchedule({ expense, onRefresh }: Props) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAmount, setNewAmount] = useState("");
  const [newDate, setNewDate] = useState(todayString());
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(false);

  const sortedAdjustments = [...expense.priceAdjustments].sort(
    (a, b) => a.startDate.localeCompare(b.startDate)
  );

  async function handleAdd() {
    const parsed = parseFloat(newAmount);
    if (isNaN(parsed) || !newDate) return;

    setLoading(true);
    try {
      const data: { amount: number; startDate: string; note?: string } = {
        amount: parsed,
        startDate: newDate,
      };
      if (newNote.trim()) {
        data.note = newNote.trim();
      }
      await api.addPriceAdjustment(expense.id, data);
      setShowAddForm(false);
      setNewAmount("");
      setNewDate(todayString());
      setNewNote("");
      onRefresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(priceId: string) {
    setLoading(true);
    try {
      await api.deletePriceAdjustment(expense.id, priceId);
      onRefresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 pb-3 pt-1">
      <div className="bg-base-100 rounded-lg p-3 border border-base-300 space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-base-content/70">
          Price Schedule
        </h4>

        <div className="text-sm flex items-center gap-2">
          <span className="font-medium">Base price:</span>
          <span className="text-error font-semibold">
            {formatCurrency(expense.amount)}
          </span>
          <span className="text-base-content/50 text-xs">(from start)</span>
        </div>

        {sortedAdjustments.length > 0 && (
          <>
            <div className="divider my-1" />
            <ul className="space-y-1" role="list" aria-label="Price adjustments">
              {sortedAdjustments.map((adj) => (
                <li
                  key={adj.id}
                  className="flex items-center gap-2 text-sm py-1"
                >
                  <span className="text-base-content/70 min-w-[100px]">
                    {formatDate(adj.startDate)}
                  </span>
                  <span className="text-error font-semibold min-w-[70px]">
                    {formatCurrency(adj.amount)}
                  </span>
                  {adj.note && (
                    <span className="text-base-content/50 text-xs italic truncate">
                      &ldquo;{adj.note}&rdquo;
                    </span>
                  )}
                  <button
                    className="btn btn-ghost btn-xs ml-auto text-error"
                    onClick={() => handleDelete(adj.id)}
                    disabled={loading}
                    aria-label={`Remove price change on ${formatDate(adj.startDate)}`}
                  >
                    x
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {sortedAdjustments.length > 0 && showAddForm && (
          <div className="divider my-1" />
        )}

        {!showAddForm ? (
          <button
            className="btn btn-xs btn-outline btn-warning mt-1"
            onClick={() => setShowAddForm(true)}
          >
            + Add price change
          </button>
        ) : (
          <div className="bg-base-200 rounded-lg p-3 space-y-2">
            <p className="text-xs font-medium text-base-content/70">
              Add price change
            </p>
            <div className="flex flex-wrap items-end gap-2">
              <label className="form-control">
                <span className="label-text text-xs">From</span>
                <input
                  type="date"
                  className="input input-bordered input-xs w-36"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  required
                />
              </label>
              <label className="form-control">
                <span className="label-text text-xs">Amount ($)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input input-bordered input-xs w-24"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </label>
              <label className="form-control">
                <span className="label-text text-xs">Note (optional)</span>
                <input
                  type="text"
                  className="input input-bordered input-xs w-40"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="reason for change"
                />
              </label>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                className="btn btn-xs btn-warning"
                onClick={handleAdd}
                disabled={loading || !newAmount || !newDate}
              >
                Save
              </button>
              <button
                className="btn btn-xs btn-ghost"
                onClick={() => {
                  setShowAddForm(false);
                  setNewAmount("");
                  setNewNote("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
