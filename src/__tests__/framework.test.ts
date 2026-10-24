import { describe, it, expect } from "vitest";
import { checkRoleCard, formatViolations, type Violation } from "../framework.ts";

/**
 * FGXT-405 — the Foresigxt Agent Framework role-card checker.
 *
 * One conformant card, one violating card per rule R1–R11. Each rule is
 * mutation-proven: disable its check, see the matching test go red.
 */

interface Fm {
  name: string;
  label: string;
  persona_name: string | null | undefined;
  skills: string[];
}

const FM: Fm = {
  name: "data-scientist",
  label: "Data Scientist",
  persona_name: null,
  skills: ["agentic-operating", "report-build"],
};
const KNOWN = new Set(["agentic-operating", "report-build", "bid-strategy"]);

const SECTION = (h: string, text: string) => `## ${h}\n${text}\n`;

type Pair = [string, string];
const SECTIONS: Pair[] = [
  ["Identity", "You are the Data Scientist on the Foresigxt team. You turn data into decisions people can defend."],
  ["Behaviours", "- Confirms the question and the data source first.\n### Habits\n- Shows the method."],
  ["Scope", "In: analysis. Out: data engineering, which goes to the person."],
  ["Method", "Use `report-build` for the write-up. Weight criteria at 40% where the brief says so."],
  ["Output contract", "A findings report."],
  ["Guardrails", "Never invent figures. Uses `request-connector` when a source is not connected."],
  ["Escalation", "Stop and ask when the data is missing."],
];

const card = (sections: Pair[] = SECTIONS) => sections.map(([h, t]) => SECTION(h, t)).join("\n");
const VALID = card();

/** A card with one section's text replaced. */
const withSection = (heading: string, text: string): string =>
  card(SECTIONS.map(([h, t]) => (h === heading ? ([h, text] as Pair) : ([h, t] as Pair))));

const check = (body: string, fm: Partial<Fm> = {}) =>
  checkRoleCard({ body, frontmatter: { ...FM, ...fm }, knownSkills: KNOWN });
const rules = (v: Violation[]) => v.map((x) => x.rule);

describe("role-card checker", () => {
  it("a conformant card has no violations", () => {
    expect(check(VALID)).toEqual([]);
  });

  it("R1: missing section", () => {
    const body = card(SECTIONS.filter(([h]) => h !== "Scope"));
    expect(rules(check(body))).toContain("R1");
  });

  it("R1: sections out of order", () => {
    const swapped = [...SECTIONS];
    [swapped[2], swapped[3]] = [swapped[3], swapped[2]];
    expect(rules(check(card(swapped)))).toContain("R1");
  });

  it("R1: extra ## section", () => {
    const body = card([...SECTIONS, ["Notes", "x"]]);
    expect(rules(check(body))).toContain("R1");
  });

  it("R1: preamble before Identity", () => {
    expect(rules(check("Intro.\n" + VALID))).toContain("R1");
  });

  it("R1: ## inside a code fence is ignored", () => {
    const body = withSection("Method", "Use `report-build` for the write-up.\n```\n## Fake\n```");
    expect(check(body)).toEqual([]);
  });

  it("R1: CRLF headings are recognised", () => {
    expect(check(VALID.replace(/\n/g, "\r\n"))).toEqual([]);
  });

  it("R2: empty section", () => {
    expect(rules(check(withSection("Output contract", "   ")))).toContain("R2");
  });

  it("R3: Identity over 60 words", () => {
    const over = withSection("Identity", "You are the Data Scientist " + "word ".repeat(56));
    expect(rules(check(over))).toContain("R3");
    const at = withSection("Identity", "You are the Data Scientist " + "word ".repeat(55));
    expect(rules(check(at))).not.toContain("R3");
  });

  it("R4: body over 600 words", () => {
    const body = withSection("Behaviours", "Shows the method. " + "word ".repeat(600));
    expect(rules(check(body))).toContain("R4");
  });

  it("R5: core skill not bound", () => {
    expect(rules(check(VALID, { skills: ["report-build"] }))).toContain("R5");
  });

  it("R6: mentions an unbound skill", () => {
    const body = withSection("Method", "Use `report-build` and `bid-strategy` for the write-up.");
    expect(rules(check(body))).toContain("R6");
  });

  it("R7: credential claims", () => {
    expect(rules(check(withSection("Behaviours", "Brings 15 years of experience.")))).toContain("R7");
    expect(rules(check(withSection("Behaviours", "10+ years in the field.")))).toContain("R7");
    expect(check(withSection("Behaviours", "Reviews a 5 years contract term."))).toEqual([]);
  });

  it("R8: numeric benchmark", () => {
    expect(rules(check(withSection("Guardrails", "Keep error ≤ 1%.")))).toContain("R8");
    expect(rules(check(withSection("Guardrails", "Keep <5% deviation.")))).toContain("R8");
  });

  it("R9: shouty emphasis", () => {
    expect(rules(check(withSection("Guardrails", "You MUST cite.")))).toContain("R9");
    expect(check(withSection("Guardrails", "Must cite."))).toEqual([]);
  });

  it("R10: persona name set", () => {
    expect(rules(check(VALID, { persona_name: "Vera" }))).toContain("R10");
    expect(rules(check(VALID, { persona_name: undefined }))).toContain("R10");
  });

  it("R11: Identity does not name the role", () => {
    expect(rules(check(withSection("Identity", "You are Vera, a scientist.")))).toContain("R11");
  });
});

describe("formatViolations", () => {
  it("prints file, rule, message and fix", () => {
    expect(formatViolations("a.md", [{ rule: "R5", message: "m", fix: "f" }])).toBe("a.md: R5: m — f");
  });
});
