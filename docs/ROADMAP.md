# CareerOps Evidence Console Roadmap

## v0.1 — Read-only console

Status: current scaffold

- [x] Next.js + TypeScript application shell
- [x] synthetic demo adapter
- [x] typed Evidence snapshot contract
- [x] Evidence Object browser
- [x] atomic Element inspection
- [x] search and collection/state filters
- [x] provenance presentation
- [x] verification lifecycle queue
- [x] claim-classification visibility
- [x] capability and role-affinity visibility
- [x] manifest/index health view
- [x] disabled write controls with explicit boundary messaging
- [ ] connect to live read API when available
- [ ] add component/unit tests
- [ ] add CI typecheck/build workflow

## v0.2 — Review operations

Dependency: Engine Evidence mutation/change-set contract.

- review one Evidence Element
- validate or reject an Element
- promote validated Elements to canonical state
- supersede existing Elements without destructive deletion
- optimistic revision enforcement
- refresh snapshot after mutations
- display validation errors and conflict details

## v0.3 — Evidence intake

- Evidence Inbox for discovered/extracted material
- provenance/source preview
- duplicate-candidate warnings without destructive auto-merge
- manual Evidence Object/Element creation through Engine contract
- source attachment and source-fragment inspection

## v0.4 — Claim governance

- allowed-usage editor
- explain why a generated claim is or is not supported
- trace resume/application claims back to Evidence Elements
- show where canonical Evidence is currently used

## v0.5 — Evidence graph

- object-to-element graph
- facet/capability projections
- role-lens projections
- source/provenance graph
- application/resume usage overlays

## Later

- agent/CLI parity for the same mutation service
- upskilling completion -> Evidence Inbox workflow
- job-gap -> learning -> demonstrated capability -> canonical Evidence loop
- responsive/mobile-focused review workflows

## Explicit non-goals

- no second source of candidate truth
- no direct Workspace filesystem editor
- no direct CareerData mutation
- no separate graph database requirement
- no PostgreSQL requirement for the Console itself
