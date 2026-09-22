"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { createEvidenceClient, EvidenceClientError } from "@/lib/evidence-client";
import type {
  EvidenceElement,
  EvidenceHealthResponse,
  EvidenceItemDetailResponse,
  EvidenceItemSummary
} from "@/lib/evidence-types";
import { deriveReadViewState } from "@/lib/view-state";

type ConsoleView = "evidence" | "search" | "health";

const client = createEvidenceClient();

const collectionOptions = [
  "ALL",
  "EMPLOYMENT",
  "PROJECT",
  "EDUCATION",
  "CERTIFICATION",
  "CAPABILITY",
  "PROFESSIONAL_DEVELOPMENT",
  "OTHER"
];

const elementTypeOptions = [
  "ALL",
  "ACHIEVEMENT",
  "RESPONSIBILITY",
  "SKILL",
  "TOOL_USAGE",
  "TECHNOLOGY_USAGE",
  "METHODOLOGY",
  "METRIC",
  "ROLE_FUNCTION",
  "DOMAIN_EXPERIENCE",
  "LEADERSHIP",
  "EDUCATION_FACT",
  "CERTIFICATION_FACT",
  "OTHER"
];

const claimOptions = ["ALL", "EXPLICIT", "VALIDATED_INFERENCE", "INFERRED"];

