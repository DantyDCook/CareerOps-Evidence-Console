# Evidence Console Integration Contract

## Status

v0.1 frontend contract. Read path is implemented. Mutation path is reserved but intentionally disabled.

## Current read contract

The console expects one aggregate endpoint:

```http
GET /evidence/snapshot
Accept: application/json
```

The response must match the TypeScript `EvidenceSnapshot` shape in `src/lib/evidence-types.ts`.

Required top-level members:

```json
{
  "objects": [],
  "elements": [],
  "sources": [],
  "metadata": {}
}
```

## Metadata requirements

The Console currently consumes:

- schema_version
- index_version
- generated_at
- eligible_verification_states
- object_count
- element_count
- source_count
- fragment_count
- source_revision
- manifest_fresh
- indexes_valid
- mode

`mode` must be `DEMO` or `LIVE`.

## Evidence semantics

The UI preserves the Engine model:

- Evidence Objects are real-world entities/groupings.
- Evidence Elements are atomic independently defensible claims.
- verification state and claim classification remain separate dimensions.
- capability and role-affinity values are projections/metadata, not replacement claims.
- provenance must remain visible and traceable.

## Reserved future mutation contract

The Console must not implement direct CRUD against Workspace files. Future API operations should be expressed through Engine-owned changesets, for example:

```text
CREATE_OBJECT
UPDATE_OBJECT
CREATE_ELEMENT
UPDATE_ELEMENT
ATTACH_ELEMENT
DETACH_ELEMENT
PROMOTE_ELEMENT
REJECT_ELEMENT
SUPERSEDE_ELEMENT
```

A write response should include either a validated refreshed snapshot or a revision identifier that can be used to retrieve one.

## Concurrency

Future writes should use optimistic revision enforcement. Blind last-write-wins behavior is not acceptable for canonical Evidence.

## Failure behavior

A failed mutation must not leave canonical records updated while generated indexes or the manifest remain stale. The Engine/API layer is responsible for atomicity; the Console only reports the resulting success or failure.
