import {
  translateDetailResponse,
  translateEngineHealth,
  translateItemsResponse,
  translateSearchResponse
} from "../evidence-contract";
import type {
  EvidenceHealthResponse,
  EvidenceItemDetailResponse,
  EvidenceItemsResponse,
  EvidenceSearchResponse
} from "../evidence-types";
import { mockDetail, mockList, mockSearch } from "./mock-engine";

export type EvidenceGatewayErrorCode =
  | "CONFIGURATION_ERROR"
  | "ENGINE_AUTH_FAILED"
  | "ENGINE_UNAVAILABLE"
  | "ENGINE_API_ERROR"
  | "ENGINE_REQUEST_FAILED"
  | "ENGINE_CONTRACT_ERROR"
  | "NOT_FOUND";

export class EvidenceGatewayError extends Error {
  constructor(
    readonly status: number,
    readonly code: EvidenceGatewayErrorCode,
    message: string
  ) {
    super(message);
    this.name = "EvidenceGatewayError";
  }
}

export function getEvidenceMode(): "LIVE" | "MOCK" {
  const raw = (process.env.CAREEROPS_EVIDENCE_MODE ?? "live").trim().toLowerCase();
  if (raw === "live") return "LIVE";
  if (raw === "mock") return "MOCK";
  throw new EvidenceGatewayError(
    503,
    "CONFIGURATION_ERROR",
    "CAREEROPS_EVIDENCE_MODE must be either live or mock."
  );
}

function allowedQuery(source: URLSearchParams, allowed: ReadonlySet<string>): URLSearchParams {
  const output = new URLSearchParams();
  for (const [key, value] of source.entries()) {
    if (!allowed.has(key)) {
      throw new EvidenceGatewayError(422, "ENGINE_REQUEST_FAILED", "Unsupported query parameter.");
    }
    output.append(key, value);
  }
  return output;
}

function liveConfig() {
  const baseUrl = process.env.CAREEROPS_ENGINE_BASE_URL?.trim();
  const token = process.env.CAREEROPS_ENGINE_API_TOKEN?.trim();
  if (!baseUrl || !token) {
    throw new EvidenceGatewayError(
      503,
      "CONFIGURATION_ERROR",
      "Live Evidence mode requires server-side CareerOps Engine URL and bearer credentials."
    );
  }
  return { baseUrl: baseUrl.replace(/\/$/, ""), token };
}

async function engineJson(path: string): Promise<unknown> {
  const { baseUrl, token } = liveConfig();
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      },
      cache: "no-store"
    });
  } catch {
    throw new EvidenceGatewayError(
      502,
      "ENGINE_UNAVAILABLE",
      "CareerOps Engine could not be reached."
    );
  }

  if (response.status === 401 || response.status === 403) {
    throw new EvidenceGatewayError(
      502,
      "ENGINE_AUTH_FAILED",
      "CareerOps Engine rejected the Console server credential."
    );
  }

  if (response.status === 404) {
    throw new EvidenceGatewayError(404, "NOT_FOUND", "Evidence item not found.");
  }

  if (!response.ok) {
    if (response.status >= 500) {
      throw new EvidenceGatewayError(
        502,
        "ENGINE_API_ERROR",
        "CareerOps Engine returned an upstream service error."
      );
    }
    throw new EvidenceGatewayError(
      response.status,
      "ENGINE_REQUEST_FAILED",
      "CareerOps Engine rejected the Evidence read request."
    );
  }

  try {
    return await response.json();
  } catch {
    throw new EvidenceGatewayError(
      502,
      "ENGINE_CONTRACT_ERROR",
      "CareerOps Engine returned an invalid JSON response."
    );
  }
}

function translateOrContractError<T>(translate: (value: unknown) => T, raw: unknown): T {
  try {
    return translate(raw);
  } catch {
    throw new EvidenceGatewayError(
      502,
      "ENGINE_CONTRACT_ERROR",
      "CareerOps Engine returned a response outside the verified read contract."
    );
  }
}

export async function listEvidenceItems(source: URLSearchParams): Promise<EvidenceItemsResponse> {
  const params = allowedQuery(source, new Set(["object_type", "text", "limit"]));
  if (getEvidenceMode() === "MOCK") return mockList(params);
  const query = params.toString();
  const raw = await engineJson(`/v1/evidence/items${query ? `?${query}` : ""}`);
  return translateOrContractError(translateItemsResponse, raw);
}

export async function getEvidenceItem(objectId: string): Promise<EvidenceItemDetailResponse> {
  if (!objectId.trim()) {
    throw new EvidenceGatewayError(404, "NOT_FOUND", "Evidence item not found.");
  }
  if (getEvidenceMode() === "MOCK") {
    const detail = mockDetail(objectId);
    if (!detail) throw new EvidenceGatewayError(404, "NOT_FOUND", "Evidence item not found.");
    return detail;
  }
  const raw = await engineJson(`/v1/evidence/items/${encodeURIComponent(objectId)}`);
  return translateOrContractError(translateDetailResponse, raw);
}

export async function searchEvidence(source: URLSearchParams): Promise<EvidenceSearchResponse> {
  const params = allowedQuery(
    source,
    new Set([
      "object_id",
      "object_type",
      "element_type",
      "facet",
      "capability",
      "role_profile",
      "min_role_relevance",
      "claim_classification",
      "limit"
    ])
  );
  if (getEvidenceMode() === "MOCK") return mockSearch(params);
  const query = params.toString();
  const raw = await engineJson(`/v1/evidence/search${query ? `?${query}` : ""}`);
  return translateOrContractError(translateSearchResponse, raw);
}

export async function getEvidenceHealth(): Promise<EvidenceHealthResponse> {
  const mode = getEvidenceMode();
  if (mode === "MOCK") {
    return translateEngineHealth({ status: "ok" }, mode);
  }
  const raw = await engineJson("/healthz");
  return translateOrContractError((value) => translateEngineHealth(value, mode), raw);
}
