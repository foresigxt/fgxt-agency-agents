import matter from "gray-matter";
import { agentFrontmatterSchema, type AgentFrontmatter } from "../schema/agent.frontmatter.ts";
import { skillFrontmatterSchema, type SkillFrontmatter } from "../schema/skill.frontmatter.ts";

export interface ParsedAgentFile {
  frontmatter: AgentFrontmatter;
  /** The markdown body, trimmed — becomes the artifact `system_prompt`. */
  system_prompt: string;
}

export interface ParsedSkillFile {
  frontmatter: SkillFrontmatter;
  /** The markdown body, trimmed — becomes the artifact `instructions`. */
  instructions: string;
}

/** Parse + validate a single agent markdown file. Throws (with the path) on bad frontmatter or empty body. */
export function parseAgentFile(path: string, source: string): ParsedAgentFile {
  const { data, content } = matter(source);
  const parsed = agentFrontmatterSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`${path}: invalid agent frontmatter: ${parsed.error.message}`);
  }
  const system_prompt = content.trim();
  if (!system_prompt) {
    throw new Error(`${path}: empty body (system_prompt is required)`);
  }
  return { frontmatter: parsed.data, system_prompt };
}

/** Parse + validate a single `SKILL.md` file. Throws (with the path) on bad frontmatter or empty body. */
export function parseSkillFile(path: string, source: string): ParsedSkillFile {
  const { data, content } = matter(source);
  const parsed = skillFrontmatterSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`${path}: invalid skill frontmatter: ${parsed.error.message}`);
  }
  const instructions = content.trim();
  if (!instructions) {
    throw new Error(`${path}: empty body (instructions are required)`);
  }
  return { frontmatter: parsed.data, instructions };
}
