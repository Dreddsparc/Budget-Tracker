import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
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

interface SliceData {
  name: string;
  value: number;
  color: string;
  percent: number;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: SliceData }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-base-300 border border-base-content/20 rounded-lg p-3 shadow-lg text-sm">
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
        <span className="font-semibold">{d.name}</span>
      </div>
      <p className="mt-1">{formatCurrency(d.value)}</p>
      <p className="text-base-content/60 text-xs">{(d.percent * 100).toFixed(1)}% of total</p>
    </div>
  );
}

function renderCustomLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  name,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  name: string;
}) {
  if (percent < 0.04) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {percent > 0.08 ? name : `${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export default function SpendingPieChart({ projections, categoryColors, options }: Props) {
  const data = useMemo(() => {
    const totals = new Map<string, number>();

    for (const day of projections) {
      for (const event of day.events) {
        if (event.type !== "expense" || event.isTransfer) continue;
        const cat = event.category || "Uncategorized";
        totals.set(cat, (totals.get(cat) || 0) + event.amount);
      }
    }

    const total = [...totals.values()].reduce((a, b) => a + b, 0);
    if (total === 0) return [];

    const slices: SliceData[] = [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({
        name,
        value,
        color: categoryColors[name] || hashColor(name),
        percent: value / total,
      }));

    return slices;
  }, [projections, categoryColors]);

  const totalSpending = data.reduce((s, d) => s + d.value, 0);

  if (data.length === 0) {
    const empty = (
      <div className="items-center justify-center h-[430px] flex">
        <p className="text-base-content/50">No expense data in this date range</p>
      </div>
    );
    return options ? empty : <div className="card bg-base-100 shadow-xl"><div className="card-body">{empty}</div></div>;
  }

  const isFull = options?.pieStyle === "full";
  const h = options?.height ?? 370;
  const outerR = Math.min(h * 0.35, 180);
  const innerR = isFull ? 0 : outerR * 0.5;

  const chart = (
    <ResponsiveContainer width="100%" height={h}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerR}
          outerRadius={outerR}
          paddingAngle={2}
          dataKey="value"
          labelLine={false}
          label={renderCustomLabel}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value: string) => (
            <span className="text-sm text-base-content">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );

  if (options) return chart;

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex items-baseline justify-between">
          <h2 className="card-title">Spending by Category</h2>
          <span className="text-sm text-base-content/60">
            Total: {formatCurrency(totalSpending)}
          </span>
        </div>
        {chart}
      </div>
    </div>
  );
}
