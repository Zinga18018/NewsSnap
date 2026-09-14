const finite = (value) => typeof value === "number" && Number.isFinite(value);
const unit = (value) => finite(value) && value >= 0 && value <= 1;

export function normalizeEvaluation(payload) {
    if (!payload || !unit(payload.metrics?.accuracy)) return null;
    const count = payload.test_samples ?? payload.num_test_samples;
    const sampleCount = Number.isInteger(count) && count > 0 ? count : null;
    const metrics = Object.fromEntries(["accuracy", "f1_weighted", "f1_macro", "mcc"].map((key) => {
        const value = payload.metrics[key];
        const valid = key === "mcc" ? finite(value) && value >= -1 && value <= 1 : unit(value);
        return [key, valid ? value : null];
    }));
    const labels = Array.isArray(payload.label_names) && payload.label_names.length > 1
        && payload.label_names.every((value) => typeof value === "string" && value.trim())
        && new Set(payload.label_names).size === payload.label_names.length ? payload.label_names : [];
    const matrix = payload.confusion_matrix;
    const matrixValid = labels.length > 0 && Array.isArray(matrix) && matrix.length === labels.length
        && matrix.every((row) => Array.isArray(row) && row.length === labels.length
            && row.every((value) => Number.isInteger(value) && value >= 0))
        && (!sampleCount || matrix.flat().reduce((sum, value) => sum + value, 0) === sampleCount);
    const curve = payload.pr_curve;
    const curveValid = Array.isArray(curve) && curve.length >= 2
        && curve.every((row, index) => row && unit(row.recall) && unit(row.precision)
            && (index === 0 || row.recall >= curve[index - 1].recall));
    return {
        metrics, sampleCount,
        timestamp: typeof payload.timestamp === "string" ? payload.timestamp : null,
        confusion: matrixValid ? matrix : null,
        labels: matrixValid ? labels : [],
        prData: curveValid ? curve : null,
    };
}

export function normalizeHistory(payload) {
    const rows = Array.isArray(payload) ? payload : payload?.metrics;
    if (!Array.isArray(rows)) return null;
    const normalized = rows.map((row) => ({
        epoch: row?.epoch,
        train_loss: row?.train_loss,
        val_loss: row?.val_loss,
        train_acc: row?.train_acc ?? row?.train_accuracy,
        val_acc: row?.val_acc ?? row?.val_accuracy,
        val_f1: row?.val_f1,
    }));
    if (!normalized.length || normalized.some((row) => !Number.isInteger(row.epoch) || row.epoch < 1
        || !finite(row.train_loss) || row.train_loss < 0 || !finite(row.val_loss) || row.val_loss < 0
        || !unit(row.train_acc) || !unit(row.val_acc) || !unit(row.val_f1))) return null;
    if (new Set(normalized.map((row) => row.epoch)).size !== normalized.length) return null;
    return normalized.sort((left, right) => left.epoch - right.epoch);
}

export function resolveArtifacts({ bundledEvaluation, bundledHistory, evaluationPayload = null, historyPayload = null }) {
    const fetchedEvaluation = normalizeEvaluation(evaluationPayload);
    const fetchedHistory = normalizeHistory(historyPayload);
    return {
        evaluation: fetchedEvaluation ?? normalizeEvaluation(bundledEvaluation),
        history: fetchedHistory ?? normalizeHistory(bundledHistory) ?? [],
        evaluationSource: fetchedEvaluation ? "Fetched saved artifact" : "Bundled historical artifact",
        historySource: fetchedHistory ? "Fetched saved artifact" : "Bundled historical artifact",
        // A successful fetch tells us transport succeeded, not that measurements are live.
        isLiveMeasurement: false,
    };
}

export function predictionScoreLabel(mode) {
    if (mode === "demo") return "keyword score share";
    if (mode === "real") return "model score (uncalibrated)";
    return "reported score (mode unverified)";
}
