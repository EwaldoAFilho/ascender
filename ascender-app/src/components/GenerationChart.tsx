"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { GenerationSeries } from "@/lib/api/soliscloud";
import { numberFormatter } from "@/lib/dashboard-data";

const BRAND = "#f5b700";
const AXIS = "#7d909b";

export function GenerationChart({ series }: { series: GenerationSeries }) {
  const isDay = series.period === "day";
  const data = series.points.map((p) => ({
    label: p.label,
    value: Math.round(p.value * 100) / 100,
  }));

  const tooltip = (
    <Tooltip
      formatter={(value) => [
        `${numberFormatter.format(Number(value))} ${series.unit}`,
        isDay ? "Potência" : "Energia",
      ]}
      contentStyle={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 8,
        color: "var(--ink)",
      }}
      labelStyle={{ color: "var(--muted)" }}
      cursor={{ fill: "rgba(245,183,0,0.08)" }}
    />
  );

  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        {isDay ? (
          <AreaChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="genFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={BRAND} stopOpacity={0.5} />
                <stop offset="100%" stopColor={BRAND} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(125,144,155,0.18)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: AXIS }}
              minTickGap={36}
            />
            <YAxis tick={{ fontSize: 11, fill: AXIS }} width={44} />
            {tooltip}
            <Area
              type="monotone"
              dataKey="value"
              stroke={BRAND}
              strokeWidth={2}
              fill="url(#genFill)"
            />
          </AreaChart>
        ) : (
          <BarChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(125,144,155,0.18)" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: AXIS }} />
            <YAxis tick={{ fontSize: 11, fill: AXIS }} width={48} />
            {tooltip}
            <Bar dataKey="value" fill={BRAND} radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
