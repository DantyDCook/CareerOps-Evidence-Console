export type EvidenceCollection =
  | "EMPLOYMENT"
  | "PROJECT"
  | "EDUCATION"
  | "CERTIFICATION"
  | "CAPABILITY"
  | "PROFESSIONAL_DEVELOPMENT"
  | "OTHER";

export type VerificationState =
  | "DISCOVERED"
  | "EXTRACTED"
  | "REVIEWED"
  | "VALIDATED"
  | "CANONICAL"
  | "REJECTED"
  | "SUPERSEDED";

export type ClaimClassification = "EXPLICIT" | "VALIDATED_INFERENCE" | "INFERRED";

export type EvidenceElementType =
  | "ACHIEVEMENT"
  | "RESPONSIBILITY"
  | "SKILL"
  | "TOOL_USAGE"
  | "TECHNOLOGY_USAGE"
  | "METHODOLOGY"
  | "METRIC"
  | "ROLE_FUNCTION"
  | "DOMAIN_EXPERIENCE"
  | "LEADERSHIP"
  | "EDUCATION_FACT"
  | "CERTIFICATION_FACT"
  | "OTHER";

export interface EvidenceItemSummary {
  object_id: string;
  object_type: EvidenceCollection | string;
  title: string;
  organization: string | null;
  summary: string | null;
  element_count: number;
  source_count: number;
  verification_states: Record<string, number>;
}

export interface EvidenceRoleAffinity {
  profile_ref: string;
  relevance: number;
  assignment_provenance: string;
}

export interface EvidenceMetric {
  name: string;
  value: string | number | boolean | null;
  unit: string | null;
}

export interface EvidenceElement {
  element_id: string;
  object_ref: string;
  element_type: EvidenceElementType | string;
  statement: string;
  facets: string[];
  capability_refs: string[];
  role_affinities: EvidenceRoleAffinity[];
  metrics: EvidenceMetric[];
  verification_state: VerificationState | string;
  claim_classification: ClaimClassification | string;
  allowed_usage: string[];
}

export interface EvidenceItemsResponse {
  count: number;
  items: EvidenceItemSummary[];
}

export interface EvidenceItemDetailResponse {
  item: EvidenceItemSummary;
  elements: EvidenceElement[];
}

export interface EvidenceSearchResponse {
  count: number;
  results: EvidenceElement[];
}

export interface EvidenceHealthResponse {
  status: string;
  mode: "LIVE" | "MOCK";
  upstream: "CareerOps-Engine";
}

export interface EvidenceListQuery {
  object_type?: string;
  text?: string;
  limit?: number;
}

export interface EvidenceSearchQuery {
  object_id?: string;
  object_type?: string;
  element_type?: string;
  facet?: string | string[];
  capability?: string | string[];
  role_profile?: string;
  min_role_relevance?: number;
  claim_classification?: string;
  limit?: number;
}
