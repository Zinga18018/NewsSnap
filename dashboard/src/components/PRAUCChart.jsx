import React from "react";
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

const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    return (
        <div className="custom-tooltip">
            <p className="tooltip-item" style={{ color: "#22d3ee" }}>
                Precision: {payload[0]?.value?.toFixed(3)}
            </p>
            <p className="tooltip-item" style={{ color: "var(--text-muted)" }}>
                Recall: {payload[0]?.payload?.recall?.toFixed(2)}
            </p>
        </div>
    );
};

export default function PRAUCChart({ data }) {
    if (!data || data.length === 0) {
        return (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                No PR data available
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                    <linearGradient id="prGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.02} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis
                    dataKey="recall"
                    stroke="transparent"
                    tick={{ fill: "#4a4a5a", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    label={{ value: "Recall", position: "insideBottom", offset: -2, fill: "#4a4a5a", fontSize: 11 }}
                />
                <YAxis
                    stroke="transparent"
                    tick={{ fill: "#4a4a5a", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 1]}
                    label={{ value: "Precision", angle: -90, position: "insideLeft", offset: 15, fill: "#4a4a5a", fontSize: 11 }}
                />
                <ReferenceLine y={0.25} stroke="rgba(255,255,255,0.06)" strokeDasharray="6 4" label={{ value: "Random", fill: "#333340", fontSize: 10, position: "right" }} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.06)" }} />
                <Area
                    type="monotone"
                    dataKey="precision"
                    stroke="#22d3ee"
                    strokeWidth={2.5}
                    fill="url(#prGrad)"
                    dot={false}
                    activeDot={{ r: 5, fill: "#22d3ee", stroke: "#0f0f12", strokeWidth: 2 }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
