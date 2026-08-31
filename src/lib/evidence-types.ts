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

export interface EvidenceFacet {
  id: string;
  namespace: "skill" | "tool" | "technology" | "methodology" | "domain" | "function" | "platform" | "language" | "framework";
  label: string;
}

export interface RoleAffinity {
  profile_ref: string;
  relevance: number;
  assignment_provenance: "EXPLICIT" | "CURATED" | "VALIDATED_INFERENCE" | "INFERRED";
  rationale?: string;
}

export interface EvidenceSource {
  source_id: string;
  source_type: string;
  label: string;
  locator: string;
}

export interface EvidenceElement {
  element_id: string;
  object_ref: string;
  element_type: EvidenceElementType;
  statement: string;
  facets: EvidenceFacet[];
  capability_refs: string[];
  role_affinities: RoleAffinity[];
  source_refs: string[];
  verification_state: VerificationState;
  claim_classification: ClaimClassification;
  allowed_usage: string[];
  audit: {
    created_at: string;
    updated_at?: string;
  };
}

export interface EvidenceObject {
  object_id: string;
  object_type: EvidenceCollection;
  title: string;
  organization?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string | null;
  summary?: string | null;
  element_refs: string[];
  source_refs: string[];
  audit: {
    created_at: string;
    updated_at?: string;
  };
}

export interface EvidenceCorpusMetadata {
  schema_version: number;
  index_version: number;
  generated_at: string;
  eligible_verification_states: VerificationState[];
  object_count: number;
  element_count: number;
  source_count: number;
  fragment_count: number;
  source_revision: string;
  manifest_fresh: boolean;
  indexes_valid: boolean;
  mode: "DEMO" | "LIVE";
}

export interface EvidenceSnapshot {
  objects: EvidenceObject[];
  elements: EvidenceElement[];
  sources: EvidenceSource[];
  metadata: EvidenceCorpusMetadata;
}
