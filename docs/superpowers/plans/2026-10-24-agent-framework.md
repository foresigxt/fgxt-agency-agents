# Foresigxt Agent Framework v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce a seven-section role-card framework in `pnpm build`, add the shared `agentic-operating` and `agent-architect` skills, and migrate the pilot role `tender-bidding-manager`.

**Architecture:** A pure checker `checkRoleCard` in `src/framework.ts` returns violations for one agent. `buildArtifacts` runs it on every agent not listed in `catalog/framework-legacy.json` and throws on any violation. A frozen-snapshot test stops the legacy list from growing. Each task that changes published output refreshes the parity fixtures and frontmatter baseline in the same task, so the suite is green after every task.

**Tech Stack:** TypeScript (ESM, run via tsx), vitest, zod, gray-matter, pnpm, Node ≥ 20.

**Spec:** `docs/superpowers/specs/2026-10-24-agent-framework-design.md` — read it first; rule text and skill content come from it.

## Global Constraints

- Executed in the fleet `roles` lane. Package-scoped tests only (`pnpm test`, `pnpm build`, `pnpm lint` in this repo). No push, PR, merge, tag, or `package.json` version change — the coordinator bumps to 0.6.0 when landing.
- Reproduce before fixing: every test is seen failing before the code that passes it. After each rule is implemented, mutation-prove it: disable that rule's check, confirm its negative test goes red, restore.
- No new agent frontmatter field; `schema/contract.ts` and `schema/agent.frontmatter.ts` are not modified.
- Only these published artifacts may change: `dist/skills.json` gains `agentic-operating` and `agent-architect`; agent `assistant` (`skills` only) and agent `tender-bidding-manager` (`system_prompt`, `skills`, `persona_name`). Every other agent stays byte-identical in `dist/agents.json`.
- The six live persona names (Atlas, Mira, Ozzy, Theo, Yuki, competitive-analyst "Vera") are not touched.
- No all-caps emphasis words (`MUST`, `NEVER`, `CRITICAL`, `IMPORTANT`) in any new skill or role text.
- Commit messages: conventional commits ending `(FGXT-<n>)`, with `<n>` the ticket number given at dispatch.

## Review Focus

1. A `##` line inside a fenced code block in a role body — it is not a section heading; R1 ignores lines between ``` fences. Test in Task 1.
2. CRLF line endings — `## Identity\r` is the Identity heading. Test in Task 1.
3. Tender-style percentages — "weighted 40%" passes R8; only a comparator before a number and `%` (`≤ 1%`, `<5%`) fails. Test in Task 1.
4. Duration phrases — "a 5 years contract term" passes R7; "15 years of experience" and "10+ years" fail. Test in Task 1.
5. Backticked non-skill tokens — `` `request-connector` `` or `` `ask-user` `` in a body are not skills and do not trip R6. Test in Task 1.

---

### Task 1: Role-card checker (`src/framework.ts`)

**Files:**
- Create: `src/framework.ts`
- Test: `src/__tests__/framework.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export const ROLE_CARD_SECTIONS = ["Identity", "Behaviours", "Scope", "Method", "Output contract", "Guardrails", "Escalation"] as const;
  export const FRAMEWORK_CORE_SKILL = "agentic-operating";
  export interface Violation { rule: `R${number}`; message: string; fix: string }
  export interface RoleCardInput {
    body: string;
    frontmatter: Pick<AgentFrontmatter, "name" | "label" | "persona_name" | "skills">;
    knownSkills: ReadonlySet<string>;
  }
  export function checkRoleCard(input: RoleCardInput): Violation[];
  export function formatViolations(file: string, violations: Violation[]): string; // one line each: `${file}: ${rule}: ${message} — ${fix}`
  ```

