"use client";

import React, { useState, useEffect } from 'react';
import './Timeline.css';
import API_BASE_URL from '../lib/api';

interface Stage {
  id: number;
  name: string;
  description: string;
  sequence_order: number;
}

export default function Timeline() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [activeStageId, setActiveStageId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/timeline/`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setStages(data);
          if (data.length > 0) setActiveStageId(data[0].id);
        } else {
          throw new Error("Invalid timeline format");
        }
      })
      .catch(err => {
        console.error("Error fetching stages:", err);
        setError("Could not load timeline. Please ensure the backend is running.");
      });
  }, []);

  if (error) return <div className="error-card glass-panel">{error}</div>;
  if (!stages.length) return <div className="loading">Loading timeline...</div>;

  return (
    <div className="timeline-container">
      <div className="timeline-track"></div>
      
      {stages.map((stage) => {
        const isActive = activeStageId === stage.id;
        
        return (
          <div 
            key={stage.id} 
            className={`timeline-item ${isActive ? 'active' : ''}`}
            onClick={() => setActiveStageId(stage.id)}
          >
            <div className="timeline-dot"></div>
            <div className="timeline-content glass-panel">
              <span className="timeline-date">Stage {stage.sequence_order}</span>
              <h3>{stage.name}</h3>
              {isActive && (
                <p className="timeline-desc">{stage.description}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
