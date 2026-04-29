"use client";

import { useEffect } from "react";
import { BarChart3, BellRing, BrainCircuit, CloudCog, KeyRound, ServerCog, ShieldCheck, type LucideIcon } from "lucide-react";

import { useApiResource } from "@/hooks/use-api-resource";
import {
  isGoogleServicesConfigured,
  trackUserAction,
  type GoogleServicesStatus,
} from "@/lib/google-services";

type ServiceCard = {
  title: string;
  description: string;
  icon: LucideIcon;
  isReady: boolean;
};

const emptyGoogleStatus: GoogleServicesStatus | null = null;

export default function GoogleServicesPanel() {
  const servicesConfigured = isGoogleServicesConfigured();
  const { data: backendStatus, isLoading, error, refresh } = useApiResource<GoogleServicesStatus | null>(
    "google-services:status",
    "/api/google-services/status",
    {
      initialData: emptyGoogleStatus,
      keepPreviousData: true,
    },
  );

  useEffect(() => {
    void trackUserAction("google_services_panel_viewed", {
      firebase_configured: servicesConfigured,
      backend_status_available: Boolean(backendStatus),
    });
  }, [backendStatus, servicesConfigured]);

  const serviceCards: ServiceCard[] = [
    {
      title: "Gemini Assistant",
      description: backendStatus?.gemini.gemini_enabled
        ? `Connected via ${backendStatus.gemini.provider} (${backendStatus.gemini.model}).`
        : "Not configured yet. Set GEMINI_API_KEY or Vertex AI credentials.",
      icon: BrainCircuit,
      isReady: backendStatus?.gemini.gemini_enabled ?? false,
    },
    {
      title: "Firebase Analytics",
      description: servicesConfigured
        ? "Event tracking is active in supported browsers."
        : "Waiting for NEXT_PUBLIC_FIREBASE_* values to enable analytics.",
      icon: BarChart3,
      isReady: servicesConfigured,
    },
    {
      title: "Cloud Logging",
      description: backendStatus?.observability.cloud_logging_enabled
        ? "Logging system is active and capturing structured backend events."
        : "Cloud logging is currently using local fallback mode.",
      icon: CloudCog,
      isReady: backendStatus?.observability.cloud_logging_enabled ?? false,
    },
    {
      title: "Cloud Run Runtime",
      description: backendStatus?.cloud_run_service
        ? `Application is running in a managed environment (${backendStatus.cloud_run_service}).`
        : "Local runtime detected. Cloud Run metadata is unavailable.",
      icon: ServerCog,
      isReady: Boolean(backendStatus?.cloud_run_service),
    },
    {
      title: "Firebase Auth",
      description: backendStatus?.firebase_auth.enabled
        ? "ID token verification is active for secured endpoints."
        : "Configure FIREBASE_PROJECT_ID or service account credentials for token verification.",
      icon: ShieldCheck,
      isReady: backendStatus?.firebase_auth.enabled ?? false,
    },
    {
      title: "Cloud Tasks Reminders",
      description: backendStatus?.cloud_tasks.enabled
        ? `Queue ${backendStatus.cloud_tasks.queue_id} is configured for reminder delivery.`
        : "Cloud Tasks is not configured. Reminder requests use local fallback queue.",
      icon: BellRing,
      isReady: backendStatus?.cloud_tasks.enabled ?? false,
    },
    {
      title: "Secret Manager",
      description: backendStatus?.secret_manager.enabled
        ? "Runtime secrets are available for protected configuration values."
        : "Set GEMINI_API_KEY_SECRET and GOOGLE_CLOUD_PROJECT to load secrets at runtime.",
      icon: KeyRound,
      isReady: backendStatus?.secret_manager.enabled ?? false,
    },
  ];

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
        Live service status is now fetched from the backend so deployment readiness is visible, not assumed.
      </p>

      {error ? (
        <div className="inline-alert" role="alert" style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", gap: "1rem" }}>
          <span>{error}</span>
          <button type="button" className="btn-premium" onClick={() => refresh()} style={{ padding: "0.35rem 0.8rem" }}>
            Retry
          </button>
        </div>
      ) : null}

      <div style={{ display: "grid", gap: "1rem" }}>
        {serviceCards.map((service) => {
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

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center" }}>
                  <h4 style={{ fontSize: "0.95rem", marginBottom: "0.25rem" }}>{service.title}</h4>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      borderRadius: "999px",
                      padding: "0.2rem 0.5rem",
                      background: service.isReady ? "#ecfdf5" : "#fffbeb",
                      color: service.isReady ? "#047857" : "#92400e",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {service.isReady ? "Ready" : "Needs Config"}
                  </span>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.5 }}>
                  {service.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="panel-note" style={{ marginTop: "1rem" }}>
        {isLoading
          ? "Refreshing service status..."
          : "Service indicators update from runtime configuration and observability health."}
      </p>

      {backendStatus?.admin_auth.allow_insecure_admin ? (
        <p className="panel-note" style={{ marginTop: "0.5rem", color: "#92400e" }}>
          Warning: insecure admin mode is enabled. Disable in production.
        </p>
      ) : null}
    </div>
  );
}
