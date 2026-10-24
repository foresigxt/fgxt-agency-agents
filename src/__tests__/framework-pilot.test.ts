import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseAgentFile } from "../parse.ts";
import { checkRoleCard, formatViolations } from "../framework.ts";

/**
 * FGXT-405 — the pilot role proves the framework end to end.
 *
 * `tender-bidding-manager` is the first role authored to the seven-section
 * card, so it is the role the build gate holds to the full check.
 */

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..");
const ROLE = "agents/foresigxt/sales/tender-bidding-manager.md";

const knownSkills = new Set(
  readdirSync(join(repoRoot, "skills")).filter((name) =>
    existsSync(join(repoRoot, "skills", name, "SKILL.md")),
  ),
);

function role() {
  return parseAgentFile(ROLE, readFileSync(join(repoRoot, ROLE), "utf8"));
}

describe("tender-bidding-manager pilot (FGXT-405)", () => {
  it("is framework-conformant", () => {
    const { frontmatter, system_prompt } = role();
    const violations = checkRoleCard({ body: system_prompt, frontmatter, knownSkills });
    expect(formatViolations(ROLE, violations)).toBe("");
  });

  it("has no persona name in its prompt", () => {
    expect(role().system_prompt).not.toContain("Vera");
  });
});
