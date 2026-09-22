import { afterEach, describe, expect, it, vi } from "vitest";
import { createEvidenceClient, EvidenceClientError } from "../src/lib/evidence-client";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("same-origin Evidence client", () => {
  it("uses list, detail, search, and health same-origin routes", async () => {
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      calls.push(url);
      if (url.startsWith("/api/evidence/items?")) {
        return new Response(JSON.stringify({ count: 0, items: [] }), { status: 200 });
      }
      if (url === "/api/evidence/items/obj_1") {
        return new Response(JSON.stringify({
          item: {
            object_id: "obj_1",
            object_type: "PROJECT",
            title: "Demo",
            organization: null,
            summary: null,
            element_count: 0,
            source_count: 0,
            verification_states: {}
          },
          elements: []
        }), { status: 200 });
      }
      if (url.startsWith("/api/evidence/search?")) {
        return new Response(JSON.stringify({ count: 0, results: [] }), { status: 200 });
      }
      return new Response(JSON.stringify({
        status: "ok",
        mode: "LIVE",
        upstream: "CareerOps-Engine"
      }), { status: 200 });
    }));

    const client = createEvidenceClient();
    await client.listItems({ object_type: "PROJECT", text: "demo" });
    await client.getItem("obj_1");
    await client.search({ capability: "DATA_QUALITY", claim_classification: "EXPLICIT" });
    await client.getHealth();

    expect(calls[0]).toContain("/api/evidence/items?");
    expect(calls[0]).toContain("object_type=PROJECT");
    expect(calls[0]).toContain("text=demo");
    expect(calls[1]).toBe("/api/evidence/items/obj_1");
    expect(calls[2]).toContain("/api/evidence/search?");
    expect(calls[2]).toContain("capability=DATA_QUALITY");
    expect(calls[3]).toBe("/api/evidence/health");
  });

  it("surfaces authentication/configuration failures from the same-origin boundary", async () => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({
        error: {
          code: "ENGINE_AUTH_FAILED",
          message: "CareerOps Engine rejected the Console server credential."
        }
      }), { status: 502 })
    ));

    const client = createEvidenceClient();
    await expect(client.listItems()).rejects.toMatchObject<EvidenceClientError>({
      status: 502,
      code: "ENGINE_AUTH_FAILED"
    });
  });

  it("surfaces browser-to-Console network failures distinctly", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("offline");
    }));

    await expect(createEvidenceClient().getHealth()).rejects.toMatchObject<EvidenceClientError>({
      status: 0,
      code: "CONSOLE_NETWORK_ERROR"
    });
  });
});
