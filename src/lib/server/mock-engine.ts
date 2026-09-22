import type {
  EvidenceElement,
  EvidenceItemDetailResponse,
  EvidenceItemsResponse,
  EvidenceSearchResponse
} from "../evidence-types";

const projectElements: EvidenceElement[] = [
  {
    element_id: "elm_demo_sql",
    object_ref: "obj_demo_pipeline",
    element_type: "TECHNOLOGY_USAGE",
    statement: "Used SQL to validate transformed records in a synthetic data pipeline.",
    facets: ["skill:SQL", "technology:PostgreSQL"],
    capability_refs: ["SQL_AND_RELATIONAL_DATA", "DATA_QUALITY"],
    role_affinities: [
      {
        profile_ref: "DATA_ENGINEERING",
        relevance: 0.9,
        assignment_provenance: "CURATED"
      }
    ],
    metrics: [{ name: "quality_rate", value: 99.5, unit: "percent" }],
    verification_state: "CANONICAL",
    claim_classification: "EXPLICIT",
    allowed_usage: ["portfolio", "resume project section"]
  },
  {
    element_id: "elm_demo_orchestration",
    object_ref: "obj_demo_pipeline",
    element_type: "METHODOLOGY",
    statement: "Added dependency-aware orchestration to a synthetic pipeline workflow.",
    facets: ["methodology:orchestration"],
    capability_refs: ["ETL_AND_INTEGRATION"],
    role_affinities: [
      {
        profile_ref: "DATA_ENGINEERING",
        relevance: 0.82,
        assignment_provenance: "CURATED"
      }
    ],
    metrics: [],
    verification_state: "CANONICAL",
    claim_classification: "EXPLICIT",
    allowed_usage: ["portfolio", "interview"]
  }
];

const certificationElements: EvidenceElement[] = [
  {
    element_id: "elm_demo_cert",
    object_ref: "obj_demo_cert",
    element_type: "CERTIFICATION_FACT",
    statement: "Completed a synthetic certification record used only for Console development.",
    facets: ["skill:SQL"],
    capability_refs: ["SQL_AND_RELATIONAL_DATA"],
    role_affinities: [
      {
        profile_ref: "DATA_ANALYTICS",
        relevance: 0.62,
        assignment_provenance: "CURATED"
      }
    ],
    metrics: [],
    verification_state: "CANONICAL",
    claim_classification: "EXPLICIT",
    allowed_usage: ["demo only"]
  }
];

const details: Record<string, EvidenceItemDetailResponse> = {
  obj_demo_pipeline: {
    item: {
      object_id: "obj_demo_pipeline",
      object_type: "PROJECT",
      title: "Synthetic Pipeline Project",
      organization: "CareerOps Demo",
      summary: "Synthetic canonical Evidence used to exercise the read-only Console.",
      element_count: projectElements.length,
      source_count: 1,
      verification_states: { CANONICAL: projectElements.length }
    },
    elements: projectElements
  },
  obj_demo_cert: {
    item: {
      object_id: "obj_demo_cert",
      object_type: "CERTIFICATION",
      title: "Synthetic SQL Certificate",
      organization: "CareerOps Demo",
      summary: null,
      element_count: certificationElements.length,
      source_count: 1,
      verification_states: { CANONICAL: certificationElements.length }
    },
    elements: certificationElements
  }
};

export function mockList(params: URLSearchParams): EvidenceItemsResponse {
  const objectType = params.get("object_type")?.toUpperCase();
  const text = params.get("text")?.trim().toLowerCase();
  const limit = Math.min(Number(params.get("limit") ?? 25) || 25, 100);

  const items = Object.values(details)
    .map((detail) => detail.item)
    .filter((item) => !objectType || item.object_type.toUpperCase() === objectType)
    .filter((item) => {
      if (!text) return true;
      return [item.object_id, item.object_type, item.title]
        .join(" ")
        .toLowerCase()
        .includes(text);
    })
    .slice(0, limit);

  return { count: items.length, items };
}

export function mockDetail(objectId: string): EvidenceItemDetailResponse | null {
  const detail = details[objectId];
  return detail ? structuredClone(detail) : null;
}

export function mockSearch(params: URLSearchParams): EvidenceSearchResponse {
  const limit = Math.min(Number(params.get("limit") ?? 20) || 20, 50);
  const objectId = params.get("object_id");
  const objectType = params.get("object_type")?.toUpperCase();
  const elementType = params.get("element_type")?.toUpperCase();
  const facets = params.getAll("facet");
  const capabilities = params.getAll("capability");
  const roleProfile = params.get("role_profile");
  const claimClassification = params.get("claim_classification")?.toUpperCase();
  const minRoleRelevanceRaw = params.get("min_role_relevance");
  const minRoleRelevance = minRoleRelevanceRaw ? Number(minRoleRelevanceRaw) : undefined;

  const results = Object.values(details)
    .flatMap((detail) => detail.elements)
    .filter((element) => !objectId || element.object_ref === objectId)
    .filter((element) => {
      if (!objectType) return true;
      return details[element.object_ref]?.item.object_type.toUpperCase() === objectType;
    })
    .filter((element) => !elementType || element.element_type.toUpperCase() === elementType)
    .filter((element) => facets.every((facet) => element.facets.includes(facet)))
    .filter((element) => capabilities.every((capability) => element.capability_refs.includes(capability)))
    .filter((element) => !claimClassification || element.claim_classification.toUpperCase() === claimClassification)
    .filter((element) => {
      if (!roleProfile) return true;
      return element.role_affinities.some((affinity) => {
        if (affinity.profile_ref !== roleProfile) return false;
        return minRoleRelevance === undefined || affinity.relevance >= minRoleRelevance;
      });
    })
    .slice(0, limit);

  return { count: results.length, results: structuredClone(results) };
}
