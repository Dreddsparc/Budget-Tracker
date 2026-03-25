import { useState, useEffect, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { Override, ProjectionDay, DateRange } from "../types";
import * as api from "../api";

interface Props {
  dateRange: DateRange;
  overrides: Override[];
  refreshKey: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface TooltipPayloadEntry {
  payload: ProjectionDay;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  return (
    <div className="bg-base-300 border border-base-content/20 rounded-lg p-3 shadow-lg text-sm">
      <p className="font-semibold mb-1">
        {new Date(data.date + "T00:00:00").toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </p>
      <p className={`font-bold text-base ${data.balance >= 0 ? "text-success" : "text-error"}`}>
        {formatCurrency(data.balance)}
      </p>
      {data.events.length > 0 && (
        <div className="mt-2 space-y-0.5">
          {data.events.map((event, i) => (
            <p key={i} className={event.type === "income" ? "text-success" : "text-error"}>
              {event.type === "income" ? "+" : "-"}
              {formatCurrency(event.amount)} {event.name}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProjectionChart({ dateRange, overrides, refreshKey }: Props) {
  const [projections, setProjections] = useState<ProjectionDay[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProjections = useCallback(async () => {
    setLoading(true);
    try {
      const activeOverrides = overrides.length > 0 ? overrides : undefined;
      const range =
        dateRange.kind === "preset"
          ? { days: dateRange.days }
          : { startDate: dateRange.startDate, endDate: dateRange.endDate };
      const result = await api.getProjections(range, activeOverrides);
      setProjections(result);
    } catch (err) {
      console.error("Failed to fetch projections:", err);
    } finally {
      setLoading(false);
    }
  }, [dateRange, overrides, refreshKey]);

  useEffect(() => {
    fetchProjections();
  }, [fetchProjections]);

  const minBalance = Math.min(...projections.map((p) => p.balance), 0);
  const maxBalance = Math.max(...projections.map((p) => p.balance), 0);
  const yPadding = Math.max(Math.abs(maxBalance - minBalance) * 0.1, 100);

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Balance Projection</h2>

        {loading && projections.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart
              data={projections}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#36d399" stopOpacity={0.3} />
                  <stop offset="50%" stopColor="#36d399" stopOpacity={0.05} />
                  <stop offset="95%" stopColor="#f87272" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis
                tickFormatter={formatCurrency}
                tick={{ fontSize: 12 }}
                domain={[minBalance - yPadding, maxBalance + yPadding]}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.3)" strokeDasharray="3 3" />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="#36d399"
                fill="url(#balanceGradient)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#36d399" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
