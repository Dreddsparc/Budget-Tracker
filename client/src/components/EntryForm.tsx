import { useState, useEffect, useRef } from "react";
import { Interval } from "../types";
import type { Account, CategoryColor } from "../types";

interface EntryFormData {
  name: string;
  amount: number;
  interval: Interval;
  startDate: string;
  endDate?: string;
  category?: string;
  active: boolean;
  isVariable?: boolean;
  isTransfer?: boolean;
  transferToAccountId?: string;
}

interface Props {
  mode: "income" | "expense";
  initial?: Partial<EntryFormData>;
  accounts?: Account[];
  categories?: CategoryColor[];
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

function toDateInput(value?: string): string {
  if (!value) return "";
  return value.split("T")[0];
}

function CategoryComboBox({
  value,
  onChange,
  categories,
}: {
  value: string;
  onChange: (val: string) => void;
  categories: CategoryColor[];
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = categories.filter(
    (c) => c.name.toLowerCase().includes((filter || value).toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFilter("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="form-control" ref={wrapperRef}>
      <label className="label">
        <span className="label-text">Category (optional)</span>
      </label>
      <div className="relative">
        <input
          type="text"
          className="input input-bordered input-sm w-full"
          value={open ? filter : value}
          onChange={(e) => {
            const v = e.target.value;
            if (open) {
              setFilter(v);
            }
            onChange(v);
          }}
          onFocus={() => {
            setOpen(true);
            setFilter(value);
          }}
          placeholder="Type or select a category..."
        />
        {open && filtered.length > 0 && (
          <ul className="absolute z-20 top-full left-0 right-0 mt-1 bg-base-300 border border-base-content/20 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filtered.map((cat) => (
              <li key={cat.name}>
                <button
                  type="button"
                  className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm hover:bg-base-200 transition-colors"
                  onClick={() => {
                    onChange(cat.name);
                    setOpen(false);
                    setFilter("");
                  }}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-medium">{cat.name}</span>
                  {cat.description && (
                    <span className="text-xs text-base-content/50 truncate">
                      {cat.description}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function EntryForm({ mode, initial, accounts, categories, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? "");
  const [interval, setInterval] = useState<Interval>(
    initial?.interval ?? Interval.MONTHLY
  );
  const [startDate, setStartDate] = useState(toDateInput(initial?.startDate) || todayString());
  const [endDate, setEndDate] = useState(toDateInput(initial?.endDate));
  const [category, setCategory] = useState(initial?.category ?? "");
  const [isVariable, setIsVariable] = useState(initial?.isVariable ?? false);
  const [isTransfer, setIsTransfer] = useState(initial?.isTransfer ?? false);
  const [transferToAccountId, setTransferToAccountId] = useState(initial?.transferToAccountId ?? "");

  useEffect(() => {
    if (initial) {
      setName(initial.name ?? "");
      setAmount(initial.amount?.toString() ?? "");
      setInterval(initial.interval ?? Interval.MONTHLY);
      setStartDate(toDateInput(initial.startDate) || todayString());
      setEndDate(toDateInput(initial.endDate));
      setCategory(initial.category ?? "");
      setIsVariable(initial.isVariable ?? false);
      setIsTransfer(initial.isTransfer ?? false);
      setTransferToAccountId(initial.transferToAccountId ?? "");
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
      data.isVariable = isVariable;
      data.isTransfer = isTransfer;
      if (isTransfer && transferToAccountId) {
        data.transferToAccountId = transferToAccountId;
      }
    }

    onSubmit(data);
  }

  const hasOtherAccounts = accounts && accounts.length > 0;

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
          <label className="label cursor-pointer justify-start gap-3">
            <input
              type="checkbox"
              className="toggle toggle-sm toggle-warning"
              checked={isVariable}
              onChange={(e) => setIsVariable(e.target.checked)}
              aria-label="Variable price"
            />
            <span className="label-text">Variable price</span>
          </label>
          {isVariable && (
            <p className="text-xs text-base-content/60 ml-1 -mt-1">
              You can add price changes after saving.
            </p>
          )}
        </div>
      )}

      {mode === "expense" && hasOtherAccounts && (
        <div className="form-control">
          <label className="label cursor-pointer justify-start gap-3">
            <input
              type="checkbox"
              className="toggle toggle-sm toggle-info"
              checked={isTransfer}
              onChange={(e) => {
                setIsTransfer(e.target.checked);
                if (!e.target.checked) setTransferToAccountId("");
              }}
              aria-label="Transfer to another account"
            />
            <span className="label-text">Transfer to another account</span>
          </label>
          {isTransfer && (
            <select
              className="select select-bordered select-sm w-full mt-2"
              value={transferToAccountId}
              onChange={(e) => setTransferToAccountId(e.target.value)}
            >
              <option value="">Select target account...</option>
              {accounts!.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {mode === "expense" && !isTransfer && (
        <CategoryComboBox
          value={category}
          onChange={setCategory}
          categories={categories || []}
        />
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
