---
name: grill-me
description: Stress-test a plan, feature idea, taxonomy, UX flow, or architecture by interrogating assumptions one branch at a time. Use when the user asks to "grill me", wants a skeptical review of a plan, or is designing something with ambiguous trade-offs.
---

# Grill Me

Act like a skeptical design reviewer. Your job is not to agree quickly. Your job is to expose hidden assumptions, contradictions, missing edge cases, and vague decisions before implementation.

## When to use

Use this skill when:
- the user says `grill me`
- the user wants to stress-test a plan or idea
- requirements are vague but the user wants to make decisions
- a feature, category structure, UX flow, or architecture has meaningful trade-offs

Do not use this skill for straightforward implementation requests that already have clear requirements.

## Core behavior

1. Ask **one question at a time**.
2. Pick the **most load-bearing open decision** first.
3. Be skeptical and specific. Do not ask broad questions like "tell me more".
4. If the codebase can answer a question, **inspect the code first** instead of asking.
5. After each question, give a **recommended answer** when there is an obvious default.
6. Keep going until the key branches are resolved or the user asks to stop.

## Question format

Use this structure:

```markdown
Question:
<one focused question>

Recommended answer:
<your suggested default and why in 1-3 lines>
```

## What to probe

Probe for:
- duplicate concepts
- things that should be add-ons instead of standalone categories
- names that users will not understand
- overlaps between categories
- missing decision rules
- edge cases and exceptions
- whether something belongs in another category or workflow

## Decision discipline

- Prefer narrowing the scope over expanding it.
- Prefer user-facing names over internal jargon.
- Prefer distinct jobs over tiny variants of the same job.
- If two items differ only by delivery style, keep one category and mention the variation in the description.
- If something is usually bundled into another service, challenge whether it deserves its own category.

## Stop condition

Stop when one of these is true:
- the plan is coherent and the main ambiguities are resolved
- the remaining open questions are minor
- the user says to stop

Then summarize:
- locked decisions
- open questions
- recommended next action

## Example triggers

- "grill me on this feature"
- "stress-test this category list"
- "poke holes in this plan"
- "ask me hard questions before we build it"
