import React, { useState, useEffect, useMemo } from "react";
import MetricsChart from "./components/MetricsChart";
import PipelineStatus from "./components/PipelineStatus";
import ModelCard from "./components/ModelCard";
import ConfusionMatrix from "./components/ConfusionMatrix";
import PRAUCChart from "./components/PRAUCChart";
import TestModelPage from "./components/TestModelPage";

/* ── SVG Icons ── */
const Icons = {
    insights: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></svg>,
    training: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M12 2v4" /><path d="M12 18v4" /><path d="m4.93 4.93 2.83 2.83" /><path d="m16.24 16.24 2.83 2.83" /><path d="M2 12h4" /><path d="M18 12h4" /><path d="m4.93 19.07 2.83-2.83" /><path d="m16.24 7.76 2.83-2.83" /></svg>,
    models: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>,
    endpoints: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v8" /><circle cx="12" cy="14" r="4" /><path d="M12 18v4" /></svg>,
    data: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v14a9 3 0 0 0 18 0V5" /><path d="M3 12a9 3 0 0 0 18 0" /></svg>,
    infra: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" /></svg>,
    settings: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>,
    search: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>,
    bell: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>,
    moon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>,
    filter: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>,
    zap: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" /></svg>,
    dollar: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
    arrowNav: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>,
    configure: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 21v-7" /><path d="M4 10V3" /><path d="M12 21v-9" /><path d="M12 8V3" /><path d="M20 21v-5" /><path d="M20 12V3" /><circle cx="4" cy="12" r="2" /><circle cx="12" cy="8" r="2" /><circle cx="20" cy="14" r="2" /></svg>,
    refresh: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></svg>,
    clock: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
    testmodel: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="6 3 20 12 6 21 6 3" /></svg>,
};

/* ── Raw epoch data → simulated daily/weekly aggregates ── */
function generateDailyData(epochData) {
    // Simulate 7 days of training data from epoch snapshots
    return [
        { day: "Mon", train_loss: 0.52, val_loss: 0.41, train_acc: 0.812, val_acc: 0.845, val_f1: 0.842 },
        { day: "Tue", train_loss: 0.44, val_loss: 0.35, train_acc: 0.842, val_acc: 0.872, val_f1: 0.870 },
        { day: "Wed", train_loss: 0.38, val_loss: 0.30, train_acc: 0.867, val_acc: 0.891, val_f1: 0.889 },
        { day: "Thu", train_loss: 0.28, val_loss: 0.27, train_acc: 0.901, val_acc: 0.903, val_f1: 0.902 },
        { day: "Fri", train_loss: 0.21, val_loss: 0.25, train_acc: 0.925, val_acc: 0.910, val_f1: 0.909 },
        { day: "Sat", train_loss: 0.17, val_loss: 0.24, train_acc: 0.942, val_acc: 0.912, val_f1: 0.912 },
        { day: "Sun", train_loss: 0.14, val_loss: 0.24, train_acc: 0.953, val_acc: 0.914, val_f1: 0.914 },
    ];
}

function generateWeeklyData(epochData) {
    return [
        { week: "Wk 1", train_loss: 0.58, val_loss: 0.46, train_acc: 0.792, val_acc: 0.821, val_f1: 0.818 },
        { week: "Wk 2", train_loss: 0.38, val_loss: 0.31, train_acc: 0.871, val_acc: 0.889, val_f1: 0.888 },
        { week: "Wk 3", train_loss: 0.22, val_loss: 0.25, train_acc: 0.921, val_acc: 0.908, val_f1: 0.908 },
        { week: "Wk 4", train_loss: 0.14, val_loss: 0.24, train_acc: 0.953, val_acc: 0.914, val_f1: 0.914 },
    ];
}

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

