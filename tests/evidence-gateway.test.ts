import { afterEach, describe, expect, it, vi } from "vitest";
import {
  EvidenceGatewayError,
  getEvidenceMode,
  listEvidenceItems,
  searchEvidence
} from "../src/lib/server/evidence-gateway";

const originalMode = process.env.CAREEROPS_EVIDENCE_MODE;
const originalBase = process.env.CAREEROPS_ENGINE_BASE_URL;
const originalToken = process.env.CAREEROPS_ENGINE_API_TOKEN;

afterEach(() => {
  vi.unstubAllGlobals();
  if (originalMode === undefined) delete process.env.CAREEROPS_EVIDENCE_MODE;
  else process.env.CAREEROPS_EVIDENCE_MODE = originalMode;
  if (originalBase === undefined) delete process.env.CAREEROPS_ENGINE_BASE_URL;
  else process.env.CAREEROPS_ENGINE_BASE_URL = originalBase;
  if (originalToken === undefined) delete process.env.CAREEROPS_ENGINE_API_TOKEN;
  else process.env.CAREEROPS_ENGINE_API_TOKEN = originalToken;
});

describe("server Evidence gateway", () => {
  it("never silently falls back from live mode to mock mode", async () => {
    process.env.CAREEROPS_EVIDENCE_MODE = "live";
    delete process.env.CAREEROPS_ENGINE_BASE_URL;
    delete process.env.CAREEROPS_ENGINE_API_TOKEN;

    expect(getEvidenceMode()).toBe("LIVE");
    await expect(listEvidenceItems(new URLSearchParams())).rejects.toMatchObject({
      status: 503,
      code: "CONFIGURATION_ERROR"
    });
  });

  it("uses mock data only when mock mode is explicit", async () => {
    process.env.CAREEROPS_EVIDENCE_MODE = "mock";
    delete process.env.CAREEROPS_ENGINE_BASE_URL;
    delete process.env.CAREEROPS_ENGINE_API_TOKEN;

    expect(getEvidenceMode()).toBe("MOCK");
    const list = await listEvidenceItems(new URLSearchParams("object_type=PROJECT"));
    expect(list.count).toBe(1);
    expect(list.items[0].verification_states).toEqual({ CANONICAL: 2 });

    const filtered = await searchEvidence(
      new URLSearchParams("capability=DATA_QUALITY&claim_classification=EXPLICIT")
    );
    expect(filtered.count).toBe(1);
    expect(filtered.results[0].element_id).toBe("elm_demo_sql");
  });

  it("maps upstream unauthorized responses to a safe auth failure", async () => {
    process.env.CAREEROPS_EVIDENCE_MODE = "live";
    process.env.CAREEROPS_ENGINE_BASE_URL = "https://engine.example";
    process.env.CAREEROPS_ENGINE_API_TOKEN = "server-secret";
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 401 })));

    await expect(listEvidenceItems(new URLSearchParams())).rejects.toMatchObject({
      status: 502,
      code: "ENGINE_AUTH_FAILED"
    });
  });

  it("maps upstream API failures without exposing upstream bodies", async () => {
    process.env.CAREEROPS_EVIDENCE_MODE = "live";
    process.env.CAREEROPS_ENGINE_BASE_URL = "https://engine.example";
    process.env.CAREEROPS_ENGINE_API_TOKEN = "server-secret";
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({ detail: "/private/workspace token=server-secret" }), { status: 500 })
    ));

    try {
      await listEvidenceItems(new URLSearchParams());
      throw new Error("expected failure");
    } catch (error) {
      expect(error).toBeInstanceOf(EvidenceGatewayError);
      expect(String((error as Error).message)).not.toContain("server-secret");
      expect(String((error as Error).message)).not.toContain("/private/workspace");
    }
  });
});
