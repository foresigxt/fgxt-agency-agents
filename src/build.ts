import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { parseAgentFile, parseSkillFile } from "./parse.ts";
import type { AgencyAgentArtifact, AgencySkillArtifact } from "../schema/contract.ts";

/**
 * Callable-agent ids that are provided by the runtime rather than authored in
 * this repo (built-in tool agents), plus ids reserved for the deferred upstream
 * vendoring (Plan A Task 6). Referencing them from `callable_agent_ids` is
 * allowed and does NOT fail the integrity check.
 *
 * `web-search` is the built-in web-search tool agent referenced by `assistant`.
 */
const KNOWN_EXTERNAL_AGENT_IDS = new Set<string>(["web-search"]);

type Provenance = "foresigxt" | "upstream";

export interface BuildResult {
  agents: AgencyAgentArtifact[];
  skills: AgencySkillArtifact[];
}

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function readActivation(root: string): Set<string> {
  const path = join(root, "catalog", "activation.json");
  if (!existsSync(path)) return new Set();
  const ids = JSON.parse(readFileSync(path, "utf8")) as string[];
  return new Set(ids);
}

/**
 * Walk the authored tree, validate + dedup by id (foresigxt wins over upstream;
 * a same-tree collision hard-fails), run integrity checks (referenced skills
 * exist; callable agents resolve), join `activation.json` → `active`, and return
 * deterministically-sorted artifact arrays.
 */
export function buildArtifacts(root: string): BuildResult {
  // --- Skills first (needed for agent skill-integrity) ---
  const skillFiles = walk(join(root, "skills")).filter(
    (p) => p.split(sep).pop() === "SKILL.md",
  );
  const skillByName = new Map<string, AgencySkillArtifact>();
  for (const file of skillFiles) {
    const { frontmatter, instructions } = parseSkillFile(
      relative(root, file),
      readFileSync(file, "utf8"),
    );
    if (skillByName.has(frontmatter.name)) {
      throw new Error(`skill id collision: "${frontmatter.name}" is defined more than once`);
    }
    skillByName.set(frontmatter.name, {
      name: frontmatter.name,
      description: frontmatter.description,
      tier: frontmatter.tier,
      tools: frontmatter.tools,
      instructions,
      ...(frontmatter.directive !== undefined ? { directive: frontmatter.directive } : {}),
    });
  }

  // --- Agents: parse + merge by id ---
  const agentFiles = walk(join(root, "agents")).filter((p) => p.endsWith(".md"));
  const byId = new Map<string, { artifact: Omit<AgencyAgentArtifact, "active">; provenance: Provenance }>();
  for (const file of agentFiles) {
    const rel = relative(root, file);
    const provenance: Provenance = rel.split(sep).includes("upstream") ? "upstream" : "foresigxt";
    const { frontmatter, system_prompt } = parseAgentFile(rel, readFileSync(file, "utf8"));
    const artifact = { ...frontmatter, system_prompt } as Omit<AgencyAgentArtifact, "active">;

    const existing = byId.get(frontmatter.id);
    if (!existing) {
      byId.set(frontmatter.id, { artifact, provenance });
      continue;
    }
    if (existing.provenance === provenance) {
      throw new Error(
        `unintended id collision: "${frontmatter.id}" appears in two ${provenance} files`,
      );
    }
    // Cross-tree: foresigxt wins over upstream.
    if (provenance === "foresigxt") {
      byId.set(frontmatter.id, { artifact, provenance });
    }
  }

  // --- Activation join + integrity ---
  const activeIds = readActivation(root);
  const agentIds = new Set(byId.keys());
  const agents: AgencyAgentArtifact[] = [];
  for (const { artifact } of byId.values()) {
    for (const skill of artifact.skills) {
      if (!skillByName.has(skill)) {
        throw new Error(`agent "${artifact.id}" references unknown skill: "${skill}"`);
      }
    }
    for (const callableId of artifact.callable_agent_ids) {
      if (!agentIds.has(callableId) && !KNOWN_EXTERNAL_AGENT_IDS.has(callableId)) {
        throw new Error(
          `agent "${artifact.id}" references unknown callable agent: "${callableId}"`,
        );
      }
    }
    agents.push({ ...artifact, active: activeIds.has(artifact.id) });
  }

  agents.sort((a, b) => a.id.localeCompare(b.id));
  const skills = [...skillByName.values()].sort((a, b) => a.name.localeCompare(b.name));
  return { agents, skills };
}
