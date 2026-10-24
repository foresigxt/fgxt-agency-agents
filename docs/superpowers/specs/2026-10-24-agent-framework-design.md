# Foresigxt Agent Framework v1 — design

Date: 2026-10-24 · Status: approved design, pending spec review · Target version: 0.6.0

## Problem

The 15 role prompts in `agents/foresigxt/` share an informal shape (identity,
responsibilities, method, output contract, quality bar) that nothing enforces.
A new role can be written in any shape. Shared agentic behaviour — planning and
executing multi-step work, asking before side effects, proposing missing tools
or skills — is either restated per role or absent. There is no skill that lets
the assistant build a new agent to a common standard.

## Goals

1. One framework every new role must follow, enforced by the build.
2. Shared agentic behaviour defined once and bound to every conformant role.
3. An `agent-architect` skill that drafts framework-conformant roles, usable by
   the app-web assistant (draft deliverable) and in Claude Code in this repo
   (writes files, runs the gate).
4. Prove the framework on one pilot role.

## Non-goals

- Migrating the other 13 legacy roles (follow-up spec).
- Behavioural evals that need a model runner (follow-up spec).
- Any change to app-web's `CORE_INTELLIGENCE_PROMPT`, prompt composer, or tools.
- A runtime mechanism for agents to install tools or skills. Agents only propose.

## Runtime facts this design relies on

Verified in `fgxt-app-web/services/foresigxt/src/` on 2026-10-24:

- `lib/prompt-composition.ts:50-61` composes: `CORE_INTELLIGENCE_PROMPT` → role
  slot (`agents.system_prompt`, or a user overlay) → personalization → skill
  directives. A role **replaces** the assistant prompt; only the core prompt is
  shared.
- Skill instructions load on demand: Mastra adds an `<available_skills>` block
  (name + description) and `skill` / `skill_read` tools
  (`agents/build-mastra-agent.ts:102-106`). Directives are always in the prompt.
- `request-connector` exists on the /chat connector surface
  (`connectors/request-connector-tool.ts`) and renders a connect card for the
  user; it is not resolved through `resolveBuiltinTool`.
- No runtime path creates or acquires a skill.
- No system-prompt length limit is enforced.

## Design basis

Drawn from Anthropic's prompt-engineering, context-engineering, tool-writing and
agent-skills guidance, OpenAI's GPT-5 prompting guide, and Zheng et al.
(arXiv 2311.10054):

- Keep the always-on prompt to the smallest set of high-signal instructions;
  load methods on demand (skills).
- A role sentence shapes tone and scope; credentials ("15 years of experience")
  do not improve accuracy. Describe observable expert behaviours instead.
- Thresholds stated in a prompt cannot be verified by the model and invite
  fabricated precision; put them in executable gates.
- Gate autonomy by action risk, not by stage: free to read and analyse, ask
  before changing anything.
- Self-improvement goes through proposals a human reviews, never self-edits.
- Avoid shouty emphasis; current models over-trigger on it.

### Mapping from the proposed multi-layer template

| Template element | Disposition in v1 |
|---|---|
| L1 expert persona, core principles | Role card `Identity` + `Behaviours` (behaviours, no credentials) |
| L1 knowledge base | Capability skills / retrieval, not the prompt |
| L1 quality benchmarks (≤1%) | Removed from prompts; future eval gates |
| L2 RTC-C | Dropped; task and context belong to the per-turn brief |
| L2 SWIV | Future opt-in `swiv-analysis` capability skill |
| L3 methodology stack, tools | Capability skills; tool detail stays in tool schemas |
| L3 process workflow | Operating-core loop (plan → act → verify → report) |
| L4 self-check, peer review | Operating-core verify step + `Output contract` |
| L4 continuous improvement | Operating-core skill-gap protocol + follow-up evals |
| Integration: human after each layer | Risk-tiered approvals in the operating core |
| Integration: monitoring, error propagation | Harness concern, out of the prompt |

## Framework model

