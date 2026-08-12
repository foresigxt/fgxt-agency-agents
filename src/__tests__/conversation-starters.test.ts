import { describe, it, expect } from "vitest";
import agents from "../../dist/agents.json";
import type { AgencyAgentArtifact } from "../../schema/contract.ts";

const DEEPENED = new Set([
  "sales-researcher","competitive-analyst","financial-reconciler","recruiter",
  "support-triage","supply-chain-coordinator","assistant","data-report-analyst",
  "executive-assistant","meeting-notetaker","content-producer",
  "social-media-manager","customer-success-op",
]);

describe("conversation_starters coverage", () => {
  it("every deepened agent has 3–4 starters; chat-llm has none", () => {
    for (const a of agents as AgencyAgentArtifact[]) {
      if (DEEPENED.has(a.id)) {
        expect(Array.isArray(a.conversation_starters), `${a.id} missing starters`).toBe(true);
        expect(a.conversation_starters.length).toBeGreaterThanOrEqual(3);
        expect(a.conversation_starters.length).toBeLessThanOrEqual(4);
      }
      if (a.id === "chat-llm") {
        expect(a.conversation_starters ?? []).toEqual([]);
      }
    }
  });
});
