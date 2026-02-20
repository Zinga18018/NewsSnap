import React from "react";

function getCellBg(value, maxVal, isDiagonal) {
    if (isDiagonal) {
        const intensity = Math.min(value / maxVal, 1);
        return `rgba(52, 211, 153, ${0.06 + intensity * 0.2})`;
    }
    if (value === 0) return "transparent";
    return `rgba(251, 113, 133, ${Math.min(value / maxVal, 0.2)})`;
}

export default function ConfusionMatrix({ matrix, labels }) {
    if (!matrix || matrix.length === 0) {
        return (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                No evaluation data yet
            </div>
        );
    }

    const maxVal = Math.max(...matrix.flat());
    const cols = labels.length + 1;

    return (
        <div
            className="matrix-grid"
            style={{ gridTemplateColumns: `60px repeat(${labels.length}, 1fr)` }}
        >
            {/* Header row */}
            <div className="matrix-header-cell"></div>
            {labels.map((label, i) => (
                <div key={`h-${i}`} className="matrix-header-cell">{label}</div>
            ))}

            {/* Data rows */}
            {matrix.map((row, i) => (
                <React.Fragment key={`r-${i}`}>
                    <div className="matrix-header-cell" style={{ textAlign: "right", paddingRight: "0.5rem" }}>
                        {labels[i]}
                    </div>
                    {row.map((val, j) => {
                        const isDiag = i === j;
                        return (
                            <div
                                key={`c-${i}-${j}`}
                                className={`matrix-cell ${isDiag ? "diagonal" : val > 0 ? "off-diagonal" : ""}`}
                                style={{ background: getCellBg(val, maxVal, isDiag) }}
                            >
                                {val}
                            </div>
                        );
                    })}
                </React.Fragment>
            ))}
        </div>
    );
}
