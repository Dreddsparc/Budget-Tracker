import { useState, useEffect, useCallback, useMemo } from "react";
import type { ProjectionDay, ChartType, ChartFullscreenOptions } from "../types";
import ProjectionChart from "./ProjectionChart";
import SpendingPieChart from "./SpendingPieChart";
import IncomeExpenseBarChart from "./IncomeExpenseBarChart";
import CashFlowChart from "./CashFlowChart";
import ExpenseTrendChart from "./ExpenseTrendChart";

const CHART_TITLES: Record<ChartType, string> = {
  projection: "Balance Projection",
  spending: "Spending by Category",
  "income-vs-expenses": "Income vs Expenses",
  "cash-flow": "Monthly Cash Flow",
  "expense-trend": "Expense Trends by Category",
};

interface Props {
  open: boolean;
  chartType: ChartType;
  projections: ProjectionDay[];
  categoryColors: Record<string, string>;
  onClose: () => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ToggleGroup({
  options: opts,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="join">
      {opts.map((opt) => (
        <button
          key={opt.value}
          className={`btn btn-xs join-item ${value === opt.value ? "btn-primary" : "btn-ghost"}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function ChartFullscreen({
  open,
  chartType,
  projections,
  categoryColors,
  onClose,
}: Props) {
  const [chartHeight, setChartHeight] = useState(window.innerHeight - 180);
  const [zoomRange, setZoomRange] = useState<[number, number] | null>(null);

  // Click-to-zoom: first click sets start, second click sets end
  const [zoomStart, setZoomStart] = useState<number | null>(null);

  // Chart-specific toggles
  const [chartStyle, setChartStyle] = useState<"area" | "line">("area");
  const [barLayout, setBarLayout] = useState<"grouped" | "stacked">("grouped");
  const [pieStyle, setPieStyle] = useState<"donut" | "full">("donut");
  const [trendMode, setTrendMode] = useState<"stacked" | "lines">("stacked");

  // Reset state when chart type or open state changes
  useEffect(() => {
    setZoomRange(null);
    setZoomStart(null);
    setChartStyle("area");
    setBarLayout("grouped");
    setPieStyle("donut");
    setTrendMode("stacked");
  }, [chartType, open]);

  const handleResize = useCallback(() => {
    setChartHeight(window.innerHeight - 180);
  }, []);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (zoomStart !== null) {
          setZoomStart(null);
        } else if (zoomRange) {
          setZoomRange(null);
        } else {
          onClose();
        }
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose, zoomRange, zoomStart]);

  // Slice projections to zoom range
  const visibleProjections = useMemo(() => {
    if (!zoomRange) return projections;
    return projections.slice(zoomRange[0], zoomRange[1] + 1);
  }, [projections, zoomRange]);

  if (!open) return null;

  const isTimeSeries = chartType !== "spending";
  const isZoomed = zoomRange !== null;
  const isSelectingZoom = zoomStart !== null;

  function handleChartClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!isTimeSeries) return;

    // Find which data point was clicked using the chart's coordinate system
    // We calculate the index based on click position relative to the chart area
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const chartLeft = 90; // approximate left margin (YAxis width + padding)
    const chartRight = rect.width - 20; // approximate right margin
    const chartWidth = chartRight - chartLeft;

    if (x < chartLeft || x > chartRight) return;

    const ratio = (x - chartLeft) / chartWidth;
    const dataSource = zoomRange ? visibleProjections : projections;
    const idx = Math.round(ratio * (dataSource.length - 1));
    const clampedIdx = Math.max(0, Math.min(idx, dataSource.length - 1));

    // Convert back to full projections index if zoomed
    const fullIdx = zoomRange ? zoomRange[0] + clampedIdx : clampedIdx;

    if (zoomStart === null || zoomStart < 0) {
      // First click — set start point
      setZoomStart(fullIdx);
    } else {
      // Second click — set end point and zoom
      const start = Math.min(zoomStart, fullIdx);
      const end = Math.max(zoomStart, fullIdx);
      if (end - start >= 1) {
        setZoomRange([start, end]);
      }
      setZoomStart(null);
    }
  }

  const options: ChartFullscreenOptions = {
    height: chartHeight,
    chartStyle,
    barLayout,
    pieStyle,
    trendMode,
  };

  function renderControls() {
    switch (chartType) {
      case "projection":
        return (
          <ToggleGroup
            options={[
              { value: "area", label: "Area" },
              { value: "line", label: "Line" },
            ]}
            value={chartStyle}
            onChange={(v) => setChartStyle(v as "area" | "line")}
          />
        );
      case "income-vs-expenses":
        return (
          <ToggleGroup
            options={[
              { value: "grouped", label: "Grouped" },
              { value: "stacked", label: "Stacked" },
            ]}
            value={barLayout}
            onChange={(v) => setBarLayout(v as "grouped" | "stacked")}
          />
        );
      case "spending":
        return (
          <ToggleGroup
            options={[
              { value: "donut", label: "Donut" },
              { value: "full", label: "Full Pie" },
            ]}
            value={pieStyle}
            onChange={(v) => setPieStyle(v as "donut" | "full")}
          />
        );
      case "expense-trend":
        return (
          <ToggleGroup
            options={[
              { value: "stacked", label: "Stacked" },
              { value: "lines", label: "Individual" },
            ]}
            value={trendMode}
            onChange={(v) => setTrendMode(v as "stacked" | "lines")}
          />
        );
      default:
        return null;
    }
  }

  function renderChart() {
    switch (chartType) {
      case "projection":
        return <ProjectionChart projections={visibleProjections} categoryColors={categoryColors} options={options} />;
      case "spending":
        return <SpendingPieChart projections={visibleProjections} categoryColors={categoryColors} options={options} />;
      case "income-vs-expenses":
        return <IncomeExpenseBarChart projections={visibleProjections} options={options} />;
      case "cash-flow":
        return <CashFlowChart projections={visibleProjections} options={options} />;
      case "expense-trend":
        return <ExpenseTrendChart projections={visibleProjections} categoryColors={categoryColors} options={options} />;
    }
  }

  // Range slider for navigation
  const totalDays = projections.length;
  const sliderStart = zoomRange?.[0] ?? 0;
  const sliderEnd = zoomRange?.[1] ?? totalDays - 1;

  return (
    <div className="fixed inset-0 z-[100] bg-base-100 flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-base-content/10 shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold">{CHART_TITLES[chartType]}</h2>
          {isZoomed && projections[zoomRange[0]] && projections[zoomRange[1]] && (
            <span className="text-sm text-base-content/60">
              {formatDate(projections[zoomRange[0]].date)} — {formatDate(projections[zoomRange[1]].date)}
              {" "}({visibleProjections.length} days)
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {renderControls()}

          {isTimeSeries && !isSelectingZoom && (
            <button
              className="btn btn-xs btn-outline btn-info"
              onClick={() => setZoomStart(-1)}
              title="Click two points on the chart to zoom into that range"
            >
              Zoom Select
            </button>
          )}

          {isSelectingZoom && (
            <span className="badge badge-info badge-sm animate-pulse">
              {zoomStart !== null && zoomStart >= 0 ? "Now click the end point" : "Click the start point on the chart"}
            </span>
          )}

          {isSelectingZoom && (
            <button
              className="btn btn-xs btn-ghost"
              onClick={() => setZoomStart(null)}
            >
              Cancel
            </button>
          )}

          {isZoomed && (
            <button
              className="btn btn-xs btn-outline"
              onClick={() => { setZoomRange(null); setZoomStart(null); }}
            >
              Reset Zoom
            </button>
          )}

          <button
            className="btn btn-sm btn-ghost btn-circle"
            onClick={onClose}
            aria-label="Close fullscreen"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Chart */}
      <div
        className={`flex-1 px-4 py-2 overflow-hidden ${isSelectingZoom ? "cursor-crosshair" : ""}`}
        onClick={isSelectingZoom ? handleChartClick : undefined}
      >
        {renderChart()}
      </div>

      {/* Range slider for time-series charts */}
      {isTimeSeries && totalDays > 1 && (
        <div className="px-6 pb-3 pt-1 border-t border-base-content/10 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs text-base-content/50 w-20 text-right">
              {projections[sliderStart] ? formatDate(projections[sliderStart].date) : ""}
            </span>
            <input
              type="range"
              min={0}
              max={totalDays - 1}
              value={sliderStart}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                const end = Math.max(v + 1, sliderEnd);
                setZoomRange([v, Math.min(end, totalDays - 1)]);
              }}
              className="range range-xs range-info flex-1"
            />
            <input
              type="range"
              min={0}
              max={totalDays - 1}
              value={sliderEnd}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                const start = Math.min(sliderStart, v - 1);
                setZoomRange([Math.max(start, 0), v]);
              }}
              className="range range-xs range-info flex-1"
            />
            <span className="text-xs text-base-content/50 w-20">
              {projections[sliderEnd] ? formatDate(projections[sliderEnd].date) : ""}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
