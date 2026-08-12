import { z } from "zod";

/**
 * Published-artifact contract — copied VERBATIM from the consumer
 * (`fgxt-app-web` `services/foresigxt/src/agency/contract.ts`). `dist/agents.json`
 * and `dist/skills.json` MUST validate against `agencyArtifactsSchema`. Keep this
 * file byte-for-byte in sync with the consumer; the parity test guards it.
 */
export const agencyAgentArtifactSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    /** Mutable display label (e.g. "Sales Researcher" for id/name "sales-researcher"). Omitted when the legacy JSON had none (assistant, chat-llm) — consumers fall back to `name`. */
    label: z.string().optional(),
    persona_name: z.string().nullable().optional(),
    description: z.string().min(1),
    division: z.string().min(1),
    role: z.enum(["supervisor", "specialist", "tool"]),
    tier: z.enum(["free", "pro"]),
    backend_type: z.enum(["chat", "live", "avatar"]),
    model: z.string().min(1),
    temperature: z.number().optional(),
    maxTokens: z.number().optional(),
    skills: z.array(z.string()).default([]),
    callable_agent_ids: z.array(z.string()).default([]),
    category: z.string().min(1),
    visibility: z.enum(["user", "internal", "system"]),
    conversation_starters: z.array(z.string()).optional(),
    color: z.string().optional(),
    system_prompt: z.string().min(1),
    active: z.boolean(),
  })
  .strict();

export const agencySkillArtifactSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().min(1),
    tier: z.enum(["free", "pro"]),
    tools: z.array(z.string()).default([]),
    instructions: z.string().min(1),
    directive: z.string().optional(),
  })
  .strict();

export const agencyArtifactsSchema = z.object({
  agents: z.array(agencyAgentArtifactSchema),
  skills: z.array(agencySkillArtifactSchema),
});

export type AgencyAgentArtifact = z.infer<typeof agencyAgentArtifactSchema>;
export type AgencySkillArtifact = z.infer<typeof agencySkillArtifactSchema>;
export type AgencyArtifacts = z.infer<typeof agencyArtifactsSchema>;
