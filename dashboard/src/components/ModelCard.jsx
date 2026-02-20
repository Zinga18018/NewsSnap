import React from "react";

const MODEL_INFO = [
    { label: "Architecture", value: "DistilBERT" },
    { label: "Base Model", value: "distilbert-base-uncased" },
    { label: "Dataset", value: "AG News (120K)" },
    { label: "Classes", value: "4 categories" },
    { label: "Max Seq Length", value: "128 tokens" },
    { label: "Batch Size", value: "32" },
    { label: "Learning Rate", value: "2e-5" },
    { label: "Optimizer", value: "AdamW" },
    { label: "Infrastructure", value: "SageMaker" },
    { label: "Container", value: "Docker → ECR" },
];

export default function ModelCard() {
    return (
        <div>
            {MODEL_INFO.map((row, i) => (
                <div className="info-row" key={i}>
                    <span className="info-label">{row.label}</span>
                    <span className="info-value">{row.value}</span>
                </div>
            ))}
        </div>
    );
}
