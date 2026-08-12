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
schema/agent.frontmatter.ts           # Zod: agent frontmatter (subset of contract)
schema/skill.frontmatter.ts           # Zod: skill frontmatter
schema/contract.ts                    # vendored consumer contract (parity oracle)
src/parse.ts                          # frontmatter parse + validate (gray-matter)
src/build.ts                          # walk + dedup + integrity + activation join
scripts/build.mjs                     # CLI → dist/*.json + dist/index.js
scripts/vendor-upstream.mjs           # stub (deferred)
dist/                                 # committed, published artifact
```

## Authoring model

- **Agent frontmatter** carries every artifact field except `system_prompt`
  (the markdown body) and `active` (joined from `catalog/activation.json`).
  `id` is a kebab-case slug and is globally unique. `label` is the display name
  (present for specialists; omitted for `assistant`/`chat-llm`). `persona_name`
  is present on every agent as a value or explicit `null`.
- **Skill frontmatter** carries `name`, `description`, `tier`, `tools`,
  `directive`; the body is `instructions`. `name` + `description` are the Claude
  Code minimum, so each `SKILL.md` drops into `.claude/skills/<name>/` unchanged.
- **Activation** lives only in `catalog/activation.json`. An id not listed there
  builds as `active: false`.
- `callable_agent_ids` may reference runtime-provided tool agents (e.g.
  `web-search`) via the `KNOWN_EXTERNAL_AGENT_IDS` allowlist in `src/build.ts`.

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

Add it as a dependency (internal `@foresigxt` registry):

```bash
pnpm add @foresigxt/agency-agents@^0.1.0
```

## Publishing

Publishing is automated on `v*` tags (`.github/workflows/ci.yml` `publish` job):
it runs `pnpm build` then `pnpm publish --access restricted` using the
`NPM_TOKEN` repository secret (a scoped publish token for the
`@foresigxt` registry). To cut a release: `git tag v0.1.0 && git push --tags`.
