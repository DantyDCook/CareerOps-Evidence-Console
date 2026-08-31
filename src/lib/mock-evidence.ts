import type { EvidenceSnapshot } from "./evidence-types";

export const demoEvidenceSnapshot: EvidenceSnapshot = {
  metadata: {
    schema_version: 1,
    index_version: 1,
    generated_at: "2026-08-31T16:00:00-04:00",
    eligible_verification_states: ["CANONICAL"],
    object_count: 4,
    element_count: 8,
    source_count: 4,
    fragment_count: 10,
    source_revision: "demo-revision-001",
    manifest_fresh: true,
    indexes_valid: true,
    mode: "DEMO"
  },
  sources: [
    {
      source_id: "src_demo_project",
      source_type: "PROJECT_DOCUMENT",
      label: "Telemetry Pipeline project notes",
      locator: "demo://project/telemetry-pipeline"
    },
    {
      source_id: "src_demo_resume",
      source_type: "RESUME",
      label: "Synthetic resume source",
      locator: "demo://resume/baseline"
    },
    {
      source_id: "src_demo_cert",
      source_type: "CERTIFICATION_DOCUMENT",
      label: "Synthetic certification record",
      locator: "demo://certification/sql"
    },
    {
      source_id: "src_demo_manual",
      source_type: "MANUAL_CONFIRMATION",
      label: "Synthetic manual confirmation",
      locator: "demo://confirmation/reporting"
    }
  ],
  objects: [
    {
      object_id: "obj_project_telemetry_demo",
      object_type: "PROJECT",
      title: "Telemetry Pipeline Demo",
      organization: "CareerOps Demo",
      start_date: "2026-01-01",
      end_date: "2026-03-31",
      status: "complete",
      summary: "Synthetic project used to exercise Evidence Console object, element, capability, and provenance views.",
      element_refs: ["elm_demo_streaming", "elm_demo_postgres", "elm_demo_quality"],
      source_refs: ["src_demo_project"],
      audit: { created_at: "2026-08-31T12:00:00Z" }
    },
    {
      object_id: "obj_employment_ops_demo",
      object_type: "EMPLOYMENT",
      title: "Operations Reporting Analyst Demo",
      organization: "Example Operations Group",
      start_date: "2025-05-01",
      end_date: null,
      status: "active",
      summary: "Synthetic employment object demonstrating explicit and validated-inference claims.",
      element_refs: ["elm_demo_reporting", "elm_demo_sql"],
      source_refs: ["src_demo_resume", "src_demo_manual"],
      audit: { created_at: "2026-08-31T12:00:00Z" }
    },
    {
      object_id: "obj_cert_sql_demo",
      object_type: "CERTIFICATION",
      title: "SQL Foundations Demo Certificate",
      organization: "Example Learning Provider",
      start_date: "2026-05-12",
      end_date: null,
      status: "earned",
      summary: "Synthetic certification record for UI and lifecycle testing.",
      element_refs: ["elm_demo_cert"],
      source_refs: ["src_demo_cert"],
      audit: { created_at: "2026-08-31T12:00:00Z" }
    },
    {
      object_id: "obj_profdev_cloud_demo",
      object_type: "PROFESSIONAL_DEVELOPMENT",
      title: "Cloud Data Study Sprint",
      organization: "CareerOps Demo",
      start_date: "2026-08-01",
      end_date: null,
      status: "in_progress",
      summary: "Synthetic noncanonical professional-development item used to populate the review queue.",
      element_refs: ["elm_demo_cloud", "elm_demo_orchestration"],
      source_refs: ["src_demo_manual"],
      audit: { created_at: "2026-08-31T12:00:00Z" }
    }
  ],
  elements: [
    {
      element_id: "elm_demo_streaming",
      object_ref: "obj_project_telemetry_demo",
      element_type: "TECHNOLOGY_USAGE",
      statement: "Implemented a synthetic streaming ingestion path for telemetry events.",
      facets: [{ id: "technology:streaming", namespace: "technology", label: "Streaming" }],
      capability_refs: ["STREAMING_DATA", "ETL_AND_INTEGRATION"],
      role_affinities: [{ profile_ref: "DATA_ENGINEERING", relevance: 0.92, assignment_provenance: "CURATED" }],
      source_refs: ["src_demo_project"],
      verification_state: "CANONICAL",
      claim_classification: "EXPLICIT",
      allowed_usage: ["project experience", "portfolio", "resume project section"],
      audit: { created_at: "2026-08-31T12:00:00Z" }
    },
    {
      element_id: "elm_demo_postgres",
      object_ref: "obj_project_telemetry_demo",
      element_type: "TECHNOLOGY_USAGE",
      statement: "Persisted pipeline metadata in a relational database for traceability.",
      facets: [{ id: "technology:postgresql", namespace: "technology", label: "PostgreSQL" }],
      capability_refs: ["SQL_AND_RELATIONAL_DATA", "DATA_QUALITY"],
      role_affinities: [{ profile_ref: "DATA_ENGINEERING", relevance: 0.86, assignment_provenance: "CURATED" }],
      source_refs: ["src_demo_project"],
      verification_state: "CANONICAL",
      claim_classification: "EXPLICIT",
      allowed_usage: ["project experience", "portfolio"],
      audit: { created_at: "2026-08-31T12:00:00Z" }
    },
    {
      element_id: "elm_demo_quality",
      object_ref: "obj_project_telemetry_demo",
      element_type: "METHODOLOGY",
      statement: "Added validation checkpoints before promoting transformed data to downstream consumers.",
      facets: [{ id: "methodology:data_quality", namespace: "methodology", label: "Data Quality" }],
      capability_refs: ["DATA_QUALITY", "ETL_AND_INTEGRATION"],
      role_affinities: [{ profile_ref: "DATA_ENGINEERING", relevance: 0.8, assignment_provenance: "CURATED" }],
      source_refs: ["src_demo_project"],
      verification_state: "CANONICAL",
      claim_classification: "EXPLICIT",
      allowed_usage: ["project experience", "interview examples"],
      audit: { created_at: "2026-08-31T12:00:00Z" }
    },
    {
      element_id: "elm_demo_reporting",
      object_ref: "obj_employment_ops_demo",
      element_type: "RESPONSIBILITY",
      statement: "Produced recurring operational reporting for stakeholder review.",
      facets: [{ id: "function:reporting", namespace: "function", label: "Reporting" }],
      capability_refs: ["REPORTING_AND_BI"],
      role_affinities: [{ profile_ref: "DATA_ANALYTICS", relevance: 0.9, assignment_provenance: "CURATED" }],
      source_refs: ["src_demo_resume", "src_demo_manual"],
      verification_state: "VALIDATED",
      claim_classification: "VALIDATED_INFERENCE",
      allowed_usage: ["resume", "interview"],
      audit: { created_at: "2026-08-31T12:00:00Z" }
    },
    {
      element_id: "elm_demo_sql",
      object_ref: "obj_employment_ops_demo",
      element_type: "SKILL",
      statement: "Used SQL to investigate structured operational data.",
      facets: [{ id: "skill:sql", namespace: "skill", label: "SQL" }],
      capability_refs: ["SQL_AND_RELATIONAL_DATA"],
      role_affinities: [{ profile_ref: "SQL_DEVELOPER", relevance: 0.78, assignment_provenance: "CURATED" }],
      source_refs: ["src_demo_resume"],
      verification_state: "REVIEWED",
      claim_classification: "EXPLICIT",
      allowed_usage: ["resume after validation"],
      audit: { created_at: "2026-08-31T12:00:00Z" }
    },
    {
      element_id: "elm_demo_cert",
      object_ref: "obj_cert_sql_demo",
      element_type: "CERTIFICATION_FACT",
      statement: "Completed a synthetic SQL foundations certification used only for interface testing.",
      facets: [{ id: "skill:sql", namespace: "skill", label: "SQL" }],
      capability_refs: ["SQL_AND_RELATIONAL_DATA"],
      role_affinities: [{ profile_ref: "DATA_ANALYTICS", relevance: 0.6, assignment_provenance: "CURATED" }],
      source_refs: ["src_demo_cert"],
      verification_state: "CANONICAL",
      claim_classification: "EXPLICIT",
      allowed_usage: ["demo only"],
      audit: { created_at: "2026-08-31T12:00:00Z" }
    },
    {
      element_id: "elm_demo_cloud",
      object_ref: "obj_profdev_cloud_demo",
      element_type: "SKILL",
      statement: "Studying cloud data platform concepts through guided exercises.",
      facets: [{ id: "platform:cloud", namespace: "platform", label: "Cloud Data" }],
      capability_refs: ["CLOUD_DATA"],
      role_affinities: [{ profile_ref: "DATA_ENGINEERING", relevance: 0.58, assignment_provenance: "INFERRED" }],
      source_refs: ["src_demo_manual"],
      verification_state: "DISCOVERED",
      claim_classification: "INFERRED",
      allowed_usage: ["learning plan only"],
      audit: { created_at: "2026-08-31T12:00:00Z" }
    },
    {
      element_id: "elm_demo_orchestration",
      object_ref: "obj_profdev_cloud_demo",
      element_type: "METHODOLOGY",
      statement: "Exploring orchestration patterns for dependency-aware data workflows.",
      facets: [{ id: "methodology:orchestration", namespace: "methodology", label: "Orchestration" }],
      capability_refs: ["ETL_AND_INTEGRATION", "CLOUD_DATA"],
      role_affinities: [{ profile_ref: "DATA_ENGINEERING", relevance: 0.64, assignment_provenance: "INFERRED" }],
      source_refs: ["src_demo_manual"],
      verification_state: "EXTRACTED",
      claim_classification: "INFERRED",
      allowed_usage: ["learning plan only"],
      audit: { created_at: "2026-08-31T12:00:00Z" }
    }
  ]
};
