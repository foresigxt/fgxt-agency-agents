import { describe, it, expect } from "vitest";
import { agentFrontmatterSchema } from "../agent.frontmatter.ts";
import { skillFrontmatterSchema } from "../skill.frontmatter.ts";

describe("agent frontmatter", () => {
  it("accepts a valid agent and applies defaults", () => {
    const parsed = agentFrontmatterSchema.parse({
      id: "sales-researcher",
      name: "sales-researcher",
      label: "Sales Researcher",
      persona_name: "Mira",
      description: "Researches prospects.",
      division: "sales",
      model: "m",
      category: "sales",
    });
    expect(parsed.role).toBe("specialist");
    expect(parsed.tier).toBe("free");
    expect(parsed.skills).toEqual([]);
  });

  it("accepts explicit null persona_name and omits absent label", () => {
    const parsed = agentFrontmatterSchema.parse({
      id: "assistant",
      name: "Assistant",
      persona_name: null,
      description: "x",
      division: "general",
      model: "m",
      category: "personal_assistant",
    });
    expect(parsed.persona_name).toBeNull();
    expect("label" in parsed).toBe(false);
  });

  it("rejects a non-kebab-case id", () => {
    expect(() =>
      agentFrontmatterSchema.parse({
        id: "Sales_Researcher",
        name: "x",
        description: "x",
        division: "sales",
        model: "m",
        category: "sales",
      }),
    ).toThrow();
  });

  it("rejects unknown keys (strict)", () => {
    expect(() =>
      agentFrontmatterSchema.parse({
        id: "x",
        name: "x",
        description: "x",
        division: "d",
        model: "m",
        category: "c",
        system_prompt: "should not live in frontmatter",
      }),
    ).toThrow();
  });
});

describe("skill frontmatter", () => {
  it("accepts the interview shape", () => {
    expect(() =>
      skillFrontmatterSchema.parse({
        name: "interview",
        description: "x",
        tier: "pro",
        tools: ["ask-user"],
        directive: "d",
      }),
    ).not.toThrow();
  });
});
