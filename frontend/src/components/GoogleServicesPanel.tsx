"use client";

import { BarChart3, BrainCircuit, CloudCog, type LucideIcon } from "lucide-react";

import { isGoogleServicesConfigured } from "@/lib/google-services";

type ServiceCard = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const services: ServiceCard[] = [
  {
    title: "Gemini Assistant",
    description: "Answers election questions with backend grounding from approved civic content.",
    icon: BrainCircuit,
  },
  {
    title: "Firebase Analytics",
    description: "Tracks feature usage, search intent, and outbound official-resource clicks.",
    icon: BarChart3,
  },
  {
    title: "Cloud Logging",
    description: "Captures backend health, chat failures, and operational diagnostics for review.",
    icon: CloudCog,
  },
];

export default function GoogleServicesPanel() {
  const servicesConfigured = isGoogleServicesConfigured();

  return (
    <div className="side-card card-premium" style={{ padding: "2rem" }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          borderRadius: "999px",
          background: "#eef2ff",
          color: "var(--brand-primary)",
          fontSize: "0.8rem",
          fontWeight: 700,
          letterSpacing: "0.04em",
          padding: "0.45rem 0.8rem",
          marginBottom: "1rem",
        }}
      >
        Google Services
      </div>

      <h3 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Reliability and insights stack</h3>
      <p className="panel-note" style={{ marginBottom: "1.5rem" }}>
        The app now surfaces meaningful Google integration instead of placeholder scripts, with product analytics on the
        frontend and observability on the backend.
      </p>

      <div style={{ display: "grid", gap: "1rem" }}>
        {services.map((service) => {
          const Icon = service.icon;

          return (
            <div
              key={service.title}
              style={{
                display: "flex",
                gap: "0.9rem",
                alignItems: "flex-start",
                padding: "1rem",
                border: "1px solid var(--border-standard)",
                borderRadius: "14px",
                background: "#f8fafc",
              }}
            >
              <div
                style={{
                  width: "2.5rem",
                  height: "2.5rem",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "white",
                  border: "1px solid var(--border-standard)",
                  color: "var(--brand-primary)",
                  flexShrink: 0,
                }}
              >
                <Icon size={18} />
              </div>

              <div>
                <h4 style={{ fontSize: "0.95rem", marginBottom: "0.25rem" }}>{service.title}</h4>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.5 }}>
                  {service.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="panel-note" style={{ marginTop: "1rem" }}>
        {servicesConfigured
          ? "Firebase Analytics is configured and ready to collect event data in supported browsers."
          : "Analytics hooks are wired and will activate as soon as the NEXT_PUBLIC_FIREBASE_* environment variables are set."}
      </p>
    </div>
  );
}
