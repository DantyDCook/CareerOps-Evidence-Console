# CareerOps Evidence Console Architecture

## Purpose

CareerOps Evidence Console is the human-facing control plane for CareerOps Evidence. It is intentionally not the system of record.

## Ownership boundaries

```text
CareerData
   |
   | source/provenance material
   v
CareerOps Engine  <---->  CareerOps Workspace
   |                       career_evidence/
   | retrieval + future mutation contracts
   v
CareerOps Evidence API
   |
   v
CareerOps Evidence Console
```

### CareerOps Engine

Owns reusable Evidence behavior:

- Evidence Object and Element contracts
- provenance contracts
- controlled vocabularies
- deterministic IDs
- corpus validation
- index generation and validation
- retrieval semantics
- future mutation/change-set semantics

### CareerOps Workspace

Owns private candidate state:

- canonical Evidence Objects
- canonical Evidence Elements
- provenance instances
- staging/extracted evidence
- generated private indexes and manifest

### CareerData

Owns source artifacts. CareerData content must not be copied into this UI repository as canonical candidate state.

### Evidence Console

Owns presentation and interaction only:

- browsing
- filtering
- review presentation
- provenance inspection
- system-health presentation
- future submission of Engine-approved mutations

## Non-negotiable rule

The browser must never directly mutate `CareerOps-Workspace/career_evidence` or CareerData source files.

## v0.1 data flow

```text
EvidenceClient
   |
   +-- NEXT_PUBLIC_CAREEROPS_API_BASE_URL set
   |      -> GET {base}/evidence/snapshot
   |
   +-- no API URL
          -> synthetic demo snapshot
```

Demo data is deliberately synthetic. It exists only to develop the interface without leaking or duplicating private candidate evidence.

## Planned write flow

```text
UI intent
  -> Evidence change set
  -> CareerOps API
  -> Engine mutation service
  -> schema/referential/provenance validation
  -> optimistic revision check
  -> atomic Workspace persistence
  -> index rebuild
  -> resulting corpus validation
  -> refreshed snapshot
```

No write action should be enabled until the Engine owns this flow.
