import React from "react";

function getCellColor(value, maxVal) {
    const intensity = value / maxVal;
    if (intensity > 0.8) return "rgba(16, 185, 129, 0.35)";
    if (intensity > 0.3) return "rgba(245, 158, 11, 0.25)";
    if (intensity > 0.05) return "rgba(239, 68, 68, 0.2)";
    return "rgba(255, 255, 255, 0.02)";
}

export default function ConfusionMatrix({ matrix, labels }) {
    if (!matrix || matrix.length === 0) {
        return <div className="empty-state">No evaluation data yet</div>;
    }

    const maxVal = Math.max(...matrix.flat());

    return (
        <table className="confusion-matrix">
            <thead>
                <tr>
                    <th></th>
                    {labels.map((label, i) => (
                        <th key={i}>{label}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {matrix.map((row, i) => (
                    <tr key={i}>
                        <th>{labels[i]}</th>
                        {row.map((val, j) => (
                            <td
                                key={j}
                                style={{
                                    background: getCellColor(i === j ? val : 0, maxVal),
                                    color: i === j ? "#10b981" : val > 0 ? "#ef4444" : "#555",
                                }}
                            >
                                {val}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
