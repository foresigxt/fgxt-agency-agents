import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * RELEASE VERSION GUARD.
 *
 * The release IS the git tag, so `package.json` `version` is not cosmetic: it is
 * what a consumer reads to know which release they installed, and the tag name
 * is derived from it. This repo has already shipped that drift once — tag
 * `v0.4.0` carried `package.json` version `0.3.0` — so the fields are pinned
 * here rather than left to be noticed by a reader.
 *
 * Two things are pinned:
 *   1. `package.json` version == the newest CHANGELOG entry. A release that
 *      bumps one without the other is half-done.
 *   2. The frontmatter baseline fixture is named for that version, because the
 *      baseline IS the frozen frontmatter of a release (see
 *      `frontmatter-invariant.test.ts`).
 */
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..");

const pkg = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")) as {
  version: string;
};
const changelog = readFileSync(join(repoRoot, "CHANGELOG.md"), "utf8");

/** The newest `## [x.y.z]` heading in the changelog — the release being cut. */
function newestChangelogVersion(): string | undefined {
  const headings = [...changelog.matchAll(/^## \[(\d+\.\d+\.\d+)\]/gm)].map((m) => m[1]);
  return headings[0];
}

describe("release version", () => {
  it("package.json version is the newest changelog entry", () => {
    const newest = newestChangelogVersion();
    expect(newest, "CHANGELOG.md has no `## [x.y.z]` entry").toBeDefined();
    expect(pkg.version, `package.json says ${pkg.version}, CHANGELOG says ${newest}`).toBe(newest);
  });

  it("the frontmatter baseline fixture is named for that version", () => {
    const expected = `v${pkg.version}-frontmatter-baseline.json`;
    const path = join(here, "__fixtures__", expected);
    expect(
      existsSync(path),
      `src/__tests__/__fixtures__/${expected} is missing — the baseline freezes one release's frontmatter`,
    ).toBe(true);
  });
});
