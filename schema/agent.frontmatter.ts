import { z } from "zod";

/**
 * Agent frontmatter schema.
 *
 * Frontmatter is a *subset* of the published artifact contract
 * (`schema/contract.ts`): it carries every field EXCEPT
 *  - `system_prompt` — authored as the markdown body, and
 *  - `active` — joined from `catalog/activation.json` at build time.
 *
 * `label` is the mutable display name (e.g. "Sales Researcher"). It is
 * REQUIRED for the 12 specialists and ABSENT for `assistant` / `chat-llm`
 * (which display via `name`), so it is optional here.
 * `persona_name` is present on all agents as either a value or explicit `null`.
 */
export const agentFrontmatterSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "id must be a kebab-case slug"),
    name: z.string().min(1),
    label: z.string().min(1).optional(),
    persona_name: z.string().min(1).nullable().optional(),
    description: z.string().min(1),
    division: z.string().min(1),
    role: z.enum(["supervisor", "specialist", "tool"]).default("specialist"),
    tier: z.enum(["free", "pro"]).default("free"),
    backend_type: z.enum(["chat", "live", "avatar"]).default("chat"),
    model: z.string().min(1),
    temperature: z.number().optional(),
    maxTokens: z.number().optional(),
    skills: z.array(z.string()).default([]),
    callable_agent_ids: z.array(z.string()).default([]),
    category: z.string().min(1),
    visibility: z.enum(["user", "internal", "system"]).default("internal"),
    conversation_starters: z.array(z.string()).optional(),
    color: z.string().optional(),
  })
  .strict();

export type AgentFrontmatter = z.infer<typeof agentFrontmatterSchema>;
