"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  BookOpen,
  Calendar,
  CheckSquare,
  Clock,
  MapPin,
  ShieldCheck,
  Zap,
  type LucideIcon,
} from "lucide-react";

import ChatAssistant from "@/components/ChatAssistant";
import EligibilityChecker from "@/components/EligibilityChecker";
import Glossary from "@/components/Glossary";
import GoogleServicesPanel from "@/components/GoogleServicesPanel";
import ImportantDates from "@/components/ImportantDates";
import RegionSelector from "@/components/RegionSelector";
import Timeline from "@/components/Timeline";
import { requestChatOpen } from "@/lib/chat-events";
import { trackOutboundLink, trackUserAction } from "@/lib/google-services";

type TabId = "timeline" | "eligibility" | "glossary";

type NavigationItem = {
  id: TabId;
  label: string;
  icon: LucideIcon;
};

type OfficialLink = {
  href: string;
  label: string;
};

const navigation: NavigationItem[] = [
  { id: "timeline", label: "Timeline", icon: Calendar },
  { id: "eligibility", label: "Eligibility", icon: CheckSquare },
  { id: "glossary", label: "Glossary", icon: BookOpen },
];

const officialLinks: OfficialLink[] = [
  { href: "https://voters.eci.gov.in", label: "Voter Portal" },
  { href: "https://affidavit.eci.gov.in", label: "Candidate Info" },
  { href: "https://www.eci.gov.in/contact-us", label: "Contact" },
];

