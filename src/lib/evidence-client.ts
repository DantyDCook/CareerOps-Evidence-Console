import type {
  EvidenceHealthResponse,
  EvidenceItemDetailResponse,
  EvidenceItemsResponse,
  EvidenceListQuery,
  EvidenceSearchQuery,
  EvidenceSearchResponse
} from "./evidence-types";

export class EvidenceClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string
  ) {
    super(message);
    this.name = "EvidenceClientError";
  }
}

function appendQuery(params: URLSearchParams, key: string, value: string | number | string[] | undefined) {
  if (value === undefined || value === "") return;
  if (Array.isArray(value)) {
    value.filter(Boolean).forEach((item) => params.append(key, item));
    return;
  }
  params.set(key, String(value));
}

async function readJson<T>(url: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store"
    });
  } catch {
    throw new EvidenceClientError(
      "The Evidence Console server could not be reached.",
      0,
      "CONSOLE_NETWORK_ERROR"
    );
  }

  const payload = await response.json().catch(() => null) as
    | { error?: { code?: string; message?: string } }
    | T
    | null;

  if (!response.ok) {
    const errorPayload = payload && typeof payload === "object" && "error" in payload ? payload.error : undefined;
    throw new EvidenceClientError(
      errorPayload?.message ?? `Evidence request failed with HTTP ${response.status}.`,
      response.status,
      errorPayload?.code ?? "CONSOLE_API_ERROR"
    );
  }

  return payload as T;
}

export interface EvidenceClient {
  listItems(query?: EvidenceListQuery): Promise<EvidenceItemsResponse>;
  getItem(objectId: string): Promise<EvidenceItemDetailResponse>;
  search(query?: EvidenceSearchQuery): Promise<EvidenceSearchResponse>;
  getHealth(): Promise<EvidenceHealthResponse>;
}

class SameOriginEvidenceClient implements EvidenceClient {
  async listItems(query: EvidenceListQuery = {}): Promise<EvidenceItemsResponse> {
    const params = new URLSearchParams();
    appendQuery(params, "object_type", query.object_type);
    appendQuery(params, "text", query.text);
    appendQuery(params, "limit", query.limit ?? 100);
    return readJson<EvidenceItemsResponse>(`/api/evidence/items?${params.toString()}`);
  }

  async getItem(objectId: string): Promise<EvidenceItemDetailResponse> {
    return readJson<EvidenceItemDetailResponse>(`/api/evidence/items/${encodeURIComponent(objectId)}`);
  }

  async search(query: EvidenceSearchQuery = {}): Promise<EvidenceSearchResponse> {
    const params = new URLSearchParams();
    appendQuery(params, "object_id", query.object_id);
    appendQuery(params, "object_type", query.object_type);
    appendQuery(params, "element_type", query.element_type);
    appendQuery(params, "facet", query.facet);
    appendQuery(params, "capability", query.capability);
    appendQuery(params, "role_profile", query.role_profile);
    appendQuery(params, "min_role_relevance", query.min_role_relevance);
    appendQuery(params, "claim_classification", query.claim_classification);
    appendQuery(params, "limit", query.limit ?? 50);
    return readJson<EvidenceSearchResponse>(`/api/evidence/search?${params.toString()}`);
  }

  async getHealth(): Promise<EvidenceHealthResponse> {
    return readJson<EvidenceHealthResponse>("/api/evidence/health");
  }
}

export function createEvidenceClient(): EvidenceClient {
  return new SameOriginEvidenceClient();
}
