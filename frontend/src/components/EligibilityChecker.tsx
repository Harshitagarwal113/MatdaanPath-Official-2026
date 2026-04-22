"use client";

import React, { useState, useEffect } from 'react';
import './EligibilityChecker.css';
import API_BASE_URL from '../lib/api';

interface Rule {
  id: number;
  question: string;
  expected_value: string;
  explanation_if_failed: string;
}

export default function EligibilityChecker() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<null | 'eligible' | 'not-eligible'>(null);
  const [failedMessage, setFailedMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/eligibility/rules`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setRules(data);
        } else {
          throw new Error("Invalid rules format");
        }
      })
      .catch(err => {
        console.error("Error fetching rules:", err);
        setError("Could not load eligibility rules.");
      });
  }, []);

  const handleAnswer = (answer: string) => {
    if (!rules.length) return;
    
    const currentRule = rules[step];
    if (answer !== currentRule.expected_value) {
      setFailedMessage(currentRule.explanation_if_failed);
      setResult('not-eligible');
    } else if (step === rules.length - 1) {
      setResult('eligible');
    } else {
      setStep(step + 1);
    }
  };

  const reset = () => {
    setStep(0);
    setResult(null);
    setFailedMessage('');
  };

  if (error) return <div className="error-card glass-panel">{error}</div>;
  if (!rules.length) return <div className="loading">Loading rules...</div>;

  return (
    <div className="eligibility-card glass-panel">
      {result === null ? (
        <div className="checker-flow">
          <h3>Question {step + 1} of {rules.length}</h3>
          <p className="question-text">{rules[step].question}</p>
          <div className="options">
            <button className="primary" onClick={() => handleAnswer('yes')}>Yes</button>
            <button className="secondary" onClick={() => handleAnswer('no')}>No</button>
          </div>
        </div>
      ) : (
        <div className="result-view">
          {result === 'eligible' ? (
            <div className="eligible-content">
              <div className="icon">✅</div>
              <h2>You are eligible to vote!</h2>
              <p>The next step is to ensure your name is in the Electoral Roll. You can apply online at the NVSP portal.</p>
              <a href="https://voters.eci.gov.in" target="_blank" className="button primary">Visit Voter Service Portal</a>
            </div>
          ) : (
            <div className="not-eligible-content">
              <div className="icon">❌</div>
              <h2>Eligibility Check Failed</h2>
              <p>{failedMessage}</p>
              <p>Please check the official ECI guidelines for special cases or future eligibility.</p>
            </div>
          )}
          <button className="text-button" onClick={reset} style={{ marginTop: '2rem' }}>Check Again</button>
        </div>
      )}
    </div>
  );
}