const heroHighlights = [
  "Official ECI links and next-step guidance",
  "Region-specific deadlines with national fallback",
  "Google-powered analytics and observability hooks",
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("timeline");
  const [selectedRegion, setSelectedRegion] = useState<number | null>(null);

  useEffect(() => {
    void trackUserAction("feature_tab_view", { tab_name: activeTab });
  }, [activeTab]);

  function handleOfficialLinkClick(link: OfficialLink) {
    void trackOutboundLink(link.href, link.label);
  }

  function handleChatLaunch() {
    void trackUserAction("chat_launch_requested", {
      source: "interactive_assistant_card",
    });
    requestChatOpen();
  }

  return (
    <div className="min-h-screen">
      <div className="scroll-fade-top" />
      <nav className="nav-bar" aria-label="Main Navigation">
        <div
          className="app-container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1.25rem 0",
            gap: "1.5rem",
          }}
        >
          <div className="brand-group" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              className="logo-box"
              style={{
                background: "var(--brand-primary)",
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px var(--brand-glow)",
              }}
            >
              <ShieldCheck size={22} color="white" />
            </div>
            <h2
              aria-label="MatdaanPath Home"
              style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}
            >
              MatdaanPath
            </h2>
          </div>

          <div className="nav-links-premium" style={{ display: "flex", gap: "2.5rem", alignItems: "center" }}>
            <div className="link-group" style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
              {officialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                  onClick={() => handleOfficialLinkClick(link)}
                >
                  {link.label}
                </a>
              ))}
            </div>
            <a
              href="https://voters.eci.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-premium btn-brand"
              style={{ padding: "0.75rem 1.5rem", textDecoration: "none", fontSize: "0.9rem" }}
              onClick={() => handleOfficialLinkClick({ href: "https://voters.eci.gov.in", label: "Register Now" })}
            >
              Register Now <ArrowUpRight size={16} />
            </a>
          </div>
        </div>
      </nav>

      <main>
        <section
          className="hero-modern"
          style={{
            padding: "8rem 0 6rem",
            background: "radial-gradient(circle at 50% -20%, #f1f5f9 0%, transparent 60%)",
          }}
        >
          <div className="app-container" style={{ textAlign: "center" }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span
                className="badge-modern"
                style={{
                  background: "#eef2ff",
                  color: "#4f46e5",
                  padding: "0.5rem 1rem",
                  borderRadius: "100px",
                  fontSize: "0.8rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: "2rem",
                  display: "inline-block",
                }}
              >
                Your Democracy, Simplified
              </span>
              <h1 className="hero-title" style={{ marginBottom: "0.5rem" }}>
                MatdaanPath
              </h1>
              <p
                style={{
                  fontSize: "1.8rem",
                  fontWeight: 700,
                  color: "var(--brand-primary)",
                  marginBottom: "2rem",
                  letterSpacing: "-0.01em",
                }}
              >
                India Election Guide 2026
              </p>
              <p
                style={{
                  fontSize: "1.25rem",
                  color: "var(--text-secondary)",
                  maxWidth: "700px",
                  margin: "0 auto",
                  lineHeight: 1.5,
                  opacity: 0.9,
                }}
              >
                Navigating the world&apos;s largest democratic exercise with trustworthy election guidance, official next
                steps, and product signals that help the team keep improving.
              </p>

              <div className="hero-highlights" style={{ marginTop: "2rem" }}>
                {heroHighlights.map((highlight) => (
                  <span key={highlight} className="hero-chip">
                    {highlight}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="dashboard-section" style={{ paddingBottom: "10rem" }}>
          <div className="app-container">
            <div className="dashboard-grid" style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "3rem" }}>
              <div className="main-panel">
                <div
                  className="feature-selector card-premium"
                  role="tablist"
                  aria-label="Project Features"
                  style={{ padding: "0.5rem", display: "flex", gap: "0.5rem", marginBottom: "3rem" }}
                >
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        id={`${item.id}-tab`}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-controls={`${item.id}-panel`}
                        className={`feature-btn ${isActive ? "active" : ""}`}
                        onClick={() => setActiveTab(item.id)}
                        style={{
                          flex: 1,
                          padding: "1rem",
                          border: "none",
                          borderRadius: "12px",
                          background: isActive ? "#f8fafc" : "transparent",
                          color: isActive ? "var(--brand-primary)" : "var(--text-muted)",
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all 0.2s",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.75rem",
                        }}
                      >
                        <Icon size={18} /> {item.label}
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    id={`${activeTab}-panel`}
                    role="tabpanel"
                    aria-labelledby={`${activeTab}-tab`}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25 }}
                  >
                    {activeTab === "timeline" && <Timeline />}
                    {activeTab === "eligibility" && <EligibilityChecker />}
                    {activeTab === "glossary" && <Glossary />}
                  </motion.div>
                </AnimatePresence>
              </div>

              <aside className="side-panel">
                <div className="side-card card-premium" style={{ padding: "2rem", marginBottom: "2rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                    <MapPin size={20} color="var(--brand-primary)" />
                    <h3 style={{ fontSize: "1.1rem" }}>Regional Context</h3>
                  </div>
                  <RegionSelector onRegionChange={setSelectedRegion} />

                  <div style={{ marginTop: "2.5rem", borderTop: "1px solid #f1f5f9", paddingTop: "2rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                      <Clock size={20} color="#f59e0b" />
                      <h3 style={{ fontSize: "1.1rem" }}>Deadlines</h3>
                    </div>
                    <ImportantDates regionId={selectedRegion} />
                  </div>
                </div>

                <div
                  className="help-card card-premium"
                  style={{
                    padding: "2rem",
                    background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                    color: "white",
                    position: "relative",
                    overflow: "hidden",
                    marginBottom: "2rem",
                  }}
                >
                  <Zap
                    size={80}
                    style={{ position: "absolute", bottom: "-20px", right: "-10px", opacity: 0.1, color: "white" }}
                  />
                  <h3 style={{ color: "white", marginBottom: "1rem", fontSize: "1.25rem" }}>Interactive Assistant</h3>
                  <p style={{ fontSize: "0.95rem", opacity: 0.9, marginBottom: "2rem" }}>
                    Need deeper insights? The assistant can explain constitutional rules, registration steps, and
                    official election processes in plain language.
                  </p>
                  <button
                    type="button"
                    className="btn-premium"
                    style={{ background: "white", color: "#6366f1", width: "100%", justifyContent: "center" }}
                    onClick={handleChatLaunch}
                  >
                    Open Chatbot <ArrowUpRight size={18} />
                  </button>
                </div>

                <GoogleServicesPanel />
              </aside>
            </div>
          </div>
        </section>
      </main>

      <ChatAssistant />
    </div>
  );
}
