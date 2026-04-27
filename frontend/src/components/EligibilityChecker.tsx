"use client";

import { useEffect, useState } from "react";
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
  failed_requirements?: FailedRequirement[];
}

interface FailedRequirement {
  question: string;
  submitted_value: string;
  expected_value: string;
  reason: string;
  next_step: string;
  official_url: string;
}

interface EligibilityStateSnapshot {
  answers: Record<string, boolean>;
  result: EligibilityResult | null;
}

const emptyRules: Rule[] = [];
const ELIGIBILITY_STORAGE_KEY = "matdaanpath:eligibility-state:v1";

function getInitialEligibilityState(): EligibilityStateSnapshot {
  if (typeof window === "undefined") {
    return { answers: {}, result: null };
  }

  const rawSnapshot = window.localStorage.getItem(ELIGIBILITY_STORAGE_KEY);
  if (!rawSnapshot) {
    return { answers: {}, result: null };
  }

  try {
    const parsedSnapshot = JSON.parse(rawSnapshot) as EligibilityStateSnapshot;
    if (!parsedSnapshot || typeof parsedSnapshot !== "object") {
      return { answers: {}, result: null };
    }

    return {
      answers: parsedSnapshot.answers ?? {},
      result: parsedSnapshot.result ?? null,
    };
  } catch {
    window.localStorage.removeItem(ELIGIBILITY_STORAGE_KEY);
    return { answers: {}, result: null };
  }
}

export default function EligibilityChecker() {
  const { data: rules, isLoading, error, refresh } = useApiResource<Rule[]>("eligibility:rules", "/api/eligibility/rules", {
    initialData: emptyRules,
  });
  const [answers, setAnswers] = useState<Record<string, boolean>>(() => getInitialEligibilityState().answers);
  const [result, setResult] = useState<EligibilityResult | null>(() => getInitialEligibilityState().result);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);

  const answeredCount = rules.filter((rule) => answers[rule.rule_key] !== undefined).length;
  const canEvaluate = rules.length > 0 && answeredCount === rules.length;

  const progressLabel = `${answeredCount} of ${rules.length} questions answered`;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const snapshot: EligibilityStateSnapshot = { answers, result };
    window.localStorage.setItem(ELIGIBILITY_STORAGE_KEY, JSON.stringify(snapshot));
  }, [answers, result]);

  async function evaluateEligibility(nextAnswers: Record<string, boolean>) {
    setIsEvaluating(true);
    setEvaluationError(null);

    try {
      const payload = Object.fromEntries(
        rules.map((rule) => [rule.rule_key, nextAnswers[rule.rule_key] ? "yes" : "no"]),
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
      [rule.rule_key]: answer,
    };

    setAnswers(nextAnswers);
    setResult(null);
    setEvaluationError(null);

    const answeredRuleCount = rules.filter((item) => nextAnswers[item.rule_key] !== undefined).length;
    if (answeredRuleCount === rules.length) {
      void evaluateEligibility(nextAnswers);
    }
  }

  function resetChecker() {
    setAnswers({});
    setResult(null);
    setEvaluationError(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ELIGIBILITY_STORAGE_KEY);
    }
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
        <div className="inline-alert" role="alert" style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
          <span>{error}</span>
          <button type="button" className="btn-premium" onClick={() => refresh()} style={{ padding: "0.4rem 0.9rem" }}>
            Retry
          </button>
        </div>
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
                className={`btn-premium ${answers[rule.rule_key] === true ? "btn-brand" : ""}`}
                aria-label={`Yes, ${rule.question}`}
                onClick={() => handleAnswer(rule, true)}
                style={{
                  padding: "0.6rem 1.5rem",
                  background: answers[rule.rule_key] === true ? "var(--brand-primary)" : "#f8fafc",
                  border: "1px solid #e2e8f0",
                  color: answers[rule.rule_key] === true ? "white" : "var(--text-main)",
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
                  background: answers[rule.rule_key] === false ? "#ef4444" : "#f8fafc",
                  border: "1px solid #e2e8f0",
                  color: answers[rule.rule_key] === false ? "white" : "var(--text-main)",
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

                {result.failed_requirements && result.failed_requirements.length > 0 ? (
                  <div style={{ marginTop: "1.25rem", display: "grid", gap: "0.85rem" }}>
                    {result.failed_requirements.map((item) => (
                      <div
                        key={`${item.question}-${item.expected_value}`}
                        style={{
                          border: "1px solid var(--border-standard)",
                          borderRadius: "10px",
                          padding: "0.85rem",
                          background: "#fffbeb",
                        }}
                      >
                        <p style={{ fontSize: "0.92rem", fontWeight: 700, marginBottom: "0.25rem" }}>{item.question}</p>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>{item.reason}</p>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.45rem" }}>{item.next_step}</p>
                        <a
                          href={item.official_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--brand-primary)" }}
                        >
                          Open official guidance
                        </a>
                      </div>
                    ))}
                  </div>
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
