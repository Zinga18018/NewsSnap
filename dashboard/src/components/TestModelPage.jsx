import React, { useState, useCallback, useEffect, useRef } from "react";

function normalizeApiBase(url) {
    if (!url) return "";
    return url.trim().replace(/\/+$/, "").replace(/\/(predict|health)$/i, "");
}

const API_URL = normalizeApiBase(
    import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:8000" : "")
);

const SAMPLE_TEXTS = [
    "Apple announces new M4 chip with revolutionary AI capabilities for MacBook Pro",
    "The Lakers defeated the Celtics 112-108 in overtime thriller at Staples Center",
    "Wall Street rallies as Federal Reserve holds interest rates steady for third quarter",
    "UN Security Council votes on new sanctions against North Korea amid nuclear tensions",
    "SpaceX successfully launches 60 Starlink satellites into orbit from Cape Canaveral",
    "Amazon reports record quarterly revenue of $170 billion, stock surges 8% after hours",
];

const LABEL_COLORS = {
    "World": { bg: "rgba(251, 191, 36, 0.12)", text: "#fbbf24", border: "rgba(251, 191, 36, 0.25)" },
    "Sports": { bg: "rgba(52, 211, 153, 0.12)", text: "#34d399", border: "rgba(52, 211, 153, 0.25)" },
    "Business": { bg: "rgba(96, 165, 250, 0.12)", text: "#60a5fa", border: "rgba(96, 165, 250, 0.25)" },
    "Sci/Tech": { bg: "rgba(167, 139, 250, 0.12)", text: "#a78bfa", border: "rgba(167, 139, 250, 0.25)" },
};

export default function TestModelPage() {
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [history, setHistory] = useState([]);
    const [error, setError] = useState(null);
    const [serverStatus, setServerStatus] = useState(null);
    const [realtime, setRealtime] = useState(true);
    const lastSubmittedRef = useRef("");

    const classify = useCallback(async (text) => {
        const trimmed = text.trim();
        if (!trimmed) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const predictUrl = API_URL ? `${API_URL}/predict` : "/predict";
            const res = await fetch(predictUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: trimmed }),
            });

            if (!res.ok) {
                if (res.status === 405) {
                    throw new Error(
                        "API returned 405. Set VITE_API_URL to your backend base URL only (example: https://<your-api-domain>, not your frontend URL and not ending with /predict)."
                    );
                }
                throw new Error(`API returned ${res.status}`);
            }

            const data = await res.json();
            const pred = data.predictions[0];
            const newResult = { ...pred, mode: data.mode, timestamp: new Date() };
            setResult(newResult);
            setHistory((h) => [newResult, ...h].slice(0, 10));
            setServerStatus(data.mode);
            lastSubmittedRef.current = trimmed;
        } catch (err) {
            setError(
                err.message.includes("fetch")
                    ? "Cannot reach API. Start backend locally with: uvicorn src.serving.api:app --port 8000, or set VITE_API_URL."
                    : err.message
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!realtime) return;
        const trimmed = input.trim();
        if (trimmed.length < 5 || trimmed === lastSubmittedRef.current) return;

        const timer = setTimeout(() => {
            classify(trimmed);
        }, 1500);

        return () => clearTimeout(timer);
    }, [input, realtime, classify]);

    const useSample = (text) => {
        setInput(text);
        classify(text);
    };

    return (
        <div className="test-model-page">
            <div className="page-header-bar">
                <h3>Test Model</h3>
                <p className="page-desc">
                    Classify news articles into World, Sports, Business, or Sci/Tech
                    {serverStatus && (
                        <span className={`mode-badge ${serverStatus}`}>
                            {serverStatus === "real" ? "Live Model" : "Demo Mode"}
                        </span>
                    )}
                </p>
            </div>

            {/* Input Section */}
            <div className="card section-card test-input-section">
                <div className="section-title">Input Text</div>
                <textarea
                    className="predict-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Paste a news headline or article here..."
                    rows={4}
                />
                <div className="input-actions">
                    <button
                        className="classify-btn"
                        onClick={() => classify(input)}
                        disabled={loading || !input.trim()}
                    >
                        {loading ? (
                            <span className="btn-loading">
                                <span className="spinner" />
                                Classifying...
                            </span>
                        ) : (
                            "Classify"
                        )}
                    </button>
                    <button className="clear-btn" onClick={() => { setInput(""); setResult(null); setError(null); }}>
                        Clear
                    </button>
                    <button
                        className="clear-btn"
                        onClick={() => setRealtime((v) => !v)}
                        title="Toggle live classification while typing"
                    >
                        {realtime ? "Realtime On" : "Realtime Off"}
                    </button>
                </div>

                {/* Sample Prompts */}
                <div className="samples-section">
                    <div className="samples-label">Try a sample</div>
                    <div className="samples-grid">
                        {SAMPLE_TEXTS.map((text, i) => (
                            <button key={i} className="sample-chip" onClick={() => useSample(text)}>
                                {text.length > 70 ? text.slice(0, 67) + "..." : text}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="predict-error">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {/* Result */}
            {result && (
                <div className="predict-result-card card" style={{ borderColor: LABEL_COLORS[result.label]?.border }}>
                    <div className="result-header">
                        <div className="result-label-badge">
                            {result.label}
                        </div>
                        <div className="result-meta">
                            <span className="result-confidence">{(result.confidence * 100).toFixed(1)}% confidence</span>
                            <span className="result-latency">{result.latency_ms}ms</span>
                        </div>
                    </div>

                    <div className="result-text-preview">{result.text}</div>

                    {/* Probability Bars */}
                    <div className="prob-bars">
                        {Object.entries(result.probabilities)
                            .sort(([, a], [, b]) => b - a)
                            .map(([label, prob]) => (
                                <div key={label} className="prob-row">
                                    <span className="prob-label">{label}</span>
                                    <div className="prob-track">
                                        <div
                                            className="prob-fill"
                                            style={{
                                                width: `${prob * 100}%`,
                                                background: LABEL_COLORS[label]?.text || "#8a8a9a",
                                            }}
                                        />
                                    </div>
                                    <span className="prob-value">{(prob * 100).toFixed(1)}%</span>
                                </div>
                            ))}
                    </div>

                    <div className="result-footer">
                        <span className="model-tag">{result.model}</span>
                        <span className="mode-tag">{result.mode} mode</span>
                    </div>
                </div>
            )}

            {/* History */}
            {history.length > 0 && (
                <div className="card section-card" style={{ marginTop: "1rem" }}>
                    <div className="section-title">Recent Predictions</div>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Text</th>
                                <th>Label</th>
                                <th>Confidence</th>
                                <th>Latency</th>
                                <th>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((h, i) => (
                                <tr key={i}>
                                    <td style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {h.text}
                                    </td>
                                    <td>
                                        <span
                                            className="status-chip"
                                            style={{
                                                background: LABEL_COLORS[h.label]?.bg,
                                                color: LABEL_COLORS[h.label]?.text,
                                            }}
                                        >
                                            {h.label}
                                        </span>
                                    </td>
                                    <td>{(h.confidence * 100).toFixed(1)}%</td>
                                    <td>{h.latency_ms}ms</td>
                                    <td className="mono">{h.timestamp.toLocaleTimeString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
