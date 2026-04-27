"use client";

import { useDeferredValue, useEffect, useState } from "react";
import { Search } from "lucide-react";

import { useApiResource } from "@/hooks/use-api-resource";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { trackUserAction } from "@/lib/google-services";

interface GlossaryItem {
  term: string;
  definition: string;
  category: string;
}

const emptyGlossaryItems: GlossaryItem[] = [];

export default function Glossary() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const debouncedSearch = useDebouncedValue(deferredSearch, 250);
  const requestPath = debouncedSearch
    ? `/api/glossary/?search=${encodeURIComponent(debouncedSearch)}`
    : "/api/glossary/";
  const { data: items, isLoading, error, refresh } = useApiResource<GlossaryItem[]>(
    `glossary:${debouncedSearch || "all"}`,
    requestPath,
    {
      initialData: emptyGlossaryItems,
      keepPreviousData: true,
    },
  );

  useEffect(() => {
    if (debouncedSearch.length >= 2) {
      void trackUserAction("glossary_search", {
        query_length: debouncedSearch.length,
        query_value: debouncedSearch.slice(0, 50),
      });
    }
  }, [debouncedSearch]);

  return (
    <div className="glossary-clean">
      <div
        className="glossary-header"
        style={{
          marginBottom: "3rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "2rem",
        }}
      >
        <div>
          <h2 style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>Election Glossary</h2>
          <p style={{ color: "var(--text-secondary)" }}>Clear definitions for key democratic and electoral terms.</p>
        </div>
        <div className="search-input-wrapper" style={{ position: "relative", flex: 1, maxWidth: "350px" }}>
          <label htmlFor="glossary-search" className="sr-only">
            Search election glossary terms
          </label>
          <Search
            size={18}
            style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
          />
          <input
            id="glossary-search"
            type="text"
            placeholder="Search terms..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem 1rem 0.75rem 2.75rem",
              borderRadius: "12px",
              border: "1px solid var(--border-standard)",
              fontSize: "0.95rem",
              outline: "none",
              background: "white",
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <p className="status-note">{debouncedSearch ? `${items.length} matching terms found` : `${items.length} glossary terms available`}</p>
        {isLoading ? <p className="status-note">Refreshing results...</p> : null}
      </div>

      {error ? (
        <div className="inline-alert" role="alert" style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
          <span>{error}</span>
          <button type="button" className="btn-premium" onClick={() => refresh()} style={{ padding: "0.4rem 0.9rem" }}>
            Retry
          </button>
        </div>
      ) : null}

      {items.length === 0 && !isLoading ? (
        <p className="empty-state" role="status">
          No glossary entries matched your search.
        </p>
      ) : null}

      <div
        className="glossary-list"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}
      >
        {items.map((item) => (
          <div key={`${item.term}-${item.category}`} className="card-premium" style={{ padding: "1.5rem" }}>
            <span
              style={{
                fontSize: "0.8rem",
                fontWeight: 800,
                color: "var(--brand-primary)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "1rem",
                display: "block",
              }}
            >
              {item.category}
            </span>
            <h3
              style={{
                fontSize: "1.4rem",
                marginBottom: "1rem",
                borderBottom: "1px solid var(--border-standard)",
                paddingBottom: "0.5rem",
              }}
            >
              {item.term}
            </h3>
            <p style={{ fontSize: "1rem", color: "var(--text-secondary)", fontWeight: 500, lineHeight: 1.6 }}>
              {item.definition}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
