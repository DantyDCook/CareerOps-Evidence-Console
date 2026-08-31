# CareerOps Evidence Console

Human-facing control plane for browsing, reviewing, and eventually governing CareerOps Evidence.

## Architectural boundary

This repository is a UI/control-plane client. It does **not** own canonical candidate evidence and must not write directly to `CareerOps-Workspace/career_evidence`.

- **CareerOps-Engine** owns Evidence contracts, validation, retrieval, indexing, IDs, and mutation semantics.
- **CareerOps-Workspace** owns private canonical Evidence instances and generated private indexes.
- **CareerData** remains source/provenance material.
- **CareerOps-Evidence-Console** renders and submits operations through Engine/API contracts.

## v0.1 scope

The initial build is intentionally read-first:

- Evidence Object browser
- atomic Evidence Element inspection
- verification-state and claim-classification filters
- capability, role-affinity, and provenance visibility
- review queue visualization
- Evidence corpus/system health
- typed API boundary with an explicit mock adapter for local development

Write actions remain disabled until the Engine exposes the approved Evidence mutation/change-set contract.

## Stack

- Next.js
- React
- TypeScript
- dependency-light CSS

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The app starts in demo mode using synthetic Evidence records. Set `NEXT_PUBLIC_CAREEROPS_API_BASE_URL` once a compatible CareerOps API is available.

## Repository status

**v0.1 scaffold — read-only control plane.**
