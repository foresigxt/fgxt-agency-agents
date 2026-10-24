import { describe, it, expect } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildArtifacts, readFrameworkLegacy } from "../build.ts";

/**
 * FGXT-405 — the legacy list is a shrink-only list.
 *
 * Every role authored before the framework is grandfathered in
 * `catalog/framework-legacy.json`; the list may shrink as roles are migrated
 * and may never grow, so a new role cannot skip the framework. Editing
 * FROZEN_PENDING below is the visible, reviewable act that does it.
 */

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..");

/**
 * The authored roles that predate the framework, frozen at FGXT-405.
 *
 * The total migration (operator decision, 2026-10-24) emptied it: every role
 * has migrated, so the legacy list may not gain a pending entry again.
 */
const FROZEN_PENDING: string[] = [];

describe("framework legacy list (FGXT-405)", () => {
  const legacy = readFrameworkLegacy(repoRoot);

  it("pending ids are a subset of the frozen snapshot", () => {
    for (const [id, entry] of legacy) {
      if (entry.status === "pending-migration") {
        expect(FROZEN_PENDING, `"${id}" was added to the legacy list`).toContain(id);
      }
    }
  });

  it("only chat-llm is exempt, with a reason", () => {
    const exempt = [...legacy]
      .filter(([, entry]) => entry.status === "exempt")
      .map(([id]) => id);
    expect(exempt).toEqual(["chat-llm"]);
    expect(legacy.get("chat-llm")?.reason.trim()).not.toBe("");
  });

  it("every listed id is an authored agent", () => {
    const { agents } = buildArtifacts(repoRoot);
    const authored = new Set(agents.map((a) => a.id));
    for (const id of legacy.keys()) {
      expect(authored, `"${id}" is listed but not authored here`).toContain(id);
    }
  });

  it("the pilot is not grandfathered", () => {
    expect(legacy.has("tender-bidding-manager")).toBe(false);
  });
});
