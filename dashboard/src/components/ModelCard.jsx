import React from "react";

const MODEL_INFO = [
    { label: "Architecture", value: "DistilBERT" },
    { label: "Base Model", value: "distilbert-base-uncased" },
    { label: "Dataset", value: "AG News (120K)" },
    { label: "Classes", value: "4 (World, Sports, Business, Sci/Tech)" },
    { label: "Max Seq Length", value: "128 tokens" },
    { label: "Batch Size", value: "32" },
    { label: "Learning Rate", value: "2e-5" },
    { label: "Optimizer", value: "AdamW" },
    { label: "Infrastructure", value: "SageMaker ml.m5.large" },
    { label: "Container", value: "Docker → ECR" },
];

export default function ModelCard() {
    return (
        <div>
            {MODEL_INFO.map((row, i) => (
                <div className="model-info-row" key={i}>
                    <span className="label">{row.label}</span>
                    <span className="value">{row.value}</span>
                </div>
            ))}
        </div>
    );
}
