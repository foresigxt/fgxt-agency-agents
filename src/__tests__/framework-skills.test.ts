import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseAgentFile, parseSkillFile } from "../parse.ts";
import { checkRoleCard, formatViolations, FRAMEWORK_CORE_SKILL, ROLE_CARD_SECTIONS } from "../framework.ts";

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

const ARCHITECT_DIRECTIVE =
  "When asked to create a new agent or role, interview for the role before drafting anything, and deliver it in the Foresigxt Agent Framework shape.";

const ASSISTANT = "agents/foresigxt/general/assistant.md";

const knownSkills = new Set(
  readdirSync(join(repoRoot, "skills")).filter((name) =>
    existsSync(join(repoRoot, "skills", name, "SKILL.md")),
  ),
);

describe("agent-architect (FGXT-405)", () => {
  it("parses with the spec's directive", () => {
    const { frontmatter } = parseSkill("agent-architect");
    expect(frontmatter.name).toBe("agent-architect");
    expect(frontmatter.tier).toBe("pro");
    expect(frontmatter.tools).toEqual([]);
    expect(frontmatter.directive).toBe(ARCHITECT_DIRECTIVE);
  });

  it("names every role-card section", () => {
    const { instructions } = parseSkill("agent-architect");
    for (const section of ROLE_CARD_SECTIONS) {
      expect(instructions, `missing role-card section: ${section}`).toContain(section);
    }
    expect(instructions).toContain("agentic-operating");
    expect(instructions).toContain("persona_name: null");
  });

  it("worked example passes the checker", () => {
    const { instructions } = parseSkill("agent-architect");
    const example = /```markdown\n([\s\S]*?)```/.exec(instructions)?.[1];
    expect(example, "the skill carries no ```markdown fence").toBeTruthy();
    const { frontmatter, system_prompt } = parseAgentFile("example.md", example ?? "");
    expect(formatViolations("example.md", checkRoleCard({ body: system_prompt, frontmatter, knownSkills }))).toBe("");
  });

  it("worked example starts no sentence with a lowercase 'never'", () => {
    const { instructions } = parseSkill("agent-architect");
    const example = /```markdown\n([\s\S]*?)```/.exec(instructions)?.[1] ?? "";
    expect(example).not.toMatch(/(^|\n)\s*-?\s*never\b/);
  });

  it("keeps new agents inactive", () => {
    expect(parseSkill("agent-architect").instructions).toContain("catalog/activation.json");
  });

  it("assistant binds agent-architect", () => {
    const { frontmatter } = parseAgentFile(ASSISTANT, readFileSync(join(repoRoot, ASSISTANT), "utf8"));
    expect(frontmatter.skills).toContain("agent-architect");
  });
});
