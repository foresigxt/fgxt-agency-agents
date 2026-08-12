import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildArtifacts } from "../build.ts";
import { agencyArtifactsSchema } from "../../schema/contract.ts";
import type { AgencyAgentArtifact } from "../../schema/contract.ts";

/**
 * THE PARITY GATE.
 *
 * The build output MUST reproduce the Plan B fixture oracle exactly — a
 * downstream "swap fixture → package" step depends on byte-equality. Fixtures
 * are vendored copies of
 * `fgxt-app-web/services/foresigxt/src/agency/__fixtures__/{agents,skills}.json`.
 */
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..");
const fixturesDir = join(here, "__fixtures__");

const fixtureAgents = JSON.parse(
  readFileSync(join(fixturesDir, "agents.json"), "utf8"),
) as AgencyAgentArtifact[];
const fixtureSkills = JSON.parse(readFileSync(join(fixturesDir, "skills.json"), "utf8"));

// Normalize through JSON so the comparison sees exactly the on-disk artifact
// (drops `undefined` keys; preserves explicit `null` — e.g. persona_name).
const raw = buildArtifacts(repoRoot);
const built = JSON.parse(JSON.stringify(raw)) as {
  agents: AgencyAgentArtifact[];
  skills: unknown[];
};

describe("parity: build output matches the Plan B fixture oracle", () => {
  it("validates against the consumer contract schema", () => {
    expect(() => agencyArtifactsSchema.parse(built)).not.toThrow();
  });

  it("emits exactly the 14 fixture agent ids (order-insensitive)", () => {
    expect(built.agents.map((a) => a.id).sort()).toEqual(
      fixtureAgents.map((a) => a.id).sort(),
    );
  });

  it.each(fixtureAgents.map((a) => a.id))(
    "agent %s matches the fixture field-for-field (incl. label presence, persona_name null, system_prompt)",
    (id) => {
      const got = built.agents.find((a) => a.id === id);
      const want = fixtureAgents.find((a) => a.id === id);
      expect(got).toEqual(want);
      // Explicit presence guards (toEqual already enforces these, but make the
      // intent unmissable):
      expect(Object.prototype.hasOwnProperty.call(got, "label")).toBe(
        Object.prototype.hasOwnProperty.call(want, "label"),
      );
      expect(got?.persona_name).toStrictEqual(want?.persona_name);
      expect(got?.active).toBe(true);
    },
  );

  it("skills round-trip exactly (empty in v0.3.0)", () => {
    expect(built.skills).toEqual(fixtureSkills);
  });
});
