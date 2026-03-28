import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { ProjectionDay } from "../types";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

interface MonthData {
  month: string;
  income: number;
  expenses: number;
}

interface Props {
  projections: ProjectionDay[];
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const inc = payload.find((p) => p.name === "Income");
  const exp = payload.find((p) => p.name === "Expenses");
  const net = (inc?.value || 0) - (exp?.value || 0);

  return (
    <div className="bg-base-300 border border-base-content/20 rounded-lg p-3 shadow-lg text-sm">
      <p className="font-semibold mb-2">{label}</p>
      {inc && (
        <p className="text-success">Income: {formatCurrency(inc.value)}</p>
      )}
      {exp && (
        <p className="text-error">Expenses: {formatCurrency(exp.value)}</p>
      )}
      <div className="divider my-1" />
      <p className={`font-bold ${net >= 0 ? "text-success" : "text-error"}`}>
        Net: {formatCurrency(net)}
      </p>
    </div>
  );
}

export default function IncomeExpenseBarChart({ projections }: Props) {
  const data = useMemo(() => {
    const months = new Map<string, { income: number; expenses: number }>();

    for (const day of projections) {
      const d = new Date(day.date + "T00:00:00");
      const key = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });

      if (!months.has(key)) months.set(key, { income: 0, expenses: 0 });
      const m = months.get(key)!;

      for (const event of day.events) {
        if (event.type === "income") m.income += event.amount;
        else m.expenses += event.amount;
      }
    }

    return [...months.entries()].map(([month, vals]): MonthData => ({
      month,
      income: Math.round(vals.income * 100) / 100,
      expenses: Math.round(vals.expenses * 100) / 100,
    }));
  }, [projections]);

  if (data.length === 0) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body items-center justify-center h-[430px]">
          <p className="text-base-content/50">No data in this date range</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Income vs Expenses</h2>

        <ResponsiveContainer width="100%" height={370}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} width={80} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="income" name="Income" fill="#36d399" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name="Expenses" fill="#f87272" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
