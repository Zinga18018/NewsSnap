import React from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null;
    return (
        <div
            style={{
                background: "rgba(10, 10, 26, 0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "10px",
                padding: "12px 16px",
                fontSize: "0.82rem",
            }}
        >
            <p style={{ color: "#888", marginBottom: "6px" }}>Epoch {label}</p>
            {payload.map((item, i) => (
                <p key={i} style={{ color: item.color, fontWeight: 500 }}>
                    {item.name}: {typeof item.value === "number" ? item.value.toFixed(4) : item.value}
                </p>
            ))}
        </div>
    );
};

export default function MetricsChart({ data, lines, xKey = "epoch" }) {
    if (!data || data.length === 0) {
        return <div className="empty-state">No training data yet</div>;
    }

    return (
        <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                    dataKey={xKey}
                    stroke="#555"
                    fontSize={12}
                    tickLine={false}
                    label={{ value: "Epoch", position: "insideBottom", offset: -2, fill: "#666", fontSize: 11 }}
                />
                <YAxis stroke="#555" fontSize={12} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                    wrapperStyle={{ fontSize: "0.78rem", paddingTop: "8px" }}
                    iconType="circle"
                    iconSize={8}
                />
                {lines.map((line) => (
                    <Line
                        key={line.key}
                        type="monotone"
                        dataKey={line.key}
                        stroke={line.color}
                        name={line.name}
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: line.color, strokeWidth: 0 }}
                        activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
}
