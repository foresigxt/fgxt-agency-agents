import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseSkillFile } from "../parse.ts";
import { FRAMEWORK_CORE_SKILL } from "../framework.ts";

/**
 * FGXT-405 — the two skills the Agent Framework adds: the shared operating
 * core every conformant role binds, and the role-drafting skill bound to the
 * assistant.
 */

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..");

const OPERATING_DIRECTIVE =
  "Plan multi-step work before acting, verify each result against its source, and ask before any step that writes, sends, files or changes a connected system.";

const OPERATING_LEADS = [
  "**Plan, act, verify, report.**",
  "**Gate side effects by risk.**",
  "**Name a missing tool instead of improvising.**",
  "**Propose a skill instead of editing yourself.**",
  "**Tie every claim to its evidence.**",
];

function skillPath(name: string): string {
  return `skills/${name}/SKILL.md`;
}

function skillSource(name: string): string {
  return readFileSync(join(repoRoot, skillPath(name)), "utf8");
}

function parseSkill(name: string) {
  return parseSkillFile(skillPath(name), skillSource(name));
}

describe("agentic-operating (FGXT-405)", () => {
  it("parses, tier free, no tools", () => {
    const { frontmatter } = parseSkill(FRAMEWORK_CORE_SKILL);
    expect(frontmatter.name).toBe(FRAMEWORK_CORE_SKILL);
    expect(frontmatter.tier).toBe("free");
    expect(frontmatter.tools).toEqual([]);
  });

  it("directive is the spec's directive", () => {
    expect(parseSkill(FRAMEWORK_CORE_SKILL).frontmatter.directive).toBe(OPERATING_DIRECTIVE);
  });

  it("carries the five operating blocks", () => {
    const { instructions } = parseSkill(FRAMEWORK_CORE_SKILL);
    for (const lead of OPERATING_LEADS) {
      expect(instructions, `missing block: ${lead}`).toContain(lead);
    }
  });

  it("names request-connector and a fallback proposal", () => {
    const { instructions } = parseSkill(FRAMEWORK_CORE_SKILL);
    expect(instructions).toContain("`request-connector`");
    expect(instructions).toContain("fallback");
  });

  it("has no shouty emphasis", () => {
    expect(skillSource(FRAMEWORK_CORE_SKILL)).not.toMatch(/\b(MUST|NEVER|CRITICAL|IMPORTANT)\b/);
  });
});
