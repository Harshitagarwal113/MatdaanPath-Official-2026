"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, CheckSquare, BookOpen, ExternalLink, 
  MapPin, ArrowUpRight, Info, LayoutGrid, List,
  Clock, ShieldCheck, HelpCircle, Zap
} from 'lucide-react';
import Timeline from '@/components/Timeline';
import EligibilityChecker from '@/components/EligibilityChecker';
import Glossary from '@/components/Glossary';
import ChatAssistant from '@/components/ChatAssistant';
import ImportantDates from '@/components/ImportantDates';
import RegionSelector from '@/components/RegionSelector';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'timeline' | 'eligibility' | 'glossary'>('timeline');
  const [selectedRegion, setSelectedRegion] = useState<number | null>(null);

  const navigation = [
    { id: 'timeline', label: 'Timeline', icon: <Calendar size={18} /> },
    { id: 'eligibility', label: 'Eligibility', icon: <CheckSquare size={18} /> },
    { id: 'glossary', label: 'Glossary', icon: <BookOpen size={18} /> }
  ];

  return (
    <div className="min-h-screen">
      <nav className="nav-bar" aria-label="Main Navigation">
        <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 0' }}>
          <div className="brand-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="logo-box" style={{ background: 'var(--brand-primary)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px var(--brand-glow)' }}>
              <ShieldCheck size={22} color="white" />
            </div>
            <h2 aria-label="MatdaanPath Home" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>MatdaanPath</h2>
          </div>
          
          <div className="nav-links-premium" style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
            <div className="link-group" style={{ display: 'flex', gap: '2rem' }}>
              <a href="https://voters.eci.gov.in" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}>Voter Portal</a>
              <a href="https://affidavit.eci.gov.in" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}>Candidate Info</a>
              <a href="https://www.eci.gov.in/contact-us" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}>Contact</a>
            </div>
            <a href="https://voters.eci.gov.in" target="_blank" rel="noopener noreferrer" className="btn-premium btn-brand" style={{ padding: '0.75rem 1.5rem', textDecoration: 'none', fontSize: '0.9rem' }}>
              Register Now <ArrowUpRight size={16} />
            </a>
          </div>
        </div>
      </nav>

      <main>
        {/* Modern Hero Section */}
        <section className="hero-modern" style={{ padding: '8rem 0 6rem', background: 'radial-gradient(circle at 50% -20%, #f1f5f9 0%, transparent 60%)' }}>
          <div className="app-container" style={{ textAlign: 'center' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="badge-modern" style={{ background: '#eef2ff', color: '#6366f1', padding: '0.5rem 1rem', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2rem', display: 'inline-block' }}>
                Your Democracy, Simplified
              </span>
              <h1 className="hero-title" style={{ marginBottom: '0.5rem' }}>MatdaanPath</h1>
              <p style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--brand-primary)', marginBottom: '2rem', letterSpacing: '-0.01em' }}>
                India Election Guide 2026
              </p>
              <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '700px', margin: '0 auto', lineHeight: 1.5, opacity: 0.8 }}>
                Navigating the world's largest democratic exercise with precision intelligence and real-time data.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Feature Dashboard */}
        <section className="dashboard-section" style={{ paddingBottom: '10rem' }}>
          <div className="app-container">
            <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '3rem' }}>
              
              <div className="main-panel">
                {/* Feature Selector */}
                <div className="feature-selector card-premium" role="tablist" aria-label="Project Features" style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem', marginBottom: '3rem' }}>
                  {navigation.map((item) => (
                    <button 
                      key={item.id}
                      role="tab"
                      aria-selected={activeTab === item.id}
                      aria-controls={`${item.id}-panel`}
                      className={`feature-btn ${activeTab === item.id ? 'active' : ''}`}
                      onClick={() => setActiveTab(item.id as any)}
                      style={{
                        flex: 1, padding: '1rem', border: 'none', borderRadius: '12px',
                        background: activeTab === item.id ? '#f8fafc' : 'transparent',
                        color: activeTab === item.id ? 'var(--brand-primary)' : 'var(--text-muted)',
                        fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem'
                      }}
                    >
                      {item.icon} {item.label}
                    </button>
                  ))}
                </div>

                {/* Dynamic Content Rendering */}
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={activeTab}
                    id={`${activeTab}-panel`}
                    role="tabpanel"
                    aria-labelledby={activeTab}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25 }}
                  >
                    {activeTab === 'timeline' && <Timeline />}
                    {activeTab === 'eligibility' && <EligibilityChecker />}
                    {activeTab === 'glossary' && <Glossary />}
                  </motion.div>
                </AnimatePresence>
              </div>

              <aside className="side-panel">
                <div className="side-card card-premium" style={{ padding: '2rem', marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <MapPin size={20} color="var(--brand-primary)" />
                    <h3 style={{ fontSize: '1.1rem' }}>Regional Context</h3>
                  </div>
                  <RegionSelector onRegionChange={setSelectedRegion} />
                  
                  <div style={{ marginTop: '2.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                      <Clock size={20} color="#f59e0b" />
                      <h3 style={{ fontSize: '1.1rem' }}>Deadlines</h3>
                    </div>
                    <ImportantDates regionId={selectedRegion} />
                  </div>
                </div>

                <div className="help-card card-premium" style={{ padding: '2rem', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white', position: 'relative', overflow: 'hidden' }}>
                  <Zap size={80} style={{ position: 'absolute', bottom: '-20px', right: '-10px', opacity: 0.1, color: 'white' }} />
                  <h3 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.25rem' }}>Interactive Assistant</h3>
                  <p style={{ fontSize: '0.95rem', opacity: 0.9, marginBottom: '2rem' }}>
                    Need deeper insights? Our AI assistant can explain constitutional rules, finding centers, and candidate details.
                  </p>
                  <button 
                    className="btn-premium" 
                    style={{ background: 'white', color: '#6366f1', width: '100%', justifyContent: 'center' }}
                    onClick={() => (document.querySelector('.chat-fab') as HTMLButtonElement)?.click()}
                  >
                    Open Chatbot <ArrowUpRight size={18} />
                  </button>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>

      <ChatAssistant />
    </div>
  );
}