Rules (from the spec, thresholds exact):
- R1: `##` headings (outside ``` fences, trailing whitespace/`\r` trimmed, exact case) equal `ROLE_CARD_SECTIONS` in order; no non-whitespace text before `## Identity`. `###` lines are content, not headings.
- R2: each section has non-whitespace content.
- R3: Identity ≤ 60 words. R4: whole body ≤ 600 words. Word count: strip `#`, `*`, `` ` ``, leading `- `; split on `/\s+/`; drop empties.
- R5: `frontmatter.skills` includes `FRAMEWORK_CORE_SKILL`.
- R6: every backticked token in the body that is in `knownSkills` is in `frontmatter.skills`.
- R7: fails on `/\b\d+\+?\s*years?\s+of\s+experience\b/i` or `/\b\d+\+\s*years?\b/i`.
- R8: fails on `/[≤≥<>]=?\s*\d+(\.\d+)?\s*%/`.
- R9: fails on `/\b(MUST|NEVER|CRITICAL|IMPORTANT)\b/` (case-sensitive).
- R10: `frontmatter.persona_name === null` (undefined also fails).
- R11: Identity section text contains `frontmatter.label ?? frontmatter.name`.

When R1 fails, skip R2/R3/R11 (sections unreliable) but still run the rest.

- [ ] **Step 1: Write the failing tests**

In `framework.test.ts`, define a conformant fixture and helpers:

```ts
const FM = { name: "data-scientist", label: "Data Scientist", persona_name: null, skills: ["agentic-operating", "report-build"] };
const KNOWN = new Set(["agentic-operating", "report-build", "bid-strategy"]);
const SECTION = (h: string, text: string) => `## ${h}\n${text}\n`;
const VALID = [
  SECTION("Identity", "You are the Data Scientist on the Foresigxt team. You turn data into decisions people can defend."),
  SECTION("Behaviours", "- Confirms the question and the data source first.\n### Habits\n- Shows the method."),
  SECTION("Scope", "In: analysis. Out: data engineering, which goes to the person."),
  SECTION("Method", "Use `report-build` for the write-up. Weight criteria at 40% where the brief says so."),
  SECTION("Output contract", "A findings report."),
  SECTION("Guardrails", "Never invent figures. Uses `request-connector` when a source is not connected."),
  SECTION("Escalation", "Stop and ask when the data is missing."),
].join("\n");
const check = (body: string, fm: Partial<typeof FM> = {}) =>
  checkRoleCard({ body, frontmatter: { ...FM, ...fm }, knownSkills: KNOWN });
const rules = (v: Violation[]) => v.map((x) => x.rule);
```

Tests (one `it` each):
- `"a conformant card has no violations"`: `expect(check(VALID)).toEqual([])` (covers Review Focus 3 and 5: the 40% and `` `request-connector` `` lines).
- `"R1: missing section"`: drop the Scope section → `rules` contains `"R1"`.
- `"R1: sections out of order"`: swap Method and Scope → contains `"R1"`.
- `"R1: extra ## section"`: append `SECTION("Notes", "x")` → contains `"R1"`.
- `"R1: preamble before Identity"`: `"Intro.\n" + VALID` → contains `"R1"`.
- `"R1: ## inside a code fence is ignored"`: insert "```\n## Fake\n```" into the Method text → `toEqual([])`.
- `"R1: CRLF headings are recognised"`: `VALID.replace(/\n/g, "\r\n")` → `toEqual([])`.
- `"R2: empty section"`: Output contract text `"   "` → contains `"R2"`.
- `"R3: Identity over 60 words"`: Identity = `"You are the Data Scientist " + "word ".repeat(56)` (61 words) → contains `"R3"`; with `repeat(55)` (60 words) → not contains.
- `"R4: body over 600 words"`: append `"word ".repeat(600)` to Behaviours → contains `"R4"`.
- `"R5: core skill not bound"`: `skills: ["report-build"]` → contains `"R5"`.
- `"R6: mentions an unbound skill"`: add `` `bid-strategy` `` to Method → contains `"R6"`.
- `"R7: credential claims"`: Behaviours `"Brings 15 years of experience."` → contains `"R7"`; `"10+ years in the field"` → contains `"R7"`; `"Reviews a 5 years contract term."` → `toEqual([])`.
- `"R8: numeric benchmark"`: Guardrails `"Keep error ≤ 1%."` → contains `"R8"`; `"<5% deviation"` → contains `"R8"`.
- `"R9: shouty emphasis"`: Guardrails `"You MUST cite."` → contains `"R9"`; `"Must cite."` → `toEqual([])`.
- `"R10: persona name set"`: `persona_name: "Vera"` → contains `"R10"`; `persona_name: undefined` → contains `"R10"`.
- `"R11: Identity does not name the role"`: Identity `"You are Vera, a scientist."` → contains `"R11"`.
- `"formatViolations prints file, rule, message and fix"`: `formatViolations("a.md", [{ rule: "R5", message: "m", fix: "f" }])` → `"a.md: R5: m — f"`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/__tests__/framework.test.ts`
Expected: FAIL — cannot resolve `../framework.ts`.

- [ ] **Step 3: Implement `checkRoleCard` and `formatViolations` in `src/framework.ts`**

Import `AgentFrontmatter` from `../schema/agent.frontmatter.ts`. Split the body into lines (`/\r?\n/`), track fence state on lines starting with ```` ``` ````, collect `## ` headings and their section text. Each `fix` is one imperative sentence (e.g. R5: `add "agentic-operating" to skills`).

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run src/__tests__/framework.test.ts`
Expected: PASS, 18 tests.

- [ ] **Step 5: Mutation-prove each rule**

For each of R1–R11: comment out that rule's check, run the file, confirm at least one test fails, restore. Record the 11 results in the lane notes.

- [ ] **Step 6: Commit**

```bash
git add src/framework.ts src/__tests__/framework.test.ts
git commit -m "feat(framework): role-card checker R1–R11 (FGXT-<n>)"
```

---

### Task 2: `agentic-operating` skill

**Files:**
- Create: `skills/agentic-operating/SKILL.md`
- Test: `src/__tests__/framework-skills.test.ts`
- Modify: `src/__tests__/__fixtures__/skills.json` (refresh)

**Interfaces:**
- Consumes: `FRAMEWORK_CORE_SKILL` from Task 1.
- Produces: skill `agentic-operating` (Tasks 3–5 bind it).

Frontmatter (exact):
```yaml
name: agentic-operating
description: Use on any multi-step task — plans the work, verifies each result, gates side effects on approval, and proposes missing tools or skills instead of improvising.
tier: free
tools: []
directive: "Plan multi-step work before acting, verify each result against its source, and ask before any step that writes, sends, files or changes a connected system."
```

Body: one framing line, then five bold-lead paragraphs in the house style of `skills/workflow-authoring/SKILL.md`, with exactly these leads, content per the spec's "L1 — `agentic-operating` skill" section:
`**Plan, act, verify, report.**` · `**Gate side effects by risk.**` · `**Name a missing tool instead of improvising.**` · `**Propose a skill instead of editing yourself.**` · `**Tie every claim to its evidence.**`
The tool-gap paragraph names `request-connector` and says to return a written proposal (need, evidence, candidate connector, read/write scope, data touched, fallback) when it is not available.

- [ ] **Step 1: Write the failing tests** in `framework-skills.test.ts` (parse with `parseSkillFile` as `tender-role.test.ts` does):
  - `"agentic-operating parses, tier free, no tools"`: `name === FRAMEWORK_CORE_SKILL`, `tier === "free"`, `tools` equals `[]`.
  - `"agentic-operating directive is the spec's directive"`: equals the directive string above.
  - `"agentic-operating carries the five operating blocks"`: instructions contain each of the five bold leads.
  - `"agentic-operating names request-connector and a fallback proposal"`: contains `` `request-connector` `` and `"fallback"`.
  - `"agentic-operating has no shouty emphasis"`: not matching `/\b(MUST|NEVER|CRITICAL|IMPORTANT)\b/`.

- [ ] **Step 2: Run to verify fail** — `pnpm vitest run src/__tests__/framework-skills.test.ts` → FAIL, file not found.

- [ ] **Step 3: Write `skills/agentic-operating/SKILL.md`.**

- [ ] **Step 4: Run to verify pass** — same command → PASS, 5 tests.

- [ ] **Step 5: Refresh the skills fixture and dist**

Run: `pnpm build && cp dist/skills.json src/__tests__/__fixtures__/skills.json && git diff --stat -- src/__tests__/__fixtures__ dist`
Expected: only `skills.json` (fixture and dist) changed; diff adds exactly the `agentic-operating` object.

- [ ] **Step 6: Full suite** — `pnpm test && pnpm lint` → all pass.

- [ ] **Step 7: Commit**

```bash
git add skills/agentic-operating src/__tests__/framework-skills.test.ts src/__tests__/__fixtures__/skills.json dist
git commit -m "feat(skills): agentic-operating core skill (FGXT-<n>)"
```

---

### Task 3: Pilot — migrate `tender-bidding-manager`

**Files:**
- Modify: `agents/foresigxt/sales/tender-bidding-manager.md`
- Modify: `src/__tests__/tender-role.test.ts:68`
- Modify: `src/__tests__/__fixtures__/agents.json`, `src/__tests__/__fixtures__/v0.6.0-frontmatter-baseline.json` (entry `tender-bidding-manager` only)
- Test: `src/__tests__/framework-pilot.test.ts`

**Interfaces:**
- Consumes: `checkRoleCard`, `formatViolations` (Task 1); skill `agentic-operating` (Task 2).

Changes:
- Frontmatter: `persona_name: null`; `skills` becomes `[agentic-operating, tender-decomposition, bid-no-bid-assessment, bid-strategy, workflow-authoring, report-build, structured-comparison, source-vetting, workspace-filing]`. Nothing else in frontmatter changes.
- Body: restructure the current text into the seven sections. Identity opens `You are the Tender Bidding Manager on the Foresigxt team.` Current "core responsibilities" → Behaviours/Scope; "Method" → Method, naming the four tender skills by backtick; "Output contract" → Output contract; "Quality bar and guardrails" → Guardrails, with the ask-before-writing and only-the-person-decides lines → Escalation. Keep every guardrail; drop "Vera" everywhere.

- [ ] **Step 1: Write the failing tests**
  - `framework-pilot.test.ts` `"tender-bidding-manager is framework-conformant"`: parse the file with `parseAgentFile`, build `knownSkills` from `readdirSync("skills")`, `expect(formatViolations(ROLE, checkRoleCard(...))).toBe("")`.
  - `framework-pilot.test.ts` `"tender-bidding-manager has no persona name in its prompt"`: `system_prompt` does not contain `"Vera"`.
  - `tender-role.test.ts:68`: change to `expect(a.persona_name).toBeNull();`.

- [ ] **Step 2: Run to verify fail** — `pnpm vitest run src/__tests__/framework-pilot.test.ts src/__tests__/tender-role.test.ts` → FAIL (R1, R5, R10, R11 violations; persona `"Vera"`).

- [ ] **Step 3: Rewrite the role file** as specified above.

- [ ] **Step 4: Run to verify pass** — same command → PASS.

- [ ] **Step 5: Refresh agent fixture and baseline**

Run: `pnpm build && cp dist/agents.json src/__tests__/__fixtures__/agents.json`. In `v0.6.0-frontmatter-baseline.json`, edit only the `tender-bidding-manager` entry: `persona_name` → `null`, `skills` → the list above.
Check: `git diff -- src/__tests__/__fixtures__/agents.json` touches only the `tender-bidding-manager` object.

- [ ] **Step 6: Full suite** — `pnpm test && pnpm lint` → all pass.

- [ ] **Step 7: Commit**

```bash
git add agents/foresigxt/sales/tender-bidding-manager.md src/__tests__ dist
git commit -m "feat(agents): migrate tender-bidding-manager to the framework; drop persona name (FGXT-<n>)"
```

---

### Task 4: Build gate and legacy list

**Files:**
- Create: `catalog/framework-legacy.json`
- Modify: `src/build.ts` (after the agent merge loop, before the activation join, ~line 96)
- Modify: `src/__tests__/build.test.ts` (helper + new tests)
- Test: `src/__tests__/framework-legacy.test.ts`
- Modify: `README.md` (Authoring model: one bullet on the framework, the legacy list, and `pnpm build` failing on violations; point at the spec)

**Interfaces:**
- Consumes: `checkRoleCard`, `formatViolations` (Task 1).
- Produces (in `src/build.ts`):
  ```ts
  export interface LegacyEntry { id: string; status: "pending-migration" | "exempt"; reason: string }
  export function readFrameworkLegacy(root: string): Map<string, LegacyEntry>; // missing file → empty map
  ```
  `readFrameworkLegacy` throws on: an unknown `status`, a duplicate `id`, an empty `reason`.

`catalog/framework-legacy.json`: `chat-llm` with `status: "exempt"`, `reason: "Bare model passthrough; no role behaviour by design."`; and these 13 with `status: "pending-migration"`, `reason: "Pre-framework role."`: `assistant, competitive-analyst, content-producer, customer-success-op, data-report-analyst, executive-assistant, financial-reconciler, meeting-notetaker, recruiter, sales-researcher, social-media-manager, supply-chain-coordinator, support-triage`. Sorted by id.

Build behaviour: for every merged agent whose id is not in the legacy map, run `checkRoleCard` with `knownSkills = new Set(skillByName.keys())`. Collect all violations across all agents; if any, throw `new Error("framework conformance failed:\n" + lines.join("\n"))` where each line comes from `formatViolations(<agent's rel path>, …)`. Keep each agent's `rel` path alongside its artifact in `byId` for this.

- [ ] **Step 1: Write the failing tests**
  - `framework-legacy.test.ts`, with `const FROZEN_PENDING = [<the 13 ids above>]`:
    - `"pending ids are a subset of the frozen snapshot"` — every `pending-migration` id is in `FROZEN_PENDING`.
    - `"only chat-llm is exempt, with a reason"` — exempt ids equal `["chat-llm"]`; its reason is non-empty.
    - `"every listed id is an authored agent"` — each id appears in `buildArtifacts(repoRoot).agents`.
    - `"the pilot is not grandfathered"` — `tender-bidding-manager` not in the map.
  - `build.test.ts`: change the existing `agentMd` fixtures to also write `catalog/framework-legacy.json` listing every fixture agent id as `pending-migration` (add a `writeLegacy(ids: string[])` helper and call it in each existing test that writes agents). Add:
    - `"fails the build on a non-conformant role not in the legacy list"`: write the interview skill and `agentMd("y", "plain body")`, no legacy file → `expect(() => buildArtifacts(root)).toThrow(/framework conformance failed:[\s\S]*agents\/foresigxt\/sales\/y\.md: R1:/)`.
    - `"passes a legacy-listed role without checking it"`: same agent with `writeLegacy(["y"])` → does not throw.
    - `"rejects a legacy entry with an unknown status"`: legacy `[{ id: "y", status: "later", reason: "r" }]` → throws `/status/`.

- [ ] **Step 2: Run to verify fail** — `pnpm vitest run src/__tests__/framework-legacy.test.ts src/__tests__/build.test.ts` → FAIL (`readFrameworkLegacy` missing / no throw).

- [ ] **Step 3: Implement `readFrameworkLegacy` and the gate in `src/build.ts`; write `catalog/framework-legacy.json`.**

- [ ] **Step 4: Run to verify pass** — same command → PASS.

- [ ] **Step 5: Mutation-prove the gate** — remove `tender-bidding-manager`'s `agentic-operating` binding temporarily → `pnpm build` exits non-zero printing an `R5` line for `agents/foresigxt/sales/tender-bidding-manager.md`; restore. Add `"tender-bidding-manager"` to the legacy file temporarily → `"the pilot is not grandfathered"` fails; restore.

- [ ] **Step 6: Full suite** — `pnpm build && pnpm test && pnpm lint && git diff --exit-code -- dist` → all pass, dist unchanged.

- [ ] **Step 7: Commit**

```bash
git add catalog/framework-legacy.json src/build.ts src/__tests__ README.md
git commit -m "feat(build): enforce the agent framework; shrink-only legacy list (FGXT-<n>)"
```

---

### Task 5: `agent-architect` skill, bound to `assistant`

**Files:**
- Create: `skills/agent-architect/SKILL.md`
- Modify: `agents/foresigxt/general/assistant.md` (frontmatter `skills` only)
- Modify: `src/__tests__/framework-skills.test.ts`
- Modify: `src/__tests__/__fixtures__/agents.json`, `skills.json`, `v0.6.0-frontmatter-baseline.json` (entry `assistant` only)

**Interfaces:**
- Consumes: `checkRoleCard` (Task 1), `parseAgentFile` (`src/parse.ts`).

Frontmatter (exact):
```yaml
name: agent-architect
description: Use when someone wants a new agent or role created — interviews for the role and drafts it in the Foresigxt Agent Framework shape for review.
tier: pro
tools: []
directive: "When asked to create a new agent or role, interview for the role before drafting anything, and deliver it in the Foresigxt Agent Framework shape."
```

Body: the five steps from the spec's "L3 — `agent-architect` skill" section (Interview, Check fit, Map capabilities, Draft the role card, Self-check then deliver — both the app-web and the Claude Code delivery paths), the seven section names, the R1–R11 checklist in plain words, and exactly one worked example: a complete role file (frontmatter + body) for a "Data Scientist" role inside a single ```` ```markdown ```` fence. The example binds only skills that exist in `skills/`, has `persona_name: null`, and must pass the checker.

`assistant.md` skills become `[delegation-routing, research-sweep, agent-architect]`. Its body is unchanged (it stays legacy).

- [ ] **Step 1: Write the failing tests** (append to `framework-skills.test.ts`):
  - `"agent-architect parses with the spec's directive"`: tier `"pro"`, tools `[]`, directive equals the string above.
  - `"agent-architect names every role-card section"`: instructions contain each of `ROLE_CARD_SECTIONS` and `"agentic-operating"` and `"persona_name: null"`.
  - `"agent-architect's worked example passes the checker"`: extract the first ```` ```markdown ```` fence from instructions, `parseAgentFile("example.md", src)`, run `checkRoleCard` with the repo's skill names → `toEqual([])`.
  - `"agent-architect keeps new agents inactive"`: instructions contain `"catalog/activation.json"`.
  - `"assistant binds agent-architect"`: parsed `assistant.md` frontmatter `skills` contains `"agent-architect"`.

- [ ] **Step 2: Run to verify fail** — `pnpm vitest run src/__tests__/framework-skills.test.ts` → FAIL (new tests).

- [ ] **Step 3: Write the skill; update `assistant.md` frontmatter.**

- [ ] **Step 4: Run to verify pass** — same command → PASS, 10 tests.

- [ ] **Step 5: Refresh fixtures** — `pnpm build && cp dist/agents.json dist/skills.json src/__tests__/__fixtures__/`; in the baseline, edit only the `assistant` entry's `skills`. Check `git diff -- src/__tests__/__fixtures__/agents.json` touches only `assistant`.

- [ ] **Step 6: Final verification**

Run: `pnpm build && pnpm test && pnpm lint && git diff --exit-code -- dist`
Expected: build prints `Built 15 agents and 25 skills → dist/`; all tests pass; lint exit 0; dist clean.
Run: `git diff main --stat -- dist/agents.json` and confirm by inspection that only `assistant` and `tender-bidding-manager` objects differ from `main`.

- [ ] **Step 7: Commit**

```bash
git add skills/agent-architect agents/foresigxt/general/assistant.md src/__tests__ dist
git commit -m "feat(skills): agent-architect builder skill, bound to assistant (FGXT-<n>)"
```

### Task 6: Migrate the 13 legacy roles (operator decision, 2026-10-24)

**Files:**
- Modify: `agents/foresigxt/<division>/<id>.md` — 13 roles
- Modify: `catalog/framework-legacy.json` — shrinks to `chat-llm` alone
- Modify: `src/__tests__/framework-legacy.test.ts` — `FROZEN_PENDING` becomes `[]`
- Test: `src/__tests__/framework-migration.test.ts`
- Modify: `src/__tests__/__fixtures__/agents.json`, `v0.6.0-frontmatter-baseline.json`
  (`persona_name` and `skills` for the 14 changed agents only)

**Interfaces:** consumes `checkRoleCard` (Task 1). Produces the same published
contract with 14 migrated agents and no persona name anywhere.

- [ ] **Step 1: Write the failing test** in `src/__tests__/framework-migration.test.ts`:
  every authored agent except `chat-llm` passes `checkRoleCard` with zero
  violations; every such agent has `persona_name: null`; no `system_prompt`
  contains Atlas, Mira, Ozzy, Theo, Yuki or Vera; `catalog/framework-legacy.json`
  lists exactly `chat-llm` (exempt). Set `FROZEN_PENDING` in
  `framework-legacy.test.ts` to `[]`, so any pending entry fails the frozen
  snapshot test. Run it — FAIL.

- [ ] **Step 2: Migrate the 13 roles**, one commit per division. For each role:
  the seven sections in order; `Identity` opens "You are the `<label>` on the
  Foresigxt team" ("You are the Assistant…" for the supervisor, which keeps its
  first-point-of-contact role); `persona_name: null`; `agentic-operating`
  prepended to `skills`; the bound skills named by backtick in `Method`. Shape
  changes only — every responsibility, method step, output-contract deliverable
  and guardrail from `main` survives, moved into a section, not dropped. The
  assistant keeps its web-search-unavailable fallback and its citation rules.

- [ ] **Step 3: Shrink the legacy list** as the roles go: remove each migrated
  id from `catalog/framework-legacy.json`, so the list ends with `chat-llm`
  alone and the frozen snapshot forbids any new pending entry.

- [ ] **Step 4: Refresh the published artifacts** — `pnpm build`, copy
  `dist/agents.json` and `dist/skills.json` into the parity fixtures, and edit
  the `persona_name` and `skills` entries of the 14 changed agents in
  `v0.6.0-frontmatter-baseline.json`. `dist/agents.json` must differ from
  `main` in exactly those 14 agents, and `dist/skills.json` in exactly the two
  new skills.

- [ ] **Step 5: Mutation-prove** — put one persona name back on one role and one
  id back in the legacy list as pending; each must turn the new test red; then
  restore byte-identical.

- [ ] **Step 6: Record the per-role preservation table** in the lane notes:
  role → each guardrail and deliverable from `main` → the section it moved to.

**Acceptance:** `pnpm build && pnpm test && pnpm lint && git diff --exit-code -- dist`
green; no persona name survives in any prompt; the legacy list holds `chat-llm`
only. The coordinator holds landing until app-web acks — no push, PR or merge
from the lane.

