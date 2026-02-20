import React, { useState, useEffect } from "react";
import MetricsChart from "./components/MetricsChart";
import PipelineStatus from "./components/PipelineStatus";
import ModelCard from "./components/ModelCard";
import ConfusionMatrix from "./components/ConfusionMatrix";

const DEMO_METRICS = {
    accuracy: 0.9142,
    f1_weighted: 0.9138,
    f1_macro: 0.9131,
    mcc: 0.8856,
};

const DEMO_HISTORY = [
    { epoch: 1, train_loss: 0.42, train_acc: 0.852, val_loss: 0.31, val_acc: 0.889, val_f1: 0.888 },
    { epoch: 2, train_loss: 0.22, train_acc: 0.921, val_loss: 0.25, val_acc: 0.908, val_f1: 0.908 },
    { epoch: 3, train_loss: 0.14, train_acc: 0.953, val_loss: 0.24, val_acc: 0.914, val_f1: 0.914 },
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
    { name: "Tokenization", status: "success", time: "4m 02s" },
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
    const [activeNav, setActiveNav] = useState("insights");
    const [activePeriod, setActivePeriod] = useState("all");
    const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleString());

    useEffect(() => {
        if (!METRICS_URL) return;
        const fetchMetrics = async () => {
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
        };
        fetchMetrics();
        const interval = setInterval(fetchMetrics, 60000);
        return () => clearInterval(interval);
    }, []);

    const navItems = [
        { id: "insights", icon: "📊", label: "Insights" },
        { id: "training", icon: "🧠", label: "Training Jobs" },
        { id: "models", icon: "📦", label: "Model Registry" },
        { id: "endpoints", icon: "🔌", label: "Endpoints" },
        { id: "data", icon: "💾", label: "Data Pipeline" },
    ];

    const navBottom = [
        { id: "infra", icon: "☁️", label: "Infrastructure" },
        { id: "settings", icon: "⚙️", label: "Settings" },
    ];

    return (
        <div className="app-layout">
            {/* ── Sidebar ── */}
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <div className="brand-icon">⚡</div>
                    <span className="brand-name">LLMOps</span>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section-label">Overview</div>
                    {navItems.map((item) => (
                        <div
                            key={item.id}
                            className={`nav-item ${activeNav === item.id ? "active" : ""}`}
                            onClick={() => setActiveNav(item.id)}
                        >
                            <span className="icon">{item.icon}</span>
                            {item.label}
                        </div>
                    ))}

                    <div className="nav-section-label" style={{ marginTop: "0.5rem" }}>System</div>
                    {navBottom.map((item) => (
                        <div
                            key={item.id}
                            className={`nav-item ${activeNav === item.id ? "active" : ""}`}
                            onClick={() => setActiveNav(item.id)}
                        >
                            <span className="icon">{item.icon}</span>
                            {item.label}
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <span className="version">LLMOps v1.0 · AG News</span>
                </div>
            </aside>

            {/* ── Main ── */}
            <main className="main-content">
                {/* Top Bar */}
                <div className="topbar">
                    <div className="topbar-left">
                        <h2>Dashboard</h2>
                    </div>
                    <div className="search-box">
                        <span className="search-icon">🔍</span>
                        <input type="text" placeholder="Search anything..." />
                        <span className="search-kbd">⌘K</span>
                    </div>
                    <div className="topbar-right">
                        <button className="topbar-btn" title="Notifications">🔔</button>
                        <button className="topbar-btn" title="Theme">🌙</button>
                        <div className="avatar">KU</div>
                    </div>
                </div>

                <div className="page-content">
                    {/* Cost Banner */}
                    <div className="cost-banner">
                        <span className="cost-icon">💰</span>
                        <span>
                            <strong>Free Tier Active</strong> — S3, Lambda, CloudWatch, ECR all within AWS Free Tier. No charges incurred.
                        </span>
                    </div>

                    {/* Config Bar */}
                    <div className="config-bar">
                        <button className={`nav-pill ${activePeriod === 'all' ? 'active' : ''}`} onClick={() => setActivePeriod('all')}>← →</button>
                        <button className={`nav-pill ${activePeriod === 'configure' ? 'active' : ''}`} onClick={() => setActivePeriod('configure')}>⚙ Configure</button>
                        <div className="spacer" />
                        <button className={`period-pill ${activePeriod === 'epoch' ? 'active' : ''}`} onClick={() => setActivePeriod('epoch')}>Per Epoch</button>
                        <button className={`period-pill ${activePeriod === 'daily' ? 'active' : ''}`} onClick={() => setActivePeriod('daily')}>Daily</button>
                        <button className={`period-pill ${activePeriod === 'weekly' ? 'active' : ''}`} onClick={() => setActivePeriod('weekly')}>Weekly</button>
                        <button className="filter-btn">🔽 Filter</button>
                    </div>

                    {/* ── KPI Cards ── */}
                    <div className="metrics-row">
                        <div className="card metric-card cyan">
                            <div className="metric-header">
                                <span className="metric-label">Accuracy</span>
                                <span className="metric-badge up">↑ 2.1%</span>
                            </div>
                            <div className="metric-value">{(metrics.accuracy * 100).toFixed(1)}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>%</span></div>
                            <div className="metric-sub">↗ Best in last 3 epochs</div>
                        </div>

                        <div className="card metric-card emerald">
                            <div className="metric-header">
                                <span className="metric-label">F1 Weighted</span>
                                <span className="metric-badge up">↑ 1.8%</span>
                            </div>
                            <div className="metric-value">{(metrics.f1_weighted * 100).toFixed(1)}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>%</span></div>
                            <div className="metric-sub">⬤ Target met</div>
                        </div>

                        <div className="card metric-card amber">
                            <div className="metric-header">
                                <span className="metric-label">F1 Macro</span>
                                <span className="metric-badge up">↑ 1.5%</span>
                            </div>
                            <div className="metric-value">{(metrics.f1_macro * 100).toFixed(1)}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>%</span></div>
                            <div className="metric-sub">Balanced across classes</div>
                        </div>

                        <div className="card metric-card violet">
                            <div className="metric-header">
                                <span className="metric-label">MCC Score</span>
                                <span className="metric-badge up">↑ Strong</span>
                            </div>
                            <div className="metric-value">{metrics.mcc.toFixed(3)}</div>
                            <div className="metric-sub">Matthews Correlation</div>
                        </div>
                    </div>

                    {/* ── Charts ── */}
                    <div className="charts-row">
                        <div className="card chart-card">
                            <div className="chart-header">
                                <div>
                                    <div className="chart-title">Training Loss</div>
                                    <div className="chart-subtitle">Loss convergence over epochs</div>
                                </div>
                                <div className="chart-legend">
                                    <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--accent-cyan)' }} /> Train</div>
                                    <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--accent-violet)' }} /> Val</div>
                                </div>
                            </div>
                            <MetricsChart
                                data={history}
                                lines={[
                                    { key: "train_loss", color: "#22d3ee", name: "Train Loss" },
                                    { key: "val_loss", color: "#a78bfa", name: "Val Loss" },
                                ]}
                                xKey="epoch"
                                areaFill
                            />
                        </div>

                        <div className="card chart-card">
                            <div className="chart-header">
                                <div>
                                    <div className="chart-title">Accuracy & F1</div>
                                    <div className="chart-subtitle">Performance metrics per epoch</div>
                                </div>
                                <div className="chart-legend">
                                    <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--accent-emerald)' }} /> Train Acc</div>
                                    <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--accent-amber)' }} /> Val Acc</div>
                                    <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--accent-rose)' }} /> Val F1</div>
                                </div>
                            </div>
                            <MetricsChart
                                data={history}
                                lines={[
                                    { key: "train_acc", color: "#34d399", name: "Train Acc" },
                                    { key: "val_acc", color: "#fbbf24", name: "Val Acc" },
                                    { key: "val_f1", color: "#fb7185", name: "Val F1" },
                                ]}
                                xKey="epoch"
                                areaFill
                            />
                        </div>
                    </div>

                    {/* ── Bottom Row ── */}
                    <div className="bottom-row">
                        <div className="card section-card">
                            <div className="section-title">Pipeline Status</div>
                            <PipelineStatus steps={pipeline} />
                        </div>

                        <div className="card section-card">
                            <div className="section-title">Model Information</div>
                            <ModelCard />
                        </div>

                        <div className="card section-card">
                            <div className="section-title">Confusion Matrix</div>
                            <ConfusionMatrix matrix={confusion} labels={labels} />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default App;
