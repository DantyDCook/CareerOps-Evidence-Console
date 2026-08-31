"use client";

import { useEffect, useMemo, useState } from "react";
import { createEvidenceClient } from "@/lib/evidence-client";
import type {
  EvidenceCollection,
  EvidenceElement,
  EvidenceObject,
  EvidenceSnapshot,
  VerificationState
} from "@/lib/evidence-types";

type ConsoleView = "evidence" | "review" | "health";

const client = createEvidenceClient();

const collectionOptions: Array<"ALL" | EvidenceCollection> = [
  "ALL",
  "EMPLOYMENT",
  "PROJECT",
  "EDUCATION",
  "CERTIFICATION",
  "CAPABILITY",
  "PROFESSIONAL_DEVELOPMENT",
  "OTHER"
];

const verificationOptions: Array<"ALL" | VerificationState> = [
  "ALL",
  "DISCOVERED",
  "EXTRACTED",
  "REVIEWED",
  "VALIDATED",
  "CANONICAL",
  "REJECTED",
  "SUPERSEDED"
];

function humanize(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function stateClass(state: VerificationState) {
  return `status status-${state.toLowerCase()}`;
}

function dateRange(object: EvidenceObject) {
  if (!object.start_date && !object.end_date) return "No date range";
  return `${object.start_date ?? "Unknown"} — ${object.end_date ?? "Present"}`;
}

function objectElements(snapshot: EvidenceSnapshot, object: EvidenceObject) {
  const refs = new Set(object.element_refs);
  return snapshot.elements.filter((element) => refs.has(element.element_id));
}

function sourceLabel(snapshot: EvidenceSnapshot, sourceId: string) {
  return snapshot.sources.find((source) => source.source_id === sourceId)?.label ?? sourceId;
}

export default function EvidenceConsolePage() {
  const [snapshot, setSnapshot] = useState<EvidenceSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ConsoleView>("evidence");
  const [search, setSearch] = useState("");
  const [collection, setCollection] = useState<"ALL" | EvidenceCollection>("ALL");
  const [verification, setVerification] = useState<"ALL" | VerificationState>("ALL");
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    client
      .getSnapshot()
      .then((result) => {
        if (!active) return;
        setSnapshot(result);
        setSelectedObjectId(result.objects[0]?.object_id ?? null);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : "Unable to load Evidence snapshot.");
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredObjects = useMemo(() => {
    if (!snapshot) return [];
    const normalizedSearch = search.trim().toLowerCase();

    return snapshot.objects.filter((object) => {
      if (collection !== "ALL" && object.object_type !== collection) return false;

      const elements = objectElements(snapshot, object);
      if (verification !== "ALL" && !elements.some((element) => element.verification_state === verification)) {
        return false;
      }

      if (!normalizedSearch) return true;
      const searchSurface = [
        object.title,
        object.organization ?? "",
        object.summary ?? "",
        ...elements.map((element) => element.statement),
        ...elements.flatMap((element) => element.facets.map((facet) => facet.label)),
        ...elements.flatMap((element) => element.capability_refs)
      ]
        .join(" ")
        .toLowerCase();

      return searchSurface.includes(normalizedSearch);
    });
  }, [snapshot, search, collection, verification]);

  const selectedObject = useMemo(() => {
    if (!snapshot) return null;
    return (
      filteredObjects.find((object) => object.object_id === selectedObjectId) ??
      filteredObjects[0] ??
      null
    );
  }, [snapshot, filteredObjects, selectedObjectId]);

  const reviewElements = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.elements.filter(
      (element) => !["CANONICAL", "REJECTED", "SUPERSEDED"].includes(element.verification_state)
    );
  }, [snapshot]);

  if (error) {
    return (
      <main className="shell">
        <section className="error-panel">
          <p className="eyebrow">CareerOps Evidence Console</p>
          <h1>Evidence source unavailable</h1>
          <p>{error}</p>
          <p className="muted">Remove or correct NEXT_PUBLIC_CAREEROPS_API_BASE_URL to return to demo mode.</p>
        </section>
      </main>
    );
  }

  if (!snapshot) {
    return (
      <main className="shell loading-shell">
        <div className="loading-card" role="status" aria-live="polite">
          <span className="loading-dot" />
          Loading Evidence Console…
        </div>
      </main>
    );
  }

  const canonicalCount = snapshot.elements.filter((element) => element.verification_state === "CANONICAL").length;

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">CareerOps</p>
          <h1>Evidence Console</h1>
          <p className="subtitle">Browse candidate evidence, inspect provenance, and review lifecycle state.</p>
        </div>
        <div className="topbar-status">
          <span className={`mode-pill ${snapshot.metadata.mode === "DEMO" ? "mode-demo" : "mode-live"}`}>
            {snapshot.metadata.mode} MODE
          </span>
          <span className="muted small">Read-only v0.1</span>
        </div>
      </header>

      <section className="summary-strip" aria-label="Evidence corpus summary">
        <div><strong>{snapshot.metadata.object_count}</strong><span>Objects</span></div>
        <div><strong>{snapshot.metadata.element_count}</strong><span>Elements</span></div>
        <div><strong>{canonicalCount}</strong><span>Canonical</span></div>
        <div><strong>{reviewElements.length}</strong><span>In review</span></div>
        <div><strong>{snapshot.metadata.source_count}</strong><span>Sources</span></div>
      </section>

      <nav className="tabs" aria-label="Evidence Console sections">
        <button className={view === "evidence" ? "tab active" : "tab"} onClick={() => setView("evidence")}>
          Evidence
        </button>
        <button className={view === "review" ? "tab active" : "tab"} onClick={() => setView("review")}>
          Review Queue <span className="tab-count">{reviewElements.length}</span>
        </button>
        <button className={view === "health" ? "tab active" : "tab"} onClick={() => setView("health")}>
          System Health
        </button>
      </nav>

      {view === "evidence" && (
        <section className="evidence-view">
          <aside className="browser-panel">
            <div className="filter-stack">
              <label>
                <span>Search</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="SQL, reporting, project…"
                  type="search"
                />
              </label>
              <div className="filter-row">
                <label>
                  <span>Collection</span>
                  <select value={collection} onChange={(event) => setCollection(event.target.value as "ALL" | EvidenceCollection)}>
                    {collectionOptions.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </label>
                <label>
                  <span>Verification</span>
                  <select value={verification} onChange={(event) => setVerification(event.target.value as "ALL" | VerificationState)}>
                    {verificationOptions.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </label>
              </div>
            </div>

            <div className="result-heading">
              <span>{filteredObjects.length} matching objects</span>
              <button type="button" disabled title="Creation is gated on the Engine mutation contract.">+ Add evidence</button>
            </div>

            <div className="object-list">
              {filteredObjects.map((object) => {
                const elements = objectElements(snapshot, object);
                return (
                  <button
                    type="button"
                    key={object.object_id}
                    className={selectedObject?.object_id === object.object_id ? "object-card selected" : "object-card"}
                    onClick={() => setSelectedObjectId(object.object_id)}
                  >
                    <span className="object-type">{humanize(object.object_type)}</span>
                    <strong>{object.title}</strong>
                    <span className="object-org">{object.organization ?? "No organization"}</span>
                    <span className="object-meta">{elements.length} atomic element{elements.length === 1 ? "" : "s"}</span>
                  </button>
                );
              })}
              {filteredObjects.length === 0 && <p className="empty-state">No Evidence Objects match these filters.</p>}
            </div>
          </aside>

          <section className="detail-panel">
            {selectedObject ? (
              <ObjectDetail snapshot={snapshot} object={selectedObject} />
            ) : (
              <div className="empty-detail"><p>Select an Evidence Object to inspect its atomic claims.</p></div>
            )}
          </section>
        </section>
      )}

      {view === "review" && (
        <section className="review-view">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Lifecycle</p>
              <h2>Evidence review queue</h2>
              <p className="muted">Noncanonical elements remain reviewable but are not promoted by this console.</p>
            </div>
            <button type="button" disabled title="Promotion is gated on the Engine mutation contract.">Promote selected</button>
          </div>

          <div className="lifecycle">
            {(["DISCOVERED", "EXTRACTED", "REVIEWED", "VALIDATED", "CANONICAL"] as VerificationState[]).map((state, index) => (
              <div className="life-step" key={state}>
                <span>{index + 1}</span>
                <div><strong>{humanize(state)}</strong><small>{snapshot.elements.filter((item) => item.verification_state === state).length} elements</small></div>
              </div>
            ))}
          </div>

          <div className="review-list">
            {reviewElements.map((element) => (
              <ElementReviewCard key={element.element_id} element={element} snapshot={snapshot} />
            ))}
            {reviewElements.length === 0 && <p className="empty-state">No items currently require review.</p>}
          </div>
        </section>
      )}

      {view === "health" && (
        <section className="health-view">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Corpus diagnostics</p>
              <h2>System health</h2>
              <p className="muted">Manifest and index indicators exposed through the Evidence API boundary.</p>
            </div>
          </div>

          <div className="health-grid">
            <HealthCard label="Manifest" value={snapshot.metadata.manifest_fresh ? "Fresh" : "Stale"} good={snapshot.metadata.manifest_fresh} />
            <HealthCard label="Indexes" value={snapshot.metadata.indexes_valid ? "Valid" : "Invalid"} good={snapshot.metadata.indexes_valid} />
            <HealthCard label="Schema" value={`v${snapshot.metadata.schema_version}`} good />
            <HealthCard label="Index version" value={`v${snapshot.metadata.index_version}`} good />
          </div>

          <dl className="metadata-table">
            <div><dt>Mode</dt><dd>{snapshot.metadata.mode}</dd></div>
            <div><dt>Generated</dt><dd>{snapshot.metadata.generated_at}</dd></div>
            <div><dt>Source revision</dt><dd><code>{snapshot.metadata.source_revision}</code></dd></div>
            <div><dt>Eligible production states</dt><dd>{snapshot.metadata.eligible_verification_states.join(", ")}</dd></div>
            <div><dt>Objects / Elements</dt><dd>{snapshot.metadata.object_count} / {snapshot.metadata.element_count}</dd></div>
            <div><dt>Sources / Fragments</dt><dd>{snapshot.metadata.source_count} / {snapshot.metadata.fragment_count}</dd></div>
          </dl>

          <div className="boundary-note">
            <strong>Write boundary active</strong>
            <p>The console intentionally exposes no direct filesystem mutation. Future writes must pass through the CareerOps Engine mutation/change-set contract and return a newly validated corpus state.</p>
          </div>
        </section>
      )}
    </main>
  );
}

function ObjectDetail({ snapshot, object }: { snapshot: EvidenceSnapshot; object: EvidenceObject }) {
  const elements = objectElements(snapshot, object);

  return (
    <div>
      <div className="detail-header">
        <div>
          <span className="object-type">{humanize(object.object_type)}</span>
          <h2>{object.title}</h2>
          <p className="detail-org">{object.organization ?? "No organization"} · {dateRange(object)}</p>
        </div>
        <div className="detail-actions">
          <button type="button" disabled title="Editing is gated on the Engine mutation contract.">Edit object</button>
          <button type="button" disabled title="Superseding is gated on the Engine mutation contract.">Supersede</button>
        </div>
      </div>

      {object.summary && <p className="object-summary">{object.summary}</p>}

      <div className="detail-section-heading">
        <div><h3>Atomic Evidence Elements</h3><span>{elements.length}</span></div>
        <p>Each element represents one independently defensible claim.</p>
      </div>

      <div className="element-list">
        {elements.map((element) => (
          <article className="element-card" key={element.element_id}>
            <div className="element-topline">
              <span className="element-type">{humanize(element.element_type)}</span>
              <span className={stateClass(element.verification_state)}>{humanize(element.verification_state)}</span>
            </div>
            <p className="statement">{element.statement}</p>
            <div className="tag-row">
              {element.facets.map((facet) => <span className="tag" key={facet.id}>{facet.label}</span>)}
              {element.capability_refs.map((capability) => <span className="tag capability" key={capability}>{humanize(capability)}</span>)}
            </div>
            <dl className="element-meta">
              <div><dt>Claim</dt><dd>{humanize(element.claim_classification)}</dd></div>
              <div><dt>Allowed usage</dt><dd>{element.allowed_usage.join(" · ")}</dd></div>
              <div><dt>Sources</dt><dd>{element.source_refs.map((source) => sourceLabel(snapshot, source)).join(" · ")}</dd></div>
            </dl>
            {element.role_affinities.length > 0 && (
              <div className="affinity-row">
                {element.role_affinities.map((affinity) => (
                  <span key={affinity.profile_ref}>{humanize(affinity.profile_ref)} <strong>{Math.round(affinity.relevance * 100)}%</strong></span>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>

      <div className="provenance-box">
        <h3>Object provenance</h3>
        {object.source_refs.map((sourceId) => {
          const source = snapshot.sources.find((item) => item.source_id === sourceId);
          return source ? (
            <div className="source-row" key={source.source_id}>
              <div><strong>{source.label}</strong><span>{humanize(source.source_type)}</span></div>
              <code>{source.locator}</code>
            </div>
          ) : null;
        })}
      </div>
    </div>
  );
}

function ElementReviewCard({ element, snapshot }: { element: EvidenceElement; snapshot: EvidenceSnapshot }) {
  const object = snapshot.objects.find((item) => item.object_id === element.object_ref);
  return (
    <article className="review-card">
      <div className="review-main">
        <div className="element-topline">
          <span className={stateClass(element.verification_state)}>{humanize(element.verification_state)}</span>
          <span className="element-type">{humanize(element.element_type)}</span>
        </div>
        <p className="statement">{element.statement}</p>
        <p className="muted small">{object?.title ?? element.object_ref} · {humanize(element.claim_classification)}</p>
      </div>
      <div className="review-source">
        <span>Provenance</span>
        <strong>{element.source_refs.map((source) => sourceLabel(snapshot, source)).join(" · ")}</strong>
      </div>
      <div className="review-actions">
        <button type="button" disabled title="Review mutations are not enabled in v0.1.">Validate</button>
        <button type="button" disabled title="Review mutations are not enabled in v0.1.">Reject</button>
      </div>
    </article>
  );
}

function HealthCard({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <article className="health-card">
      <span className={good ? "health-indicator good" : "health-indicator bad"} />
      <div><span>{label}</span><strong>{value}</strong></div>
    </article>
  );
}
