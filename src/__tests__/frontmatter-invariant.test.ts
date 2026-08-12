import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildArtifacts } from "../build.ts";
import type { AgencyAgentArtifact } from "../../schema/contract.ts";

/**
 * FRONTMATTER-INVARIANT GUARD.
 *
 * Freezes every non-body frontmatter field (everything except `system_prompt`,
 * `conversation_starters`, and `active`) at its v0.1.0 value. Later tasks in
 * this plan rewrite agent system prompts only — this test fails loudly if a
 * prompt edit accidentally drifts a model ref, tier, persona, or any other
 * frontmatter field.
 */
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..");

const baseline = JSON.parse(
  readFileSync(join(here, "__fixtures__/v0.1.0-frontmatter-baseline.json"), "utf8"),
) as Record<string, Record<string, unknown>>;

describe("frontmatter invariant: non-body fields frozen at v0.1.0", () => {
  it("every agent's frontmatter (minus body + starters) is byte-identical to v0.1.0", () => {
    const { agents } = buildArtifacts(repoRoot);
    const strip = ({
      system_prompt: _system_prompt,
      conversation_starters: _conversation_starters,
      active: _active,
      ...rest
    }: AgencyAgentArtifact) => rest;
    const current = Object.fromEntries(agents.map((a) => [a.id, strip(a)]));
    expect(Object.keys(current).sort()).toEqual(Object.keys(baseline).sort());
    for (const id of Object.keys(baseline)) {
      expect(current[id], `frontmatter drift on "${id}"`).toEqual(baseline[id]);
    }
  });
});
