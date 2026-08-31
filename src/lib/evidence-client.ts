import { demoEvidenceSnapshot } from "./mock-evidence";
import type { EvidenceSnapshot } from "./evidence-types";

export interface EvidenceClient {
  getSnapshot(): Promise<EvidenceSnapshot>;
}

class MockEvidenceClient implements EvidenceClient {
  async getSnapshot(): Promise<EvidenceSnapshot> {
    return structuredClone(demoEvidenceSnapshot);
  }
}

class HttpEvidenceClient implements EvidenceClient {
  constructor(private readonly baseUrl: string) {}

  async getSnapshot(): Promise<EvidenceSnapshot> {
    const response = await fetch(`${this.baseUrl.replace(/\/$/, "")}/evidence/snapshot`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`CareerOps Evidence API returned HTTP ${response.status}.`);
    }

    return (await response.json()) as EvidenceSnapshot;
  }
}

export function createEvidenceClient(): EvidenceClient {
  const baseUrl = process.env.NEXT_PUBLIC_CAREEROPS_API_BASE_URL?.trim();
  return baseUrl ? new HttpEvidenceClient(baseUrl) : new MockEvidenceClient();
}
