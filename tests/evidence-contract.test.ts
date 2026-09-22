import { describe, expect, it } from "vitest";
import {
  translateDetailResponse,
  translateItemsResponse,
  translateSearchResponse
} from "../src/lib/evidence-contract";

const summary = {
  object_id: "obj_1",
  object_type: "PROJECT",
  title: "Synthetic Project",
  element_count: 1,
  source_count: 2,
  verification_states: { CANONICAL: 1 }
};

const element = {
  element_id: "elm_1",
  object_ref: "obj_1",
  element_type: "SKILL",
  statement: "Used SQL in a synthetic test.",
  facets: ["skill:SQL"],
  capability_refs: ["SQL_AND_RELATIONAL_DATA"],
  role_affinities: [
    {
      profile_ref: "DATA_ANALYTICS",
      relevance: 0.9,
      assignment_provenance: "CURATED",
      rationale: "must not cross the read DTO"
    }
  ],
  metrics: [{ name: "quality_rate", value: 99.5, unit: "percent", source_path: "/private" }],
  verification_state: "CANONICAL",
  claim_classification: "EXPLICIT",
  allowed_usage: ["resume"],
  source_refs: [{ source_id: "private" }],
  source_path: "/private/workspace"
};

describe("Engine response translation", () => {
  it("allowlists list fields and tolerates missing optional summary fields", () => {
    const translated = translateItemsResponse({
      count: 1,
      items: [{ ...summary, hidden: "secret" }]
    });

    expect(translated).toEqual({
      count: 1,
      items: [
        {
          ...summary,
          organization: null,
          summary: null
        }
      ]
    });
    expect(JSON.stringify(translated)).not.toContain("secret");
  });

  it("allowlists detail element fields and drops hidden provenance", () => {
    const translated = translateDetailResponse({
      item: { ...summary, organization: "Demo", summary: null },
      elements: [element],
      provenance: { source_path: "/private" }
    });

    expect(translated.elements[0].facets).toEqual(["skill:SQL"]);
    expect(translated.elements[0].role_affinities[0]).toEqual({
      profile_ref: "DATA_ANALYTICS",
      relevance: 0.9,
      assignment_provenance: "CURATED"
    });
    expect(JSON.stringify(translated)).not.toContain("source_path");
    expect(JSON.stringify(translated)).not.toContain("source_refs");
    expect(JSON.stringify(translated)).not.toContain("rationale");
  });

  it("translates search results using the same allowlist", () => {
    const translated = translateSearchResponse({ count: 1, results: [element] });
    expect(translated.count).toBe(1);
    expect(translated.results[0].allowed_usage).toEqual(["resume"]);
  });
});