const DEMO_PR_DATA = [
    { recall: 0.0, precision: 1.0 },
    { recall: 0.1, precision: 0.99 },
    { recall: 0.2, precision: 0.985 },
    { recall: 0.3, precision: 0.981 },
    { recall: 0.4, precision: 0.974 },
    { recall: 0.5, precision: 0.968 },
    { recall: 0.6, precision: 0.958 },
    { recall: 0.7, precision: 0.946 },
    { recall: 0.8, precision: 0.931 },
    { recall: 0.85, precision: 0.918 },
    { recall: 0.9, precision: 0.895 },
    { recall: 0.92, precision: 0.878 },
    { recall: 0.95, precision: 0.841 },
    { recall: 0.97, precision: 0.792 },
    { recall: 0.99, precision: 0.702 },
    { recall: 1.0, precision: 0.55 },
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
    const [prData, setPrData] = useState(DEMO_PR_DATA);
    const [confusion, setConfusion] = useState(DEMO_CONFUSION);
    const [labels, setLabels] = useState(DEMO_LABELS);
    const [pipeline, setPipeline] = useState(DEMO_PIPELINE);
    const [activeNav, setActiveNav] = useState("insights");
    const [timescale, setTimescale] = useState("epoch");
    const [lastRefresh, setLastRefresh] = useState(new Date());

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
                    if (evalData.pr_curve) setPrData(evalData.pr_curve);
                }
                if (histRes.ok) {
                    const histData = await histRes.json();
                    if (histData.metrics) setHistory(histData.metrics);
                }
                setLastRefresh(new Date());
            } catch (err) {
                console.log("Using demo data:", err.message);
            }
        };
        fetchMetrics();
        const interval = setInterval(fetchMetrics, 30000);
        return () => clearInterval(interval);
    }, []);

    const navItems = [
        { id: "insights", icon: Icons.insights, label: "Insights" },
        { id: "training", icon: Icons.training, label: "Training Jobs" },
        { id: "models", icon: Icons.models, label: "Model Registry" },
        { id: "endpoints", icon: Icons.endpoints, label: "Endpoints" },
        { id: "testmodel", icon: Icons.testmodel, label: "Test Model" },
        { id: "data", icon: Icons.data, label: "Data Pipeline" },
    ];

    const navBottom = [
        { id: "infra", icon: Icons.infra, label: "Infrastructure" },
        { id: "settings", icon: Icons.settings, label: "Settings" },
    ];

    const renderPageContent = () => {
        switch (activeNav) {
            case "insights":
                return <InsightsPage metrics={metrics} history={history} prData={prData} confusion={confusion} labels={labels} pipeline={pipeline} timescale={timescale} setTimescale={setTimescale} lastRefresh={lastRefresh} />;
            case "training":
                return <TrainingPage history={history} timescale={timescale} setTimescale={setTimescale} />;
            case "models":
                return <ModelsPage />;
            case "endpoints":
                return <EndpointsPage />;
            case "testmodel":
                return <TestModelPage />;
            case "data":
                return <DataPage pipeline={pipeline} />;
            case "infra":
                return <InfraPage />;
            case "settings":
                return <SettingsPage />;
            default:
                return null;
        }
    };

    const pageTitle = [...navItems, ...navBottom].find(n => n.id === activeNav)?.label || "Dashboard";

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <div className="brand-icon">{Icons.zap}</div>
                    <span className="brand-name">LLMOps</span>
                </div>
                <nav className="sidebar-nav">
                    <div className="nav-section-label">Overview</div>
                    {navItems.map((item) => (
                        <div key={item.id} className={`nav-item ${activeNav === item.id ? "active" : ""}`} onClick={() => setActiveNav(item.id)}>
                            <span className="icon">{item.icon}</span>{item.label}
                        </div>
                    ))}
                    <div className="nav-section-label" style={{ marginTop: "0.5rem" }}>System</div>
                    {navBottom.map((item) => (
                        <div key={item.id} className={`nav-item ${activeNav === item.id ? "active" : ""}`} onClick={() => setActiveNav(item.id)}>
                            <span className="icon">{item.icon}</span>{item.label}
                        </div>
                    ))}
                </nav>
                <div className="sidebar-footer">
                    <span className="version">LLMOps v1.0 · AG News · us-east-1</span>
                </div>
            </aside>

            <main className="main-content">
                <div className="topbar">
                    <div className="topbar-left"><h2>{pageTitle}</h2></div>
                    <div className="search-box">
                        <span className="search-icon">{Icons.search}</span>
                        <input type="text" placeholder="Search anything..." />
                        <span className="search-kbd">⌘K</span>
                    </div>
                    <div className="topbar-right">
                        <button className="topbar-btn" title="Notifications">{Icons.bell}</button>
                        <button className="topbar-btn" title="Theme">{Icons.moon}</button>
                        <div className="avatar">KU</div>
                    </div>
                </div>
                <div className="page-content">{renderPageContent()}</div>
            </main>
        </div>
    );
}

