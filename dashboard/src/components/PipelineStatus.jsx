import React from "react";

export default function PipelineStatus({ steps }) {
    return (
        <div>
            {steps.map((step, i) => (
                <div className="pipeline-step" key={i}>
                    <div className={`step-indicator ${step.status}`} />
                    <span className="step-name">{step.name}</span>
                    <span className="step-duration">{step.time}</span>
                </div>
            ))}
        </div>
    );
}
