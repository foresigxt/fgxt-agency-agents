import type { AgentFrontmatter } from "../schema/agent.frontmatter.ts";

/**
 * FGXT-405 — the Foresigxt Agent Framework role-card checker.
 *
 * A role card is the markdown body of `agents/foresigxt/<division>/<id>.md`.
 * The checker is pure: it takes one card plus the skills that exist in this
 * repo and returns the violations, so the build gate, the test suite and the
 * `agent-architect` skill all agree on one definition of "conformant".
 */

/** The `##` sections every conformant role card carries, in order. */
export const ROLE_CARD_SECTIONS = [
  "Identity",
  "Behaviours",
  "Scope",
  "Method",
  "Output contract",
  "Guardrails",
  "Escalation",
] as const;

/** The shared operating skill every conformant role binds. */
export const FRAMEWORK_CORE_SKILL = "agentic-operating";

/** Word budget for the Identity section. */
const IDENTITY_WORD_LIMIT = 60;
/** Word budget for the whole body. */
const BODY_WORD_LIMIT = 600;

export interface Violation {
  rule: `R${number}`;
  message: string;
  fix: string;
}

export interface RoleCardInput {
  body: string;
  frontmatter: Pick<AgentFrontmatter, "name" | "label" | "persona_name" | "skills">;
  /** The skill names that exist in this repo — a backticked token only counts when it names one of them. */
  knownSkills: ReadonlySet<string>;
}

interface CardSections {
  /** The `##` headings found outside code fences, in order. */
  headings: string[];
  /** The body text of each section, by heading. */
  text: Map<string, string>;
  /** Everything before the first `##` heading. */
  preamble: string;
}

/**
 * Split a card into its `##` sections.
 *
 * A `##` line inside a fenced code block is content, not a heading, and
 * `###` sub-headings are content too — only `## ` starts a section.
 */
function splitCard(body: string): CardSections {
  const headings: string[] = [];
  const text = new Map<string, string>();
  const preambleLines: string[] = [];
  let inFence = false;
  let current: string | null = null;
  let currentLines: string[] = [];

  for (const line of body.split(/\r?\n/)) {
    if (line.trimStart().startsWith("```")) inFence = !inFence;
    if (!inFence) {
      const heading = /^##\s+(.*)$/.exec(line)?.[1].trim();
      if (heading !== undefined) {
        if (current !== null) text.set(current, currentLines.join("\n"));
        current = heading;
        currentLines = [];
        headings.push(heading);
        continue;
      }
    }
    if (current === null) preambleLines.push(line);
    else currentLines.push(line);
  }
  if (current !== null) text.set(current, currentLines.join("\n"));

  return { headings, text, preamble: preambleLines.join("\n") };
}

/**
 * Count words the way the framework does: markdown markers (`#`, `*`, `` ` ``)
 * and bullet markers carry no words, everything else separated by whitespace
 * is one word.
 */
