import React, { useState, useEffect } from "react";
import MetricsChart from "./components/MetricsChart";

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
    filter: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>,
    zap: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" /></svg>,
    dollar: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
    arrowNav: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>,
    configure: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 21v-7" /><path d="M4 10V3" /><path d="M12 21v-9" /><path d="M12 8V3" /><path d="M20 21v-5" /><path d="M20 12V3" /><circle cx="4" cy="12" r="2" /><circle cx="12" cy="8" r="2" /><circle cx="20" cy="14" r="2" /></svg>,
    refresh: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></svg>,
    clock: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
    testmodel: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="6 3 20 12 6 21 6 3" /></svg>,
};

import bundledEvaluation from "../../evidence/evaluation_results.json";
import bundledHistory from "../../evidence/training_history.json";
import provenance from "../../evidence/provenance.json";
import { resolveArtifacts } from "./api/artifactData";
const METRICS_URL = (import.meta.env.VITE_METRICS_URL || "/metrics").replace(/\/$/, "");
const SOURCE_BASE = "https://github.com/Zinga18018/NewsSnap/blob/master";
const number = (value, digits = 1) => typeof value === "number" ? value.toFixed(digits) : "—";
const percent = (value) => typeof value === "number" ? `${(value * 100).toFixed(2)}%` : "—";

function App() {
    const [artifacts, setArtifacts] = useState(() => resolveArtifacts({ bundledEvaluation, bundledHistory }));
    const [activeNav, setActiveNav] = useState("insights");
    const [lastChecked, setLastChecked] = useState(null);

    useEffect(() => {
        const controller = new AbortController();
        const load = async (filename) => {
            try {
                const response = await fetch(`${METRICS_URL}/${filename}`, { signal: controller.signal });
                return response.ok ? await response.json() : null;
            } catch { return null; }
        };
        const fetchArtifacts = async () => {
            const [evaluationPayload, historyPayload] = await Promise.all([
                load("latest_evaluation.json"), load("latest_metrics.json"),
            ]);
            if (controller.signal.aborted) return;
            setArtifacts(resolveArtifacts({ bundledEvaluation, bundledHistory, evaluationPayload, historyPayload }));
            setLastChecked(new Date());
        };
        fetchArtifacts();
        const interval = setInterval(fetchArtifacts, 30000);
        return () => { controller.abort(); clearInterval(interval); };
    }, []);

    const navItems = [
        { id: "insights", icon: Icons.insights, label: "Evaluation Record" },
        { id: "training", icon: Icons.training, label: "Training Record" },
        { id: "models", icon: Icons.models, label: "Model Provenance" },
        { id: "testmodel", icon: Icons.testmodel, label: "Test Model" },
        { id: "data", icon: Icons.data, label: "Data & Limitations" },
        { id: "infra", icon: Icons.infra, label: "Deployment Guide" },
    ];
    const pages = {
        insights: <InsightsPage artifacts={artifacts} lastChecked={lastChecked} />,
        training: <TrainingPage artifacts={artifacts} lastChecked={lastChecked} />,
        models: <ModelsPage />,
        testmodel: <TestModelPage />,
        data: <DataPage />,
        infra: <DeploymentPage />,
    };
    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="sidebar-brand"><div className="brand-icon">{Icons.zap}</div><span className="brand-name">NewsSnap</span></div>
                <nav className="sidebar-nav">
                    <div className="nav-section-label">Project evidence</div>
                    {navItems.map((item) => (
                        <button type="button" key={item.id} className={`nav-item ${activeNav === item.id ? "active" : ""}`}
                            style={{ border: 0, textAlign: "left", background: activeNav === item.id ? undefined : "transparent" }}
                            onClick={() => setActiveNav(item.id)}>
                            <span className="icon">{item.icon}</span>{item.label}
                        </button>
                    ))}
                </nav>
                <div className="sidebar-footer"><span className="version">DistilBERT · historical AG News experiment</span></div>
            </aside>
            <main className="main-content">
                <div className="topbar"><div className="topbar-left"><h2>{navItems.find((item) => item.id === activeNav)?.label}</h2></div></div>
                <div className="page-content">{pages[activeNav]}</div>
            </main>
        </div>
    );
}

function SourceLink({ path, children }) {
    return <a href={`${SOURCE_BASE}/${path}`} target="_blank" rel="noreferrer">{children}</a>;
}

function EvidenceNotice() {
    return <div className="metrics-source-banner demo">
        <strong>Historical experiment.</strong>
        <span>The saved February 2026 checkpoint used 512 training examples and 128 validation examples for one epoch.
            Original sampled row IDs were not saved; overlap with the evaluation split is not established.
            These records do not measure current traffic or cloud uptime.</span>
    </div>;
}