/* ─── TIMESCALE SELECTOR ─── */
function TimescaleBar({ timescale, setTimescale, lastRefresh }) {
    const scales = [
        { id: "epoch", label: "Per Epoch" },
        { id: "daily", label: "Daily" },
        { id: "weekly", label: "Weekly" },
    ];
    return (
        <div className="config-bar">
            <div className="refresh-info">
                <span className="icon-inline">{Icons.clock}</span>
                <span className="refresh-text">Updated {lastRefresh ? lastRefresh.toLocaleTimeString() : "now"}</span>
            </div>
            <div className="spacer" />
            {scales.map(s => (
                <button key={s.id} className={`period-pill ${timescale === s.id ? "active" : ""}`} onClick={() => setTimescale(s.id)}>
                    {s.label}
                </button>
            ))}
            <button className="refresh-btn" onClick={() => window.location.reload()} title="Refresh data">
                {Icons.refresh}
            </button>
        </div>
    );
}

/* ─── CHART DATA HOOK ─── */
function useTimescaledData(epochHistory, timescale) {
    return useMemo(() => {
        if (timescale === "daily") {
            return { data: generateDailyData(epochHistory), xKey: "day", xLabel: "Day" };
        }
        if (timescale === "weekly") {
            return { data: generateWeeklyData(epochHistory), xKey: "week", xLabel: "Week" };
        }
        return { data: epochHistory, xKey: "epoch", xLabel: "Epoch" };
    }, [epochHistory, timescale]);
}

/* ─── INSIGHTS PAGE ─── */
function InsightsPage({ metrics, history, prData, confusion, labels, pipeline, timescale, setTimescale, lastRefresh }) {
    const { data: chartData, xKey } = useTimescaledData(history, timescale);

    return (
        <>
            <div className="cost-banner">
                <span className="cost-icon">{Icons.dollar}</span>
                <span><strong>Free Tier Active</strong> — S3, Lambda, CloudWatch, ECR all within AWS Free Tier. $0.00 this month.</span>
            </div>

            <TimescaleBar timescale={timescale} setTimescale={setTimescale} lastRefresh={lastRefresh} />

            <div className="metrics-row">
                <div className="card metric-card cyan">
                    <div className="metric-header"><span className="metric-label">Accuracy</span><span className="metric-badge up">+2.1%</span></div>
                    <div className="metric-value">{(metrics.accuracy * 100).toFixed(1)}<span className="metric-unit">%</span></div>
                    <div className="metric-sub">Best in last 3 epochs</div>
                </div>
                <div className="card metric-card emerald">
                    <div className="metric-header"><span className="metric-label">F1 Weighted</span><span className="metric-badge up">+1.8%</span></div>
                    <div className="metric-value">{(metrics.f1_weighted * 100).toFixed(1)}<span className="metric-unit">%</span></div>
                    <div className="metric-sub">Target met</div>
                </div>
                <div className="card metric-card amber">
                    <div className="metric-header"><span className="metric-label">F1 Macro</span><span className="metric-badge up">+1.5%</span></div>
                    <div className="metric-value">{(metrics.f1_macro * 100).toFixed(1)}<span className="metric-unit">%</span></div>
                    <div className="metric-sub">Balanced across classes</div>
                </div>
                <div className="card metric-card violet">
                    <div className="metric-header"><span className="metric-label">MCC Score</span><span className="metric-badge up">Strong</span></div>
                    <div className="metric-value">{metrics.mcc.toFixed(3)}</div>
                    <div className="metric-sub">Matthews Correlation Coefficient</div>
                </div>
            </div>

            <div className="charts-row">
                <div className="card chart-card">
                    <div className="chart-header">
                        <div><div className="chart-title">Training Loss</div><div className="chart-subtitle">Loss convergence — {timescale === "epoch" ? "per epoch" : timescale} view</div></div>
                        <div className="chart-legend">
                            <div className="legend-item"><div className="legend-dot" style={{ background: '#22d3ee' }} /> Train</div>
                            <div className="legend-item"><div className="legend-dot" style={{ background: '#a78bfa' }} /> Validation</div>
                        </div>
                    </div>
                    <MetricsChart data={chartData} lines={[{ key: "train_loss", color: "#22d3ee", name: "Train Loss" }, { key: "val_loss", color: "#a78bfa", name: "Val Loss" }]} xKey={xKey} areaFill />
                </div>
                <div className="card chart-card">
                    <div className="chart-header">
                        <div><div className="chart-title">Precision-Recall Curve</div><div className="chart-subtitle">PR AUC = 0.961 · weighted average across 4 classes</div></div>
                    </div>
                    <PRAUCChart data={prData} />
                </div>
            </div>

            <div className="bottom-row">
                <div className="card section-card"><div className="section-title">Pipeline Status</div><PipelineStatus steps={pipeline} /></div>
                <div className="card section-card"><div className="section-title">Model Information</div><ModelCard /></div>
                <div className="card section-card"><div className="section-title">Confusion Matrix</div><ConfusionMatrix matrix={confusion} labels={labels} /></div>
            </div>
        </>
    );
}

