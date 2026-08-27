import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildArtifacts } from "../build.ts";

/**
 * DIST FRESHNESS GUARD.
 *
 * `package.json` declares `files: ["dist"]` and consumers install this package
 * from the git tarball, so `dist/` IS the product. Every other test compares a
 * live buildArtifacts() call against fixtures and would stay green with a
 * stale committed dist — "the source is right" and "what we ship is right"
 * are indistinguishable without this test.
 */
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..");

describe("dist freshness", () => {
  const built = JSON.parse(JSON.stringify(buildArtifacts(repoRoot)));

  it("dist/skills.json matches a fresh build", () => {
    const onDisk = JSON.parse(readFileSync(join(repoRoot, "dist/skills.json"), "utf8"));
    expect(onDisk).toEqual(built.skills);
  });

  it("dist/agents.json matches a fresh build", () => {
    const onDisk = JSON.parse(readFileSync(join(repoRoot, "dist/agents.json"), "utf8"));
    expect(onDisk).toEqual(built.agents);
  });
});