function humanize(value: string) {
  return value
    .replace(/:/g, ": ")
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function stateClass(state: string) {
  return `status status-${state.toLowerCase()}`;
}

function errorMessage(error: unknown) {
  if (!(error instanceof EvidenceClientError)) {
    return error instanceof Error ? error.message : "Unable to read Evidence.";
  }

  switch (error.code) {
    case "CONFIGURATION_ERROR":
      return "Live Evidence mode is not configured on the Console server. Configure the server-only Engine URL and bearer credential, or explicitly select mock mode for development.";
    case "ENGINE_AUTH_FAILED":
      return "The Console server could not authenticate to CareerOps-Engine. Check the server-side bearer credential and Engine authentication configuration.";
    case "ENGINE_UNAVAILABLE":
      return "CareerOps-Engine is unreachable from the Console server.";
    case "ENGINE_API_ERROR":
    case "ENGINE_CONTRACT_ERROR":
      return error.message;
    case "CONSOLE_NETWORK_ERROR":
      return "The browser could not reach the same-origin Evidence Console API.";
    default:
      return error.message;
  }
}

function verificationLabel(item: EvidenceItemSummary) {
  const entries = Object.entries(item.verification_states);
  if (entries.length === 0) return "No visible elements";
  return entries.map(([state, count]) => `${humanize(state)} ${count}`).join(" · ");
}

function ElementCard({ element }: { element: EvidenceElement }) {
  return (
    <article className="element-card">
      <div className="element-topline">
        <span className="element-type">{humanize(element.element_type)}</span>
        <span className={stateClass(element.verification_state)}>
          {humanize(element.verification_state)}
        </span>
      </div>

      <p className="statement">{element.statement}</p>

      <div className="tag-row">
        {element.facets.map((facet) => (
          <span className="tag" key={facet}>{facet}</span>
        ))}
        {element.capability_refs.map((capability) => (
          <span className="tag capability" key={capability}>{humanize(capability)}</span>
        ))}
      </div>

      <dl className="element-meta">
        <div>
          <dt>Claim</dt>
          <dd>{humanize(element.claim_classification)}</dd>
        </div>
        <div>
          <dt>Allowed usage</dt>
          <dd>{element.allowed_usage.length ? element.allowed_usage.join(" · ") : "None exposed"}</dd>
        </div>
        <div>
          <dt>Element ID</dt>
          <dd><code>{element.element_id}</code></dd>
        </div>
      </dl>

      {element.role_affinities.length > 0 && (
        <div className="affinity-row">
          {element.role_affinities.map((affinity) => (
            <span key={`${affinity.profile_ref}-${affinity.assignment_provenance}`}>
              {humanize(affinity.profile_ref)}{" "}
              <strong>{Math.round(affinity.relevance * 100)}%</strong>
              {" · "}
              {humanize(affinity.assignment_provenance)}
            </span>
          ))}
        </div>
      )}

      {element.metrics.length > 0 && (
        <div className="metric-row">
          {element.metrics.map((metric) => (
            <span key={metric.name}>
              <strong>{humanize(metric.name)}</strong>{" "}
              {metric.value === null ? "n/a" : String(metric.value)}
              {metric.unit ? ` ${metric.unit}` : ""}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

function ObjectDetail({
  detail,
  loading,
  error
}: {
  detail: EvidenceItemDetailResponse | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return <div className="empty-detail" role="status">Loading object detail…</div>;
  }
  if (error) {
    return <div className="inline-error" role="alert">{error}</div>;
  }
  if (!detail) {
    return <div className="empty-detail"><p>Select an Evidence Object to inspect its canonical Elements.</p></div>;
  }

  return (
    <div>
      <div className="detail-header">
        <div>
          <span className="object-type">{humanize(detail.item.object_type)}</span>
          <h2>{detail.item.title}</h2>
          <p className="detail-org">{detail.item.organization ?? "No organization exposed"}</p>
        </div>
        <div className="detail-actions">
          <span className="mode-pill mode-live">READ ONLY</span>
        </div>
      </div>

      {detail.item.summary && <p className="object-summary">{detail.item.summary}</p>}

      <div className="detail-section-heading">
        <div>
          <h3>Canonical Evidence Elements</h3>
          <span>{detail.elements.length}</span>
        </div>
        <p>Only Engine-authorized production/index-eligible Evidence is visible here.</p>
      </div>

      <div className="element-list">
        {detail.elements.map((element) => <ElementCard key={element.element_id} element={element} />)}
        {detail.elements.length === 0 && <p className="empty-state">No canonical Elements were returned.</p>}
      </div>

      <div className="provenance-box">
        <h3>Source coverage</h3>
        <p className="muted">
          {detail.item.source_count} referenced source record{detail.item.source_count === 1 ? "" : "s"} contribute to the visible canonical Elements.
          The remote read API intentionally does not expose source records, fragments, filesystem locations, or hidden provenance.
        </p>
      </div>
    </div>
  );
}

export default function EvidenceConsolePage() {
  const [view, setView] = useState<ConsoleView>("evidence");
  const [health, setHealth] = useState<EvidenceHealthResponse | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);

  const [items, setItems] = useState<EvidenceItemSummary[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [objectText, setObjectText] = useState("");
  const [objectType, setObjectType] = useState("ALL");
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

  const [detail, setDetail] = useState<EvidenceItemDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [elementType, setElementType] = useState("ALL");
  const [claimClassification, setClaimClassification] = useState("ALL");
  const [facet, setFacet] = useState("");
  const [capability, setCapability] = useState("");
  const [roleProfile, setRoleProfile] = useState("");
  const [minRoleRelevance, setMinRoleRelevance] = useState("");
  const [searchResults, setSearchResults] = useState<EvidenceElement[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchRan, setSearchRan] = useState(false);

  useEffect(() => {
    let active = true;
    client.getHealth()
      .then((result) => {
        if (!active) return;
        setHealth(result);
        setHealthError(null);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setHealthError(errorMessage(error));
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setListLoading(true);
      setListError(null);
      client.listItems({
        object_type: objectType === "ALL" ? undefined : objectType,
        text: objectText.trim() || undefined,
        limit: 100
      })
        .then((result) => {
          if (!active) return;
          setItems(result.items);
          setSelectedObjectId((current) => {
            if (current && result.items.some((item) => item.object_id === current)) return current;
            return result.items[0]?.object_id ?? null;
          });
        })
        .catch((error: unknown) => {
          if (!active) return;
          setItems([]);
          setSelectedObjectId(null);
          setListError(errorMessage(error));
        })
        .finally(() => {
          if (active) setListLoading(false);
        });
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [objectText, objectType]);

  useEffect(() => {
    let active = true;
    if (!selectedObjectId) {
      setDetail(null);
      setDetailError(null);
      return () => {
        active = false;
      };
    }

    setDetailLoading(true);
    setDetailError(null);
    client.getItem(selectedObjectId)
      .then((result) => {
        if (!active) return;
        setDetail(result);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setDetail(null);
        setDetailError(errorMessage(error));
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedObjectId]);

  async function runElementSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchRan(true);
    setSearchLoading(true);
    setSearchError(null);

    let minimum: number | undefined;
    if (minRoleRelevance.trim()) {
      minimum = Number(minRoleRelevance);
      if (!Number.isFinite(minimum) || minimum < 0 || minimum > 1) {
        setSearchLoading(false);
        setSearchResults([]);
        setSearchError("Minimum role relevance must be a number from 0 to 1.");
        return;
      }
    }

    try {
      const result = await client.search({
        object_type: objectType === "ALL" ? undefined : objectType,
        element_type: elementType === "ALL" ? undefined : elementType,
        facet: facet.trim() || undefined,
        capability: capability.trim() || undefined,
        role_profile: roleProfile.trim() || undefined,
        min_role_relevance: minimum,
        claim_classification: claimClassification === "ALL" ? undefined : claimClassification,
        limit: 50
      });
      setSearchResults(result.results);
    } catch (error: unknown) {
      setSearchResults([]);
      setSearchError(errorMessage(error));
    } finally {
      setSearchLoading(false);
    }
  }

  const loadedElementCount = useMemo(
    () => items.reduce((sum, item) => sum + item.element_count, 0),
    [items]
  );
  const canonicalCount = useMemo(
    () => items.reduce((sum, item) => sum + (item.verification_states.CANONICAL ?? 0), 0),
    [items]
  );
  const sourceRefCount = useMemo(
    () => items.reduce((sum, item) => sum + item.source_count, 0),
    [items]
  );
  const listState = deriveReadViewState(listLoading, listError, items.length);

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">CareerOps</p>
          <h1>Evidence Console</h1>
          <p className="subtitle">Browse and search production canonical Evidence through the CareerOps-Engine read boundary.</p>
        </div>
        <div className="topbar-status">
          <span className={`mode-pill ${health?.mode === "MOCK" ? "mode-demo" : "mode-live"}`}>
            {health?.mode ?? "LIVE"} MODE
          </span>
          <span className="muted small">Read-only integration</span>
        </div>
      </header>

      <section className="summary-strip" aria-label="Loaded Evidence summary">
        <div><strong>{items.length}</strong><span>Loaded objects</span></div>
        <div><strong>{loadedElementCount}</strong><span>Linked elements</span></div>
        <div><strong>{canonicalCount}</strong><span>Canonical elements</span></div>
        <div><strong>{sourceRefCount}</strong><span>Source refs</span></div>
        <div><strong>{health?.status ?? "—"}</strong><span>Engine health</span></div>
      </section>

      <nav className="tabs" aria-label="Evidence Console sections">
        <button className={view === "evidence" ? "tab active" : "tab"} onClick={() => setView("evidence")}>
          Evidence
        </button>
        <button className={view === "search" ? "tab active" : "tab"} onClick={() => setView("search")}>
          Element Search
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
                <span>Object search</span>
                <input
                  value={objectText}
                  onChange={(event) => setObjectText(event.target.value)}
                  placeholder="Title, type, or object ID"
                />
              </label>
              <div className="filter-row">
                <label>
                  <span>Object type</span>
                  <select value={objectType} onChange={(event) => setObjectType(event.target.value)}>
                    {collectionOptions.map((option) => (
                      <option key={option} value={option}>{option === "ALL" ? "All object types" : humanize(option)}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Visibility</span>
                  <select value="PRODUCTION_CANONICAL" disabled>
                    <option>Production canonical</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="result-heading">
              <span>{listLoading ? "Loading…" : `${items.length} object${items.length === 1 ? "" : "s"}`}</span>
              <span>Engine limit: 100</span>
            </div>

            <div className="object-list" aria-live="polite">
              {listState === "loading" && <p className="empty-state">Loading canonical Evidence…</p>}
              {listState === "error" && <p className="empty-state inline-error" role="alert">{listError}</p>}
              {listState === "empty" && <p className="empty-state">No production canonical Evidence matched these object filters.</p>}
              {listState === "ready" && items.map((item) => (
                <button
                  className={item.object_id === selectedObjectId ? "object-card selected" : "object-card"}
                  key={item.object_id}
                  onClick={() => setSelectedObjectId(item.object_id)}
                >
                  <span className="object-type">{humanize(item.object_type)}</span>
                  <strong>{item.title}</strong>
                  <span className="object-org">{item.organization ?? "No organization exposed"}</span>
                  <span className="object-meta">{item.element_count} elements · {item.source_count} source refs</span>
                  <span className="object-meta">{verificationLabel(item)}</span>
                </button>
              ))}
            </div>
          </aside>

          <section className="detail-panel">
            <ObjectDetail detail={detail} loading={detailLoading} error={detailError} />
          </section>
        </section>
      )}

      {view === "search" && (
        <section className="review-view">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Structured retrieval</p>
              <h2>Search canonical Elements</h2>
              <p className="muted">
                These filters map only to the current Engine search contract. Verification-state filtering is intentionally unavailable because the remote surface is already restricted to production/index-eligible Evidence.
              </p>
            </div>
          </div>

          <form className="search-form" onSubmit={runElementSearch}>
            <div className="filter-row">
              <label>
                <span>Object type</span>
                <select value={objectType} onChange={(event) => setObjectType(event.target.value)}>
                  {collectionOptions.map((option) => (
                    <option key={option} value={option}>{option === "ALL" ? "All object types" : humanize(option)}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Visibility</span>
                <select value="PRODUCTION_CANONICAL" disabled>
                  <option>Production canonical</option>
                </select>
              </label>
            </div>
            <div className="filter-row">
              <label>
                <span>Element type</span>
                <select value={elementType} onChange={(event) => setElementType(event.target.value)}>
                  {elementTypeOptions.map((option) => (
                    <option key={option} value={option}>{option === "ALL" ? "All element types" : humanize(option)}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Claim classification</span>
                <select value={claimClassification} onChange={(event) => setClaimClassification(event.target.value)}>
                  {claimOptions.map((option) => (
                    <option key={option} value={option}>{option === "ALL" ? "All classifications" : humanize(option)}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="filter-row">
              <label><span>Facet</span><input value={facet} onChange={(event) => setFacet(event.target.value)} placeholder="skill:SQL" /></label>
              <label><span>Capability</span><input value={capability} onChange={(event) => setCapability(event.target.value)} placeholder="DATA_QUALITY" /></label>
            </div>
            <div className="filter-row">
              <label><span>Role profile</span><input value={roleProfile} onChange={(event) => setRoleProfile(event.target.value)} placeholder="DATA_ENGINEERING" /></label>
              <label><span>Minimum relevance</span><input value={minRoleRelevance} onChange={(event) => setMinRoleRelevance(event.target.value)} inputMode="decimal" placeholder="0.8" /></label>
            </div>
            <div className="search-actions">
              <button type="submit" disabled={searchLoading}>{searchLoading ? "Searching…" : "Search Elements"}</button>
            </div>
          </form>

          {searchError && <div className="inline-error" role="alert">{searchError}</div>}
          {!searchRan && !searchLoading && <p className="empty-state">Choose optional filters, then run a structured Engine search.</p>}
          {searchRan && !searchLoading && !searchError && searchResults.length === 0 && (
            <p className="empty-state">No production canonical Elements matched those filters.</p>
          )}
          <div className="element-list" aria-live="polite">
            {searchResults.map((element) => <ElementCard key={element.element_id} element={element} />)}
          </div>
        </section>
      )}

      {view === "health" && (
        <section className="health-view">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Read boundary</p>
              <h2>System health</h2>
              <p className="muted">Only health information actually exposed by the current Engine read API is reported as runtime data.</p>
            </div>
          </div>

          <div className="health-grid">
            <HealthCard label="Engine" value={health?.status ?? "Unavailable"} good={health?.status === "ok"} />
            <HealthCard label="Console mode" value={health?.mode ?? "Unknown"} good={Boolean(health)} />
            <HealthCard label="Upstream" value={health?.upstream ?? "CareerOps-Engine"} good={Boolean(health)} />
            <HealthCard label="Mutation" value="Disabled" good />
          </div>

          {healthError && <div className="inline-error" role="alert">{healthError}</div>}

          <dl className="metadata-table">
            <div><dt>Canonical scope</dt><dd>Production/index-eligible Evidence only</dd></div>
            <div><dt>Workspace authority</dt><dd>Private Workspace state remains behind CareerOps-Engine; the browser has no direct access.</dd></div>
            <div><dt>Detailed provenance</dt><dd>Not exposed by API-001A/B; only per-object source counts are visible.</dd></div>
            <div><dt>Corpus revision</dt><dd>Not exposed by API-001A/B.</dd></div>
            <div><dt>Read routes</dt><dd><code>/v1/evidence/items</code>, detail, search, and <code>/healthz</code> through same-origin Console handlers.</dd></div>
          </dl>

          <div className="boundary-note">
            <strong>Production versus staging</strong>
            <p>
              This Console read integration shows canonical production Evidence only. Staging, extracted, review-candidate, authoring, and mutation concepts are intentionally outside this read surface and are not represented as production Evidence.
            </p>
          </div>
        </section>
      )}
    </main>
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
