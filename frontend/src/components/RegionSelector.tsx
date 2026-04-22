"use client";

import React, { useEffect, useState } from 'react';
import API_BASE_URL from '../lib/api';

interface Region {
  id: number;
  name: string;
  code: string;
}

export default function RegionSelector({ onRegionChange }: { onRegionChange: (id: number | null) => void }) {
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/deadlines/regions`)
      .then(res => res.json())
      .then(data => setRegions(data))
      .catch(err => console.error("Error fetching regions:", err));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value ? parseInt(e.target.value) : null;
    setSelectedId(id);
    onRegionChange(id);
  };

  return (
    <div className="region-selector">
      <label htmlFor="region">Select Your Region:</label>
      <select id="region" value={selectedId || ''} onChange={handleChange} className="glass-panel">
        <option value="">All Regions / National</option>
        {regions.map(r => (
          <option key={r.id} value={r.id}>{r.name}</option>
        ))}
      </select>

      <style jsx>{`
        .region-selector {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 2rem;
        }
        select {
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          color: white;
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          outline: none;
          cursor: pointer;
        }
        label {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
