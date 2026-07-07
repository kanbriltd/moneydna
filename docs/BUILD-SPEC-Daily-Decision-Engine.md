# MoneyDNA — Daily Decision Engine: Build Spec (for Claude Code)

This is the developer-ready spec for the heart of MoneyDNA V1. A working core is already implemented (see `README-DECISION.md`); use this spec in **Claude Code**, inside your live repo, to run, refine, and extend it against the real app during the pilot.

## The one hypothesis this serves
> **Hypothesis 001:** People will trust an AI companion that helps them make one better financial decision every day — and it measurably changes their behavior.

Every task below exists to prove or break that. If a change doesn't help someone make one better decision today, or doesn't help *measure* whether it did, it waits.

## Architecture (already scaffolded)
```
Discovery (who you are)  ─┐
Money situation (manual)  ├─►  DecisionContext  ─►  Engine (deterministic pick)  ─►  Narrate (AI voice)  ─►  ONE decision
Analytics (if statement)  ┘                                   │
                                                        Feedback loop  ─►  evolve 5 DNA traits  ─►  Weekly story
                                                              │
                                                        Event log  ─►  Pilot dashboard (3 numbers)
```

## Data tiers (manual-first — critical)
The engine must always produce one good decision, degrading gracefully:
- **Tier 1** — DNA + goal + manual money situation only (day-one user, no statement). Confidence = "medium", phrased as "based on what you've shared".
- **Tier 2** — + optional manual daily check-in ("I spent ~KES X on food").
- **Tier 3** — + connected statement (precise overspend detection). Confidence = "high".
`buildContext()` in `src/app/api/decision/route.ts` sets `dataTier`; the engine reads it. Never block a decision on missing statement data.

## Files (already created)
| File | Role |
|------|------|
| `src/lib/decision/inputs.ts` | `DecisionContext`, `Traits`, payday math, amount helper |
| `src/lib/decision/engine.ts` | Candidate generation + scoring → one `Decision` (pure, deterministic) |
| `src/lib/decision/traits.ts` | Seed traits from discovery; evolve from follow-through |
| `src/lib/decision/narrate.ts` | AI phrasing over the chosen decision (Claude + fallback) |
| `src/lib/decision/weekly.ts` | Weekly reflection story |
| `src/app/api/decision/route.ts` | GET today's decision (generate+persist); POST feedback + evolve traits |
| `src/app/api/situation/route.ts` | GET/POST the 4–5 manual money inputs |
| `src/app/api/weekly/route.ts` | GET weekly reflection |
| `src/app/api/pilot/route.ts` | GET the 3 pilot numbers |
| `src/app/(app)/today/page.tsx` + `TodayView.tsx` | The Morning Brief home |
| `src/app/(app)/pilot/page.tsx` + `PilotView.tsx` | Founder pilot dashboard |

## The decision-scoring contract (keep it explainable)
`score = normalisedImpact * 0.55 + fit * 0.45`, minus 0.2 if the kind repeats yesterday's. `fit` is a 0..1 function of the user's 5 traits + calendar. **Rule: the deterministic engine chooses; the AI only rephrases.** Never let the LLM invent a different decision or new numbers.

## Recommended next tasks in Claude Code (in order)
1. **Run it live** — `prisma migrate dev --name add_decision_engine`, then exercise `/today` end-to-end (discovery → situation → decision → feedback → trait change). Fix anything the real runtime surfaces.
2. **Post-login redirect to `/today`** — make the Morning Brief the landing screen (currently `/dashboard`). Update the auth redirect / home route.
3. **Tune candidate rules against real reactions** — during the pilot, watch which `kind`s get followed vs skipped (the `DailyDecision` table) and adjust `fit`/impact. This is where pilot learning turns into product.
4. **Add the optional Tier-2 daily check-in** — a one-tap "what did you spend yesterday?" that sharpens the next decision.
5. **Gate `/pilot`** — restrict to founder emails via an allowlist (env `PILOT_ADMINS`), before any wider launch.
6. **Push notification / morning trigger** — the loop needs a reason to open at 8am. A daily reminder (web push / email) is the single highest-leverage retention add once the core feels right.

## Guardrails (do not regress)
- Decisions are **nudges, never advice/directives**; never name specific products. (Consistent with `coachGuardrails.ts` + the "not advisers, not planners" foundation.)
- Honesty about confidence when data is thin.
- Financial DNA is identity, not a credit score.

## The only metrics that matter now
1. **Morning Brief open rate** (`today_viewed` per active user) — target >60%.
2. **Decision follow-through** (`decision_followed` / decided) — rising.
3. **"Would you miss it?"** at ~30 days + week-4 retention > ~40%.
All wired through `logEvent()` and surfaced in `/pilot`.
