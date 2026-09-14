import React, { useState, useCallback, useEffect, useRef } from "react";
import { browserDemoPrediction } from "../demoClassifier";
import { predictionScoreLabel } from "../api/artifactData";
import {
    NewsApiError,
    checkApiHealth,
    normalizeApiBase,
    requestPrediction,
} from "../api/newsApi";

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
    const [fallbackNote, setFallbackNote] = useState(null);
    const [serverStatus, setServerStatus] = useState(null);
    const [realtime, setRealtime] = useState(true);
    const lastSubmittedRef = useRef("");
    const activeRequestRef = useRef({ id: 0, controller: null });

    useEffect(() => {
        if (!API_URL) {
            setServerStatus("demo");
            return undefined;
        }
        const controller = new AbortController();

        const checkHealth = async () => {
            try {
                const mode = await checkApiHealth(API_URL, {
                    signal: controller.signal,
                    timeoutMs: 8_000,
                });
                if (mode) setServerStatus(mode);
            } catch {
                if (!controller.signal.aborted) setServerStatus("demo");
            }
        };

        checkHealth();
        return () => controller.abort();
    }, []);

    useEffect(() => () => activeRequestRef.current.controller?.abort(), []);

    const classify = useCallback(async (text) => {
        const trimmed = text.trim();
        if (!trimmed) return;

        activeRequestRef.current.controller?.abort();
        const controller = new AbortController();
        const requestId = activeRequestRef.current.id + 1;
        activeRequestRef.current = { id: requestId, controller };
        lastSubmittedRef.current = trimmed;

        setLoading(true);
        setFallbackNote(null);
        setResult(null);

        const useBrowserFallback = (reason = null) => {
            const pred = browserDemoPrediction(trimmed);
            const newResult = { ...pred, timestamp: new Date() };
            setResult(newResult);
            setHistory((h) => [newResult, ...h].slice(0, 10));
            setServerStatus("demo");
            setFallbackNote(reason);
        };

        try {
            if (!API_URL) {
                useBrowserFallback();
                return;
            }
            const pred = await requestPrediction(API_URL, trimmed, {
                signal: controller.signal,
            });
            if (activeRequestRef.current.id !== requestId) return;

            const newResult = { ...pred, timestamp: new Date() };
            setResult(newResult);
            setHistory((h) => [newResult, ...h].slice(0, 10));
            setServerStatus(pred.mode);
        } catch (err) {
            if (activeRequestRef.current.id !== requestId || controller.signal.aborted) return;
            const reason = err instanceof NewsApiError
                ? `${err.message} Showing the browser fallback instead.`
                : "The model API could not be reached. Showing the browser fallback instead.";
            useBrowserFallback(reason);
        } finally {
            if (activeRequestRef.current.id === requestId) {
                setLoading(false);
                activeRequestRef.current.controller = null;
            }
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

    const modeBadgeText = serverStatus === "real" ? "Model API" : serverStatus === "demo" ? "Keyword Demo" : "Mode unverified";

    return (
        <div className="test-model-page">
            <div className="page-header-bar">
                <h3>Test Model</h3>
                <p className="page-desc">
                    Classify news articles into World, Sports, Business, or Sci/Tech
                    {serverStatus && (
                        <span className={`mode-badge ${serverStatus}`}>
                            {modeBadgeText}
                        </span>
                    )}
                </p>
            </div>

            {serverStatus && (
                <div className={`model-status-banner ${serverStatus}`}>
                    <strong>
                        {serverStatus === "real" ? "Backend reports model inference." : serverStatus === "demo" ? "Keyword demonstration." : "Backend mode is unverified."}
                    </strong>
                    <span>
                        {serverStatus === "real"
                            ? "Result scores are uncalibrated model outputs, not probabilities that a prediction is correct."
                            : "Demonstration scores describe keyword matches; they do not measure DistilBERT confidence."}
                    </span>
                </div>
            )}

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
                    <button className="clear-btn" onClick={() => { setInput(""); setResult(null); }}>
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
                    <div className="samples-label">Try an illustrative headline (not a current news feed)</div>
                    <div className="samples-grid">
                        {SAMPLE_TEXTS.map((text, i) => (
                            <button key={i} className="sample-chip" onClick={() => useSample(text)}>
                                {text.length > 70 ? text.slice(0, 67) + "..." : text}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {fallbackNote && (
                <div className="model-status-banner demo">
                    <strong>Backend unavailable.</strong><span>{fallbackNote}</span>
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
                            <span className="result-confidence">{(result.confidence * 100).toFixed(1)}% {predictionScoreLabel(result.mode)}</span>
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
                    {result.mode === "demo" && (
                        <div className="result-mode-explainer">
                            Demo mode uses a transparent keyword-based fallback for the public interface. The displayed score shares are not DistilBERT confidence values. Run locally or connect a hosted model API for real inference.
                        </div>
                    )}
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
                                <th>Score and source</th>
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
                                    <td>{(h.confidence * 100).toFixed(1)}% · {predictionScoreLabel(h.mode)}</td>
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
