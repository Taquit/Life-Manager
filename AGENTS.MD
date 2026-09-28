# AGENTS.md — Money_app Multi-Agent Protocol

This document governs the workflow, roles, permissions, and directory boundaries for autonomous and semi-autonomous subagents operating in the **Money_app** repository via `agy`.

---

## 1. Directory & Workspace Boundaries

To prevent conflicting edits and maintain clean domain separation, agents must strictly operate within their designated workspaces:

| Agent | Allowed Write Paths | Read-Only Paths | Prohibited Write Paths |
|---|---|---|---|
| **`@backend-dev`** | `packages/backend/**`, `infra/**`, `sst.config.ts`, `migrations/**` | Root configs, types, shared specs | Any frontend or client directory (`packages/frontend/**`, `apps/**`, `extra.md`) |
| **`@frontend-dev`** | `packages/frontend/**` (or app root per `extra.md`) | Backend contracts, shared types, `extra.md` | Any backend, database, infra, or SST configuration files |
| **`@contract-reviewer`** | *None (Read-Only)* | Entire repository | All files across the repository |
| **`@compilador`** | Build configs, gradle configs, packaging scripts, root APK copy | Entire repository (for build execution) | Application source code (`src/**`), `.env` files |

---

## 2. Agent Roster

- **`@backend-dev`** (`.agents/agents/backend-dev.md`): Senior Backend Developer handling SST v4 infrastructure, AWS Lambda handlers, PostgreSQL persistence, and API contract design.
- **`@frontend-dev`** (`.agents/agents/frontend-dev.md`): Senior Frontend Developer handling views, state management, client validation, and API consumption per guidelines in `extra.md`.
- **`@contract-reviewer`** (`.agents/agents/contract-reviewer.md`): Quality and Integration Gatekeeper auditing DTO parity, JSON casing consistency, HTTP signatures, and type alignment.
- **`@compilador`** (`.agents/agents/compilador.md`): Build & Compilation Specialist handling frontend and backend build execution, resolving environment/dependency errors autonomously, and delegating source code errors to `@frontend-dev` or `@backend-dev`.

---

## 3. End-to-End Development Workflow

Every full-stack feature or API alteration must follow this 3-stage lifecycle:

### Step 1: Contract Definition & Backend Implementation (`@backend-dev`)
1. Implement or update the necessary database schema/migrations and business logic.
2. Define explicit DTOs for request payloads, query parameters, and response structures.
3. Expose the endpoint with strict `camelCase` JSON keys and structured error envelopes.
4. **Safety Rule:** Require explicit user confirmation before executing any `sst deploy` or destructive database commands.

### Step 2: Client Integration (`@frontend-dev`)
1. Consult the contracts established by `@backend-dev`.
2. Inspect `extra.md` to ensure design, styling, and state management conventions are respected.
3. Implement the UI components, network clients, and serialization models using matching property names.
4. Handle loading, optimistic updates, and API error states gracefully.

### Step 3: Contract Verification & Sign-Off (`@contract-reviewer`)
1. Before closing any task or merging changes, trigger `@contract-reviewer` to audit modified backend and frontend files.
2. The auditor verifies:
   - Identical key naming across payloads (zero tolerance for `snake_case` vs. `camelCase` drift).
   - Type, nullability, and optional field parity.
   - Endpoint paths, HTTP verbs, and error payloads.
3. If discrepancies are found, the reviewer issues an `ACTION REQUIRED` report directing the responsible agent to fix the drift.
4. A task is considered complete only after receiving a `PASSED` audit report.

---

## 4. Orchestration Rules for the Main Agent

When a multi-step user prompt is received:
- Automatically route backend work to `@backend-dev` first.
- Hand off the produced contracts to `@frontend-dev`.
- Automatically chain `@contract-reviewer` as the terminal validation step before returning the final response to the user.