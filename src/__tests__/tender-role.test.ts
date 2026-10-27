import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseAgentFile, parseSkillFile } from "../parse.ts";
import { agentFrontmatterSchema } from "../../schema/agent.frontmatter.ts";
import { skillFrontmatterSchema } from "../../schema/skill.frontmatter.ts";

/**
 * FGXT-388: Tender Bidding Manager role and its skills.
 *
 * This repo has no tool-id registry. The authoritative check is app-web's
 * `services/foresigxt/scripts/tool-id-gate.mjs`, run during the catalog
 * regeneration in FGXT-389. The "tool ids already used by shipped skills"
 * test below is the early, local proxy for it — deliberately not a copy of
 * app-web's id list, which would drift. Workflow-authoring is checked against
 * the six app-web tool ids added by FGXT-441 instead of that older proxy.
 */
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..");

const NEW = ["tender-decomposition", "bid-no-bid-assessment", "bid-strategy"];
const WORKFLOW_SKILL = "workflow-authoring";

function parseSkill(name: string) {
  const rel = `skills/${name}/SKILL.md`;
  return parseSkillFile(rel, readFileSync(join(repoRoot, rel), "utf8"));
}

function existingSkills() {
  return readdirSync(join(repoRoot, "skills"))
    .filter(
      (n) =>
        !NEW.includes(n) &&
        n !== WORKFLOW_SKILL &&
        existsSync(join(repoRoot, "skills", n, "SKILL.md")),
    )
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

  it("workflow-authoring declares the workflow tool ids in their documented order", () => {
    expect(parseSkill(WORKFLOW_SKILL).frontmatter.tools).toEqual([
      "workflow-draft",
      "workflow-update",
      "workflow-validate",
      "workflow-list",
      "workflow-runs",
      "workflow-run",
    ]);
  });

  it("workflow-authoring describes the available workflow lifecycle and fallbacks", () => {
    const { instructions } = parseSkill(WORKFLOW_SKILL);
    for (const tool of [
      "workflow-list",
      "workflow-draft",
      "workflow-update",
      "workflow-validate",
      "workflow-runs",
      "workflow-run",
    ]) {
      expect(instructions, `missing workflow tool: ${tool}`).toContain(`\`${tool}\``);
    }
    expect(instructions).toContain("upgrade_required");
    expect(instructions).toContain("Pro or Bundle");
    expect(instructions).toContain("conversation's toolset");
    expect(instructions).toContain("cannot be saved or run from this");
    expect(instructions).toContain("conversation");
  });

  it("workflow-authoring gates a run without duplicating a platform confirmation", () => {
    const { instructions } = parseSkill(WORKFLOW_SKILL);
    expect(instructions).toContain("show the step summary and get");
    expect(instructions).toContain("the person's yes first");
    expect(instructions).toContain("unless the platform presents its own confirmation");
    expect(instructions).toContain("do not also ask in prose");
  });
});

const ROLE = "agents/foresigxt/sales/tender-bidding-manager.md";

describe("tender-bidding-manager role (FGXT-388)", () => {
  it("tender-bidding-manager parses, binds only existing skills, and has no callable agents", () => {
    const { frontmatter } = parseAgentFile(ROLE, readFileSync(join(repoRoot, ROLE), "utf8"));
    const a = agentFrontmatterSchema.parse(frontmatter);
    expect(a.id).toBe("tender-bidding-manager");
    expect(a.persona_name).toBeNull();
    expect(a.division).toBe("sales");
    expect(a.tier).toBe("pro");
    expect(a.model).toBeUndefined();
    expect(a.callable_agent_ids).toEqual([]);
    for (const n of NEW) expect(a.skills).toContain(n);
    for (const s of a.skills) expect(existsSync(join(repoRoot, `skills/${s}/SKILL.md`))).toBe(true);
    expect(a.conversation_starters).toHaveLength(3);
  });

  it("IS activated (FGXT-389, 0.7.0)", () => {
    // The role shipped in 0.6.0 as an UNACTIVATED pilot and 0.7.0 activates
    // it — this assertion is the pin for that.
    const activation = JSON.parse(
      readFileSync(join(repoRoot, "catalog/activation.json"), "utf8"),
    ) as string[];
    expect(activation).toContain("tender-bidding-manager");
  });
});
