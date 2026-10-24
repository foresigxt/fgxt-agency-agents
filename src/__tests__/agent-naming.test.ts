import { describe, it, expect } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildArtifacts } from "../build.ts";

/**
 * FGXT-405 — one naming rule for every agent: `name` is the id slug and
 * `label` is the role's display name. Consumers fall back label → name, so a
 * role that carries neither shows a slug to a person.
 */

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..");

describe("agent naming (FGXT-405)", () => {
  it("every authored agent names itself by its id and carries a display label", () => {
    const { agents } = buildArtifacts(repoRoot);
    for (const agent of agents) {
      expect(agent.name, `${agent.id}: name is not the id slug`).toBe(agent.id);
      expect(agent.label?.trim(), `${agent.id}: no display label`).toBeTruthy();
    }
  });
});