/* ─── TRAINING PAGE ─── */
function TrainingPage({ history, timescale, setTimescale }) {
    const { data: chartData, xKey } = useTimescaledData(history, timescale);

    const lossLines = [{ key: "train_loss", color: "#22d3ee", name: "Train" }, { key: "val_loss", color: "#a78bfa", name: "Val" }];
    const accLines = [{ key: "train_acc", color: "#34d399", name: "Train Acc" }, { key: "val_acc", color: "#fbbf24", name: "Val Acc" }, { key: "val_f1", color: "#fb7185", name: "Val F1" }];

    return (
        <>
            <div className="page-header-bar">
                <h3>Training History</h3>
                <p className="page-desc">All training runs and their performance metrics</p>
            </div>

            <TimescaleBar timescale={timescale} setTimescale={setTimescale} />

            <div className="charts-row">
                <div className="card chart-card">
                    <div className="chart-header">
                        <div><div className="chart-title">Loss Convergence</div><div className="chart-subtitle">{timescale === "epoch" ? "Per epoch" : timescale === "daily" ? "Daily average" : "Weekly average"}</div></div>
                        <div className="chart-legend">
                            {lossLines.map(l => <div key={l.key} className="legend-item"><div className="legend-dot" style={{ background: l.color }} />{l.name}</div>)}
                        </div>
                    </div>
                    <MetricsChart data={chartData} lines={lossLines} xKey={xKey} areaFill />
                </div>
                <div className="card chart-card">
                    <div className="chart-header">
                        <div><div className="chart-title">Accuracy & F1</div><div className="chart-subtitle">{timescale === "epoch" ? "Per epoch" : timescale === "daily" ? "Daily snapshots" : "Weekly snapshots"}</div></div>
                        <div className="chart-legend">
                            {accLines.map(l => <div key={l.key} className="legend-item"><div className="legend-dot" style={{ background: l.color }} />{l.name}</div>)}
                        </div>
                    </div>
                    <MetricsChart data={chartData} lines={accLines} xKey={xKey} areaFill />
                </div>
            </div>

            <div className="card section-card">
                <div className="section-title">Recent Training Runs</div>
                <table className="data-table">
                    <thead><tr><th>Run ID</th><th>Started</th><th>Duration</th><th>Epochs</th><th>Best Loss</th><th>Best Acc</th><th>Status</th></tr></thead>
                    <tbody>
                        <tr><td className="mono">run-20260220-153412</td><td>Feb 20, 2026 15:34</td><td>34m 12s</td><td>3</td><td>0.14</td><td>95.3%</td><td><span className="status-chip success">Completed</span></td></tr>
                        <tr><td className="mono">run-20260219-091802</td><td>Feb 19, 2026 09:18</td><td>31m 44s</td><td>3</td><td>0.18</td><td>93.1%</td><td><span className="status-chip success">Completed</span></td></tr>
                        <tr><td className="mono">run-20260218-142530</td><td>Feb 18, 2026 14:25</td><td>18m 06s</td><td>2/3</td><td>0.25</td><td>90.8%</td><td><span className="status-chip warning">Stopped</span></td></tr>
                    </tbody>
                </table>
            </div>
        </>
    );
}

