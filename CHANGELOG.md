# Changelog

All notable changes to `@foresigxt/agency-agents`.

The release is the git tag — there is no npm publish step. Consumers install
`github:foresigxt/fgxt-agency-agents#v<version>` and get the committed `dist/` verbatim.

## [Unreleased]

- Strengthened the shared `agentic-operating` skill for long, multi-step, and unattended work. It now covers when to ask or proceed, outcome-based plans and replanning, action-specific approvals, platform confirmations and approved workflows, uncertain outcomes, delegation, and a definition of done.
- Changed `workspace-filing` to offer a descriptive workspace save and save it only after the person agrees.

## [0.8.0] - 2026-10-27

- The `workflow-authoring` skill now exposes the six workflow tools and explains their lifecycle:
  list existing workflows before drafting, draft and update definitions, validate before presenting
  a workflow as ready, and start or inspect runs. Running remains an approved side effect, and
  the skill falls back to a readable step summary when the workflow tools are unavailable.
- `workflow-run` is available on Agent Pro and Bundle plans. An `upgrade_required` refusal leaves
  the saved workflow intact.

## [0.7.0] - 2026-10-26

> The `tender-bidding-manager` role is **ACTIVATED**. It shipped in 0.6.0 as an unactivated
> pilot (absent from `catalog/activation.json`), and 0.7.0 activates it — the release
> FGXT-389 was waiting for.

- **Activation**: `tender-bidding-manager` joins `catalog/activation.json`, so the role is
  live from this release — it appears in the app-web gallery and is installable.
- The role is **tier `pro`** and its four tender skills (`tender-decomposition`,
  `bid-no-bid-assessment`, `bid-strategy`, `workflow-authoring`) are tier `pro`.
- The role leaves `model` and `temperature` out, so it is **pool-routed** (the same
  convention as every other role in the catalog).
- No prompt, skill or persona content changed — this release is the activation, so every
  existing role is byte-identical to 0.6.0.

## [0.6.0] - 2026-10-24

> `0.5.0` is **retired**, not merely untagged: the number was reserved for FGXT-389 and will
> never be released. FGXT-389 — the `tender-bidding-manager` activation, the app-web dependency
> bump and the catalog seed — **ships in a later version**, not in this one. This release
> follows `0.4.0` directly, so the version sequence is 0.4.0 → 0.6.0.

### Agent Framework v1 (FGXT-405)

Every authored role now carries the same seven-section role card, and the build refuses to
publish a card that does not.

- **Role-card checker** (`src/framework.ts`) — eleven rules, R1–R11: the seven sections
  (`Identity`, `Behaviours`, `Scope`, `Method`, `Output contract`, `Guardrails`, `Escalation`)
  present and in order with nothing before `Identity`; no empty section; `Identity` within 60
  words; the body within 600; the shared core skill bound; every skill named in the body bound;
  no credential claims; no numeric benchmark a model cannot verify; no shouting; no authored
  persona name; `Identity` names the role.
- **Build enforcement** (`src/build.ts`) — a non-conforming card fails the build. The legacy list
  is validated with zod and may only shrink.
- **`Scope` convention** — every conformant role states its boundary as two labelled clauses:
  `In:` what the role does, `Out:` what it does not, each naming where the excluded work goes
  (`Out: … — that goes to the close team`). A role card with no `Scope` section fails R1.
- **14 of the 15 agents conform** to the card. `chat-llm` is the only exception: it is a bare
  model passthrough with no role behaviour, and it stays on the framework-legacy list alone.
- **Persona names dropped** — `persona_name` is `null` on every agent. The call name is the
  user's to choose at install time, not something the agency authors.
- **One naming rule** — `name` is the id slug and `label` is the display name, for every agent
  including `assistant` (`assistant` / `Assistant`) and `chat-llm` (`chat-llm` /
  `Chat with LLM`).
- **Two new skills** — `agentic-operating`, the shared operating skill bound by every conformant
  role, and `agent-architect`, the role-card builder bound to `assistant`.
- Every one of the 14 agents that existed at `0.4.0` has a new prompt, and 13 of them have new
  frontmatter. The exception is `chat-llm`: it is exempt from the card, so its body is unchanged
  and only two frontmatter fields move — `name` becomes the id slug (`chat-llm`) and the display
  name moves to a new `label` (`Chat with LLM`). `tender-bidding-manager` is new.
  `dist/agents.json` therefore differs from `0.4.0` in all 15 agents; `dist/skills.json` gains six
  skills (the two above plus the four tender skills below).

### Tender skills and role (FGXT-388)

- Four new skills: `tender-decomposition`, `bid-no-bid-assessment`, `bid-strategy`,
  `workflow-authoring`.
- New role `tender-bidding-manager` (Sales), **inactive** — it ships authored but awaits
  activation via `catalog/activation.json` (FGXT-389).

### Breaking for consumers

- `persona_name` is `null` on every agent, so app-web must re-sync installed copies and
  refresh system-role prompts (FGXT-410). A consumer that keys on the old persona names breaks.
- Every authored role's `system_prompt` is restructured to the role card.
- `customer-success-op`'s `label` changes from `Customer Success Operations` to
  `Customer Success Operations Specialist` (FGXT-405, `5844aea`), so the Identity reads
  "You are the Customer Success Operations Specialist on the Foresigxt team". A consumer that
  keys on the old label breaks. The label is display-only — `name` is unchanged.
- `package.json` `version` was `0.3.0` at `v0.4.0`; it now matches the release.

## [0.4.0] - 2026-08-28

- **Breaking:** roles bind skills instead of pinning a model or `maxTokens`; `model` is optional
  in the artifact contract and its absence means pool-routed.
- Six shared method skills and thirteen role signature skills added.
- The committed `dist/` is guarded by a freshness test.

## [0.3.0] - 2026-08-13

- **Breaking:** the `interview` skill is removed; role skills relocate to the web-app core tier.

## [0.2.0] - 2026-08-12

- Conversation-starter coverage for every agent.
- Seven role-generic prompts deepened; six persona prompts deepened to the house template with
  starters.
- The frontmatter invariant guard is introduced.

## [0.1.0] - 2026-08-12

- First release. Distribution is by git tag; no npm publish.
