import React, { useState, useEffect } from "react";
import MetricsChart from "./components/MetricsChart";
import PipelineStatus from "./components/PipelineStatus";
import ModelCard from "./components/ModelCard";
import ConfusionMatrix from "./components/ConfusionMatrix";

// Demo data — replaced with real S3 data in production
const DEMO_METRICS = {
    accuracy: 0.9142,
    f1_weighted: 0.9138,
    f1_macro: 0.9131,
    mcc: 0.8856,
};

const DEMO_HISTORY = [
    { epoch: 1, train_loss: 0.42, train_accuracy: 0.85, val_loss: 0.31, val_accuracy: 0.89, val_f1: 0.888 },
    { epoch: 2, train_loss: 0.22, train_accuracy: 0.92, val_loss: 0.25, val_accuracy: 0.91, val_f1: 0.908 },
    { epoch: 3, train_loss: 0.14, train_accuracy: 0.95, val_loss: 0.24, val_accuracy: 0.914, val_f1: 0.914 },
];

const DEMO_CONFUSION = [
    [1780, 35, 52, 33],
    [22, 1868, 12, 18],
    [48, 18, 1752, 42],
    [30, 25, 38, 1827],
];

const DEMO_LABELS = ["World", "Sports", "Business", "Sci/Tech"];

const DEMO_PIPELINE = [
    { name: "Data Ingestion", status: "success", time: "2m 14s" },
    { name: "Preprocessing", status: "success", time: "1m 38s" },
    { name: "Model Training", status: "success", time: "34m 12s" },
    { name: "Evaluation", status: "success", time: "2m 05s" },
    { name: "Model Registry", status: "running", time: "..." },
    { name: "Endpoint Deploy", status: "pending", time: "—" },
];

const METRICS_URL = import.meta.env.VITE_METRICS_URL || null;

function App() {
    const [metrics, setMetrics] = useState(DEMO_METRICS);
    const [history, setHistory] = useState(DEMO_HISTORY);
    const [confusion, setConfusion] = useState(DEMO_CONFUSION);
    const [labels, setLabels] = useState(DEMO_LABELS);
    const [pipeline, setPipeline] = useState(DEMO_PIPELINE);
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleString());

    // Fetch real metrics from S3 if URL is configured
    useEffect(() => {
        if (!METRICS_URL) return;

        const fetchMetrics = async () => {
            setLoading(true);
            try {
                const [evalRes, histRes] = await Promise.all([
                    fetch(`${METRICS_URL}/latest_evaluation.json`),
                    fetch(`${METRICS_URL}/latest_metrics.json`),
                ]);

                if (evalRes.ok) {
                    const evalData = await evalRes.json();
                    setMetrics(evalData.metrics);
                    if (evalData.confusion_matrix) setConfusion(evalData.confusion_matrix);
                    if (evalData.label_names) setLabels(evalData.label_names);
                    setLastUpdated(new Date(evalData.timestamp).toLocaleString());
                }

                if (histRes.ok) {
                    const histData = await histRes.json();
                    if (histData.metrics) setHistory(histData.metrics);
                }
            } catch (err) {
                console.log("Using demo data:", err.message);
            }
            setLoading(false);
        };

        fetchMetrics();
        const interval = setInterval(fetchMetrics, 60000); // Refresh every 60s
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="app">
            <header className="header">
                <h1>⚡ LLMOps Dashboard</h1>
                <p>AG News Classification Pipeline — Last updated: {lastUpdated}</p>
            </header>

            {/* ── KPI Metrics ── */}
            <div className="metrics-grid">
                <div className="card metric-card blue">
                    <div className="card-title">Accuracy</div>
                    <div className="metric-value blue">{(metrics.accuracy * 100).toFixed(1)}%</div>
                    <div className="metric-delta positive">↑ Production</div>
                </div>
                <div className="card metric-card green">
                    <div className="card-title">F1 Score (Weighted)</div>
                    <div className="metric-value green">{(metrics.f1_weighted * 100).toFixed(1)}%</div>
                    <div className="metric-delta positive">↑ Target met</div>
                </div>
                <div className="card metric-card purple">
                    <div className="card-title">F1 Score (Macro)</div>
                    <div className="metric-value purple">{(metrics.f1_macro * 100).toFixed(1)}%</div>
                    <div className="metric-delta positive">↑ Balanced</div>
                </div>
                <div className="card metric-card orange">
                    <div className="card-title">MCC</div>
                    <div className="metric-value orange">{metrics.mcc.toFixed(3)}</div>
                    <div className="metric-delta positive">↑ Strong correlation</div>
                </div>
            </div>

            {/* ── Charts ── */}
            <div className="charts-grid">
                <div className="card chart-card">
                    <div className="card-title">Training History — Loss</div>
                    <MetricsChart
                        data={history}
                        lines={[
                            { key: "train_loss", color: "#4f8eff", name: "Train Loss" },
                            { key: "val_loss", color: "#8b5cf6", name: "Val Loss" },
                        ]}
                        xKey="epoch"
                    />
                </div>
                <div className="card chart-card">
                    <div className="card-title">Training History — Accuracy & F1</div>
                    <MetricsChart
                        data={history}
                        lines={[
                            { key: "train_accuracy", color: "#10b981", name: "Train Acc" },
                            { key: "val_accuracy", color: "#f59e0b", name: "Val Acc" },
                            { key: "val_f1", color: "#ef4444", name: "Val F1" },
                        ]}
                        xKey="epoch"
                    />
                </div>
            </div>

            {/* ── Bottom Row ── */}
            <div className="status-grid">
                <div className="card">
                    <div className="card-title">Pipeline Status</div>
                    <PipelineStatus steps={pipeline} />
                </div>

                <div className="card">
                    <div className="card-title">Model Info</div>
                    <ModelCard />
                </div>

                <div className="card">
                    <div className="card-title">Confusion Matrix</div>
                    <ConfusionMatrix matrix={confusion} labels={labels} />
                </div>
            </div>
        </div>
    );
}

export default App;