function DataRefreshBar({ lastChecked, source }) {
    return <div className="config-bar">
        <div className="refresh-info"><span className="icon-inline">{Icons.clock}</span>
            <span className="refresh-text">{lastChecked ? `Files last checked ${lastChecked.toLocaleTimeString()}` : "Showing bundled evidence"}</span></div>
        <div className="spacer" />
        <span className="source-chip demo">{source}</span>
        <button className="refresh-btn" onClick={() => window.location.reload()} title="Check saved files again">{Icons.refresh}</button>
    </div>;
}

function InsightsPage({ artifacts, lastChecked }) {
    const { evaluation, history, evaluationSource, historySource } = artifacts;
    const metrics = evaluation?.metrics ?? {};
    return <>
        <EvidenceNotice />
        <DataRefreshBar lastChecked={lastChecked} source={evaluationSource} />
        <p className="page-desc">Evaluation record: {evaluation?.timestamp?.slice(0, 10) || "date not supplied"}.
            {evaluation?.sampleCount ? ` ${evaluation.sampleCount.toLocaleString()} articles in the supplied evaluation file.` : " Sample count unavailable."}
            {" "}The bundled record uses a project-created AG News split, not its official test split.</p>
        <div className="metrics-row">
            {[
                ["Accuracy", percent(metrics.accuracy), "Reported evaluation result", "cyan"],
                ["F1 weighted", percent(metrics.f1_weighted), "Reported evaluation result", "emerald"],
                ["F1 macro", percent(metrics.f1_macro), "Reported evaluation result", "amber"],
                ["MCC", number(metrics.mcc, 3), "Reported evaluation result", "violet"],
            ].map(([label, value, detail, color]) => <div className={`card metric-card ${color}`} key={label}>
                <div className="metric-header"><span className="metric-label">{label}</span><span className="metric-badge">Saved</span></div>
                <div className="metric-value">{value}</div><div className="metric-sub">{detail}</div>
            </div>)}
        </div>
        <div className="charts-row">
            <div className="card chart-card"><div className="chart-header"><div><div className="chart-title">Recorded training loss</div>
                <div className="chart-subtitle">{historySource} · {history.length} recorded epoch{history.length === 1 ? "" : "s"}</div></div></div>
                <MetricsChart data={history} lines={[{ key: "train_loss", color: "#22d3ee", name: "Train loss" }, { key: "val_loss", color: "#a78bfa", name: "Validation loss" }]} areaFill />
            </div>
            <div className="card chart-card"><div className="chart-header"><div><div className="chart-title">Precision-recall curve</div>
                <div className="chart-subtitle">{evaluation?.prData ? "Curve supplied by the selected artifact; averaging method not verified" : "No curve is present in the selected artifact"}</div></div></div>
                {evaluation?.prData ? <PRAUCChart data={evaluation.prData} /> : <div className="empty-state"><h4>No measured curve available</h4><p>A scalar accuracy or F1 value cannot reconstruct a precision-recall curve.</p></div>}
            </div>
        </div>
        <div className="charts-row">
            <div className="card section-card"><div className="section-title">Historical model information</div><ModelCard /></div>
            <div className="card section-card"><div className="section-title">Saved confusion matrix</div>
                <p className="page-desc">Rows: actual category. Columns: predicted category.</p>
                {evaluation?.confusion ? <ConfusionMatrix matrix={evaluation.confusion} labels={evaluation.labels} /> : <div className="empty-state"><h4>Matrix unavailable</h4><p>The selected file must include a valid matrix, labels, and consistent counts.</p></div>}
            </div>
        </div>
        <p className="page-desc"><SourceLink path="evidence/evaluation_results.json">Original evaluation record</SourceLink>{" · "}
            <SourceLink path="evidence/provenance.json">Training and overlap provenance</SourceLink></p>
    </>;
}

