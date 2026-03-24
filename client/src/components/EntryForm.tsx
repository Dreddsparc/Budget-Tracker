import { useState, useEffect } from "react";
import { Interval } from "../types";

interface EntryFormData {
  name: string;
  amount: number;
  interval: Interval;
  startDate: string;
  endDate?: string;
  category?: string;
  active: boolean;
}

interface Props {
  mode: "income" | "expense";
  initial?: Partial<EntryFormData>;
  onSubmit: (data: EntryFormData) => void;
  onCancel: () => void;
}

const INTERVAL_OPTIONS: { value: Interval; label: string }[] = [
  { value: Interval.ONE_TIME, label: "One Time" },
  { value: Interval.DAILY, label: "Daily" },
  { value: Interval.WEEKLY, label: "Weekly" },
  { value: Interval.BIWEEKLY, label: "Biweekly" },
  { value: Interval.MONTHLY, label: "Monthly" },
  { value: Interval.QUARTERLY, label: "Quarterly" },
  { value: Interval.YEARLY, label: "Yearly" },
];

function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

export default function EntryForm({ mode, initial, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? "");
  const [interval, setInterval] = useState<Interval>(
    initial?.interval ?? Interval.MONTHLY
  );
  const [startDate, setStartDate] = useState(initial?.startDate ?? todayString());
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");

  useEffect(() => {
    if (initial) {
      setName(initial.name ?? "");
      setAmount(initial.amount?.toString() ?? "");
      setInterval(initial.interval ?? Interval.MONTHLY);
      setStartDate(initial.startDate ?? todayString());
      setEndDate(initial.endDate ?? "");
      setCategory(initial.category ?? "");
    }
  }, [initial]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!name.trim() || isNaN(parsed)) return;

    const data: EntryFormData = {
      name: name.trim(),
      amount: parsed,
      interval,
      startDate,
      active: initial?.active ?? true,
    };

    if (mode === "expense") {
      if (endDate) data.endDate = endDate;
      if (category.trim()) data.category = category.trim();
    }

    onSubmit(data);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-base-200 rounded-lg">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Name</span>
        </label>
        <input
          type="text"
          className="input input-bordered input-sm w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={mode === "income" ? "Salary" : "Rent"}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="form-control">
          <label className="label">
            <span className="label-text">Amount ($)</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="input input-bordered input-sm w-full"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Interval</span>
          </label>
          <select
            className="select select-bordered select-sm w-full"
            value={interval}
            onChange={(e) => setInterval(e.target.value as Interval)}
          >
            {INTERVAL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={`grid gap-3 ${mode === "expense" ? "grid-cols-2" : "grid-cols-1"}`}>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Start Date</span>
          </label>
          <input
            type="date"
            className="input input-bordered input-sm w-full"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>

        {mode === "expense" && (
          <div className="form-control">
            <label className="label">
              <span className="label-text">End Date (optional)</span>
            </label>
            <input
              type="date"
              className="input input-bordered input-sm w-full"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        )}
      </div>

      {mode === "expense" && (
        <div className="form-control">
          <label className="label">
            <span className="label-text">Category (optional)</span>
          </label>
          <input
            type="text"
            className="input input-bordered input-sm w-full"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Housing, Food, Transport..."
          />
        </div>
      )}

      <div className="flex gap-2 justify-end pt-2">
        <button type="button" className="btn btn-sm btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-sm btn-primary">
          {initial?.name ? "Update" : "Add"}
        </button>
      </div>
    </form>
  );
}
