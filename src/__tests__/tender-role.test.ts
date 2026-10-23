import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseSkillFile } from "../parse.ts";
import { skillFrontmatterSchema } from "../../schema/skill.frontmatter.ts";

/**
 * FGXT-388: Tender Bidding Manager role and its skills.
 *
 * This repo has no tool-id registry. The authoritative check is app-web's
 * `services/foresigxt/scripts/tool-id-gate.mjs`, run during the catalog
 * regeneration in FGXT-389. The "tool ids already used by shipped skills"
 * test below is the early, local proxy for it — deliberately not a copy of
 * app-web's id list, which would drift.
 */
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..");

const NEW = ["tender-decomposition", "bid-no-bid-assessment", "bid-strategy", "workflow-authoring"];

function parseSkill(name: string) {
  const rel = `skills/${name}/SKILL.md`;
  return parseSkillFile(rel, readFileSync(join(repoRoot, rel), "utf8"));
}

function existingSkills() {
  return readdirSync(join(repoRoot, "skills"))
    .filter((n) => !NEW.includes(n) && existsSync(join(repoRoot, "skills", n, "SKILL.md")))
    .map(parseSkill);
}

describe("tender skills (FGXT-388)", () => {
  it.each(NEW)("%s parses against skillFrontmatterSchema with a non-empty body", (n) => {
    const { frontmatter, instructions } = parseSkill(n);
    expect(skillFrontmatterSchema.parse(frontmatter).name).toBe(n);
    expect(instructions.trim().length).toBeGreaterThan(200);
  });

  it.each(NEW)("%s has a directive that does not restate its description", (n) => {
    const { frontmatter } = parseSkill(n);
    expect(frontmatter.directive, `${n} has no directive`).toBeTruthy();
    expect(frontmatter.directive).not.toBe(frontmatter.description);
  });

  it("new skills only use tool ids already used by shipped skills", () => {
    const shipped = new Set(existingSkills().flatMap((s) => s.frontmatter.tools));
    for (const n of NEW) {
      for (const t of parseSkill(n).frontmatter.tools) {
        expect(shipped, `${n} uses unshipped tool id "${t}"`).toContain(t);
      }
    }
  });

  it("workflow-authoring declares no tools (workflow tools arrive in FGXT-368)", () => {
    expect(parseSkill("workflow-authoring").frontmatter.tools).toEqual([]);
  });
});
