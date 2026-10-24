# @foresigxt/agency-agents

Markdown-authored **agents** and **skills** for the Foresigxt agency, plus a
validating build that publishes the artifact contract consumed by `fgxt-app-web`.

This repo is the **authoring source**. Agents are markdown + YAML frontmatter;
skills are Claude-Code-compatible `SKILL.md` folders. The build walks the tree,
validates frontmatter, dedups by `id`, runs integrity checks, joins activation,
and emits `dist/agents.json` + `dist/skills.json` + `dist/index.js`.

## Layout

```
agents/foresigxt/<division>/<id>.md   # authored agents (14 in v0)
agents/upstream/                      # reserved (deferred — Plan A Task 6)
skills/<name>/SKILL.md                # skills (interview in v0)
catalog/activation.json               # allowlist of active agent ids → active:true
catalog/divisions.json                # division metadata
catalog/framework-legacy.json         # roles the framework gate does not check
schema/agent.frontmatter.ts           # Zod: agent frontmatter (subset of contract)
schema/skill.frontmatter.ts           # Zod: skill frontmatter
schema/contract.ts                    # vendored consumer contract (parity oracle)
src/parse.ts                          # frontmatter parse + validate (gray-matter)
src/framework.ts                      # role-card conformance checker (R1–R11)
src/build.ts                          # walk + dedup + framework gate + integrity + activation join
scripts/build.mjs                     # CLI → dist/*.json + dist/index.js
scripts/vendor-upstream.mjs           # stub (deferred)
dist/                                 # committed, published artifact
```

## Authoring model

- **Agent frontmatter** carries every artifact field except `system_prompt`
  (the markdown body) and `active` (joined from `catalog/activation.json`).
  `id` is a kebab-case slug and is globally unique. `name` is the id slug and
  `label` is the display name — every agent carries both, so a consumer that
  falls back label → name always shows a display name. `persona_name` is
  present on every agent as a value or explicit `null`.
- **Skill frontmatter** carries `name`, `description`, `tier`, `tools`,
  `directive`; the body is `instructions`. `name` + `description` are the Claude
  Code minimum, so each `SKILL.md` drops into `.claude/skills/<name>/` unchanged.
- **Activation** lives only in `catalog/activation.json`. An id not listed there
  builds as `active: false`.
- `callable_agent_ids` may reference runtime-provided tool agents (e.g.
  `web-search`) via the `KNOWN_EXTERNAL_AGENT_IDS` allowlist in `src/build.ts`.
- **Every new role follows the Agent Framework**: a seven-section card
  (`Identity`, `Behaviours`, `Scope`, `Method`, `Output contract`,
  `Guardrails`, `Escalation`) that binds the `agentic-operating` skill and
  names no persona — the call name is assigned when the person installs the
  agent. `pnpm build` fails on any violation and names the file, the rule and
  the fix. Roles authored before the framework are grandfathered in
  `catalog/framework-legacy.json`, a shrink-only list. The rules are in
  `src/framework.ts`; the design is in
  `docs/superpowers/specs/2026-10-24-agent-framework-design.md`.

## Commands

```bash
pnpm install
pnpm build   # → dist/agents.json, dist/skills.json, dist/index.js
pnpm test    # vitest (incl. the parity gate)
pnpm lint    # eslint
```

`dist/` is committed. CI (`.github/workflows/ci.yml`) runs
`build → test → lint` and fails if the committed `dist/` is stale.

## Parity gate

`src/__tests__/parity.test.ts` deep-compares the build output against the
vendored fixture oracle in `src/__tests__/__fixtures__/` (a copy of
`fgxt-app-web`'s `services/foresigxt/src/agency/__fixtures__/{agents,skills}.json`)
and validates it against `schema/contract.ts`. The build must reproduce the
fixtures byte-for-byte — including `label` presence, `persona_name` null-vs-value,
and every `system_prompt`.

## Consuming the package

```js
import { agents, skills } from "@foresigxt/agency-agents";
// or the raw artifacts:
import agents from "@foresigxt/agency-agents/agents.json" with { type: "json" };
```

Distributed **directly from GitHub** (no npm registry). The built `dist/` is
committed and `package.json` `exports` resolve to it, so consumers install the
repo at a version tag and get the artifacts verbatim — no build on install, and
no auth for a public repo:

```bash
pnpm add github:foresigxt/fgxt-agency-agents#v0.1.0
```

Pin to a tag (recommended) or a commit SHA for reproducibility. `gray-matter`
and `zod` are `devDependencies` (build-only) — consumers pull no runtime deps.

## Releasing

There is no npm publish step — the git tag *is* the release. To cut one: bump
`version` in `package.json`, ensure `pnpm build` leaves `dist/` clean (CI's
`git diff --exit-code -- dist` gate enforces this), then:

```bash
git tag v0.1.0 && git push origin main --tags
```

Consumers then bump their dependency ref (e.g. `#v0.1.1`). CI (`.github/workflows/ci.yml`)
runs build + test + lint + the `dist` freshness gate on every push, PR, and tag.