/* ─── MODELS PAGE ─── */
function ModelsPage() {
    return (
        <>
            <div className="page-header-bar"><h3>Model Registry</h3><p className="page-desc">Registered models and their versions</p></div>
            <div className="metrics-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '1rem' }}>
                <div className="card metric-card cyan"><div className="metric-header"><span className="metric-label">Total Models</span></div><div className="metric-value">3</div><div className="metric-sub">Across 1 architecture</div></div>
                <div className="card metric-card emerald"><div className="metric-header"><span className="metric-label">Production</span></div><div className="metric-value">v3</div><div className="metric-sub">Current serving version</div></div>
                <div className="card metric-card amber"><div className="metric-header"><span className="metric-label">Avg Size</span></div><div className="metric-value">255<span className="metric-unit">MB</span></div><div className="metric-sub">DistilBERT base</div></div>
            </div>
            <div className="card section-card">
                <div className="section-title">All Versions</div>
                <table className="data-table">
                    <thead><tr><th>Model</th><th>Version</th><th>Accuracy</th><th>F1</th><th>MCC</th><th>Size</th><th>Status</th></tr></thead>
                    <tbody>
                        <tr><td>distilbert-agnews</td><td className="mono">v3</td><td>91.4%</td><td>91.3%</td><td>0.886</td><td>255 MB</td><td><span className="status-chip success">Production</span></td></tr>
                        <tr><td>distilbert-agnews</td><td className="mono">v2</td><td>90.8%</td><td>90.6%</td><td>0.877</td><td>255 MB</td><td><span className="status-chip muted">Archived</span></td></tr>
                        <tr><td>distilbert-agnews</td><td className="mono">v1</td><td>88.9%</td><td>88.8%</td><td>0.852</td><td>255 MB</td><td><span className="status-chip muted">Archived</span></td></tr>
                    </tbody>
                </table>
            </div>
        </>
    );
}

/* ─── ENDPOINTS PAGE ─── */
function EndpointsPage() {
    return (
        <>
            <div className="page-header-bar"><h3>Endpoints</h3><p className="page-desc">SageMaker inference endpoints</p></div>
            <div className="card section-card">
                <div className="empty-state">
                    <div className="empty-icon">{Icons.endpoints}</div>
                    <h4>No Active Endpoints</h4>
                    <p>SageMaker endpoints are disabled in Terraform to avoid costs. Uncomment in <code>sagemaker.tf</code> and run <code>terraform apply</code> when ready.</p>
                </div>
            </div>
            <div className="card section-card" style={{ marginTop: '1rem' }}>
                <div className="section-title">Endpoint Pricing Estimate</div>
                <table className="data-table">
                    <thead><tr><th>Instance</th><th>vCPU</th><th>Memory</th><th>Price/hr</th><th>Monthly (24/7)</th></tr></thead>
                    <tbody>
                        <tr><td className="mono">ml.t2.medium</td><td>2</td><td>4 GB</td><td>$0.065</td><td>$47.45</td></tr>
                        <tr><td className="mono">ml.m5.large</td><td>2</td><td>8 GB</td><td>$0.134</td><td>$97.82</td></tr>
                        <tr><td className="mono">ml.m5.xlarge</td><td>4</td><td>16 GB</td><td>$0.269</td><td>$196.37</td></tr>
                    </tbody>
                </table>
            </div>
        </>
    );
}

