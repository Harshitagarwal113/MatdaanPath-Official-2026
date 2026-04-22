"use client";

import React, { useState } from 'react';
import Timeline from '@/components/Timeline';
import EligibilityChecker from '@/components/EligibilityChecker';
import Glossary from '@/components/Glossary';
import ChatAssistant from '@/components/ChatAssistant';
import ImportantDates from '@/components/ImportantDates';
import RegionSelector from '@/components/RegionSelector';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'timeline' | 'eligibility' | 'glossary'>('timeline');
  const [selectedRegion, setSelectedRegion] = useState<number | null>(null);

  const voterResources = [
    { title: "Voter Service Portal", desc: "Register to vote or update details", url: "https://voters.eci.gov.in" },
    { title: "Know Your Candidate", desc: "View candidate affidavits", url: "https://affidavit.eci.gov.in" },
    { title: "Polling Booth Locator", desc: "Find your assigned polling station", url: "https://electoralsearch.eci.gov.in" },
    { title: "SVEEP Programme", desc: "Voter awareness initiatives", url: "https://ecisveep.nic.in" }
  ];

  return (
    <main className="container">
      <header className="hero" style={{ textAlign: 'center', padding: '6rem 0 4rem' }}>
        <h1 className="title-gradient" style={{ fontSize: '4.5rem', marginBottom: '1rem' }}>MatdaanPath</h1>
        <p className="subtitle" style={{ fontSize: '1.25rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
          Your trustworthy, AI-powered guide to the Indian democratic process. Verified sources, simplified insights.
        </p>
      </header>

      <div className="tab-wrapper">
        <div className="tabs glass-panel">
          <button 
            className={activeTab === 'timeline' ? 'active' : ''} 
            onClick={() => setActiveTab('timeline')}
          >
            Election Timeline
          </button>
          <button 
            className={activeTab === 'eligibility' ? 'active' : ''} 
            onClick={() => setActiveTab('eligibility')}
          >
            Eligibility Checker
          </button>
          <button 
            className={activeTab === 'glossary' ? 'active' : ''} 
            onClick={() => setActiveTab('glossary')}
          >
            Election Glossary
          </button>
        </div>
      </div>

      <section className="dashboard-grid">
        <div className="main-nav-area">
          <section className="content-area">
            {activeTab === 'timeline' && <Timeline />}
            {activeTab === 'eligibility' && <EligibilityChecker />}
            {activeTab === 'glossary' && <Glossary />}
          </section>
        </div>

        <aside className="sidebar">
          <RegionSelector onRegionChange={setSelectedRegion} />
          <ImportantDates regionId={selectedRegion} />
          
          <div className="resources-section">
            <h2 className="title-gradient" style={{ fontSize: '1.5rem' }}>Voter Resources</h2>
            <div className="resource-list">
              {voterResources.map((res, i) => (
                <a key={i} href={res.url} target="_blank" rel="noopener noreferrer" className="resource-link glass-panel">
                  <h4>{res.title}</h4>
                  <p>{res.desc}</p>
                </a>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <ChatAssistant />

      <style jsx>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 3rem;
          margin-top: 2rem;
        }
        .tab-wrapper {
          position: sticky;
          top: 2rem;
          z-index: 100;
          margin-bottom: 3rem;
          display: flex;
          justify-content: center;
        }
        .tabs {
          display: flex;
          gap: 0.5rem;
          padding: 0.5rem;
          max-width: fit-content;
        }
        .tabs button {
          background: transparent;
          border: none;
          color: var(--text-muted);
          padding: 0.75rem 1.5rem;
          cursor: pointer;
          border-radius: 14px;
          transition: all 0.3s ease;
          font-weight: 500;
          white-space: nowrap;
        }
        .tabs button.active {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .content-area {
          animation: slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          min-height: 600px;
        }
        .resource-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 1rem;
        }
        .resource-link {
          padding: 1.25rem !important;
          display: block;
          text-decoration: none;
        }
        .resource-link h4 {
          margin-bottom: 0.25rem;
          color: white;
          font-size: 1rem;
        }
        .resource-link p {
          margin-bottom: 0;
          font-size: 0.85rem;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
          .sidebar {
            order: -1;
          }
        }
      `}</style>
    </main>
  );
}
