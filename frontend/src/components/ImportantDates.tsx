"use client";

import { useState } from "react";
import { Bell } from "lucide-react";

import { useApiResource } from "@/hooks/use-api-resource";
import { fetchJson } from "@/lib/fetch-json";
import { trackUserAction } from "@/lib/google-services";

interface Deadline {
  id: number;
  name: string;
  date: string;
  description?: string | null;
}

interface ReminderResponse {
  queued: boolean;
  provider: string;
  task_name: string;
  scheduled_for: string;
}

const emptyDeadlines: Deadline[] = [];
const deadlineDateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const REMINDER_EMAIL_STORAGE_KEY = "matdaanpath:reminder-email:v1";

export default function ImportantDates({ regionId }: { regionId: number | null }) {
  const requestKey = `deadlines:${regionId ?? "all"}`;
  const requestPath = regionId ? `/api/deadlines/?region_id=${regionId}` : "/api/deadlines/";
  const { data: deadlines, isLoading, error, refresh } = useApiResource<Deadline[]>(requestKey, requestPath, {
    initialData: emptyDeadlines,
  });
  const [reminderStateByDeadline, setReminderStateByDeadline] = useState<Record<number, string>>({});

  async function handleReminder(deadline: Deadline) {
    const cachedEmail = typeof window !== "undefined" ? window.localStorage.getItem(REMINDER_EMAIL_STORAGE_KEY) : "";
    const email = window.prompt("Enter your email to receive a reminder", cachedEmail || "");
    if (!email) {
      return;
    }

    setReminderStateByDeadline((current) => ({ ...current, [deadline.id]: "Scheduling reminder..." }));
    try {
      const response = await fetchJson<ReminderResponse>("/api/reminders/subscribe", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          deadline_name: deadline.name,
          deadline_date: deadline.date,
        }),
      });

      if (typeof window !== "undefined") {
        window.localStorage.setItem(REMINDER_EMAIL_STORAGE_KEY, email.trim());
      }
      setReminderStateByDeadline((current) => ({
        ...current,
        [deadline.id]: response.provider === "cloud_tasks" ? "Reminder scheduled" : "Reminder saved (local fallback)",
      }));
      void trackUserAction("deadline_reminder_scheduled", {
        provider: response.provider,
        deadline_name: deadline.name,
      });
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Could not schedule reminder.";
      setReminderStateByDeadline((current) => ({ ...current, [deadline.id]: message }));
    }
  }

  return (
    <div className="dates-clean">
      <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <Bell size={18} color="#f59e0b" /> Upcoming Deadlines
      </h3>
      <p className="panel-note" style={{ marginBottom: "1.25rem" }}>
        Regional selections include state-specific deadlines plus national events that still apply.
      </p>

      {error ? (
        <div className="inline-alert" role="alert" style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
          <span>{error}</span>
          <button type="button" className="btn-premium" onClick={() => refresh()} style={{ padding: "0.35rem 0.8rem" }}>
            Retry
          </button>
        </div>
      ) : null}

      {isLoading && deadlines.length === 0 ? (
        <p className="status-note" role="status">
          Loading upcoming deadlines...
        </p>
      ) : null}

      <div
        className="dates-stack"
        role="list"
        aria-busy={isLoading}
        aria-label="Upcoming deadlines list"
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        {deadlines.length > 0 ? (
          deadlines.map((deadline) => {
            const parsedDate = new Date(deadline.date);

            return (
              <div
                key={deadline.id}
                className="date-item"
                role="listitem"
                aria-label={`Deadline for ${deadline.name} on ${deadlineDateFormatter.format(parsedDate)}`}
                style={{ display: "flex", gap: "1rem", alignItems: "center" }}
              >
                <div
                  className="date-pill"
                  style={{
                    background: "#f8fafc",
                    padding: "0.75rem",
                    borderRadius: "10px",
                    minWidth: "72px",
                    textAlign: "center",
                    border: "1px solid var(--border-standard)",
                    flexShrink: 0,
                  }}
                >
                  <div style={{ fontSize: "1rem", fontWeight: 800 }}>{parsedDate.getDate()}</div>
                  <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
                    {parsedDate.toLocaleString("default", { month: "short" })}
                  </div>
                </div>

                <div className="date-info">
                  <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>{deadline.name}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {deadlineDateFormatter.format(parsedDate)}
                  </div>
                  {deadline.description ? (
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                      {deadline.description}
                    </div>
                  ) : null}
                  <div style={{ marginTop: "0.45rem", display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="btn-premium"
                      style={{ padding: "0.25rem 0.65rem", fontSize: "0.75rem" }}
                      onClick={() => void handleReminder(deadline)}
                    >
                      Set reminder
                    </button>
                    {reminderStateByDeadline[deadline.id] ? (
                      <span
                        style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}
                        role="status"
                        aria-live="polite"
                      >
                        {reminderStateByDeadline[deadline.id]}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        ) : !isLoading ? (
          <p className="empty-state" role="status">
            No upcoming deadlines are available for this region yet.
          </p>
        ) : null}
      </div>
    </div>
  );
}
