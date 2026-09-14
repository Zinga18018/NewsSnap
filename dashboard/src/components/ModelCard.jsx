import React from "react";
import provenance from "../../../evidence/provenance.json";

export default function ModelCard() {
    const run = provenance.training_run;
    const checkpoint = provenance.checkpoint;
    const rows = [
        ["Base model", checkpoint.base_model],
        ["Recorded run date", run.date],
        ["Training examples", run.training_examples.toLocaleString()],
        ["Validation examples", run.validation_examples.toLocaleString()],
        ["Recorded epochs", run.epochs],
        ["Batch size", run.batch_size],
        ["Learning rate", run.learning_rate],
        ["Maximum input", `${checkpoint.max_tokens} tokens`],
        ["Device in historical log", run.device_recorded],
    ];
    return <div>{rows.map(([label, value]) => <div className="info-row" key={label}>
        <span className="info-label">{label}</span><span className="info-value">{value}</span>
    </div>)}</div>;
}
