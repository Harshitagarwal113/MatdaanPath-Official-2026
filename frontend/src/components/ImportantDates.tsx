"use client";

import React, { useEffect, useState } from 'react';
import API_BASE_URL from '../lib/api';

interface Deadline {
  id: number;
  name: string;
  date: string;
  description: string;
}

export default function ImportantDates({ regionId }: { regionId: number | null }) {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);

  useEffect(() => {
    const url = regionId ? `${API_BASE_URL}/api/deadlines/?region_id=${regionId}` : `${API_BASE_URL}/api/deadlines/`;
    fetch(url)
      .then(res => res.json())
      .then(data => setDeadlines(data))
      .catch(err => console.error("Error fetching deadlines:", err));
  }, [regionId]);

  return (
    <div className="deadlines-container">
      <h2 className="title-gradient">Critical Deadlines</h2>
      <div className="deadline-grid">
        {deadlines.map(d => (
          <div key={d.id} className="deadline-card glass-panel">
            <div className="date-badge">
              <span className="day">{new Date(d.date).getDate()}</span>
              <span className="month">{new Date(d.date).toLocaleString('default', { month: 'short' })}</span>
            </div>
            <div className="deadline-info">
              <h3>{d.name}</h3>
              <p>{d.description}</p>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .deadlines-container {
          margin-bottom: 4rem;
        }
        .deadline-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-top: 2rem;
        }
        .deadline-card {
          display: flex;
          gap: 1.5rem;
          align-items: center;
          padding: 1.5rem !important;
        }
        .date-badge {
          background: var(--primary);
          padding: 1rem;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 70px;
        }
        .date-badge .day {
          font-size: 1.5rem;
          font-weight: 800;
          color: white;
        }
        .date-badge .month {
          font-size: 0.8rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
          text-transform: uppercase;
        }
        .deadline-info h3 {
          margin-bottom: 0.25rem;
          font-size: 1.1rem;
        }
        .deadline-info p {
          margin-bottom: 0;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}
