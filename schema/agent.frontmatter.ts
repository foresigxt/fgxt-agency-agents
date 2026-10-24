import { z } from "zod";

/**
 * Agent frontmatter schema.
 *
 * Frontmatter is a *subset* of the published artifact contract
 * (`schema/contract.ts`): it carries every field EXCEPT
 *  - `system_prompt` — authored as the markdown body, and
 *  - `active` — joined from `catalog/activation.json` at build time.
 *
 * `label` is the mutable display name (e.g. "Sales Researcher"). Every agent
 * carries one — `name` is the id slug and `label` is what a person sees — but
 * it stays optional here so the published contract shape does not change.
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
    /** Omitted means pool-routed: the agent's modelPolicy.class selects the pool. */
    model: z.string().min(1).optional(),
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
