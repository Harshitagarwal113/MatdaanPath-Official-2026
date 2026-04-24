"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronRight } from 'lucide-react';
import API_BASE_URL from '../lib/api';

interface Stage {
  id: number;
  name: string;
  description: string;
  sequence_order: number;
}

export default function Timeline() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/timeline/`)
      .then(res => res.json())
      .then(data => setStages(data))
      .catch(err => console.error("Error fetching timeline:", err));
  }, []);

  return (
    <div className="timeline-elegant">
      <div className="timeline-header" style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Election Journey</h2>
        <p style={{ color: 'var(--text-muted)' }}>The lifecycle of a general election in India.</p>
      </div>

      <div className="timeline-flow" style={{ display: 'flex', flexDirection: 'column' }}>
        {stages.map((stage, index) => (
          <div 
            key={stage.id} 
            className="timeline-item"
            style={{ display: 'flex', gap: '2rem', cursor: 'pointer' }}
            onClick={() => setActiveStep(index)}
          >
            <div className="item-rail" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="item-dot" style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: index <= activeStep ? 'var(--brand-primary)' : 'white',
                border: `2px solid ${index <= activeStep ? 'var(--brand-primary)' : 'var(--border-standard)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: index <= activeStep ? 'white' : 'var(--text-muted)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: 2
              }}>
                {index < activeStep ? <Check size={16} /> : <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>{stage.sequence_order}</span>}
              </div>
              {index < stages.length - 1 && (
                <div className="item-line" style={{ 
                  width: '2px', flex: 1, margin: '0.5rem 0',
                  background: index < activeStep ? 'var(--brand-primary)' : 'var(--border-standard)',
                  transition: 'background 0.4s'
                }} />
              )}
            </div>

            <div className={`item-content card-premium ${index === activeStep ? 'active' : ''}`} style={{
              flex: 1, padding: '2rem', marginBottom: '2.5rem',
              border: index === activeStep ? '1px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
              boxShadow: index === activeStep ? '0 10px 30px -10px rgba(99, 102, 241, 0.2)' : 'var(--shadow-sm)',
              transform: index === activeStep ? 'scale(1.02)' : 'scale(1)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
              <h3 style={{ fontSize: '1.25rem', color: index === activeStep ? 'var(--brand-primary)' : 'var(--text-main)', marginBottom: '0.5rem' }}>
                {stage.name}
              </h3>
              <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{stage.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
