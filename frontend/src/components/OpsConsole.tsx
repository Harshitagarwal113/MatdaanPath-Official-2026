"use client";

import { useEffect, useState } from "react";
import { DatabaseZap, KeyRound, ShieldCheck, Sparkles } from "lucide-react";

import { fetchJson } from "@/lib/fetch-json";
import { fetchGoogleServicesStatus, type GoogleServicesStatus } from "@/lib/google-services";

type AdminIdentity = {
  user_id: string;
  is_admin: boolean;
  auth_provider: string;
  email?: string | null;
};

const ADMIN_TOKEN_STORAGE_KEY = "matdaanpath:admin-token:v1";

export default function OpsConsole() {
  const [adminToken, setAdminToken] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }
    return window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || "";
  });
  const [adminIdentity, setAdminIdentity] = useState<AdminIdentity | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [serviceStatus, setServiceStatus] = useState<GoogleServicesStatus | null>(null);

  const [newTerm, setNewTerm] = useState("");
  const [newDefinition, setNewDefinition] = useState("");
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceUrl, setNewSourceUrl] = useState("");

  useEffect(() => {
    async function loadServiceStatus() {
      try {
        const status = await fetchGoogleServicesStatus();
        setServiceStatus(status);
      } catch {
        // Keep previous status if fetch fails.
      }
    }
    void loadServiceStatus();
  }, []);

  function authHeaders() {
    const headers = new Headers();
    if (adminToken.trim()) {
      headers.set("Authorization", `Bearer ${adminToken.trim()}`);
    }
    return headers;
  }

  async function verifyAdminAccess() {
    setStatusMessage("Checking admin access...");
    try {
      const identity = await fetchJson<AdminIdentity>("/api/admin/me", {
        headers: authHeaders(),
      });
      setAdminIdentity(identity);
      setStatusMessage(`Admin verified (${identity.auth_provider}).`);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, adminToken.trim());
      }
    } catch (error) {
      setAdminIdentity(null);
      setStatusMessage(error instanceof Error ? error.message : "Admin verification failed.");
    }
  }

  async function createGlossaryEntry() {
    if (!newTerm.trim() || !newDefinition.trim()) {
      setStatusMessage("Enter both term and definition.");
      return;
    }

    setStatusMessage("Creating glossary entry...");
    try {
      await fetchJson("/api/admin/glossary", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          term: newTerm.trim(),
          definition: newDefinition.trim(),
          category: "Operations",
        }),
      });
      setStatusMessage("Glossary entry created.");
      setNewTerm("");
      setNewDefinition("");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Could not create glossary entry.");
    }
  }

  async function createSourceEntry() {
    if (!newSourceName.trim() || !newSourceUrl.trim()) {
      setStatusMessage("Enter both source name and source URL.");
      return;
    }

    setStatusMessage("Creating source entry...");
    try {
      await fetchJson("/api/admin/sources", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          name: newSourceName.trim(),
          url: newSourceUrl.trim(),
          source_type: "official",
          status: "approved",
        }),
      });
      setStatusMessage("Source entry created.");
      setNewSourceName("");
      setNewSourceUrl("");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Could not create source entry.");
    }
  }

  return (
    <div className="card-premium" style={{ padding: "2rem", display: "grid", gap: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
        <Sparkles size={20} color="var(--brand-primary)" />
        <h2 style={{ margin: 0, fontSize: "1.35rem" }}>Operations Console</h2>
      </div>

      <p className="panel-note" style={{ margin: 0 }}>
        Use this console to validate admin access and manage core content entities while cloud services are being wired.
      </p>

      <div style={{ display: "grid", gap: "0.7rem" }}>
        <label htmlFor="admin-token" style={{ fontWeight: 700, fontSize: "0.88rem" }}>
          Admin bearer token
        </label>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <input
            id="admin-token"
            type="password"
            value={adminToken}
            onChange={(event) => setAdminToken(event.target.value)}
            style={{
              flex: 1,
              minWidth: "260px",
              padding: "0.7rem 0.8rem",
              borderRadius: "10px",
              border: "1px solid var(--border-standard)",
              background: "#fff",
            }}
          />
          <button type="button" className="btn-premium btn-brand" onClick={() => void verifyAdminAccess()}>
            Verify Access <ShieldCheck size={16} />
          </button>
        </div>
        {adminIdentity ? (
          <p className="status-note">
            Authenticated as <strong>{adminIdentity.user_id}</strong> via <strong>{adminIdentity.auth_provider}</strong>.
          </p>
        ) : null}
      </div>

      <div style={{ display: "grid", gap: "0.8rem", padding: "1rem", border: "1px solid var(--border-standard)", borderRadius: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
          <DatabaseZap size={18} color="var(--brand-primary)" />
          <h3 style={{ margin: 0, fontSize: "1rem" }}>Glossary quick-create</h3>
        </div>
        <input
          type="text"
          placeholder="Term"
          value={newTerm}
          onChange={(event) => setNewTerm(event.target.value)}
          style={{ padding: "0.65rem 0.75rem", borderRadius: "10px", border: "1px solid var(--border-standard)" }}
        />
        <textarea
          placeholder="Definition"
          value={newDefinition}
          onChange={(event) => setNewDefinition(event.target.value)}
          style={{ padding: "0.65rem 0.75rem", borderRadius: "10px", border: "1px solid var(--border-standard)", minHeight: "84px" }}
        />
        <button type="button" className="btn-premium" onClick={() => void createGlossaryEntry()}>
          Save Glossary Entry
        </button>
      </div>

      <div style={{ display: "grid", gap: "0.8rem", padding: "1rem", border: "1px solid var(--border-standard)", borderRadius: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
          <KeyRound size={18} color="var(--brand-primary)" />
          <h3 style={{ margin: 0, fontSize: "1rem" }}>Source quick-create</h3>
        </div>
        <input
          type="text"
          placeholder="Source name"
          value={newSourceName}
          onChange={(event) => setNewSourceName(event.target.value)}
          style={{ padding: "0.65rem 0.75rem", borderRadius: "10px", border: "1px solid var(--border-standard)" }}
        />
        <input
          type="url"
          placeholder="https://example.com"
          value={newSourceUrl}
          onChange={(event) => setNewSourceUrl(event.target.value)}
          style={{ padding: "0.65rem 0.75rem", borderRadius: "10px", border: "1px solid var(--border-standard)" }}
        />
        <button type="button" className="btn-premium" onClick={() => void createSourceEntry()}>
          Save Source Entry
        </button>
      </div>

      <div style={{ padding: "1rem", borderRadius: "12px", border: "1px solid var(--border-standard)", background: "#f8fafc" }}>
        <h3 style={{ marginTop: 0, marginBottom: "0.5rem", fontSize: "1rem" }}>Runtime service checks</h3>
        <p className="panel-note" style={{ margin: 0 }}>
          Firebase Auth: {serviceStatus?.firebase_auth.ready ? "Ready" : "Not ready"} | Cloud Tasks:{" "}
          {serviceStatus?.cloud_tasks.ready ? "Ready" : "Fallback"} | Secret Manager:{" "}
          {serviceStatus?.secret_manager.ready ? "Ready" : "Not ready"}
        </p>
      </div>

      {statusMessage ? (
        <p className="status-note" style={{ margin: 0 }}>
          {statusMessage}
        </p>
      ) : null}
    </div>
  );
}
