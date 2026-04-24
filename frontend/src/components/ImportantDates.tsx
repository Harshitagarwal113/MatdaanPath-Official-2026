"use client";

import { Bell } from "lucide-react";

import { useApiResource } from "@/hooks/use-api-resource";

interface Deadline {
  id: number;
  name: string;
  date: string;
  description?: string | null;
}

const emptyDeadlines: Deadline[] = [];
const deadlineDateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default function ImportantDates({ regionId }: { regionId: number | null }) {
  const requestKey = `deadlines:${regionId ?? "all"}`;
  const requestPath = regionId ? `/api/deadlines/?region_id=${regionId}` : "/api/deadlines/";
  const { data: deadlines, isLoading, error } = useApiResource<Deadline[]>(requestKey, requestPath, {
    initialData: emptyDeadlines,
  });

  return (
    <div className="dates-clean">
      <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <Bell size={18} color="#f59e0b" /> Upcoming Deadlines
      </h3>
      <p className="panel-note" style={{ marginBottom: "1.25rem" }}>
        Regional selections include state-specific deadlines plus national events that still apply.
      </p>

      {error ? (
        <p className="inline-alert" role="alert">
          {error}
        </p>
      ) : null}

      {isLoading && deadlines.length === 0 ? (
        <p className="status-note" role="status">
          Loading upcoming deadlines...
        </p>
      ) : null}

      <div
        className="dates-stack"
        role="list"
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
