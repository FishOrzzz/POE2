"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatRate } from "@/lib/currencyDisplay";

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
  points: { timestamp: string; value: number }[];
}

// A function prop can't cross the server->client component boundary (this
// component is rendered from server components like AnchorDashboard), so the
// formatting choice is a plain string instead of a callback.
type ValueFormat = "rate" | "percent";

interface TrendChartProps {
  series: ChartSeries[];
  format?: ValueFormat;
  height?: number;
}

function formatValue(value: number, format: ValueFormat): string {
  return format === "percent" ? `${value.toFixed(0)}%` : formatRate(value);
}

function mergeSeries(series: ChartSeries[]): Record<string, number | string>[] {
  const byTimestamp = new Map<string, Record<string, number | string>>();
  for (const s of series) {
    for (const point of s.points) {
      const row = byTimestamp.get(point.timestamp) ?? { timestamp: point.timestamp };
      row[s.key] = point.value;
      byTimestamp.set(point.timestamp, row);
    }
  }
  return [...byTimestamp.values()].sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp)));
}

function formatDateTick(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const GRID_COLOR = "#71717a33";
const AXIS_COLOR = "#a1a1aa";

export default function TrendChart({ series, format = "rate", height = 220 }: TrendChartProps) {
  const data = mergeSeries(series);

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed border-zinc-200 text-sm text-zinc-400 dark:border-zinc-800 dark:text-zinc-600"
        style={{ height }}
      >
        Not enough data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" />
        <XAxis
          dataKey="timestamp"
          tickFormatter={formatDateTick}
          tick={{ fontSize: 11, fill: AXIS_COLOR }}
          stroke={GRID_COLOR}
          minTickGap={30}
        />
        <YAxis
          tick={{ fontSize: 11, fill: AXIS_COLOR }}
          stroke={GRID_COLOR}
          width={54}
          tickFormatter={(v: number) => formatValue(v, format)}
        />
        <Tooltip
          labelFormatter={(label) => formatDateTick(String(label))}
          formatter={(value, name) => {
            const numeric = typeof value === "number" ? value : Number(value);
            const s = series.find((entry) => entry.key === name);
            return [formatValue(numeric, format), s?.label ?? String(name)];
          }}
          contentStyle={{
            backgroundColor: "#18181b",
            border: "1px solid #3f3f46",
            borderRadius: 8,
            fontSize: 12,
            color: "#fafafa",
          }}
        />
        {series.length > 1 && (
          <Legend
            formatter={(value) => series.find((s) => s.key === value)?.label ?? value}
            wrapperStyle={{ fontSize: 12 }}
          />
        )}
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.key}
            stroke={s.color}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
