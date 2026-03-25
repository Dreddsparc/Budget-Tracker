import { useState, useMemo } from "react";
import type { DateRange } from "../types";

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const PRESETS = [
  { days: 30, label: "30d" },
  { days: 60, label: "60d" },
  { days: 90, label: "90d" },
  { days: 180, label: "6mo" },
  { days: 365, label: "1yr" },
];

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function monthStart(dateStr: string): string {
  return dateStr.slice(0, 7) + "-01";
}

function monthEnd(year: number, month: number): string {
  const d = new Date(year, month + 1, 0);
  return d.toISOString().split("T")[0];
}

function formatRangeLabel(range: DateRange): string {
  if (range.kind === "preset") return "";
  const s = new Date(range.startDate + "T00:00:00");
  const e = new Date(range.endDate + "T00:00:00");
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${fmt(s)} — ${fmt(e)}`;
}

function getMonthOptions(): { label: string; startDate: string; endDate: string }[] {
  const today = new Date();
  const options: { label: string; startDate: string; endDate: string }[] = [];

  // 3 months back + current + 12 months forward
  for (let offset = -3; offset <= 12; offset++) {
    const d = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const endDate = monthEnd(year, month);
    options.push({ label, startDate, endDate });
  }

  return options;
}

export default function DateRangeBar({ value, onChange }: Props) {
  const [showCustom, setShowCustom] = useState(value.kind === "custom");
  const [customStart, setCustomStart] = useState(
    value.kind === "custom" ? value.startDate : todayStr()
  );
  const [customEnd, setCustomEnd] = useState(
    value.kind === "custom" ? value.endDate : addDays(todayStr(), 90)
  );

  const monthOptions = useMemo(getMonthOptions, []);

  function handlePreset(days: number) {
    setShowCustom(false);
    onChange({ kind: "preset", days });
  }

  function handleCustomApply() {
    if (customStart && customEnd && customStart <= customEnd) {
      onChange({ kind: "custom", startDate: customStart, endDate: customEnd });
    }
  }

  function handleMonthSelect(startDate: string, endDate: string) {
    setCustomStart(startDate);
    setCustomEnd(endDate);
    onChange({ kind: "custom", startDate, endDate });
  }

  function handleMultiMonth(count: number) {
    const start = monthStart(customStart || todayStr());
    const d = new Date(start + "T00:00:00");
    d.setMonth(d.getMonth() + count);
    d.setDate(d.getDate() - 1);
    const end = d.toISOString().split("T")[0];
    setCustomStart(start);
    setCustomEnd(end);
    onChange({ kind: "custom", startDate: start, endDate: end });
  }

  const isPreset = value.kind === "preset";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* Preset buttons */}
        <div className="flex gap-1">
          {PRESETS.map((p) => (
            <button
              key={p.days}
              className={`btn btn-xs ${
                isPreset && value.days === p.days ? "btn-primary" : "btn-ghost"
              }`}
              onClick={() => handlePreset(p.days)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="divider divider-horizontal mx-0 h-6" />

        {/* Custom toggle */}
        <button
          className={`btn btn-xs ${showCustom ? "btn-accent" : "btn-ghost"}`}
          onClick={() => {
            setShowCustom(!showCustom);
            if (!showCustom && value.kind === "preset") {
              // Initialize custom dates from current preset
              const start = todayStr();
              const end = addDays(start, value.days);
              setCustomStart(start);
              setCustomEnd(end);
            }
          }}
        >
          Custom
        </button>

        {/* Range label when custom is active */}
        {value.kind === "custom" && !showCustom && (
          <span className="text-xs text-base-content/70">
            {formatRangeLabel(value)}
          </span>
        )}
      </div>

      {/* Custom date picker row */}
      {showCustom && (
        <div className="flex flex-wrap items-end gap-2 p-3 bg-base-200 rounded-lg">
          {/* Quick month picker */}
          <div className="form-control">
            <label className="label py-0">
              <span className="label-text text-xs">Month</span>
            </label>
            <select
              className="select select-bordered select-xs"
              value=""
              onChange={(e) => {
                const opt = monthOptions[parseInt(e.target.value)];
                if (opt) handleMonthSelect(opt.startDate, opt.endDate);
              }}
            >
              <option value="" disabled>
                Pick a month...
              </option>
              {monthOptions.map((opt, i) => (
                <option key={opt.startDate} value={i}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Multi-month spans */}
          <div className="flex gap-1 items-end pb-0.5">
            {[2, 3, 6].map((n) => (
              <button
                key={n}
                className="btn btn-xs btn-ghost"
                onClick={() => handleMultiMonth(n)}
              >
                {n}mo
              </button>
            ))}
          </div>

          <div className="divider divider-horizontal mx-0 h-8" />

          {/* Manual date inputs */}
          <div className="form-control">
            <label className="label py-0">
              <span className="label-text text-xs">From</span>
            </label>
            <input
              type="date"
              className="input input-bordered input-xs"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
            />
          </div>
          <div className="form-control">
            <label className="label py-0">
              <span className="label-text text-xs">To</span>
            </label>
            <input
              type="date"
              className="input input-bordered input-xs"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
            />
          </div>
          <button
            className="btn btn-xs btn-primary"
            onClick={handleCustomApply}
            disabled={!customStart || !customEnd || customStart > customEnd}
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