function wordCount(text: string): number {
  const cleaned = text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*-\s+/, ""))
    .join(" ")
    .replace(/[#*`]/g, "")
    .trim();
  return cleaned === "" ? 0 : cleaned.split(/\s+/).filter(Boolean).length;
}

/** R1 — the seven sections, exactly, in order, with nothing in front of Identity. */
function checkR1(sections: CardSections): Violation[] {
  const violations: Violation[] = [];
  const expected = ROLE_CARD_SECTIONS.join(", ");
  const found = sections.headings.join(", ");
  if (found !== expected) {
    violations.push({
      rule: "R1",
      message: `the card has ## sections [${found}] but must have exactly [${expected}] in order`,
      fix: `give the card exactly these ## sections, in order: ${expected}`,
    });
  }
  if (sections.preamble.trim() !== "") {
    violations.push({
      rule: "R1",
      message: "there is text before the ## Identity section",
      fix: "move the opening text into the Identity section",
    });
  }
  return violations;
}

/** R2 — every section says something. */
function checkR2(sections: CardSections): Violation[] {
  const violations: Violation[] = [];
  for (const heading of ROLE_CARD_SECTIONS) {
    if ((sections.text.get(heading) ?? "").trim() === "") {
      violations.push({
        rule: "R2",
        message: `the "${heading}" section is empty`,
        fix: `write what the role does in the "${heading}" section`,
      });
    }
  }
  return violations;
}

/** R3 — Identity is a short opening, not a biography. */
function checkR3(sections: CardSections): Violation[] {
  const words = wordCount(sections.text.get("Identity") ?? "");
  if (words > IDENTITY_WORD_LIMIT) {
    return [
      {
        rule: "R3",
        message: `the Identity section is ${words} words (limit ${IDENTITY_WORD_LIMIT})`,
        fix: `shorten the Identity section to ${IDENTITY_WORD_LIMIT} words or fewer`,
      },
    ];
  }
  return [];
}

/** R4 — the whole card stays inside the prompt budget. */
function checkR4(body: string): Violation[] {
  const words = wordCount(body);
  if (words > BODY_WORD_LIMIT) {
    return [
      {
        rule: "R4",
        message: `the body is ${words} words (limit ${BODY_WORD_LIMIT})`,
        fix: `shorten the body to ${BODY_WORD_LIMIT} words or fewer`,
      },
    ];
  }
  return [];
}

/** R5 — every conformant role binds the shared operating skill. */
function checkR5(frontmatter: RoleCardInput["frontmatter"]): Violation[] {
  if (frontmatter.skills.includes(FRAMEWORK_CORE_SKILL)) return [];
  return [
    {
      rule: "R5",
      message: `the core skill "${FRAMEWORK_CORE_SKILL}" is not bound`,
      fix: `add "${FRAMEWORK_CORE_SKILL}" to skills`,
    },
  ];
}

/** R6 — a skill the card points at is bound in the same card. */
function checkR6(input: RoleCardInput): Violation[] {
  const bound = new Set(input.frontmatter.skills);
  const mentioned = new Set<string>();
  for (const match of input.body.matchAll(/`([^`\n]+)`/g)) mentioned.add(match[1]);
  const violations: Violation[] = [];
  for (const token of mentioned) {
    if (input.knownSkills.has(token) && !bound.has(token)) {
      violations.push({
        rule: "R6",
        message: `the card mentions the skill "${token}" but does not bind it`,
        fix: `bind "${token}" in skills or drop the mention`,
      });
    }
  }
  return violations;
}

/** R7 — no credentials; describe the behaviour instead. */
const CREDENTIAL_CLAIM = /\b\d+\+?\s*years?\s+of\s+experience\b/i;
const TENURE_CLAIM = /\b\d+\+\s*years?\b/i;

function checkR7(body: string): Violation[] {
  const match = CREDENTIAL_CLAIM.exec(body) ?? TENURE_CLAIM.exec(body);
  if (!match) return [];
  return [
    {
      rule: "R7",
      message: `the card claims credentials ("${match[0]}")`,
      fix: "describe the observable behaviour instead of years of experience",
    },
  ];
}

/** R8 — no numeric quality benchmark a model cannot verify. */
const NUMERIC_BENCHMARK = /[≤≥<>]=?\s*\d+(\.\d+)?\s*%/;

function checkR8(body: string): Violation[] {
  const match = NUMERIC_BENCHMARK.exec(body);
  if (!match) return [];
  return [
    {
      rule: "R8",
      message: `the card states a numeric benchmark ("${match[0]}")`,
      fix: "state the quality bar as behaviour, not as a percentage threshold",
    },
  ];
}

/** R9 — no shouting; plain words carry the instruction. */
const SHOUTY_EMPHASIS = /\b(MUST|NEVER|CRITICAL|IMPORTANT)\b/;

function checkR9(body: string): Violation[] {
  const match = SHOUTY_EMPHASIS.exec(body);
  if (!match) return [];
  return [
    {
      rule: "R9",
      message: `the card uses all-caps emphasis ("${match[0]}")`,
      fix: "write the instruction in plain words",
    },
  ];
}

/** R10 — the role is named by its role, not by an authored persona name. */
function checkR10(frontmatter: RoleCardInput["frontmatter"]): Violation[] {
  if (frontmatter.persona_name === null) return [];
  return [
    {
      rule: "R10",
      message: `persona_name is ${JSON.stringify(frontmatter.persona_name ?? null)} instead of null`,
      fix: "set persona_name to null; the call name is assigned when the person installs the agent",
    },
  ];
}

/** R11 — the Identity section names the role the card is for. */
function checkR11(input: RoleCardInput, sections: CardSections): Violation[] {
  const role = input.frontmatter.label ?? input.frontmatter.name;
  if ((sections.text.get("Identity") ?? "").includes(role)) return [];
  return [
    {
      rule: "R11",
      message: `the Identity section does not name the role ("${role}")`,
      fix: `open the Identity section with the role, e.g. "You are the ${role} on the Foresigxt team"`,
    },
  ];
}

/**
 * Check one role card against the framework.
 *
 * When R1 fails the sections cannot be trusted, so R2, R3 and R11 are skipped;
 * every other rule still runs.
 */
export function checkRoleCard(input: RoleCardInput): Violation[] {
  const sections = splitCard(input.body);
  const r1 = checkR1(sections);
  const violations: Violation[] = [...r1];
  if (r1.length === 0) {
    violations.push(...checkR2(sections));
    violations.push(...checkR3(sections));
  }
  violations.push(...checkR4(input.body));
  violations.push(...checkR5(input.frontmatter));
  violations.push(...checkR6(input));
  violations.push(...checkR7(input.body));
  violations.push(...checkR8(input.body));
  violations.push(...checkR9(input.body));
  violations.push(...checkR10(input.frontmatter));
  if (r1.length === 0) {
    violations.push(...checkR11(input, sections));
  }
  return violations;
}

/** One line per violation: `<file>: <rule>: <message> — <fix>`. */
export function formatViolations(file: string, violations: Violation[]): string {
  return violations.map((v) => `${file}: ${v.rule}: ${v.message} — ${v.fix}`).join("\n");
}
