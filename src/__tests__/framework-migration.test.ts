import { describe, it, expect } from "vitest";
import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildArtifacts, readFrameworkLegacy } from "../build.ts";
import { checkRoleCard, formatViolations } from "../framework.ts";

/**
 * FGXT-405 — the total migration (operator decision, 2026-10-24).
 *
 * Every authored role except `chat-llm` is a framework role: it passes the
 * checker, it carries no authored persona name, and no prompt mentions one.
 * The legacy list is `chat-llm` alone.
 */

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..");

/** A bare model passthrough — no role behaviour by design, so it is exempt. */
const EXEMPT = "chat-llm";

/** The call names the total migration drops from every role. */
const PERSONA_NAMES = ["Atlas", "Mira", "Ozzy", "Theo", "Yuki", "Vera"];

const knownSkills = new Set(
  readdirSync(join(repoRoot, "skills")).filter((name) =>
    existsSync(join(repoRoot, "skills", name, "SKILL.md")),
  ),
);

/** The authored roles, minus the exempt one. */
function migratedRoles() {
  const { agents } = buildArtifacts(repoRoot);
  return agents.filter((agent) => agent.id !== EXEMPT);
}

describe("total migration (FGXT-405)", () => {
  it("every authored role except chat-llm passes the framework", () => {
    for (const agent of migratedRoles()) {
      const violations = checkRoleCard({
        body: agent.system_prompt,
        frontmatter: agent,
        knownSkills,
      });
      expect(formatViolations(agent.id, violations), agent.id).toBe("");
    }
  });

  it("every migrated role has no authored persona name", () => {
    for (const agent of migratedRoles()) {
      expect(agent.persona_name, `${agent.id} still carries a persona name`).toBeNull();
    }
  });

  it("no role prompt mentions a persona name", () => {
    for (const agent of migratedRoles()) {
      for (const name of PERSONA_NAMES) {
        expect(agent.system_prompt, `${agent.id} mentions "${name}"`).not.toContain(name);
      }
    }
  });

  it("the legacy list is chat-llm alone", () => {
    const legacy = readFrameworkLegacy(repoRoot);
    expect([...legacy.keys()]).toEqual([EXEMPT]);
    expect(legacy.get(EXEMPT)?.status).toBe("exempt");
  });
});
