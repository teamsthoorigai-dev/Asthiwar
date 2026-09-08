# ASTHIWAR — Novascape-Style Rebuild

A complete build plan for rebuilding the ASTHIWAR design-and-build website with the
structure, motion language and visual craft of **https://www.novascape.in**.

- **Reference site (structure & feel):** novascape.in
- **Content source:** `C:\Users\sunda\Desktop\Asthivar\asthiwar-v1-main`
- **Build target:** this folder (`Rework-asthivar-demo-ui-sample-testing-v1`) — currently empty
- **Phase 1:** frontend only, no backend. Calculator runs on a local pricing engine.
- **Phase 2:** move/rebuild the Express + Neon Postgres backend and swap the engine over.

---

## How to use these docs with Gemini / ChatGPT

Work **top to bottom**. Each prompt in `06-BUILD-PROMPTS.md` assumes the previous
one finished. Paste the referenced doc as context alongside the prompt.

| Order | Doc | Paste this into the AI when... |
|---|---|---|
| 1 | [01-MASTER-PLAN.md](docs/01-MASTER-PLAN.md) | Always. It is the ground truth for stack + IA. |
| 2 | [02-DESIGN-SYSTEM.md](docs/02-DESIGN-SYSTEM.md) | Any styling, tokens, motion or component work. |
| 3 | [03-HOMEPAGE-BLUEPRINT.md](docs/03-HOMEPAGE-BLUEPRINT.md) | Building any of the 19 homepage sections. |
| 4 | [04-PAGE-SPECS.md](docs/04-PAGE-SPECS.md) | Building inner pages. |
| 5 | [05-CALCULATOR-SPEC.md](docs/05-CALCULATOR-SPEC.md) | Building the 5-step estimator. |
| 6 | [06-BUILD-PROMPTS.md](docs/06-BUILD-PROMPTS.md) | The copy-paste prompt sequence, wired to your installed skills. **Start here to actually build.** |
| 7 | [07-BACKEND-PHASE-2.md](docs/07-BACKEND-PHASE-2.md) | Only after the frontend is complete. |

### Works with any agent

`06-BUILD-PROMPTS.md` is written for **Claude Code, Codex, Antigravity, Cursor, Gemini
or ChatGPT**. It wires in the 24 skills installed at `~/.agents/skills/` — and, more
importantly, scopes the three that would otherwise fight a faithful rebuild. Read its
§0 (setup) and §2 (conflict rules) before running anything.

### The one rule that keeps this from going wrong

Never let the AI invent design tokens, spacing or motion values.
Every prompt in `06-BUILD-PROMPTS.md` ends with the same guardrail line — keep it.

---

## Quick start

```bash
npx create-next-app@latest . --typescript --tailwind --app --eslint --src-dir --import-alias "@/*"
npm i gsap lenis
```

Then run Prompt 01 from `docs/06-BUILD-PROMPTS.md`.
