import React from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null;
    return (
        <div className="custom-tooltip">
            <p className="tooltip-label">Epoch {label}</p>
            {payload.map((item, i) => (
                <p key={i} className="tooltip-item" style={{ color: item.color }}>
                    {item.name}: {typeof item.value === "number" ? item.value.toFixed(4) : item.value}
                </p>
            ))}
        </div>
    );
};

export default function MetricsChart({ data, lines, xKey = "epoch", areaFill = false }) {
    if (!data || data.length === 0) {
        return (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                No training data yet
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                    {lines.map((line) => (
                        <linearGradient key={`grad-${line.key}`} id={`grad-${line.key}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={line.color} stopOpacity={0.25} />
                            <stop offset="100%" stopColor={line.color} stopOpacity={0} />
                        </linearGradient>
                    ))}
                </defs>
                <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.03)"
                    vertical={false}
                />
                <XAxis
                    dataKey={xKey}
                    stroke="transparent"
                    tick={{ fill: "#4a4a5a", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="transparent"
                    tick={{ fill: "#4a4a5a", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.06)" }} />
                {lines.map((line) => (
                    <Area
                        key={line.key}
                        type="monotone"
                        dataKey={line.key}
                        stroke={line.color}
                        strokeWidth={2.5}
                        name={line.name}
                        fill={areaFill ? `url(#grad-${line.key})` : "transparent"}
                        dot={{ r: 4, fill: "#0f0f12", stroke: line.color, strokeWidth: 2 }}
                        activeDot={{
                            r: 6,
                            fill: line.color,
                            stroke: "#0f0f12",
                            strokeWidth: 2,
                        }}
                    />
                ))}
            </AreaChart>
        </ResponsiveContainer>
    );
}
