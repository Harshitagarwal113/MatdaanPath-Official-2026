"use client";

import React, { useState } from "react";
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

export default function RegionSelector({ onRegionChange }: { onRegionChange: (id: number | null) => void }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { data: regions, isLoading, error } = useApiResource<Region[]>("deadlines:regions", "/api/deadlines/regions", {
    initialData: emptyRegions,
  });

  const selectedRegion = regions.find((region) => region.id === selectedId) ?? null;

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const id = event.target.value ? Number(event.target.value) : null;
    const region = regions.find((item) => item.id === id) ?? null;

    setSelectedId(id);
    onRegionChange(id);

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
          value={selectedId ?? ""}
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
        <p className="inline-alert" role="alert" style={{ marginTop: "0.75rem" }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
