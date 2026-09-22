# CareerOps Evidence Console

Human-facing read console for production canonical CareerOps Evidence.

## Authority and boundaries

CareerOps Evidence Console is not the system of record.

- **CareerOps-Workspace** owns the private canonical Evidence corpus and generated private indexes.
- **CareerOps-Engine** owns Evidence contracts, validation, retrieval, authentication, and the remote-safe read projection.
- **CareerOps-Evidence-Console** renders read DTOs received through CareerOps-Engine.
- The browser never accesses Workspace directly and never receives the Engine bearer credential.

The current Console integration is strictly read-only. It does not expose Evidence authoring, approval, apply, mutation, or direct filesystem operations.

## Live architecture

```text
Browser
  |
  | same-origin GET /api/evidence/*
  v
Next.js Console server
  |
  | Authorization: Bearer <server-only token>
  v
CareerOps-Engine
  |
  | authenticated evidence:read projection
  v
private CareerOps-Workspace canonical Evidence
```

The Console was verified against CareerOps-Engine main at
`bdbce0f25c3441de9238136db1d3e10943ff51ea`.

Integrated Engine routes:

- `GET /healthz`
- `GET /v1/evidence/items`
- `GET /v1/evidence/items/{object_id}`
- `GET /v1/evidence/search`

The Console exposes same-origin GET handlers only. Browser request headers are not forwarded to Engine; the server supplies its configured bearer credential and the Engine derives `evidence:read` server-side.

## Configuration

Live mode is the default and fails visibly if it is not fully configured.

```bash
CAREEROPS_EVIDENCE_MODE=live
CAREEROPS_ENGINE_BASE_URL=http://127.0.0.1:8000
CAREEROPS_ENGINE_API_TOKEN=<server-only bearer token>
```

Do **not** use `NEXT_PUBLIC_*` for the Engine URL or bearer token. The token must remain server-only and must never be committed.

### Explicit mock development mode

Synthetic development data is available only when mock mode is deliberately selected:

```bash
CAREEROPS_EVIDENCE_MODE=mock
```

Mock mode does not require an Engine URL or token. Missing or invalid live configuration never falls back to mock mode. The mock fixture contains synthetic DTO-shaped records only; real Workspace Evidence must never be copied into public fixtures.

## Visible read model

The UI displays fields returned by the verified read API, including:

- Evidence Object ID, type, title, organization, summary
- linked Element count and per-object source count
- Element type and statement
- verification state
- claim classification
- allowed usage
- facets
- capabilities
- role affinities and assignment provenance
- allowlisted scalar metrics
- Engine health status

The current read API intentionally does **not** expose source records, source fragments, filesystem locations, hidden provenance, or corpus/source revision. The Console therefore does not infer or reconstruct those fields.

Production canonical/index-eligible Evidence is shown as production data. Staging, extracted, authoring, and review-candidate concepts are not presented as production Evidence.

## Development

Requires Node 20.9+.

```bash
npm install
npm test
npm run typecheck
npm run build
npm run dev
```

Open `http://localhost:3000`.

CI runs the focused tests, TypeScript typecheck, and production build. No lint command is currently configured.

## Repository status

**v0.2 live read integration — read-only canonical Evidence browser/search.**
