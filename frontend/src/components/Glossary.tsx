"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Book } from 'lucide-react';
import API_BASE_URL from '../lib/api';

interface GlossaryItem {
  term: string;
  definition: string;
  category: string;
}

export default function Glossary() {
  const [items, setItems] = useState<GlossaryItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = search ? `${API_BASE_URL}/api/glossary/?search=${encodeURIComponent(search)}` : `${API_BASE_URL}/api/glossary/`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching glossary:", err);
        setLoading(false);
      });
  }, [search]);

  return (
    <div className="glossary-clean">
      <div className="glossary-header" style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Election Glossary</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Clear definitions for key democratic and electoral terms.</p>
        </div>
        <div className="search-input-wrapper" style={{ position: 'relative', flex: 1, maxWidth: '350px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search terms..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem',
              borderRadius: '12px', border: '1px solid var(--border-light)',
              fontSize: '0.95rem', outline: 'none', background: 'white'
            }}
          />
        </div>
      </div>

      <div className="glossary-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {items.map((item, i) => (
          <div key={i} className="glossary-card card-clean" style={{ padding: '1.5rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--brand-blue)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', display: 'block' }}>
              {item.category}
            </span>
            <h3 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', borderBottom: '2px solid black', paddingBottom: '0.5rem' }}>{item.term}</h3>
            <p style={{ fontSize: '1.2rem', color: '#000', fontWeight: 500, lineHeight: 1.5 }}>{item.definition}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