| Layer | Home | Holds | Loaded |
|---|---|---|---|
| L0 Core intelligence | app-web `CORE_INTELLIGENCE_PROMPT` | Platform identity, safety | Always; unchanged |
| L1 Operating core | `skills/agentic-operating/SKILL.md` | Shared agentic behaviour | Directive always; body on demand |
| L2 Role card | `agents/foresigxt/<division>/<id>.md` body | Who this expert is and how they behave | Always (role slot) |
| L3 Capability skills | `skills/<name>/SKILL.md`, bound in `skills:` | Methods, templates, checklists, tool usage | Directive always; body on demand |
| Gates | `src/framework.ts`, tests | Structural rules, thresholds | Build / CI |

### L1 — `agentic-operating` skill

Frontmatter: `name: agentic-operating`, `tier: free`, `tools: []`, a directive
that states the loop and the approval rule in one sentence:
"Plan multi-step work before acting, verify each result against its source,
and ask before any step that writes, sends, files or changes a connected system."

Body, five blocks:

1. **Plan → act → verify → report.** Show the plan for multi-step work; check
   each step against ground truth (tool results, the documents); stop when the
   success criterion is met, when blocked, or when the next step needs a person;
   when a non-critical detail is missing, proceed, record the assumption, and
   report it.
2. **Risk tiers.** Reading and analysing need no approval. Writing, sending,
   filing, deleting or changing a connected system waits for the person's
   approval, stating what will change and where. Irreversible actions need an
   explicit confirmation. No workarounds around a refused or failing action.
3. **Tool-gap protocol.** When a needed capability is missing, say so. Use
   `request-connector` when it is available; otherwise return a proposal:
   need, evidence from this task, candidate connector, read/write scope, data
   touched, fallback. Never claim a tool you do not have.
4. **Skill-gap protocol.** When a method recurs or a deliverable could be
   better with a reusable procedure, draft a proposed skill (name, trigger
   description, steps, quality bar) as a deliverable for human review. Never
   edit your own prompt or skills.
5. **Evidence-linked output.** Tie each claim to its source and how it was
   verified; state what is unverified. No self-rated confidence percentages.

### L2 — role card

Body is markdown with exactly these `##` sections, in order:

