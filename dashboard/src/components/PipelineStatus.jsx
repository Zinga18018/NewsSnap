import React from "react";

export default function PipelineStatus({ steps }) {
    return (
        <div>
            {steps.map((step, i) => (
                <div className="pipeline-step" key={i}>
                    <div className={`status-dot ${step.status}`} />
                    <span className="step-name">{step.name}</span>
                    <span className="step-time">{step.time}</span>
                </div>
            ))}
        </div>
    );
}
