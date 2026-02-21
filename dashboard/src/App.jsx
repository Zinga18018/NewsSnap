import React, { useState, useEffect } from "react";
import MetricsChart from "./components/MetricsChart";
import PipelineStatus from "./components/PipelineStatus";
import ModelCard from "./components/ModelCard";
import ConfusionMatrix from "./components/ConfusionMatrix";
import PRAUCChart from "./components/PRAUCChart";

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
};

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
    const [activePeriod, setActivePeriod] = useState("all");

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
            } catch (err) {
                console.log("Using demo data:", err.message);
            }
        };
        fetchMetrics();
        const interval = setInterval(fetchMetrics, 60000);
        return () => clearInterval(interval);
    }, []);

    const navItems = [
        { id: "insights", icon: Icons.insights, label: "Insights" },
        { id: "training", icon: Icons.training, label: "Training Jobs" },
        { id: "models", icon: Icons.models, label: "Model Registry" },
        { id: "endpoints", icon: Icons.endpoints, label: "Endpoints" },
        { id: "data", icon: Icons.data, label: "Data Pipeline" },
    ];

    const navBottom = [
        { id: "infra", icon: Icons.infra, label: "Infrastructure" },
        { id: "settings", icon: Icons.settings, label: "Settings" },
    ];

    const renderPageContent = () => {
        switch (activeNav) {
            case "insights":
                return <InsightsPage metrics={metrics} history={history} prData={prData} confusion={confusion} labels={labels} pipeline={pipeline} activePeriod={activePeriod} setActivePeriod={setActivePeriod} />;
            case "training":
                return <TrainingPage history={history} />;
            case "models":
                return <ModelsPage />;
            case "endpoints":
                return <EndpointsPage />;
            case "data":
                return <DataPage pipeline={pipeline} />;
            case "infra":
                return <InfraPage />;
            case "settings":
                return <SettingsPage />;
            default:
                return <InsightsPage metrics={metrics} history={history} prData={prData} confusion={confusion} labels={labels} pipeline={pipeline} activePeriod={activePeriod} setActivePeriod={setActivePeriod} />;
        }
    };

    const pageTitle = navItems.find(n => n.id === activeNav)?.label || navBottom.find(n => n.id === activeNav)?.label || "Dashboard";

    return (
        <div className="app-layout">
            {/* ── Sidebar ── */}
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <div className="brand-icon">{Icons.zap}</div>
                    <span className="brand-name">LLMOps</span>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section-label">Overview</div>
                    {navItems.map((item) => (
                        <div key={item.id} className={`nav-item ${activeNav === item.id ? "active" : ""}`} onClick={() => setActiveNav(item.id)}>
                            <span className="icon">{item.icon}</span>
                            {item.label}
                        </div>
                    ))}
                    <div className="nav-section-label" style={{ marginTop: "0.5rem" }}>System</div>
                    {navBottom.map((item) => (
                        <div key={item.id} className={`nav-item ${activeNav === item.id ? "active" : ""}`} onClick={() => setActiveNav(item.id)}>
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
                <div className="topbar">
                    <div className="topbar-left">
                        <h2>{pageTitle}</h2>
                    </div>
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

                <div className="page-content">
                    {renderPageContent()}
                </div>
            </main>
        </div>
    );
}

/* ─── INSIGHTS PAGE ─── */
function InsightsPage({ metrics, history, prData, confusion, labels, pipeline, activePeriod, setActivePeriod }) {
    return (
        <>
            <div className="cost-banner">
                <span className="cost-icon">{Icons.dollar}</span>
                <span><strong>Free Tier Active</strong> — S3, Lambda, CloudWatch, ECR all within AWS Free Tier. No charges incurred.</span>
            </div>

            <div className="config-bar">
                <button className="nav-pill active">{Icons.arrowNav} Navigate</button>
                <button className="nav-pill">{Icons.configure} Configure</button>
                <div className="spacer" />
                {["Per Epoch", "Daily", "Weekly"].map(p => (
                    <button key={p} className={`period-pill ${activePeriod === p.toLowerCase().replace(' ', '') ? 'active' : ''}`} onClick={() => setActivePeriod(p.toLowerCase().replace(' ', ''))}>{p}</button>
                ))}
                <button className="filter-btn">{Icons.filter} Filter</button>
            </div>

            <div className="metrics-row">
                <div className="card metric-card cyan">
                    <div className="metric-header"><span className="metric-label">Accuracy</span><span className="metric-badge up">+2.1%</span></div>
                    <div className="metric-value">{(metrics.accuracy * 100).toFixed(1)}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>%</span></div>
                    <div className="metric-sub">Best in last 3 epochs</div>
                </div>
                <div className="card metric-card emerald">
                    <div className="metric-header"><span className="metric-label">F1 Weighted</span><span className="metric-badge up">+1.8%</span></div>
                    <div className="metric-value">{(metrics.f1_weighted * 100).toFixed(1)}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>%</span></div>
                    <div className="metric-sub">Target met</div>
                </div>
                <div className="card metric-card amber">
                    <div className="metric-header"><span className="metric-label">F1 Macro</span><span className="metric-badge up">+1.5%</span></div>
                    <div className="metric-value">{(metrics.f1_macro * 100).toFixed(1)}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>%</span></div>
                    <div className="metric-sub">Balanced across classes</div>
                </div>
                <div className="card metric-card violet">
                    <div className="metric-header"><span className="metric-label">MCC Score</span><span className="metric-badge up">Strong</span></div>
                    <div className="metric-value">{metrics.mcc.toFixed(3)}</div>
                    <div className="metric-sub">Matthews Correlation</div>
                </div>
            </div>

            <div className="charts-row">
                <div className="card chart-card">
                    <div className="chart-header">
                        <div><div className="chart-title">Training Loss</div><div className="chart-subtitle">Loss convergence over epochs</div></div>
                        <div className="chart-legend">
                            <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--accent-cyan)' }} /> Train</div>
                            <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--accent-violet)' }} /> Val</div>
                        </div>
                    </div>
                    <MetricsChart data={history} lines={[{ key: "train_loss", color: "#22d3ee", name: "Train Loss" }, { key: "val_loss", color: "#a78bfa", name: "Val Loss" }]} xKey="epoch" areaFill />
                </div>
                <div className="card chart-card">
                    <div className="chart-header">
                        <div><div className="chart-title">Precision-Recall Curve</div><div className="chart-subtitle">PR AUC = 0.961 (weighted avg)</div></div>
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
function TrainingPage({ history }) {
    return (
        <>
            <div className="page-header-bar"><h3>Training History</h3><p className="page-desc">All training runs and their performance metrics</p></div>
            <div className="card section-card" style={{ marginBottom: '1rem' }}>
                <div className="section-title">Loss Over Epochs</div>
                <MetricsChart data={history} lines={[{ key: "train_loss", color: "#22d3ee", name: "Train" }, { key: "val_loss", color: "#a78bfa", name: "Val" }]} xKey="epoch" areaFill />
            </div>
            <div className="card section-card">
                <div className="section-title">Recent Training Runs</div>
                <table className="data-table">
                    <thead><tr><th>Run ID</th><th>Date</th><th>Epochs</th><th>Best Loss</th><th>Best Acc</th><th>Status</th></tr></thead>
                    <tbody>
                        <tr><td className="mono">run-20260220</td><td>Feb 20, 2026</td><td>3</td><td>0.14</td><td>95.3%</td><td><span className="status-chip success">Completed</span></td></tr>
                        <tr><td className="mono">run-20260219</td><td>Feb 19, 2026</td><td>3</td><td>0.18</td><td>93.1%</td><td><span className="status-chip success">Completed</span></td></tr>
                        <tr><td className="mono">run-20260218</td><td>Feb 18, 2026</td><td>2</td><td>0.25</td><td>90.8%</td><td><span className="status-chip warning">Stopped early</span></td></tr>
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
            <div className="card section-card">
                <table className="data-table">
                    <thead><tr><th>Model</th><th>Version</th><th>Accuracy</th><th>F1</th><th>Size</th><th>Status</th></tr></thead>
                    <tbody>
                        <tr><td>distilbert-agnews</td><td>v3</td><td>91.4%</td><td>91.3%</td><td>255 MB</td><td><span className="status-chip success">Production</span></td></tr>
                        <tr><td>distilbert-agnews</td><td>v2</td><td>90.8%</td><td>90.6%</td><td>255 MB</td><td><span className="status-chip muted">Archived</span></td></tr>
                        <tr><td>distilbert-agnews</td><td>v1</td><td>88.9%</td><td>88.8%</td><td>255 MB</td><td><span className="status-chip muted">Archived</span></td></tr>
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
                    <p>SageMaker endpoints are commented out in Terraform to avoid costs.<br />Uncomment in <code>sagemaker.tf</code> when ready to deploy.</p>
                </div>
            </div>
        </>
    );
}

/* ─── DATA PAGE ─── */
function DataPage({ pipeline }) {
    return (
        <>
            <div className="page-header-bar"><h3>Data Pipeline</h3><p className="page-desc">Data ingestion, preprocessing, and storage</p></div>
            <div className="metrics-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="card metric-card cyan"><div className="metric-header"><span className="metric-label">Training Samples</span></div><div className="metric-value">96,000</div></div>
                <div className="card metric-card emerald"><div className="metric-header"><span className="metric-label">Validation Samples</span></div><div className="metric-value">12,000</div></div>
                <div className="card metric-card amber"><div className="metric-header"><span className="metric-label">Test Samples</span></div><div className="metric-value">12,000</div></div>
            </div>
            <div className="card section-card" style={{ marginTop: '1rem' }}>
                <div className="section-title">Pipeline Steps</div>
                <PipelineStatus steps={pipeline} />
            </div>
            <div className="card section-card" style={{ marginTop: '1rem' }}>
                <div className="section-title">S3 Storage</div>
                <table className="data-table">
                    <thead><tr><th>Bucket</th><th>Files</th><th>Size</th><th>Status</th></tr></thead>
                    <tbody>
                        <tr><td className="mono">llmop-ml-data-dev</td><td>5</td><td>~70 MB</td><td><span className="status-chip success">Synced</span></td></tr>
                        <tr><td className="mono">llmop-ml-models-dev</td><td>0</td><td>—</td><td><span className="status-chip muted">Pending</span></td></tr>
                        <tr><td className="mono">llmop-ml-metrics-dev</td><td>2</td><td>~1.7 KB</td><td><span className="status-chip success">Synced</span></td></tr>
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
            <div className="page-header-bar"><h3>Infrastructure</h3><p className="page-desc">AWS resources provisioned via Terraform</p></div>
            <div className="card section-card">
                <table className="data-table">
                    <thead><tr><th>Resource</th><th>Name</th><th>Region</th><th>Status</th></tr></thead>
                    <tbody>
                        <tr><td>S3 Bucket</td><td className="mono">llmop-ml-data-dev</td><td>us-east-1</td><td><span className="status-chip success">Active</span></td></tr>
                        <tr><td>S3 Bucket</td><td className="mono">llmop-ml-models-dev</td><td>us-east-1</td><td><span className="status-chip success">Active</span></td></tr>
                        <tr><td>S3 Bucket</td><td className="mono">llmop-ml-metrics-dev</td><td>us-east-1</td><td><span className="status-chip success">Active</span></td></tr>
                        <tr><td>ECR Repository</td><td className="mono">llmop-training-dev</td><td>us-east-1</td><td><span className="status-chip success">Active</span></td></tr>
                        <tr><td>IAM Role</td><td className="mono">llmop-sagemaker-execution</td><td>Global</td><td><span className="status-chip success">Active</span></td></tr>
                        <tr><td>Lambda Function</td><td className="mono">llmop-pipeline-trigger</td><td>us-east-1</td><td><span className="status-chip success">Active</span></td></tr>
                        <tr><td>CloudWatch Dashboard</td><td className="mono">llmop-dashboard-dev</td><td>us-east-1</td><td><span className="status-chip success">Active</span></td></tr>
                        <tr><td>SageMaker Model</td><td className="mono">—</td><td>us-east-1</td><td><span className="status-chip muted">Not deployed</span></td></tr>
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
            <div className="page-header-bar"><h3>Settings</h3><p className="page-desc">Project configuration and preferences</p></div>
            <div className="card section-card">
                <div className="section-title">Model Configuration</div>
                <ModelCard />
            </div>
            <div className="card section-card" style={{ marginTop: '1rem' }}>
                <div className="section-title">Environment</div>
                <div className="info-row"><span className="info-label">Project Name</span><span className="info-value">llmop</span></div>
                <div className="info-row"><span className="info-label">Environment</span><span className="info-value">dev</span></div>
                <div className="info-row"><span className="info-label">Region</span><span className="info-value">us-east-1</span></div>
                <div className="info-row"><span className="info-label">Account ID</span><span className="info-value">396081123986</span></div>
            </div>
        </>
    );
}

export default App;
