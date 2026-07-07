# The MoneyDNA Constitution

*The principles every engineer, designer, and future employee must obey. This is not marketing and not technical documentation. It governs the product. It outlives the code.*

---

## The founding sentence

> **MoneyDNA doesn't manage money. It improves financial judgment.**

Everything below serves that sentence. If a feature does not improve a person's financial judgment, it does not belong in MoneyDNA.

---

## The Five Principles

**Principle 1 — Judgment, not management.**
MoneyDNA doesn't manage money. It improves financial judgment. We help people make one better decision and understand *why* — we never take the decision from them.

**Principle 2 — One best move.**
One decision, every day. Never overwhelm. The discipline of *one* is the product.

**Principle 3 — Evidence before reasoning.**
No explanation without evidence. No confidence without evidence. No prediction without evidence. Evidence is assembled first; language comes second.

**Principle 4 — Never sound more certain than the evidence allows.**
This is a coding standard, not a slogan. Confidence is computed from evidence, never asserted by a model or a copywriter.

**Principle 5 — Trust compounds faster than intelligence.**
We are not trying to be the smartest AI. We are trying to be the most trusted financial companion. When intelligence and trust conflict, trust wins.

---

## The Articles

**Article I — Truth.**
MoneyDNA never invents evidence. Every fact shown to a user must trace to something they told us, something we observed, or something we clearly label as an inference.

**Article II — Humility.**
MoneyDNA openly distinguishes observations from inferences. "You told us" and "we observed" and "we're guessing" are never blurred.

**Article III — Judgment.**
Recommendations support human decisions; they never replace them. MoneyDNA shows the move and the evidence, then the human decides.

**Article IV — Learning.**
Every interaction improves future recommendations through *verified user outcomes* — not assumptions. The loop closes: decision → outcome → memory → better next decision.

**Article V — Trust over cleverness.**
If forced to choose between sounding intelligent and being truthful, MoneyDNA always chooses truth.

---

## The confidence policy (how Article I & Principle 4 are enforced in code)

MoneyDNA earns the right to numbers. It never predicts a percentage; it may, once it has enough of a user's own history, *report a measured count*.

| The user's history for this decision type | What MoneyDNA may show |
|---|---|
| **0–9 similar decisions** | Confidence **bands only** — 🟢 High / 🟡 Medium / ⚪ Low. No numbers. |
| **10–19 similar decisions** | Bands **+ simple factual counts** — e.g. "You've followed this type of move 8 times." |
| **20+ similar decisions** | Bands **+ measured historical ratios** — e.g. "You've followed 17 of 21 similar moves." Never a *predicted* percentage. |

The number, when it finally appears, is always **measured from the user's own logged behaviour** — a fact about them, not a forecast about them. The distinction between a predicted number and a measured one is the difference between a fortune-teller and a mirror. MoneyDNA is always the mirror.

---

## The one rule that governs all others

> **MoneyDNA must never sound more certain than the evidence allows.**

Held relentlessly, this is a moat. AI capability is becoming a commodity; a reputation for epistemic honesty is not. Everyone will have models. Almost no one will have the discipline to say *"we don't know yet."*
