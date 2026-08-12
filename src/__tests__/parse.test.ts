import { describe, it, expect } from "vitest";
import { parseAgentFile, parseSkillFile } from "../parse.ts";

const agentMd = `---
id: sales-researcher
name: sales-researcher
label: Sales Researcher
persona_name: Mira
description: Researches prospects.
division: sales
role: specialist
tier: free
model: cloudflare-ai-gateway/google-ai-studio/gemini-flash-latest
temperature: 0.4
maxTokens: 2048
skills:
  - interview
callable_agent_ids: []
category: sales
visibility: system
---

You are a Sales Researcher.

Format outputs as concise, actionable briefs.`;

describe("parseAgentFile", () => {
  it("splits frontmatter and body (system_prompt), preserving internal blank lines", () => {
    const r = parseAgentFile("agents/foresigxt/sales/sales-researcher.md", agentMd);
    expect(r.frontmatter.id).toBe("sales-researcher");
    expect(r.frontmatter.persona_name).toBe("Mira");
    expect(r.system_prompt).toBe(
      "You are a Sales Researcher.\n\nFormat outputs as concise, actionable briefs.",
    );
  });

  it("throws with the path on empty body", () => {
    const noBody = agentMd.split("\n\n")[0];
    expect(() => parseAgentFile("x/y.md", noBody)).toThrow(/x\/y\.md/);
  });
});

describe("parseSkillFile", () => {
  it("splits frontmatter and body (instructions)", () => {
    const skillMd = `---
name: interview
description: Ask before acting.
tier: pro
tools:
  - ask-user
directive: Ask up to 4 questions.
---

Call the ask-user tool.`;
    const r = parseSkillFile("skills/interview/SKILL.md", skillMd);
    expect(r.frontmatter.name).toBe("interview");
    expect(r.frontmatter.tools).toEqual(["ask-user"]);
    expect(r.instructions).toBe("Call the ask-user tool.");
  });
});
