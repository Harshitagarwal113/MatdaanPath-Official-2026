"use client";

import React, { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

import { useApiResource } from "@/hooks/use-api-resource";
import { trackUserAction } from "@/lib/google-services";

interface Region {
  id: number;
  name: string;
  code: string;
  description?: string | null;
}

const emptyRegions: Region[] = [];
const REGION_STORAGE_KEY = "matdaanpath:selected-region-id:v1";

function getInitialSelectedRegionId(): number | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawSelection = window.localStorage.getItem(REGION_STORAGE_KEY);
  if (!rawSelection) {
    return null;
  }

  const parsedSelection = Number(rawSelection);
  return Number.isFinite(parsedSelection) && parsedSelection > 0 ? parsedSelection : null;
}

export default function RegionSelector({ onRegionChange }: { onRegionChange: (id: number | null) => void }) {
  const [selectedId, setSelectedId] = useState<number | null>(() => getInitialSelectedRegionId());
  const { data: regions, isLoading, error, refresh } = useApiResource<Region[]>("deadlines:regions", "/api/deadlines/regions", {
    initialData: emptyRegions,
  });

  const hasValidSelectedRegion = selectedId !== null && regions.some((region) => region.id === selectedId);
  const effectiveSelectedId = hasValidSelectedRegion ? selectedId : null;
  const selectedRegion = regions.find((region) => region.id === effectiveSelectedId) ?? null;

  useEffect(() => {
    if (selectedId !== null && !hasValidSelectedRegion && isLoading) {
      return;
    }

    onRegionChange(effectiveSelectedId);
    if (typeof window !== "undefined" && selectedId !== null && effectiveSelectedId === null && !isLoading) {
      window.localStorage.removeItem(REGION_STORAGE_KEY);
    }
  }, [effectiveSelectedId, hasValidSelectedRegion, isLoading, onRegionChange, selectedId]);

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const id = event.target.value ? Number(event.target.value) : null;
    const region = regions.find((item) => item.id === id) ?? null;

    setSelectedId(id);
    onRegionChange(id);
    if (typeof window !== "undefined") {
      if (id === null) {
        window.localStorage.removeItem(REGION_STORAGE_KEY);
      } else {
        window.localStorage.setItem(REGION_STORAGE_KEY, String(id));
      }
    }

    void trackUserAction("region_selected", {
      region_name: region?.name ?? "National Coverage",
      region_code: region?.code ?? "ALL",
    });
  }

  return (
    <div className="region-selector-elegant">
      <label htmlFor="region" style={{ display: "block", fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.6rem" }}>
        Choose a region
      </label>

      <div style={{ position: "relative" }}>
        <select
          id="region"
          value={effectiveSelectedId ?? ""}
          onChange={handleChange}
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "0.85rem 1rem",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            background: "#f8fafc",
            color: "#1e293b",
            fontSize: "0.95rem",
            fontWeight: 600,
            appearance: "none",
            cursor: isLoading ? "progress" : "pointer",
            outline: "none",
            transition: "all 0.2s",
          }}
          aria-describedby="region-helper"
        >
          <option value="">{isLoading ? "Loading regions..." : "National Coverage"}</option>
          {regions.map((region) => (
            <option key={region.id} value={region.id}>
              {region.name}
            </option>
          ))}
        </select>
        <ChevronDown
          style={{
            position: "absolute",
            right: "0.75rem",
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            color: "#64748b",
          }}
          size={16}
        />
      </div>

      <p id="region-helper" className="panel-note" style={{ marginTop: "0.75rem" }}>
        {selectedRegion?.description ?? "Use national coverage when you want general election guidance across India."}
      </p>

      {error ? (
        <div className="inline-alert" role="alert" style={{ marginTop: "0.75rem", display: "flex", justifyContent: "space-between", gap: "1rem" }}>
          <span>{error}</span>
          <button type="button" className="btn-premium" onClick={() => refresh()} style={{ padding: "0.35rem 0.8rem" }}>
            Retry
          </button>
        </div>
      ) : null}
    </div>
  );
}