1. `Identity` — the role (its `label`, e.g. "You are the Data Scientist on the
   Foresigxt team"), who they serve, the outcome; ≤ 60 words. No personal name.
2. `Behaviours` — observable habits of an expert in the field.
3. `Scope` — in scope, out of scope, and where out-of-scope work goes.
4. `Method` — the role's default sequence; points at bound skills by
   `` `skill-name` `` rather than restating them.
5. `Output contract` — the named deliverables.
6. `Guardrails` — what the role never invents or does.
7. `Escalation` — when it stops and asks, and when it hands off.

`###` subheadings are allowed inside a section. Frontmatter is unchanged; no
new field is added, so the published contract shape is unchanged.

### Role name, not persona name

An agent is identified by its role. `label` (e.g. "Data Scientist") is the
display name. The call name a person uses for it ("Vera", "Theo") is assigned by
the user when they install or create the agent; it is not authored here. A
conformant role therefore has `persona_name: null` and an `Identity` written in
role terms. The `persona_name` field stays in the contract (always `null` for
conformant roles) so the shape does not change; app-web supplies the
user-assigned name at runtime (see Contract and rollout).

## Conformance gate

### `src/framework.ts`

`checkRoleCard({ id, file, body, frontmatter }): Violation[]` where
`Violation = { rule: string; message: string; fix: string }`.

| Rule | Check |
|---|---|
| R1 | `##` headings are exactly the seven above, in order; no other `##` |
| R2 | Every section has non-whitespace content |
| R3 | `Identity` ≤ 60 words |
| R4 | Body ≤ 600 words |
| R5 | `frontmatter.skills` includes `agentic-operating` |
| R6 | Every backticked token in the body that names a skill in `skills/` is bound in `frontmatter.skills` |
| R7 | No credential claims: `/\b\d+\+?\s*years?\b(\s+of)?\s+experience/i` and `/\b\d+\+\s*years\b/i` |
| R8 | No numeric quality benchmarks: `/[≤≥<>]=?\s*\d+(\.\d+)?\s*%/` |
| R9 | No all-caps emphasis words: `\b(MUST|NEVER|CRITICAL|IMPORTANT)\b` (case-sensitive) |
| R10 | `frontmatter.persona_name` is `null` |
| R11 | `Identity` contains the role's `label` (or `name` when no `label`) |

Word counts split on whitespace after stripping markdown markers.

### Build integration

`src/build.ts` calls `checkRoleCard` for every agent whose id is not in the
legacy list. Any violation fails the build with one line per violation:
`<file>: <rule>: <message> — <fix>`. CI already runs build → test → lint.

### Legacy list — `catalog/framework-legacy.json`

```json
[
  { "id": "chat-llm", "status": "exempt", "reason": "Bare model passthrough; no role behaviour by design." },
  { "id": "assistant", "status": "pending-migration", "reason": "Pre-framework role." }
]
```

(Abbreviated: the 13 authored roles other than `chat-llm` and the pilot are
`pending-migration`; 15 authored roles in total.)

`framework-legacy.test.ts` pins the pending ids as a frozen snapshot:

- every listed id exists as an authored agent;
- the pending set is a subset of the snapshot (it may shrink; it may not grow);
- an `exempt` entry has a non-empty `reason`;
- the pilot id is absent.

Adding a new role to the list fails the test, so a new role cannot skip the
framework. Editing the snapshot is a visible, reviewable act.

### Not gated in v1

Prose quality, contradictions between sections, and behavioural outcomes. These
belong to the follow-up eval spec.

## L3 — `agent-architect` skill

`skills/agent-architect/SKILL.md`, `tier: pro`, `tools: []`, bound to
`assistant`. Directive: "When asked to create a new agent or role, interview for
the role before drafting anything, and deliver it in the Foresigxt Agent
Framework shape."

Instructions:

1. **Interview**, one question at a time (`ask-user` when available): the job
   and who it serves; three typical requests; deliverables; what it must never
   do; risky actions; systems it touches; division and tier.
2. **Check fit.** If an existing role covers the job, say so and suggest it
   instead of building a duplicate.
3. **Map capabilities.** Bind existing skills by name. Each method with no skill
   becomes a proposed skill (name, trigger description, steps, quality bar).
   Each system with no connector becomes a proposed connector (need, scope,
   fallback) — the same format as the operating core's gap protocols.
4. **Draft the role card**: frontmatter plus the seven sections, written to
   R1–R11, with `agentic-operating` bound, `persona_name: null`, and the role
   named by its `label`. Never invent a personal name; if the requester offers
   one, note that they assign it when they install the agent.
5. **Self-check against R1–R11, then deliver:**
   - in app-web: the draft role file, proposed skills and proposed connectors as
     one reviewable deliverable; state that it is not live until a maintainer
     adds it to the agency repo; save to workspace only with approval;
   - in Claude Code in this repo: write `agents/foresigxt/<division>/<id>.md`
     and any proposed `skills/<name>/SKILL.md`, leave the id out of
     `catalog/activation.json`, run `pnpm build && pnpm test`, report results.
     Activation is a human decision.

The skill includes one compact worked example of a conformant role card.

## Pilot

`tender-bidding-manager` (inactive) is restructured into the seven-section card
with `agentic-operating` bound. Its persona name "Vera" is dropped:
`persona_name: null`, and `Identity` opens "You are the Tender Bidding Manager
on the Foresigxt team". Other content is preserved; only shape changes. It is
absent from the legacy list and must pass the full check.

## Testing

Package-scoped vitest only.

- `src/__tests__/framework.test.ts`: per rule R1–R11, one conformant and one
  violating card; each rule mutation-proven (disable the check, see red).
- `build.test.ts`: a fixture tree with one non-conformant role makes `build`
  throw, naming file and rule.
- `framework-legacy.test.ts`: as above.
- Skills: `agentic-operating` and `agent-architect` parse; `assistant` binds
  `agent-architect`.
- Pilot: Vera passes `checkRoleCard` with zero violations.
- Parity fixtures refreshed for the intended changes only (two new skills,
  `assistant.skills`, Vera's `system_prompt` and `skills`), following the
  FGXT-388 precedent; `dist/` rebuilt with no other diff.

## Contract and rollout

- Contract shape unchanged. `dist/skills.json` gains two skills; `assistant`
  and `tender-bidding-manager` change; all other agents are byte-identical.
- app-web picks up the refreshed fixtures on its next agency bump.
- Persona names: `tender-bidding-manager.persona_name` becomes `null`. The six
  live legacy roles with persona names (financial-reconciler "Atlas",
  sales-researcher "Mira", supply-chain-coordinator "Ozzy", recruiter "Theo",
  support-triage "Yuki", competitive-analyst "Vera" — the same name as the
  tender role) keep them until their migration, so live users see no
  change in this release. app-web was notified on 2026-10-24 that persona names
  move to a user-assigned install-time name; dropping them from live roles waits
  on app-web supporting that.
- Implemented in the `roles` lane on a new ticket; reproduce first, mutation-
  prove after, no push / PR / merge from the lane.
- Lands after FGXT-389's push: version 0.5.0 → 0.6.0.

## Assumptions to confirm

- `request-connector` is reachable from agent surfaces where roles run; the
  operating core degrades to a written proposal when it is not.
- Binding a new skill to `assistant` is accepted by app-web's skill registry
  drift test (`skills/__tests__/registry-generated-drift.test.ts`) after the
  next generated-registry refresh.

## Follow-ups

1. Migrate the remaining 13 roles (shrinks the legacy list to `chat-llm`).
2. Behavioural eval suite: asks before writing, cites, stops, routes to skills.
3. `swiv-analysis` capability skill.
4. Confirm the `request-connector` assumption with app-web.
5. app-web: user-assigned agent name at install or creation. Confirmed by the
   app-web coordinator on 2026-10-24 (task t-1ce522b99b2f3fc6): no such field
   exists today — `persona_name` is copied from the Role on install and never
   rewritten. The personalization slot is org-scoped free text, not a name
   field; app-web recommends a dedicated column rendered by composition as its
   own line ("The user calls you <name>."). UI already falls back persona →
   label → name, so a `null` persona displays the label with no app-web change.
   Owner ruling 2026-10-24 (task t-816d6c79fa3bea2f): the user decides the call
   name; the system suggests a default at install or create. Tracked in app-web
   as FGXT-404. app-web generates the suggestion; this repo ships no
   `suggested_names` and no contract change. The six live persona names are
   dropped during migration only after app-web confirms FGXT-404 has shipped.

## Total migration (2026-10-24) — operator decision

The migration is total and lands in the same 0.6.0 release.

- All 13 pre-framework roles migrate to the seven-section card in this release,
  not in a follow-up. The legacy list ends this release with `chat-llm` alone.
- The six live persona names are dropped now, not after their roles are
  migrated: `financial-reconciler` ("Atlas"), `sales-researcher` ("Mira"),
  `supply-chain-coordinator` ("Ozzy"), `recruiter` ("Theo"), `support-triage`
  ("Yuki") and `competitive-analyst` ("Vera") all become `persona_name: null`.
- `chat-llm` stays exempt — a bare model passthrough has no role behaviour to
  conform to.

**Superseded by this section.** The "Persona names" paragraph in "Contract and
rollout" above — the six live legacy roles "keep them until their migration, so
live users see no change in this release" — no longer holds: the names are
dropped in this release. The closing line of "Assumptions to confirm" above —
"the six live persona names are dropped during migration only after app-web
confirms FGXT-404 has shipped" — is superseded the same way: the operator
decided to drop them now, and the coordinator holds landing until app-web acks.

**Unchanged.** The mechanism is the same one this design already described:
`persona_name` stays in the published contract and is `null` for every
conformant role, app-web renders the label when the persona is null, and the
call name is the person's to assign at install or create time (app-web owns the
suggestion, FGXT-404). The contract shape does not change; no new frontmatter
field is added. The design basis for dropping credentials and persona names is
unchanged: a role is identified by its role, and a credential or a call name in
the prompt does not make the answer more accurate.

