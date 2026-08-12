import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";

/**
 * Every `skills/<name>/SKILL.md` must be Claude-Code-loadable: non-empty
 * `name` + `description` frontmatter, and the folder name must equal the
 * frontmatter `name`.
 */
const here = dirname(fileURLToPath(import.meta.url));
const skillsDir = join(here, "..", "..", "skills");

function skillDirs(): string[] {
  return readdirSync(skillsDir).filter((entry) => statSync(join(skillsDir, entry)).isDirectory());
}

describe("Claude-Code compatibility", () => {
  it("has at least one authored skill", () => {
    expect(skillDirs().length).toBeGreaterThan(0);
  });

  it.each(skillDirs())("skill folder %s has a Claude-loadable SKILL.md", (folder) => {
    const source = readFileSync(join(skillsDir, folder, "SKILL.md"), "utf8");
    const { data, content } = matter(source);
    expect(typeof data.name).toBe("string");
    expect((data.name as string).length).toBeGreaterThan(0);
    expect(typeof data.description).toBe("string");
    expect((data.description as string).length).toBeGreaterThan(0);
    expect(data.name).toBe(folder);
    expect(content.trim().length).toBeGreaterThan(0);
  });
});
