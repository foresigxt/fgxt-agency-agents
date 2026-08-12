import { z } from "zod";

/**
 * Skill frontmatter schema (Claude-Code-compatible `SKILL.md`).
 *
 * Frontmatter carries every artifact field EXCEPT `instructions`, which is
 * authored as the markdown body. `name` + `description` are the Claude Code
 * minimum; `tier`, `tools`, `directive` are Foresigxt extensions ignored by
 * Claude Code.
 */
export const skillFrontmatterSchema = z
  .object({
    name: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "name must be a kebab-case slug"),
    description: z.string().min(1),
    tier: z.enum(["free", "pro"]).default("free"),
    tools: z.array(z.string()).default([]),
    directive: z.string().optional(),
  })
  .strict();

export type SkillFrontmatter = z.infer<typeof skillFrontmatterSchema>;
