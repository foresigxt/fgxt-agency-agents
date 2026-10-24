# Changelog

All notable changes to `@foresigxt/agency-agents`.

The release is the git tag — there is no npm publish step. Consumers install
`github:foresigxt/fgxt-agency-agents#v<version>` and get the committed `dist/` verbatim.

## [0.6.0] - 2026-10-24

> `0.5.0` was reserved for FGXT-389 (tender-role activation, the app-web dependency bump and the
> catalog seed) and was never tagged. This release follows `0.4.0` directly.

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
- **14 of the 15 agents conform** to the card. `chat-llm` is the only exception: it is a bare
  model passthrough with no role behaviour, and it stays on the framework-legacy list alone.
- **Persona names dropped** — `persona_name` is `null` on every agent. The call name is the
  user's to choose at install time, not something the agency authors.
- **One naming rule** — `name` is the id slug and `label` is the display name, for every agent
  including `assistant` (`assistant` / `Assistant`) and `chat-llm` (`chat-llm` /
  `Chat with LLM`).
- **Two new skills** — `agentic-operating`, the shared operating skill bound by every conformant
  role, and `agent-architect`, the role-card builder bound to `assistant`.
- Every one of the 14 agents that existed at `0.4.0` has a new prompt and new frontmatter, and
  `tender-bidding-manager` is new. `dist/agents.json` therefore differs from `0.4.0` in all 15
  agents; `dist/skills.json` gains six skills (the two above plus the four tender skills below).

### Tender skills and role (FGXT-388)

- Four new skills: `tender-decomposition`, `bid-no-bid-assessment`, `bid-strategy`,
  `workflow-authoring`.
- New role `tender-bidding-manager` (Sales), **inactive** — it ships authored but awaits
  activation via `catalog/activation.json` (FGXT-389).

### Breaking for consumers

- `persona_name` is `null` on every agent, so app-web must re-sync installed copies and
  refresh system-role prompts (FGXT-410). A consumer that keys on the old persona names breaks.
- Every authored role's `system_prompt` is restructured to the role card.
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
