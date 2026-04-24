"use client";

import { useState } from "react";
import { Check } from "lucide-react";

import { useApiResource } from "@/hooks/use-api-resource";
import { trackUserAction } from "@/lib/google-services";

interface Stage {
  id: number;
  name: string;
  description: string;
  sequence_order: number;
}

const emptyStages: Stage[] = [];

export default function Timeline() {
  const [selectedStep, setSelectedStep] = useState(0);
  const { data: stages, isLoading, error } = useApiResource<Stage[]>("timeline:default", "/api/timeline/", {
    initialData: emptyStages,
  });

  const activeStep = Math.min(selectedStep, Math.max(stages.length - 1, 0));

  function handleStageSelect(index: number, stageName: string) {
    setSelectedStep(index);
    void trackUserAction("timeline_stage_selected", {
      stage_name: stageName,
      stage_position: index + 1,
    });
  }

  return (
    <div className="timeline-elegant">
      <div className="timeline-header" style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>Election Journey</h2>
        <p style={{ color: "var(--text-muted)" }}>The lifecycle of a general election in India, step by step.</p>
      </div>

      {error ? (
        <p className="inline-alert" role="alert">
          {error}
        </p>
      ) : null}

      {isLoading && stages.length === 0 ? (
        <p className="status-note" role="status">
          Loading election stages...
        </p>
      ) : null}

      {!isLoading && stages.length === 0 ? (
        <p className="empty-state" role="status">
          Timeline data is not available yet.
        </p>
      ) : null}

      {stages.length > 0 ? (
        <>
          <p className="status-note" style={{ marginBottom: "1rem" }}>
            Step {activeStep + 1} of {stages.length}
          </p>
          <div className="timeline-flow" style={{ display: "flex", flexDirection: "column" }}>
            {stages.map((stage, index) => {
              const isActive = index === activeStep;
              const isCompleted = index < activeStep;

              return (
                <div key={stage.id} className="timeline-item" style={{ display: "flex", gap: "2rem" }}>
                  <div className="item-rail" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div
                      className="item-dot"
                      aria-hidden="true"
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: index <= activeStep ? "var(--brand-primary)" : "white",
                        border: `2px solid ${index <= activeStep ? "var(--brand-primary)" : "var(--border-standard)"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: index <= activeStep ? "white" : "var(--text-muted)",
                        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                        zIndex: 2,
                      }}
                    >
                      {isCompleted ? <Check size={16} /> : <span style={{ fontSize: "0.8rem", fontWeight: 800 }}>{stage.sequence_order}</span>}
                    </div>
                    {index < stages.length - 1 ? (
                      <div
                        className="item-line"
                        aria-hidden="true"
                        style={{
                          width: "2px",
                          flex: 1,
                          margin: "0.5rem 0",
                          background: index < activeStep ? "var(--brand-primary)" : "var(--border-standard)",
                          transition: "background 0.4s",
                        }}
                      />
                    ) : null}
                  </div>

                  <button
                    type="button"
                    className={`item-content card-premium ${isActive ? "active" : ""}`}
                    aria-current={isActive ? "step" : undefined}
                    onClick={() => handleStageSelect(index, stage.name)}
                    style={{
                      flex: 1,
                      padding: "2rem",
                      marginBottom: "2.5rem",
                      border: isActive ? "1px solid var(--brand-primary)" : "1px solid var(--border-subtle)",
                      boxShadow: isActive ? "0 10px 30px -10px rgba(99, 102, 241, 0.2)" : "var(--shadow-sm)",
                      transform: isActive ? "scale(1.02)" : "scale(1)",
                      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                      textAlign: "left",
                      background: "white",
                      cursor: "pointer",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "1.25rem",
                        color: isActive ? "var(--brand-primary)" : "var(--text-main)",
                        marginBottom: "0.5rem",
                      }}
                    >
                      {stage.name}
                    </h3>
                    <p style={{ fontSize: "1rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{stage.description}</p>
                  </button>
                </div>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}
