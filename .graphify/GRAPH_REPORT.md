# Graph Report - .  (2026-11-03)

## Corpus Check
- Corpus is ~18.704 words - fits in a single context window. You may not need a graph.

## Summary
- 177 nodes · 296 edges · 18 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output
- Edge kinds: contains: 116 · imports: 76 · imports_from: 50 · calls: 24 · references: 17 · implements: 11 · inherits: 1 · method: 1


## Input Scope
- Requested: tracked
- Resolved: tracked (source: cli)
- Included files: 46 · Candidates: 80
- Excluded: 0 untracked · 109 ignored · 1 sensitive · 0 missing committed
- Recommendation: Use --scope all or graphify.yaml inputs.corpus for a knowledge-base folder.

## Graph Freshness
- Source baseline: `4f9dbbe`; rebuilt from the tracked working tree for the admin-managed password revision.
- Includes password creation, password updates, session revocation, and the 74-check local verification flow.
## God Nodes (most connected - your core abstractions)
1. `getSession()` - 12 edges
2. `Gastro Buku Tamu` - 11 edges
3. `sql` - 10 edges
4. `ClientRow` - 9 edges
5. `EventInputError` - 9 edges
6. `createManagedEvent()` - 6 edges
7. `UserRow` - 5 edges
8. `eventPasswordFingerprint()` - 5 edges
9. `updateManagedEventPassword()` - 5 edges
10. `managed_events` - 4 edges

## Surprising Connections (you probably didn't know these)
- `Admin-created events` --references--> `createManagedEvent()`  [EXTRACTED]
  README.md → src/lib/managed-events.ts
- `Admin-managed event passwords` --references--> `verifyLogin()`  [EXTRACTED]
  README.md → src/lib/auth.ts
- `Customer search and pagination` --references--> `AdminClient()`  [EXTRACTED]
  README.md → src/app/admin/AdminClient.tsx
- `Immediate event session revocation` --references--> `canUseManagedEvent()`  [EXTRACTED]
  README.md → src/lib/managed-events.ts
- `Gastro WMS and Intranet visual consistency` --references--> `WorkspaceShell()`  [EXTRACTED]
  README.md → src/components/WorkspaceShell.tsx

## Communities

### Community 0 - "Session and Ownership"
Cohesion: 0.10
Nodes (14): Ctx, AppSession, destroySession(), getSession(), saveSession(), sessionOptions(), verifyLogin(), EventRow (+6 more)

### Community 1 - "Managed Event Access"
Cohesion: 0.14
Nodes (20): EventInputError, parseEventInput(), parseEventPassword(), parseWhitelistEmails(), addWhitelist(), checkLegacyPassword(), createManagedEvent(), eventPasswordFingerprint() (+12 more)

### Community 2 - "Workspace Interface"
Cohesion: 0.11
Nodes (20): ApiResponse, EVENT_LABELS, EventFilter, Props, EventManager(), EventName(), shortEventName(), Pagination() (+12 more)

### Community 3 - "Guest Data and Exports"
Cohesion: 0.25
Nodes (11): filename(), GET(), ClientRow, fetchClientsForExport(), fetchClientsForSalesman(), fetchEventName(), buildMultiSalesmanXlsx(), buildSalesmanXlsx() (+3 more)

### Community 4 - "Application Access Policies"
Cohesion: 0.15
Nodes (13): AdminClient(), Credentials and screenshots remain local, canUseManagedEvent(), Gastro Buku Tamu, Private environment configuration, Event-only user accounts, Dynamic event XLSX export, Legacy NFH FHI Bali access (+5 more)

### Community 5 - "Local Integration Checks"
Cohesion: 0.20
Nodes (8): clientIds, db, eventCodes, login(), qaEmails, request(), suffix, target

### Community 6 - "Local Docker Deployment"
Cohesion: 0.33
Nodes (6): Local Next.js application on loopback port 3047, Internal PostgreSQL Docker database, Internal Neon HTTP adapter, Persistent local database volume, Isolated local data copy, Seventy four integration checks and browser persistence checks

### Community 7 - "Event Access Schema"
Cohesion: 0.60
Nodes (5): event_whitelist, events, managed_event_users, managed_events, users

### Community 8 - "Read Only Data Copy"
Cohesion: 0.40
Nodes (4): client, source, sql, target

### Community 9 - "Initial Account Seeding"
Cohesion: 0.50
Nodes (4): ADMINS, main(), SALES, sql

### Community 10 - "Root Layout Metadata"
Cohesion: 0.50
Nodes (2): inter, metadata

### Community 11 - "Local HTTP Adapter"
Cohesion: 0.50
Nodes (3): pool, server, url

### Community 12 - "Email Password Login"
Cohesion: 0.67
Nodes (1): LoginForm()

### Community 13 - "Next Framework Configuration"
Cohesion: 1.00
Nodes (1): nextConfig

### Community 14 - "PostCSS Build Configuration"
Cohesion: 1.00
Nodes (1): config

### Community 17 - "Schema Migration Runner"
Cohesion: 1.00
Nodes (1): sql

### Community 18 - "Tailwind Theme Configuration"
Cohesion: 1.00
Nodes (1): config

### Community 20 - "Gastro Brand Asset"
Cohesion: 1.00
Nodes (1): Gastro commercial F and B equipment logo since 1986

## Knowledge Gaps
- **44 isolated node(s):** `nextConfig`, `config`, `target`, `source`, `sql` (+39 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Root Layout Metadata`** (2 nodes): `inter`, `metadata`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Email Password Login`** (1 nodes): `LoginForm()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next Framework Configuration`** (1 nodes): `nextConfig`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `PostCSS Build Configuration`** (1 nodes): `config`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Schema Migration Runner`** (1 nodes): `sql`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Tailwind Theme Configuration`** (1 nodes): `config`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Gastro Brand Asset`** (1 nodes): `Gastro commercial F and B equipment logo since 1986`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Gastro Buku Tamu` connect `Application Access Policies` to `Workspace Interface`, `Managed Event Access`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `getSession()` connect `Session and Ownership` to `Managed Event Access`, `Guest Data and Exports`, `Email Password Login`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `nextConfig`, `config`, `target` to the rest of the system?**
  _44 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Session and Ownership` be split into smaller, more focused modules?**
  _Cohesion score 0.10420168067226891 - nodes in this community are weakly interconnected._
- **Should `Managed Event Access` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `Workspace Interface` be split into smaller, more focused modules?**
  _Cohesion score 0.11384615384615385 - nodes in this community are weakly interconnected._