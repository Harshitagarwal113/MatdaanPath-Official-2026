"use client";

import React, { useEffect, useState } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
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
    <div className="region-selector-elegant">
      <div style={{ position: 'relative' }}>
        <select 
          id="region" 
          value={selectedId || ''} 
          onChange={handleChange} 
          style={{
            width: '100%', padding: '0.85rem 1rem', border: '1px solid #e2e8f0',
            borderRadius: '12px', background: '#f8fafc', color: '#1e293b',
            fontSize: '0.95rem', fontWeight: 600, appearance: 'none',
            cursor: 'pointer', outline: 'none', transition: 'all 0.2s'
          }}
          aria-label="Select Region"
          onFocus={(e) => {
            e.target.style.borderColor = '#6366f1';
            e.target.style.background = 'white';
            e.target.style.boxShadow = '0 0 0 4px rgba(99, 102, 241, 0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e2e8f0';
            e.target.style.background = '#f8fafc';
            e.target.style.boxShadow = 'none';
          }}
        >
          <option value="">National Coverage</option>
          {regions.map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <ChevronDown 
          style={{ 
            position: 'absolute', right: '0.75rem', top: '50%', 
            transform: 'translateY(-50%)', pointerEvents: 'none',
            color: '#64748b'
          }} 
          size={16} 
        />
      </div>
    </div>
  );
}