function TrainingPage({ artifacts, lastChecked }) {
    const { history, historySource } = artifacts;
    return <>
        <EvidenceNotice />
        <DataRefreshBar lastChecked={lastChecked} source={historySource} />
        <div className="page-header-bar"><h3>Recorded training history</h3><p className="page-desc">The bundled log contains one epoch on 512 training and 128 validation examples. Fetching the file does not start or observe a training job.</p></div>
        <div className="charts-row">
            <div className="card chart-card"><div className="chart-title">Training and validation loss</div>
                <MetricsChart data={history} lines={[{ key: "train_loss", color: "#22d3ee", name: "Train" }, { key: "val_loss", color: "#a78bfa", name: "Validation" }]} areaFill /></div>
            <div className="card chart-card"><div className="chart-title">Recorded accuracy and F1</div>
                <MetricsChart data={history} lines={[{ key: "train_acc", color: "#34d399", name: "Train accuracy" }, { key: "val_acc", color: "#fbbf24", name: "Validation accuracy" }, { key: "val_f1", color: "#fb7185", name: "Validation F1" }]} /></div>
        </div>
        <div className="card section-card"><div className="section-title">Rows in the selected history file</div>
            <table className="data-table"><thead><tr><th>Epoch</th><th>Train loss</th><th>Validation loss</th><th>Train accuracy</th><th>Validation accuracy</th><th>Validation F1</th></tr></thead>
                <tbody>{history.map((row) => <tr key={row.epoch}><td>{row.epoch}</td><td>{number(row.train_loss, 4)}</td><td>{number(row.val_loss, 4)}</td><td>{percent(row.train_acc)}</td><td>{percent(row.val_acc)}</td><td>{number(row.val_f1, 4)}</td></tr>)}</tbody>
            </table>
        </div>
        <p className="page-desc"><SourceLink path="evidence/training_history.json">Original epoch values</SourceLink>{" · "}<SourceLink path="evidence/provenance.json">Recovered run provenance</SourceLink></p>
    </>;
}

function ModelsPage() {
    const record = provenance.checkpoint;
    return <>
        <EvidenceNotice />
        <div className="page-header-bar"><h3>Historical checkpoint record</h3><p className="page-desc">This view describes the saved checkpoint. It is not connected to a production model registry.</p></div>
        <div className="charts-row"><div className="card section-card"><div className="section-title">Training configuration</div><ModelCard /></div>
            <div className="card section-card"><div className="section-title">Artifact identity</div>
                <p className="page-desc">Checkpoint: <code>{record.id}</code></p>
                <p className="page-desc">Recorded size: {record.bytes.toLocaleString()} bytes · {record.format}</p>
                <p className="page-desc">SHA-256: <code style={{ overflowWrap: "anywhere" }}>{record.sha256}</code></p>
                <p className="page-desc">A file hash identifies the recorded artifact; it does not establish a current deployment or leakage-free evaluation.</p>
                <SourceLink path="evidence/provenance.json">Inspect the complete provenance record</SourceLink>
            </div></div>
    </>;
}

function DataPage() {
    const prepared = provenance.prepared_data;
    const run = provenance.training_run;
    const overlap = provenance.overlap_audit;
    return <>
        <div className="page-header-bar"><h3>Prepared data and fitted samples</h3><p className="page-desc">Preparing a pool and fitting a checkpoint are separate steps.</p></div>
        <div className="metrics-row">
            {[["Prepared training pool", prepared.train_pool, "Available pool; not all fitted", "cyan"],
              ["Actually used for training", run.training_examples, "Recorded checkpoint fit", "emerald"],
              ["Actually used for validation", run.validation_examples, "Recorded checkpoint selection", "amber"],
              ["Historical evaluation split", prepared.test, "Project-created split", "violet"]].map(([label, value, detail, color]) =>
                <div className={`card metric-card ${color}`} key={label}><div className="metric-label">{label}</div><div className="metric-value">{value.toLocaleString()}</div><div className="metric-sub">{detail}</div></div>)}
        </div>
        <div className="card section-card"><div className="section-title">Known evaluation limits</div>
            <p className="page-desc">{prepared.note}</p>
            <p className="page-desc">The prepared validation pool has {prepared.validation_pool.toLocaleString()} rows. The recorded run used only {run.validation_examples} of them.</p>
            <p className="page-desc">The normalized-text audit found {overlap.train_pool_vs_validation} shared texts between the training and validation pools, {overlap.train_pool_vs_test} between the training pool and evaluation split, and {overlap.validation_vs_test} between validation and evaluation.</p>
            <p className="page-desc">Fitted-subset overlap: {overlap.fitted_subset_overlap} The training random seed was not recorded.</p>
            <SourceLink path="evidence/provenance.json">Review data counts and overlap evidence</SourceLink>
        </div>
    </>;
}

function DeploymentPage() {
    return <>
        <div className="page-header-bar"><h3>Deployment guide</h3><p className="page-desc">Repository capabilities and setup instructions; no cloud status feed is connected to this view.</p></div>
        <div className="card section-card"><div className="section-title">What can be inspected</div>
            <p className="page-desc">The project includes a local classification API and infrastructure configuration. Configuration files do not establish that a cloud resource is running, that a model is registered, or that a service has a particular cost or uptime.</p>
            <p className="page-desc">The Test Model view identifies whether an individual result came from a configured API or the transparent browser keyword demonstration.</p>
            <p className="page-desc"><SourceLink path="README.md">Run and deployment instructions</SourceLink>{" · "}<SourceLink path="src/serving/api.py">Classification API implementation</SourceLink></p>
        </div>
    </>;
}

export default App;
