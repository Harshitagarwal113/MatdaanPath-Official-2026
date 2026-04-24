"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
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
    <div className="dates-clean">
      <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Bell size={18} color="var(--brand-orange)" /> Upcoming Deadlines
      </h3>
      <div className="dates-stack" role="list" aria-label="Upcoming deadlines list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {deadlines.length > 0 ? (
          deadlines.map((d) => (
            <div key={d.id} className="date-item" role="listitem" aria-label={`Deadline for ${d.name} on ${new Date(d.date).toDateString()}`} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div className="date-pill" style={{
                background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '10px',
                minWidth: '55px', textAlign: 'center', border: '1px solid var(--border-light)'
              }}>
                <div style={{ fontSize: '1rem', fontWeight: 800 }}>{new Date(d.date).getDate()}</div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  {new Date(d.date).toLocaleString('default', { month: 'short' })}
                </div>
              </div>
              <div className="date-info">
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{d.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Election {new Date(d.date).getFullYear()}</div>
              </div>
            </div>
          ))
        ) : (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No upcoming deadlines for this region.</p>
        )}
      </div>
    </div>
  );
}
