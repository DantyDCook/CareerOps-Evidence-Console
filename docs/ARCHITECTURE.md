# CareerOps Evidence Console Architecture

## Purpose

CareerOps Evidence Console is a human-facing read/control-plane surface for CareerOps Evidence. It is not the system of record and does not own canonical candidate state.

## Ownership

```text
private CareerOps-Workspace
  canonical Evidence + indexes
          ^
          |
          | repository resolution and validation
          |
CareerOps-Engine
  authenticated positive-allowlist read API
          ^
          |
          | server-to-server bearer authentication
          |
Next.js Console server
  same-origin read handlers
          ^
          |
          | no Engine bearer token
          |
Browser
```

### CareerOps-Workspace

Workspace is the private authority for canonical Evidence instances and generated indexes. The Console never reads Workspace files directly and no Workspace filesystem path is part of the browser contract.

### CareerOps-Engine

Engine owns:

- Evidence Object/Element contracts
- canonical/index-eligibility rules
- validation and repository loading
- retrieval semantics
- bearer authentication and server-derived `evidence:read`
- positive-allowlist remote DTOs
- request-fresh corpus loading

The read contract verified for this integration exposes:

- `GET /healthz`
- `GET /v1/evidence/items`
- `GET /v1/evidence/items/{object_id}`
- `GET /v1/evidence/search`

The Console does not call authoring or mutation routes.

### Console server

Next.js route handlers form the credential boundary:

```text
/api/evidence/items
/api/evidence/items/[objectId]
/api/evidence/search
/api/evidence/health
        |
        +--> server-only Engine base URL
        +--> server-only bearer token
        +--> GET-only Engine read route
        +--> Console positive-allowlist translation
```

The server does not forward browser authorization/scope headers. The browser cannot grant itself `evidence:read`; authorization remains an Engine decision.

A second positive-allowlist translation layer admits only the currently verified Engine DTO fields before responses return to the browser. Unexpected upstream fields are discarded and malformed contract responses fail closed.

## Configuration and failure behavior

Default mode is live:

```text
CAREEROPS_EVIDENCE_MODE=live
CAREEROPS_ENGINE_BASE_URL=<server-only URL>
CAREEROPS_ENGINE_API_TOKEN=<server-only bearer>
```

No Engine credential may be placed in `NEXT_PUBLIC_*`.

Failure classes are intentionally distinct:

- missing/invalid server configuration → configuration failure
- Engine 401/403 → Engine authentication failure
- network failure → Engine unavailable
- Engine 5xx → upstream API failure
- malformed/unverified DTO → contract failure
- valid empty result → empty state

The browser receives sanitized messages only.

## Explicit mock mode

```text
CAREEROPS_EVIDENCE_MODE=mock
```

Mock mode is a server-side synthetic adapter that emits the same DTO shape used by live reads. It is never selected automatically when live configuration is missing or broken.

Real private Evidence must not be copied into the mock fixture.

## Read-model limits

The current API permits the Console to display object summaries, canonical Elements, verification state, claim classification, allowed usage, facets, capabilities, role affinities, allowlisted metrics, and per-object source counts.

The current API does not expose:

- source records
- source fragments
- filesystem locations
- hidden provenance
- authoring/audit structures
- mutation revisions
- corpus/source revision

The Console labels these as unavailable rather than inferring them.

## Production versus staging

This integration is a production-canonical read surface. Managed staging, extracted/review candidates, and future authoring state must remain visibly distinct from canonical production Evidence. They are not synthesized into this read model.

## Write boundary

No Console route added by this integration mutates Evidence. Any future authoring/approval/apply work must use separately governed Engine mutation/change-set contracts and is outside EVIDENCE-CONSOLE-READ-001.
