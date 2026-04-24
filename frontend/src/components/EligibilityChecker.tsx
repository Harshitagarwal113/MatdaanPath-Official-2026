"use client";

import { useState } from "react";
import { ArrowRight, Info, ShieldCheck } from "lucide-react";

import { useApiResource } from "@/hooks/use-api-resource";
import { fetchJson } from "@/lib/fetch-json";
import { trackUserAction } from "@/lib/google-services";

interface Rule {
  id: number;
  question: string;
  requirement_description: string;
  rule_key: string;
  sequence_order: number;
}

interface EligibilityResult {
  eligible: boolean;
  message: string;
  failed_rules: string[];
}

const emptyRules: Rule[] = [];

export default function EligibilityChecker() {
  const { data: rules, isLoading, error } = useApiResource<Rule[]>("eligibility:rules", "/api/eligibility/rules", {
    initialData: emptyRules,
  });
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [result, setResult] = useState<EligibilityResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);

  const answeredCount = Object.keys(answers).length;
  const canEvaluate = rules.length > 0 && answeredCount === rules.length;

  const progressLabel = `${answeredCount} of ${rules.length} questions answered`;

  async function evaluateEligibility(nextAnswers: Record<number, boolean>) {
    setIsEvaluating(true);
    setEvaluationError(null);

    try {
      const payload = Object.fromEntries(
        rules.map((rule) => [rule.rule_key, nextAnswers[rule.id] ? "yes" : "no"]),
      );

      const response = await fetchJson<EligibilityResult>("/api/eligibility/check", {
        method: "POST",
        body: JSON.stringify({ answers: payload }),
      });

      setResult(response);
      void trackUserAction("eligibility_completed", {
        eligible: response.eligible,
        answered_count: rules.length,
      });
    } catch (requestError) {
      setResult(null);
      setEvaluationError(
        requestError instanceof Error ? requestError.message : "We could not evaluate eligibility right now.",
      );
    } finally {
      setIsEvaluating(false);
    }
  }

  function handleAnswer(rule: Rule, answer: boolean) {
    const nextAnswers = {
      ...answers,
      [rule.id]: answer,
    };

    setAnswers(nextAnswers);
    setResult(null);
    setEvaluationError(null);

    if (Object.keys(nextAnswers).length === rules.length) {
      void evaluateEligibility(nextAnswers);
    }
  }

  function resetChecker() {
    setAnswers({});
    setResult(null);
    setEvaluationError(null);
  }

  return (
    <div className="checker-elegant">
      <header className="checker-header" style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>Eligibility Check</h2>
        <p style={{ color: "var(--text-muted)" }}>Answer each question to assess whether you appear eligible to vote.</p>
      </header>

      <p className="status-note" style={{ marginBottom: "1rem" }}>
        {progressLabel}
      </p>

      {error ? (
        <p className="inline-alert" role="alert">
          {error}
        </p>
      ) : null}

      {isLoading && rules.length === 0 ? (
        <p className="status-note" role="status">
          Loading eligibility rules...
        </p>
      ) : null}

      <div
        className="rules-stack"
        role="group"
        aria-label="Eligibility Questions"
        style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
      >
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="rule-card card-premium"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1.5rem",
              padding: "2rem",
            }}
          >
            <div className="rule-info">
              <h4 style={{ fontSize: "1.1rem", marginBottom: "0.25rem" }}>{rule.question}</h4>
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>{rule.requirement_description}</p>
            </div>
            <div className="rule-actions" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                type="button"
                className={`btn-premium ${answers[rule.id] === true ? "btn-brand" : ""}`}
                aria-label={`Yes, ${rule.question}`}
                onClick={() => handleAnswer(rule, true)}
                style={{
                  padding: "0.6rem 1.5rem",
                  background: answers[rule.id] === true ? "var(--brand-primary)" : "#f8fafc",
                  border: "1px solid #e2e8f0",
                  color: answers[rule.id] === true ? "white" : "var(--text-main)",
                }}
              >
                Yes
              </button>
              <button
                type="button"
                aria-label={`No, ${rule.question}`}
                onClick={() => handleAnswer(rule, false)}
                style={{
                  padding: "0.6rem 1.5rem",
                  background: answers[rule.id] === false ? "#ef4444" : "#f8fafc",
                  border: "1px solid #e2e8f0",
                  color: answers[rule.id] === false ? "white" : "var(--text-main)",
                  borderRadius: "999px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                No
              </button>
            </div>
          </div>
        ))}
      </div>

      {canEvaluate && (isEvaluating || result || evaluationError) ? (
        <div
          className="result-elegant card-premium"
          role="status"
          aria-live="polite"
          style={{
            marginTop: "3rem",
            borderLeft: `6px solid ${result?.eligible ? "#10b981" : "#f59e0b"}`,
            padding: "3rem",
          }}
        >
          {isEvaluating ? (
            <p className="status-note">Evaluating your answers against the configured voting rules...</p>
          ) : null}

          {evaluationError ? (
            <p className="inline-alert" role="alert">
              {evaluationError}
            </p>
          ) : null}

          {result ? (
            <div style={{ display: "flex", alignItems: "flex-start", gap: "2rem", flexWrap: "wrap" }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: result.eligible ? "#ecfdf5" : "#fffbeb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {result.eligible ? <ShieldCheck size={32} color="#10b981" /> : <Info size={32} color="#f59e0b" />}
              </div>

              <div style={{ flex: 1, minWidth: "260px" }}>
                <h3 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
                  {result.eligible ? "Likely Eligible" : "Needs Review"}
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", marginBottom: "1rem" }}>{result.message}</p>

                {result.failed_rules.length > 0 ? (
                  <p className="status-note">
                    Review these answers again: {result.failed_rules.join(", ")}.
                  </p>
                ) : null}
              </div>

              <button type="button" className="btn-premium btn-brand" onClick={resetChecker}>
                Reset Check <ArrowRight size={16} />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
