import { useMemo } from "react";
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
import type { ProjectionDay } from "../types";

const DEFAULT_LINE_COLOR = "#36d399";

const CATEGORY_PALETTE = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f43f5e",
];

function hashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CATEGORY_PALETTE[Math.abs(hash) % CATEGORY_PALETTE.length];
}

interface Props {
  projections: ProjectionDay[];
  categoryColors: Record<string, string>;
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
  categoryColors,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
  categoryColors: Record<string, string>;
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
            <p key={i} className="flex items-center gap-1.5">
              {event.type === "expense" && event.category && (
                <span
                  className="inline-block w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor:
                      categoryColors[event.category] || hashColor(event.category),
                  }}
                />
              )}
              <span className={event.type === "income" ? "text-success" : "text-error"}>
                {event.type === "income" ? "+" : "-"}
                {formatCurrency(event.amount)} {event.name}
              </span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProjectionChart({ projections, categoryColors }: Props) {
  const minBalance = Math.min(...projections.map((p) => p.balance), 0);
  const maxBalance = Math.max(...projections.map((p) => p.balance), 0);
  const yPadding = Math.max(Math.abs(maxBalance - minBalance) * 0.1, 100);

  // Build gradient stops that color the line by expense category
  const strokeStops = useMemo(() => {
    if (projections.length < 2) return null;

    const stops: { offset: number; color: string }[] = [];
    let prevColor = DEFAULT_LINE_COLOR;

    for (let i = 0; i < projections.length; i++) {
      const offset = i / (projections.length - 1);
      const expenseEvents = projections[i].events.filter((e) => e.type === "expense");

      let pointColor = DEFAULT_LINE_COLOR;
      if (expenseEvents.length > 0) {
        // Use the largest expense's category color
        const dominant = expenseEvents.reduce((a, b) => (a.amount > b.amount ? a : b));
        if (dominant.category) {
          pointColor = categoryColors[dominant.category] || hashColor(dominant.category);
        }
      }

      if (pointColor !== prevColor) {
        // Hard transition: end previous color, start new color at same offset
        stops.push({ offset, color: prevColor });
        stops.push({ offset, color: pointColor });
      }

      prevColor = pointColor;
    }

    // Ensure bookend stops exist
    if (stops.length === 0) {
      return [
        { offset: 0, color: DEFAULT_LINE_COLOR },
        { offset: 1, color: DEFAULT_LINE_COLOR },
      ];
    }
    if (stops[0].offset > 0) {
      stops.unshift({ offset: 0, color: stops[0].color });
    }
    stops.push({ offset: 1, color: prevColor });

    return stops;
  }, [projections, categoryColors]);

  // Custom active dot that matches the category color
  function renderActiveDot(props: { cx: number; cy: number; index: number }) {
    const day = projections[props.index];
    if (!day) return <circle cx={props.cx} cy={props.cy} r={4} fill={DEFAULT_LINE_COLOR} />;
    const expenseEvents = day.events.filter((e) => e.type === "expense");
    let color = DEFAULT_LINE_COLOR;
    if (expenseEvents.length > 0) {
      const dominant = expenseEvents.reduce((a, b) => (a.amount > b.amount ? a : b));
      if (dominant.category) {
        color = categoryColors[dominant.category] || hashColor(dominant.category);
      }
    }
    return <circle cx={props.cx} cy={props.cy} r={4} fill={color} stroke="white" strokeWidth={1} />;
  }

  if (projections.length === 0) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body items-center justify-center h-[430px]">
          <p className="text-base-content/50">No projection data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Balance Projection</h2>

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
              {strokeStops && (
                <linearGradient id="categoryStrokeGradient" x1="0" y1="0" x2="1" y2="0">
                  {strokeStops.map((s, i) => (
                    <stop
                      key={i}
                      offset={`${(s.offset * 100).toFixed(2)}%`}
                      stopColor={s.color}
                    />
                  ))}
                </linearGradient>
              )}
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
            <Tooltip content={<CustomTooltip categoryColors={categoryColors} />} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.3)" strokeDasharray="3 3" />
            <Area
              type="monotone"
              dataKey="balance"
              stroke={strokeStops ? "url(#categoryStrokeGradient)" : DEFAULT_LINE_COLOR}
              fill="url(#balanceGradient)"
              strokeWidth={2}
              dot={false}
              activeDot={renderActiveDot}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
