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
 * `conversation_starters`, and `active`) at its v0.6.0 catalog-release value.
 * v0.6.0 dropped every authored persona name and settled one naming rule
 * (`name` is the id slug, `label` is the display name) on top of the v0.4.0
 * move that bound skills and pool-routed roles via `modelPolicy.class` rather
 * than pinning a model — the baseline below reflects that release. This test
 * fails loudly if a later prompt edit accidentally drifts a model ref, tier,
 * persona, or any other frontmatter field.
 *
 * The baseline file is named for the release it freezes, so its path is built
 * from `package.json` `version` rather than hard-coded — one version bump and
 * one fixture rename move both together (see `release-version.test.ts`, which
 * requires that fixture to exist under exactly this name).
 */
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..");

const pkg = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")) as {
  version: string;
};

const baseline = JSON.parse(
  readFileSync(join(here, "__fixtures__", `v${pkg.version}-frontmatter-baseline.json`), "utf8"),
) as Record<string, Record<string, unknown>>;

describe(`frontmatter invariant: non-body fields frozen at v${pkg.version}`, () => {
  it(`every agent's frontmatter (minus body + starters) is byte-identical to v${pkg.version}`, () => {
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

  it("v0.4.0 invariant: no agent pins a model or maxTokens", () => {
    const { agents } = buildArtifacts(repoRoot);
    for (const a of agents) {
      expect(a.model, `${a.id} still pins a model`).toBeUndefined();
      expect(a.maxTokens, `${a.id} still pins maxTokens`).toBeUndefined();
    }
  });

  it("v0.4.0 invariant: every non-internal agent binds at least one skill", () => {
    const { agents } = buildArtifacts(repoRoot);
    for (const a of agents.filter((x) => x.id !== "chat-llm")) {
      expect((a.skills ?? []).length, `${a.id} binds no skills`).toBeGreaterThan(0);
    }
  });
});
