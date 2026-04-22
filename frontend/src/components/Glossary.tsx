"use client";

import React, { useState, useEffect } from 'react';
import './Glossary.css';
import API_BASE_URL from '../lib/api';

interface GlossaryItem {
  term: string;
  definition: string;
  category: string;
}

export default function Glossary() {
  const [items, setItems] = useState<GlossaryItem[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = search ? `${API_BASE_URL}/api/glossary/?query=${search}` : `${API_BASE_URL}/api/glossary/`;
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setItems(data);
        } else {
          throw new Error("Invalid glossary format");
        }
      })
      .catch(err => {
        console.error("Error fetching glossary:", err);
        setError("Could not load glossary.");
      });
  }, [search]);

  if (error) return <div className="error-card glass-panel">{error}</div>;

  return (
    <div className="glossary-section">
      <div className="search-bar glass-panel">
        <input 
          type="text" 
          placeholder="Search for terms (e.g., EVM, VVPAT)..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="glossary-grid">
        {items.map((item, index) => (
          <div key={index} className="glossary-card glass-panel">
            <span className="category-tag">{item.category}</span>
            <h3>{item.term}</h3>
            <p>{item.definition}</p>
          </div>
        ))}
      </div>
      
      {items.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No terms found matching your search.</p>
      )}
    </div>
  );
}
