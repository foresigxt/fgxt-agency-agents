import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { buildArtifacts } from "../build.ts";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "agency-build-"));
});
afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

function write(relPath: string, contents: string): void {
  const abs = join(root, relPath);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, contents);
}

const INTERVIEW_SKILL = `---
name: interview
description: Ask before acting.
tier: pro
tools:
  - ask-user
---

Call the ask-user tool.`;

function agentMd(id: string, body: string, extra = ""): string {
  return `---
id: ${id}
name: ${id}
persona_name: null
description: desc
division: sales
role: specialist
tier: free
model: m
category: sales
visibility: system
skills:
  - interview
callable_agent_ids: []
${extra}---

${body}`;
}

describe("buildArtifacts", () => {
  it("merges a duplicate id across trees: foresigxt wins, active from activation.json", () => {
    write("skills/interview/SKILL.md", INTERVIEW_SKILL);
    write("agents/foresigxt/sales/x.md", agentMd("x", "FORESIGXT"));
    write("agents/upstream/sales/x.md", agentMd("x", "UPSTREAM"));
    write("catalog/activation.json", '["x"]');

    const { agents } = buildArtifacts(root);
    const x = agents.filter((a) => a.id === "x");
    expect(x).toHaveLength(1);
    expect(x[0].system_prompt).toBe("FORESIGXT");
    expect(x[0].active).toBe(true);
  });

  it("marks unlisted ids inactive", () => {
    write("skills/interview/SKILL.md", INTERVIEW_SKILL);
    write("agents/foresigxt/sales/x.md", agentMd("x", "BODY"));
    write("catalog/activation.json", "[]");
    const { agents } = buildArtifacts(root);
    expect(agents[0].active).toBe(false);
  });

  it("hard-fails on two upstream files with the same id", () => {
    write("skills/interview/SKILL.md", INTERVIEW_SKILL);
    write("agents/upstream/a/x.md", agentMd("x", "A"));
    write("agents/upstream/b/x.md", agentMd("x", "B"));
    expect(() => buildArtifacts(root)).toThrow(/collision.*x/i);
  });

  it("hard-fails when an agent lists an unknown skill", () => {
    write(
      "agents/foresigxt/sales/x.md",
      agentMd("x", "BODY").replace("  - interview", "  - ghost"),
    );
    write("catalog/activation.json", '["x"]');
    expect(() => buildArtifacts(root)).toThrow(/ghost/);
  });

  it("hard-fails on a callable_agent_ids referencing an unknown id", () => {
    write("skills/interview/SKILL.md", INTERVIEW_SKILL);
    write(
      "agents/foresigxt/sales/x.md",
      agentMd("x", "BODY", "").replace("callable_agent_ids: []", "callable_agent_ids:\n  - ghost-agent\n"),
    );
    write("catalog/activation.json", '["x"]');
    expect(() => buildArtifacts(root)).toThrow(/ghost-agent/);
  });

  it("allows web-search as a known external callable agent", () => {
    write("skills/interview/SKILL.md", INTERVIEW_SKILL);
    write(
      "agents/foresigxt/general/assistant.md",
      agentMd("assistant", "BODY").replace(
        "callable_agent_ids: []",
        "callable_agent_ids:\n  - web-search\n",
      ),
    );
    write("catalog/activation.json", '["assistant"]');
    expect(() => buildArtifacts(root)).not.toThrow();
  });
});
