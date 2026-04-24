"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Info, Check, X, ArrowRight } from 'lucide-react';
import API_BASE_URL from '../lib/api';

interface Rule {
  id: number;
  question: string;
  requirement_description: string;
}

export default function EligibilityChecker() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/eligibility/rules`)
      .then(res => res.json())
      .then(data => setRules(data))
      .catch(err => console.error("Error fetching rules:", err));
  }, []);

  const handleAnswer = (ruleId: number, answer: boolean) => {
    setAnswers(prev => ({ ...prev, [ruleId]: answer }));
    if (Object.keys({ ...answers, [ruleId]: answer }).length === rules.length) {
      setShowResult(true);
    }
  };

  const isEligible = Object.values(answers).every(v => v === true);

  return (
    <div className="checker-elegant">
      <header className="checker-header" style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Eligibility Check</h2>
        <p style={{ color: 'var(--text-muted)' }}>Quickly verify your legal status for the upcoming elections.</p>
      </header>

      <div className="rules-stack" role="form" aria-label="Eligibility Questions" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {rules.map((rule, i) => (
          <div key={rule.id} className="rule-card card-premium" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2rem' }}>
            <div className="rule-info">
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{rule.question}</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{rule.requirement_description}</p>
            </div>
            <div className="rule-actions" style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                className={`btn-premium ${answers[rule.id] === true ? 'btn-brand' : 'btn-ghost'}`}
                aria-label={`Yes, ${rule.question}`}
                onClick={() => handleAnswer(rule.id, true)}
                style={{ padding: '0.6rem 1.5rem', background: answers[rule.id] === true ? 'var(--brand-primary)' : '#f8fafc', border: '1px solid #e2e8f0', color: answers[rule.id] === true ? 'white' : 'var(--text-main)' }}
              >
                Yes
              </button>
              <button 
                className={`btn-premium ${answers[rule.id] === false ? 'active-no' : 'btn-ghost'}`}
                aria-label={`No, ${rule.question}`}
                onClick={() => handleAnswer(rule.id, false)}
                style={{ padding: '0.6rem 1.5rem', background: answers[rule.id] === false ? '#ef4444' : '#f8fafc', border: '1px solid #e2e8f0', color: answers[rule.id] === false ? 'white' : 'var(--text-main)' }}
              >
                No
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showResult && (
          <motion.div 
            className="result-elegant card-premium" 
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginTop: '3rem', borderLeft: `6px solid ${isEligible ? '#10b981' : '#f59e0b'}`, padding: '3rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: isEligible ? '#ecfdf5' : '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isEligible ? <ShieldCheck size={32} color="#10b981" /> : <Info size={32} color="#f59e0b" />}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{isEligible ? "Likely Eligible" : "Ineligible Status"}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
                  {isEligible 
                    ? "Your inputs match the legal requirements. Please proceed to the official voter registration portal."
                    : "Based on your criteria, you may not be eligible to vote. Consult ECI guidelines for specific rules."}
                </p>
              </div>
              <button className="btn-premium btn-brand" onClick={() => window.location.reload()}>
                Reset Check <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
