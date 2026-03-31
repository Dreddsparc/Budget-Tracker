import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import type { ProjectionDay, ChartFullscreenOptions } from "../types";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

interface MonthFlow {
  month: string;
  net: number;
  income: number;
  expenses: number;
}

interface Props {
  projections: ProjectionDay[];
  options?: ChartFullscreenOptions;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { payload: MonthFlow }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;

  return (
    <div className="bg-base-300 border border-base-content/20 rounded-lg p-3 shadow-lg text-sm">
      <p className="font-semibold mb-2">{label}</p>
      <p className="text-success">Income: {formatCurrency(d.income)}</p>
      <p className="text-error">Expenses: {formatCurrency(d.expenses)}</p>
      <div className="divider my-1" />
      <p className={`font-bold text-base ${d.net >= 0 ? "text-success" : "text-error"}`}>
        {d.net >= 0 ? "Surplus" : "Deficit"}: {formatCurrency(d.net)}
      </p>
    </div>
  );
}

export default function CashFlowChart({ projections, options }: Props) {
  const data = useMemo(() => {
    const months = new Map<string, { income: number; expenses: number }>();

    for (const day of projections) {
      const d = new Date(day.date + "T00:00:00");
      const key = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });

      if (!months.has(key)) months.set(key, { income: 0, expenses: 0 });
      const m = months.get(key)!;

      for (const event of day.events) {
        if (event.type === "income") m.income += event.amount;
        else if (!event.isTransfer) m.expenses += event.amount;
      }
    }

    return [...months.entries()].map(([month, vals]): MonthFlow => ({
      month,
      income: Math.round(vals.income * 100) / 100,
      expenses: Math.round(vals.expenses * 100) / 100,
      net: Math.round((vals.income - vals.expenses) * 100) / 100,
    }));
  }, [projections]);

  if (data.length === 0) {
    const empty = (
      <div className="items-center justify-center h-[430px] flex">
        <p className="text-base-content/50">No data in this date range</p>
      </div>
    );
    return options ? empty : <div className="card bg-base-100 shadow-xl"><div className="card-body">{empty}</div></div>;
  }

  const cumulativeData = useMemo(() => {
    let running = 0;
    return data.map((d) => {
      running += d.net;
      return { ...d, cumulative: Math.round(running * 100) / 100 };
    });
  }, [data]);

  const chart = (
    <ResponsiveContainer width="100%" height={options?.height ?? 370}>
      <BarChart data={cumulativeData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        {(options?.showGrid !== false) && (
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        )}
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} width={80} />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={0} stroke="rgba(255,255,255,0.3)" strokeDasharray="3 3" />
        <Bar dataKey="net" name="Net Cash Flow" radius={[4, 4, 0, 0]}>
          {cumulativeData.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.net >= 0 ? "#36d399" : "#f87272"}
              fillOpacity={0.85}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  if (options) return chart;

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex items-baseline justify-between">
          <h2 className="card-title">Monthly Cash Flow</h2>
          <span className="text-sm text-base-content/60">
            Net over period:{" "}
            <span className={cumulativeData[cumulativeData.length - 1]?.cumulative >= 0 ? "text-success" : "text-error"}>
              {formatCurrency(cumulativeData[cumulativeData.length - 1]?.cumulative || 0)}
            </span>
          </span>
        </div>
        {chart}
      </div>
    </div>
  );
}
