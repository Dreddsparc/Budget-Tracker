import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { ProjectionDay, ChartFullscreenOptions } from "../types";

const FALLBACK_PALETTE = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f43f5e",
  "#a855f7", "#64748b",
];

function hashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return FALLBACK_PALETTE[Math.abs(hash) % FALLBACK_PALETTE.length];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

interface Props {
  projections: ProjectionDay[];
  categoryColors: Record<string, string>;
  options?: ChartFullscreenOptions;
}

export default function ExpenseTrendChart({ projections, categoryColors, options }: Props) {
  const { data, categories } = useMemo(() => {
    // Aggregate by week to smooth daily noise
    const weeks = new Map<string, Map<string, number>>();
    const allCategories = new Set<string>();

    for (const day of projections) {
      // Group into weeks (Monday-start)
      const d = new Date(day.date + "T00:00:00");
      const dayOfWeek = d.getDay();
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((dayOfWeek + 6) % 7));
      const weekKey = monday.toISOString().split("T")[0];

      if (!weeks.has(weekKey)) weeks.set(weekKey, new Map());
      const week = weeks.get(weekKey)!;

      for (const event of day.events) {
        if (event.type !== "expense") continue;
        const cat = event.category || "Uncategorized";
        allCategories.add(cat);
        week.set(cat, (week.get(cat) || 0) + event.amount);
      }
    }

    // Sort categories by total spending (largest first)
    const catTotals = new Map<string, number>();
    for (const week of weeks.values()) {
      for (const [cat, amount] of week) {
        catTotals.set(cat, (catTotals.get(cat) || 0) + amount);
      }
    }
    const sortedCats = [...catTotals.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([cat]) => cat);

    // Build data array
    const weekData = [...weeks.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([weekKey, catMap]) => {
        const d = new Date(weekKey + "T00:00:00");
        const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const row: Record<string, string | number> = { week: label };
        for (const cat of sortedCats) {
          row[cat] = Math.round((catMap.get(cat) || 0) * 100) / 100;
        }
        return row;
      });

    return { data: weekData, categories: sortedCats };
  }, [projections]);

  if (data.length === 0 || categories.length === 0) {
    const empty = (
      <div className="items-center justify-center h-[430px] flex">
        <p className="text-base-content/50">No expense data in this date range</p>
      </div>
    );
    return options ? empty : <div className="card bg-base-100 shadow-xl"><div className="card-body">{empty}</div></div>;
  }

  const isLines = options?.trendMode === "lines";

  const chart = (
    <ResponsiveContainer width="100%" height={options?.height ?? 370}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis
          dataKey="week"
          tick={{ fontSize: 12 }}
          interval="preserveStartEnd"
          minTickGap={40}
        />
        <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} width={80} />
        <Tooltip
          formatter={(value: number, name: string) => [formatCurrency(value), name]}
          contentStyle={{
            backgroundColor: "oklch(var(--b3))",
            border: "1px solid oklch(var(--bc) / 0.2)",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
          }}
        />
        <Legend />
        {categories.map((cat) => {
          const color = categoryColors[cat] || hashColor(cat);
          return (
            <Area
              key={cat}
              type="monotone"
              dataKey={cat}
              stackId={isLines ? undefined : "expenses"}
              stroke={color}
              fill={color}
              fillOpacity={isLines ? 0.1 : 0.6}
            />
          );
        })}
      </AreaChart>
    </ResponsiveContainer>
  );

  if (options) return chart;

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Expense Trends by Category</h2>
        <p className="text-xs text-base-content/50">Weekly aggregation</p>
        {chart}
      </div>
    </div>
  );
}
