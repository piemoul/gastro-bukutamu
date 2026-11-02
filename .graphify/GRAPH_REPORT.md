# Graph Report - .  (2026-11-02)

## Corpus Check
- label mode - file stats not available

## Summary
- 169 nodes · 274 edges · 18 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output
- Edge kinds: contains: 111 · imports: 70 · imports_from: 47 · calls: 17 · references: 17 · implements: 11 · inherits: 1


## Graph Freshness
- Built from Git commit: `a448e95`
- Compare this hash to `git rev-parse HEAD` before trusting freshness-sensitive graph output.
## God Nodes (most connected - your core abstractions)
1. `getSession()` - 11 edges
2. `Gastro Buku Tamu` - 11 edges
3. `sql` - 10 edges
4. `ClientRow` - 9 edges
5. `EventInputError` - 6 edges
6. `UserRow` - 5 edges
7. `managed_events` - 4 edges
8. `EventName()` - 4 edges
9. `WorkspaceShell()` - 4 edges
10. `sessionOptions()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `Automatically generated event passwords` --references--> `verifyLogin()`  [EXTRACTED]
  README.md → src/lib/auth.ts
- `Admin-created events` --references--> `createManagedEvent()`  [EXTRACTED]
  README.md → src/lib/managed-events.ts
- `Customer search and pagination` --references--> `AdminClient()`  [EXTRACTED]
  README.md → src/app/admin/AdminClient.tsx
- `Immediate event session revocation` --references--> `canUseManagedEvent()`  [EXTRACTED]
  README.md → src/lib/managed-events.ts
- `Gastro WMS and Intranet visual consistency` --references--> `WorkspaceShell()`  [EXTRACTED]
  README.md → src/components/WorkspaceShell.tsx

## Communities

### Community 0 - "Session and Ownership"
Cohesion: 0.11
Nodes (13): Ctx, AppSession, destroySession(), getSession(), saveSession(), sessionOptions(), verifyLogin(), EventRow (+5 more)

### Community 1 - "Managed Event Access"
Cohesion: 0.12
Nodes (22): EventManager(), EVENT_TIMEZONES, EventInputError, parseEventInput(), parseWhitelistEmails(), addWhitelist(), createManagedEvent(), digest() (+14 more)

### Community 2 - "Workspace Interface"
Cohesion: 0.14
Nodes (16): ApiResponse, EVENT_LABELS, EventFilter, Props, EventName(), shortEventName(), Pagination(), WorkspaceIcon() (+8 more)

### Community 3 - "Guest Data and Exports"
Cohesion: 0.25
Nodes (11): filename(), GET(), ClientRow, fetchClientsForExport(), fetchClientsForSalesman(), fetchEventName(), buildMultiSalesmanXlsx(), buildSalesmanXlsx() (+3 more)

### Community 4 - "Application Access Policies"
Cohesion: 0.17
Nodes (12): AdminClient(), Credentials and screenshots remain local, canUseManagedEvent(), Gastro Buku Tamu, Private environment configuration, Event-only user accounts, Dynamic event XLSX export, Legacy NFH FHI Bali access (+4 more)

### Community 5 - "Local Integration Checks"
Cohesion: 0.20
Nodes (8): clientIds, db, eventCodes, login(), qaEmails, request(), suffix, target

### Community 6 - "Local Docker Deployment"
Cohesion: 0.33
Nodes (6): Local Next.js application on loopback port 3047, Internal PostgreSQL Docker database, Internal Neon HTTP adapter, Persistent local database volume, Isolated local data copy, Fifty integration checks and browser persistence checks

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

### Community 19 - "Gastro Brand Asset"
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

- **Why does `Gastro Buku Tamu` connect `Application Access Policies` to `Managed Event Access`, `Workspace Interface`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `getSession()` connect `Session and Ownership` to `Managed Event Access`, `Guest Data and Exports`, `Email Password Login`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `nextConfig`, `config`, `target` to the rest of the system?**
  _44 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Session and Ownership` be split into smaller, more focused modules?**
  _Cohesion score 0.10873440285204991 - nodes in this community are weakly interconnected._
- **Should `Managed Event Access` be split into smaller, more focused modules?**
  _Cohesion score 0.12315270935960591 - nodes in this community are weakly interconnected._
- **Should `Workspace Interface` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._