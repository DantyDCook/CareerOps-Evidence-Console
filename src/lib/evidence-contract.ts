import type {
  EvidenceElement,
  EvidenceHealthResponse,
  EvidenceItemDetailResponse,
  EvidenceItemSummary,
  EvidenceItemsResponse,
  EvidenceMetric,
  EvidenceRoleAffinity,
  EvidenceSearchResponse
} from "./evidence-types";

type JsonRecord = Record<string, unknown>;

export class EvidenceContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EvidenceContractError";
  }
}

function asRecord(value: unknown, label: string): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new EvidenceContractError(`${label} must be an object.`);
  }
  return value as JsonRecord;
}

function requiredString(record: JsonRecord, key: string): string {
  const value = record[key];
  if (typeof value !== "string") {
    throw new EvidenceContractError(`${key} must be a string.`);
  }
  return value;
}

function optionalString(record: JsonRecord, key: string): string | null {
  const value = record[key];
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") {
    throw new EvidenceContractError(`${key} must be a string or null.`);
  }
  return value;
}

function finiteNumber(record: JsonRecord, key: string): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new EvidenceContractError(`${key} must be a finite number.`);
  }
  return value;
}

function stringArray(record: JsonRecord, key: string): string[] {
  const value = record[key];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new EvidenceContractError(`${key} must be an array of strings.`);
  }
  return [...value] as string[];
}

function verificationStates(record: JsonRecord): Record<string, number> {
  const raw = asRecord(record.verification_states, "verification_states");
  return Object.fromEntries(
    Object.entries(raw).map(([key, value]) => {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new EvidenceContractError("verification_states values must be finite numbers.");
      }
      return [key, value];
    })
  );
}

export function translateItemSummary(value: unknown): EvidenceItemSummary {
  const record = asRecord(value, "Evidence item summary");
  return {
    object_id: requiredString(record, "object_id"),
    object_type: requiredString(record, "object_type"),
    title: requiredString(record, "title"),
    organization: optionalString(record, "organization"),
    summary: optionalString(record, "summary"),
    element_count: finiteNumber(record, "element_count"),
    source_count: finiteNumber(record, "source_count"),
    verification_states: verificationStates(record)
  };
}

function translateRoleAffinity(value: unknown): EvidenceRoleAffinity {
  const record = asRecord(value, "role affinity");
  return {
    profile_ref: requiredString(record, "profile_ref"),
    relevance: finiteNumber(record, "relevance"),
    assignment_provenance: requiredString(record, "assignment_provenance")
  };
}

function translateMetric(value: unknown): EvidenceMetric {
  const record = asRecord(value, "metric");
  const rawValue = record.value;
  if (
    rawValue !== null &&
    rawValue !== undefined &&
    typeof rawValue !== "string" &&
    typeof rawValue !== "number" &&
    typeof rawValue !== "boolean"
  ) {
    throw new EvidenceContractError("metric value must be scalar or null.");
  }
  if (typeof rawValue === "number" && !Number.isFinite(rawValue)) {
    throw new EvidenceContractError("metric value must be finite.");
  }
  return {
    name: requiredString(record, "name"),
    value: rawValue === undefined ? null : rawValue,
    unit: optionalString(record, "unit")
  };
}

export function translateElement(value: unknown): EvidenceElement {
  const record = asRecord(value, "Evidence element");
  const affinities = record.role_affinities;
  const metrics = record.metrics;
  if (!Array.isArray(affinities) || !Array.isArray(metrics)) {
    throw new EvidenceContractError("role_affinities and metrics must be arrays.");
  }
  return {
    element_id: requiredString(record, "element_id"),
    object_ref: requiredString(record, "object_ref"),
    element_type: requiredString(record, "element_type"),
    statement: requiredString(record, "statement"),
    facets: stringArray(record, "facets"),
    capability_refs: stringArray(record, "capability_refs"),
    role_affinities: affinities.map(translateRoleAffinity),
    metrics: metrics.map(translateMetric),
    verification_state: requiredString(record, "verification_state"),
    claim_classification: requiredString(record, "claim_classification"),
    allowed_usage: stringArray(record, "allowed_usage")
  };
}

export function translateItemsResponse(value: unknown): EvidenceItemsResponse {
  const record = asRecord(value, "Evidence items response");
  if (!Array.isArray(record.items)) {
    throw new EvidenceContractError("items must be an array.");
  }
  return {
    count: finiteNumber(record, "count"),
    items: record.items.map(translateItemSummary)
  };
}

export function translateDetailResponse(value: unknown): EvidenceItemDetailResponse {
  const record = asRecord(value, "Evidence detail response");
  if (!Array.isArray(record.elements)) {
    throw new EvidenceContractError("elements must be an array.");
  }
  return {
    item: translateItemSummary(record.item),
    elements: record.elements.map(translateElement)
  };
}

export function translateSearchResponse(value: unknown): EvidenceSearchResponse {
  const record = asRecord(value, "Evidence search response");
  if (!Array.isArray(record.results)) {
    throw new EvidenceContractError("results must be an array.");
  }
  return {
    count: finiteNumber(record, "count"),
    results: record.results.map(translateElement)
  };
}

export function translateEngineHealth(value: unknown, mode: "LIVE" | "MOCK"): EvidenceHealthResponse {
  const record = asRecord(value, "Engine health response");
  return {
    status: requiredString(record, "status"),
    mode,
    upstream: "CareerOps-Engine"
  };
}