/* ─── DATA PAGE ─── */
function DataPage({ pipeline }) {
    return (
        <>
            <div className="page-header-bar"><h3>Data Pipeline</h3><p className="page-desc">Data ingestion, preprocessing, and storage on S3</p></div>
            <div className="metrics-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="card metric-card cyan"><div className="metric-header"><span className="metric-label">Total Samples</span></div><div className="metric-value">120<span className="metric-unit">K</span></div><div className="metric-sub">AG News dataset</div></div>
                <div className="card metric-card emerald"><div className="metric-header"><span className="metric-label">Train Split</span></div><div className="metric-value">96<span className="metric-unit">K</span></div><div className="metric-sub">80% · 27 MB</div></div>
                <div className="card metric-card amber"><div className="metric-header"><span className="metric-label">Validation</span></div><div className="metric-value">12<span className="metric-unit">K</span></div><div className="metric-sub">10% · 3.3 MB</div></div>
                <div className="card metric-card violet"><div className="metric-header"><span className="metric-label">Test</span></div><div className="metric-value">12<span className="metric-unit">K</span></div><div className="metric-sub">10% · 3.3 MB</div></div>
            </div>
            <div className="card section-card" style={{ marginTop: '1rem' }}>
                <div className="section-title">Pipeline Steps</div>
                <PipelineStatus steps={pipeline} />
            </div>
            <div className="card section-card" style={{ marginTop: '1rem' }}>
                <div className="section-title">S3 Storage</div>
                <table className="data-table">
                    <thead><tr><th>Bucket</th><th>Files</th><th>Size</th><th>Last Modified</th><th>Status</th></tr></thead>
                    <tbody>
                        <tr><td className="mono">llmop-ml-data-dev</td><td>5</td><td>70.4 MB</td><td>Feb 20, 19:00</td><td><span className="status-chip success">Synced</span></td></tr>
                        <tr><td className="mono">llmop-ml-models-dev</td><td>0</td><td>—</td><td>—</td><td><span className="status-chip muted">Awaiting training</span></td></tr>
                        <tr><td className="mono">llmop-ml-metrics-dev</td><td>2</td><td>1.7 KB</td><td>Feb 20, 19:00</td><td><span className="status-chip success">Synced</span></td></tr>
                    </tbody>
                </table>
            </div>
        </>
    );
}

