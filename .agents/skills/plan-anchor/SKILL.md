---
name: plan-anchor
description: >-
  Use this skill for any multi-step or long-running task — building a feature, a
  refactor, a multi-file change, or anything expected to take more than a few steps.
  It keeps the agent anchored to a written plan so instructions given at the start,
  and corrections given midway, are not lost as the context window fills. Use it when
  the user says the agent "forgets", "loses context", "drops instructions", "goes off
  track", or "stops following the plan".
---

# Plan Anchor

Long agent tasks fail in a specific way: the instructions are followed for the first
few steps, then quietly stop being followed. The cause is not stupidity — it is that
the plan lived in the conversation, and the conversation got trimmed.

The fix is to move the plan out of the context window and onto disk, then re-read it
on every step.

## Setup — once per task

Create `AGENT_PLAN.md` at the project root **before writing any code**:

```markdown
# <task name>

## Goal
<one sentence — what "done" looks like>

## Constraints
- <hard rules that must survive the whole task>
- <files or areas that must not be touched>

## Out of scope
- <what this task explicitly does not include>

## Steps
- [ ] 1. <step>
- [ ] 2. <step>
- [ ] 3. <step>

## Decisions
<empty at start — append as decisions get made>

## Corrections
<empty at start — append every mid-task instruction from the user>
```

Show it to the user and get approval before executing step 1.

## The loop — every single step

Before each step:

1. **Read `AGENT_PLAN.md` in full.** Not from memory. Actually read the file.
2. State: `Step N of M: <name>. Remaining: <count>.`
3. Check the current work against **Constraints** and **Out of scope**.
4. Do the step.
5. Tick the box. Append anything decided to **Decisions**.

Reading the file every step is the entire mechanism. Skipping it because you "remember
what the plan says" is exactly the failure this skill prevents — by the time you are
wrong about that, you cannot tell.

## When the user interrupts

A mid-task instruction is the most commonly dropped thing in agent work. It arrives
while you are deep in a step, gets acknowledged, and is gone three steps later.

The moment one arrives:

1. Append it verbatim to the **Corrections** section of `AGENT_PLAN.md`.
2. Amend the affected steps in the plan.
3. Say what changed in one line.
4. Then continue.

Never carry a correction only in your head.

## Detecting your own drift

Stop and re-read the plan when any of these is true:

- You are about to touch a file not mentioned anywhere in the plan.
- You cannot state, without looking, which step you are on.
- You are about to add a dependency, a pattern or an abstraction the plan does not name.
- The user says something like "I already told you" or "that's not what I asked".

Say plainly: *"I have drifted from the plan — re-reading it now."* That sentence costs
nothing and saves the task.

## Finishing

Before reporting completion:

1. Read `AGENT_PLAN.md` one final time.
2. Confirm every box is ticked, or say which are not and why.
3. Re-read the user's original request and confirm each part is addressed.
4. State explicitly what you did **not** do.

## What this skill is not

It is not a substitute for a short task. For a one-file edit, skip all of this — the
overhead is worse than the risk.
