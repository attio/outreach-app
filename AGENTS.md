# AGENTS.md

This file provides guidance to AI agents working on the Outreach Attio app.

## Context

This is an Attio App SDK app. It integrates Attio CRM with Outreach.io (sales engagement platform), enabling:

- Adding people to Outreach sequences from Attio record pages (single and bulk)
- Opening people in Outreach from record pages (finds or creates a prospect)
- Workflow triggers when a prospect is added to a sequence or changes sequence state
- Workflow step to add a prospect to an Outreach sequence

All blocks and record actions use **user connections** (OAuth) — each user connects their own Outreach account.

## File and folder structure

| Path                                                      | Description                                                                                       |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `src/app.ts`                                              | Main entrypoint — registers record actions and bulk actions                                        |
| `src/blocks/add-to-sequence/`                             | Step block — `block.ts`, `configurator.tsx`, `execute.ts`                                         |
| `src/blocks/trigger-added-to-sequence/`                   | Trigger block — fires when prospect is added to a sequence                                        |
| `src/blocks/trigger-sequence-state-changed/`              | Trigger block — fires when a prospect's sequence state changes                                    |
| `src/components/`                                         | Shared React dialog components (`AddToSequenceDialog`, `CreateProspectDialog`, `Loading`)         |
| `src/graphql/`                                            | GraphQL queries for the Attio API (get person by ID, person type)                                 |
| `src/outreach/outreach-client.ts`                         | `OutreachClient` class — all Outreach REST API calls; returns `@attio/fetchable` results          |
| `src/outreach/constants.ts`                               | Outreach API base URL and other constants                                                         |
| `src/outreach/get-outreach.ts`                            | Helper to instantiate `OutreachClient` from the user connection token                             |
| `src/outreach/utils.ts`                                   | URL builders and other shared utilities                                                           |
| `src/outreach/mailboxes/`                                 | Server: list mailboxes for the connected user                                                     |
| `src/outreach/prospects/`                                 | Server: find, create, and update prospects; map Attio person → prospect attributes                |
| `src/outreach/sequences/`                                 | Server: list sequences, add single/bulk prospects to a sequence                                   |
| `src/outreach/types/`                                     | Zod schemas, inferred types, error types, webhook payload types                                   |
| `src/outreach/webhooks/`                                  | Register and clean up Outreach webhooks (used by trigger blocks on activate/deactivate)           |
| `src/record/actions/`                                     | Single and bulk record actions for the `people` object                                            |
| `src/utils/`                                              | Workflow trigger log helper                                                                       |

## Workflow blocks

| Block                         | Type    | Description                                                                             |
| ----------------------------- | ------- | --------------------------------------------------------------------------------------- |
| `add-to-sequence`             | step    | Add a prospect to an Outreach sequence using the selected mailbox and contact details   |
| `trigger-added-to-sequence`   | trigger | Fires when a prospect is added to the selected Outreach sequence                        |
| `trigger-sequence-state-changed` | trigger | Fires when a prospect's state changes in the selected Outreach sequence               |

## Record actions

| Action                    | Type   | Object  | Description                                                              |
| ------------------------- | ------ | ------- | ------------------------------------------------------------------------ |
| `person-add-to-sequence`  | single | people  | Add a person to an Outreach sequence via a dialog (pick sequence + mailbox) |
| `open-in-outreach`        | single | people  | Find or create the prospect in Outreach and open their profile            |
| `add-many-to-sequence`    | bulk   | people  | Add multiple people to a sequence in batches of 100                      |

## Key patterns

- **All Outreach API calls go through `OutreachClient`** — never call `fetch` for Outreach directly outside this class.
- **`@attio/fetchable` result pattern** — `OutreachClient` returns `OutreachResult<T>` (`AsyncResult<T, OutreachError[]>`), never throws. Check `isErrored(result)` before using `result.value`.
- **Paginated responses** — `requestPaginated` fetches up to 3 pages of 1000 items each. If more pages exist, it logs an error and returns the truncated set.
- **Webhooks** — trigger blocks register Outreach webhooks on activate and clean them up on deactivate. Webhook payloads are validated with Zod schemas in `src/outreach/types/webhooks.ts`.
- **User connections** — all blocks set `requireUserConnection: true`. Do NOT wrap `getUserConnection()` in a try/catch.

## Environment

### Client-side code

Runs in browser inside a sandboxed custom JS runtime. Constraints:

- MUST NOT render HTML tags directly (`<div>`, etc.) — use App SDK components only
- MUST NOT use custom CSS or styles
- MUST NOT call `fetch` directly — use server-side functions instead
- Files rendering React components MUST use `.tsx` extension

### Server-side code

Runs in files ending in `.server.ts`, `.webhook.ts`, `.event.ts`. Custom JS runtime (not Node.js) — some Node.js APIs are unavailable.

## Using the Attio App SDK

Three packages:

- `attio/client` — client-side imports
- `attio/server` — server-side imports
- `attio` — shared/environment-agnostic imports

Always verify imports against existing examples, TypeScript types, or SDK docs. Never guess.

## Coding guidelines

- Use Zod to validate data from Outreach API responses
- Only include properties in Zod schemas that are explicitly needed
- Use `try/catch` around `.json()` calls
- Use `console.error` for unexpected errors — do NOT log sensitive data (emails, passwords)
- Handle API errors gracefully — return fallback UI in React components, never throw
- `OutreachClient` MUST NOT leak transport-layer details to callers — return `OutreachError[]` instead
- Prefer named arguments over positional when using 3+ args
- No `any` — type errors must be fixed properly

### Error messages (user-facing)

- Never dump raw JSON, HTTP status codes, or square brackets in UI error messages
- Never expose transport-layer details — say "Outreach: An unexpected error occurred" not "503 from Outreach"
- Use `outreachApiErrorUserMessage(errors)` to convert `OutreachError[]` into a user-facing string
- Auth errors (401/403) should tell the user to reconnect their Outreach account

## Validation commands

```bash
pnpm run build          # type-check via attio build
pnpm run lint           # eslint
pnpm run lint:fix       # eslint --fix
pnpm run format:check   # prettier check
pnpm run format         # prettier write
pnpm run test           # vitest run
pnpm run knip           # dead code check
```
