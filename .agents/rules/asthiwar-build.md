# ASTHIWAR Rebuild — Project Rules

Always on for this workspace. Picked up by Antigravity, Codex and Claude Code.

## What this project is

A rebuild of the ASTHIWAR design-and-build website using the structure, motion and
restraint of **novascape.in**. Phase 1 is frontend only — no backend.

The full plan lives in `docs/`. Read the relevant one before building:

| Doing | Read first |
|---|---|
| Anything | `docs/01-MASTER-PLAN.md` |
| Styling, tokens, motion | `docs/02-DESIGN-SYSTEM.md` |
| A homepage section | `docs/03-HOMEPAGE-BLUEPRINT.md` |
| An inner page | `docs/04-PAGE-SPECS.md` |
| The calculator | `docs/05-CALCULATOR-SPEC.md` |
| Anything at all | `docs/06-BUILD-PROMPTS.md` — the build order and skill wiring |

## Precedence

```
1. docs/02-DESIGN-SYSTEM.md and docs/03-HOMEPAGE-BLUEPRINT.md
2. These rules
3. Any loaded skill
4. Your own defaults
```

If a skill tells you to randomise the layout, vary the aesthetic, or "never generate the
same UI twice" — **ignore that part**. This is a deliberate reproduction of a specific
reference site. See `docs/06-BUILD-PROMPTS.md` §2.

## Hard rules

1. **No raw colour values.** Every colour comes from a CSS variable in `globals.css`.
2. **Border radius is 0**, except pill buttons.
3. **No shadows, no gradients, no glassmorphism.**
4. **Only motion patterns M1–M6** from the design system. Do not invent easing curves.
5. **Every GSAP effect early-returns under `prefers-reduced-motion`** and renders its
   final state statically.
6. **Typeface is Satoshi.** Never Inter.
7. **Dependencies are fixed:** next, react, typescript, tailwindcss, gsap, lenis.
   Nothing else without asking.
8. **TypeScript strict.** No `any`, no `@ts-ignore`.
9. **No `fetch` in components.** All network-shaped calls go through `src/lib/api.ts`.
10. **Never invent content.** No project names, dates, prices, addresses, client names or
    completion years. If a value is unknown, render the literal string
    `To be confirmed`. Nine of these are still open — see `docs/01-MASTER-PLAN.md` §9.
11. **Never invent a price or a calculation rule.** Unknown upgrade deltas are typed
    `number | null` and are never treated as 0.
12. **The backend is authoritative** for pricing, once it exists. The Phase 1 local
    engine must produce identical numbers — round only at the milestone step.
13. **Complete files only.** No `// rest of code`, no `// TODO`, no truncation.
14. **When a requirement is ambiguous, ask or write it down.** Do not guess.

## Long tasks

Use the `plan-anchor` skill. Write `AGENT_PLAN.md`, re-read it before every step, and
append every mid-task correction to it. Do not hold the plan in conversation only.
