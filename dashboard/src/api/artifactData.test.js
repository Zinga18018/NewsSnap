import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { normalizeEvaluation, normalizeHistory, predictionScoreLabel, resolveArtifacts } from "./artifactData.js";

const loadEvidence = (name) => JSON.parse(readFileSync(new URL(`../../../evidence/${name}`, import.meta.url), "utf8"));
const bundledEvaluation = loadEvidence("evaluation_results.json");
const bundledHistory = loadEvidence("training_history.json");

test("bundled values come from the historical evidence with no fabricated PR curve", () => {
    const state = resolveArtifacts({ bundledEvaluation, bundledHistory });
    assert.equal(state.evaluation.metrics.accuracy, 0.8699);
    assert.equal(state.evaluation.sampleCount, 12000);
    assert.equal(state.evaluation.confusion.flat().reduce((a, b) => a + b), 12000);
    assert.equal(state.evaluation.prData, null);
    assert.equal(state.history[0].train_acc, bundledHistory[0].train_accuracy);
    assert.equal(state.evaluationSource, "Bundled historical artifact");
});

test("fetched scalar metrics never turn a missing curve or matrix into demonstration data", () => {
    const state = resolveArtifacts({ bundledEvaluation, bundledHistory,
        evaluationPayload: { metrics: { accuracy: 0.75 }, test_samples: 4 } });
    assert.equal(state.evaluationSource, "Fetched saved artifact");
    assert.equal(state.isLiveMeasurement, false);
    assert.equal(state.evaluation.prData, null);
    assert.equal(state.evaluation.confusion, null);
    assert.equal(state.evaluation.metrics.f1_macro, null);
    assert.equal(state.historySource, "Bundled historical artifact");
});

test("a successful history fetch cannot relabel bundled evaluation as fetched or live", () => {
    const state = resolveArtifacts({ bundledEvaluation, bundledHistory, historyPayload: { metrics: bundledHistory } });
    assert.equal(state.evaluationSource, "Bundled historical artifact");
    assert.equal(state.historySource, "Fetched saved artifact");
    assert.equal(state.isLiveMeasurement, false);
});

test("malformed evaluation values fall back to the labeled historical record", () => {
    for (const accuracy of [null, true, "0.9", Number.NaN, Number.POSITIVE_INFINITY, -0.1, 1.1]) {
        const state = resolveArtifacts({ bundledEvaluation, bundledHistory, evaluationPayload: { metrics: { accuracy } } });
        assert.equal(state.evaluationSource, "Bundled historical artifact");
        assert.equal(state.evaluation.metrics.accuracy, 0.8699);
    }
});

test("curve and confusion data require their own valid measurements", () => {
    const base = { metrics: { accuracy: 0.75 }, test_samples: 4, label_names: ["A", "B"] };
    assert.equal(normalizeEvaluation({ ...base, confusion_matrix: [[1, 0], [0, 1]] }).confusion, null);
    assert.equal(normalizeEvaluation({ ...base, pr_curve: [{ recall: 0.5, precision: 0.8 }, { recall: 0.1, precision: 0.9 }] }).prData, null);
    assert.equal(normalizeEvaluation({ ...base, pr_curve: [null, { recall: 1, precision: 0.5 }] }).prData, null);
    const payload = { ...base, confusion_matrix: [[1, 1], [0, 2]], pr_curve: [{ recall: 0, precision: 1 }, { recall: 1, precision: 0.5 }] };
    assert.deepEqual(normalizeEvaluation(payload).confusion, payload.confusion_matrix);
    assert.deepEqual(normalizeEvaluation(payload).prData, payload.pr_curve);
});

test("history accepts original and normalized aliases without inventing epochs", () => {
    const rows = normalizeHistory(bundledHistory);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].epoch, 1);
    assert.deepEqual(normalizeHistory({ metrics: rows }), rows);
    assert.equal(normalizeHistory([{ epoch: 1 }]), null);
    assert.equal(normalizeHistory([rows[0], rows[0]]), null);
});

test("provenance separates the fitted subset from prepared pools", () => {
    const record = loadEvidence("provenance.json");
    assert.equal(record.training_run.training_examples, 512);
    assert.equal(record.training_run.validation_examples, 128);
    assert.equal(record.training_run.epochs, 1);
    assert.equal(record.prepared_data.train_pool, 96000);
    assert.match(record.overlap_audit.fitted_subset_overlap, /Not established/);
});

test("demo scores and uncalibrated model scores receive distinct descriptions", () => {
    assert.equal(predictionScoreLabel("demo"), "keyword score share");
    assert.equal(predictionScoreLabel("real"), "model score (uncalibrated)");
    assert.equal(predictionScoreLabel("unknown"), "reported score (mode unverified)");
});