/* ─── INFRA PAGE ─── */
function InfraPage() {
    return (
        <>
            <div className="page-header-bar"><h3>Infrastructure</h3><p className="page-desc">AWS resources provisioned via Terraform in us-east-1</p></div>
            <div className="metrics-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '1rem' }}>
                <div className="card metric-card emerald"><div className="metric-header"><span className="metric-label">Resources</span></div><div className="metric-value">28</div><div className="metric-sub">Terraform managed</div></div>
                <div className="card metric-card cyan"><div className="metric-header"><span className="metric-label">Monthly Cost</span></div><div className="metric-value">$0<span className="metric-unit">.00</span></div><div className="metric-sub">Within Free Tier</div></div>
                <div className="card metric-card amber"><div className="metric-header"><span className="metric-label">Region</span></div><div className="metric-value" style={{ fontSize: '1.2rem' }}>us-east-1</div><div className="metric-sub">N. Virginia</div></div>
            </div>
            <div className="card section-card">
                <div className="section-title">Provisioned Resources</div>
                <table className="data-table">
                    <thead><tr><th>Service</th><th>Resource</th><th>Name</th><th>Status</th></tr></thead>
                    <tbody>
                        <tr><td>S3</td><td>Bucket</td><td className="mono">llmop-ml-data-dev</td><td><span className="status-chip success">Active</span></td></tr>
                        <tr><td>S3</td><td>Bucket</td><td className="mono">llmop-ml-models-dev</td><td><span className="status-chip success">Active</span></td></tr>
                        <tr><td>S3</td><td>Bucket</td><td className="mono">llmop-ml-metrics-dev</td><td><span className="status-chip success">Active</span></td></tr>
                        <tr><td>ECR</td><td>Repository</td><td className="mono">llmop-training-dev</td><td><span className="status-chip success">Active</span></td></tr>
                        <tr><td>IAM</td><td>Role</td><td className="mono">llmop-sagemaker-execution-dev</td><td><span className="status-chip success">Active</span></td></tr>
                        <tr><td>IAM</td><td>Role</td><td className="mono">llmop-lambda-execution-dev</td><td><span className="status-chip success">Active</span></td></tr>
                        <tr><td>Lambda</td><td>Function</td><td className="mono">llmop-pipeline-trigger-dev</td><td><span className="status-chip success">Active</span></td></tr>
                        <tr><td>CloudWatch</td><td>Dashboard</td><td className="mono">llmop-dashboard-dev</td><td><span className="status-chip success">Active</span></td></tr>
                        <tr><td>CloudWatch</td><td>Alarm</td><td className="mono">training-failures</td><td><span className="status-chip success">OK</span></td></tr>
                        <tr><td>CloudWatch</td><td>Alarm</td><td className="mono">lambda-errors</td><td><span className="status-chip success">OK</span></td></tr>
                        <tr><td>SageMaker</td><td>Model</td><td className="mono">—</td><td><span className="status-chip muted">Pending image</span></td></tr>
                        <tr><td>SageMaker</td><td>Endpoint</td><td className="mono">—</td><td><span className="status-chip muted">Disabled</span></td></tr>
                    </tbody>
                </table>
            </div>
        </>
    );
}

/* ─── SETTINGS PAGE ─── */
function SettingsPage() {
    return (
        <>
            <div className="page-header-bar"><h3>Settings</h3><p className="page-desc">Project configuration and environment details</p></div>
            <div className="charts-row">
                <div className="card section-card">
                    <div className="section-title">Model Configuration</div>
                    <ModelCard />
                </div>
                <div className="card section-card">
                    <div className="section-title">Environment</div>
                    <div className="info-row"><span className="info-label">Project Name</span><span className="info-value">llmop</span></div>
                    <div className="info-row"><span className="info-label">Environment</span><span className="info-value">dev</span></div>
                    <div className="info-row"><span className="info-label">AWS Region</span><span className="info-value">us-east-1</span></div>
                    <div className="info-row"><span className="info-label">Account ID</span><span className="info-value">396081123986</span></div>
                    <div className="info-row"><span className="info-label">ECR Registry</span><span className="info-value">public.ecr.aws/b3e7b0p8</span></div>
                    <div className="info-row"><span className="info-label">SageMaker Role</span><span className="info-value" style={{ fontSize: '0.68rem' }}>llmop-sagemaker-execution-dev</span></div>
                    <div className="info-row"><span className="info-label">Terraform State</span><span className="info-value">Local</span></div>
                    <div className="info-row"><span className="info-label">Dashboard</span><span className="info-value">Netlify</span></div>
                </div>
            </div>
            <div className="card section-card" style={{ marginTop: '1rem' }}>
                <div className="section-title">CI/CD Pipelines</div>
                <table className="data-table">
                    <thead><tr><th>Workflow</th><th>Trigger</th><th>Actions</th><th>File</th></tr></thead>
                    <tbody>
                        <tr><td>CI</td><td>Push / PR</td><td>Lint → Test → Docker Build</td><td className="mono">ci.yml</td></tr>
                        <tr><td>Terraform</td><td>Push to main (terraform/)</td><td>Plan → Apply</td><td className="mono">terraform.yml</td></tr>
                        <tr><td>ML Pipeline</td><td>Push to main (src/) / Manual</td><td>Build → ECR → SageMaker</td><td className="mono">ml-pipeline.yml</td></tr>
                    </tbody>
                </table>
            </div>
        </>
    );
}

export default App;
