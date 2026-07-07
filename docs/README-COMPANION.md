# MoneyDNA — Companion + Memory Layer

The layer that makes MoneyDNA *know who each user is* — the "companion first" foundation, made real in code. It runs a warm discovery conversation, reveals the user's **Financial DNA**, remembers it forever, injects that memory into every AI reply, and **instruments everything** so the app produces the retention/engagement evidence investors asked for.

Type-checked clean against your codebase — **0 new type errors**.

## What's included

| File | Type | Purpose |
|------|------|---------|
| `prisma/schema-additions.prisma` | **schema** | `CompanionProfile` (the memory) + `Event` (telemetry) models, and the 2 lines to add to `User` |
| `prisma/migrations/20260706_add_companion/migration.sql` | **migration** | Ready SQL (or let `prisma migrate dev` generate it) |
| `src/lib/companion/discovery.ts` | **new** | The discovery conversation — 9 warm, human questions (no money, no forms) |
| `src/lib/companion/financialDna.ts` | **new** | 6 Financial DNA archetypes + deterministic derivation + AI reveal (with fallback) |
| `src/lib/companion/memory.ts` | **new** | Loads the profile and builds the "what I know about you" brief for AI prompts |
| `src/lib/events.ts` | **new** | `logEvent()` telemetry + `metricsSnapshot()` — the evidence engine |
| `src/app/api/companion/route.ts` | **new** | GET profile · POST discovery → derive DNA → reveal |
| `src/app/api/coach/route.ts` | **replace** | Coach now loads companion memory + logs events |
| `src/lib/coachEngine.ts` | **replace** | Coach now injects the memory brief so it speaks like it knows the user |
| `src/app/(app)/discover/page.tsx` | **new** | The discovery route (server) |
| `src/components/companion/DiscoverView.tsx` | **new** | The conversational onboarding + the "reveal your Financial DNA" moment |
| `src/components/layout/Sidebar.tsx` | **replace** | Full nav incl. "Financial DNA" (also keeps Blueprint + Simulator) |

> Note: `coachEngine.ts` here is the **guardrails version** from the Features bundle, now also carrying memory injection. It supersedes both earlier versions. The Sidebar likewise supersedes the Features-bundle Sidebar.

## Install

1. Apply the **Features bundle** first (Salary Blueprint / Simulator / Guardrails) if you haven't — this build layers on top of it.
2. Copy `src/` over your repo (mirrors your structure). Replaced files: `coachEngine.ts`, `api/coach/route.ts`, `Sidebar.tsx`.
3. Add the schema: paste the two models from `prisma/schema-additions.prisma` into `prisma/schema.prisma`, and add these two lines inside your `User` model:
   ```prisma
   companionProfile CompanionProfile?
   events           Event[]
   ```
4. Migrate:
   ```bash
   npx prisma migrate dev --name add_companion
   ```
5. Run it. New route: **/discover** (also in the sidebar as "Financial DNA").

## The flow

1. **Discovery** — before any money, MoneyDNA asks 9 warm questions about who the user is (money story, temperament, risk, life stage, what a good life means, biggest fear, and their vision in their own words).
2. **Reveal** — it derives a Financial DNA archetype (Builder, Guardian, Explorer, Achiever, Dreamer, Steward) and writes a personal, AI-generated reveal. This is the shareable "magic moment."
3. **Memory** — the profile is stored and injected into the coach's prompt, so from then on the AI speaks like a companion who *remembers* the person — never re-introducing itself, always grounded in who they are.
4. **Evidence** — every step logs an event (`discovery_started`, `discovery_completed`, `dna_revealed`, `coach_question_asked`, …). `metricsSnapshot()` rolls these into the funnel + engagement numbers that answer the investor's "traction = 3/10."

## Why this matters strategically

- **It makes "companion first" real** — the app now knows who it's talking to.
- **It deepens the moat** — the identity a user *volunteers* (story, fears, vision) is data no competitor can copy from a bank feed. This is the seed of the Financial Behaviour Graph.
- **It creates the addiction loop's first hit** — the DNA reveal is the shareable moment that drives word of mouth.
- **It produces evidence from day one** — the Event log is exactly what turns "we think users will engage" into a screenshot of a funnel.

## Principle kept throughout

Financial DNA is **identity, not advice**. The reveal describes *who you are*; it never tells anyone what to buy, save, or do. Consistent with the guardrails and the "not advisers, not planners" foundation.
