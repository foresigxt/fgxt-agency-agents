// CLI entry — runs the build and writes the published artifacts to dist/.
// Run via `tsx scripts/build.mjs` (see package.json "build"). tsx resolves the
// imported .ts sources at runtime.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildArtifacts } from "../src/build.ts";

const root = process.cwd();
const { agents, skills } = buildArtifacts(root);

const distDir = join(root, "dist");
mkdirSync(distDir, { recursive: true });

writeFileSync(join(distDir, "agents.json"), JSON.stringify(agents, null, 2) + "\n");
writeFileSync(join(distDir, "skills.json"), JSON.stringify(skills, null, 2) + "\n");

// dist/index.js re-exports the JSON as named exports so consumers can
// `import { agents, skills } from "@foresigxt/agency-agents"`. JSON is loaded
// via createRequire, which works in every Node ESM runtime without flags.
const indexJs = `import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const agents = require("./agents.json");
const skills = require("./skills.json");
export { agents, skills };
export default { agents, skills };
`;
writeFileSync(join(distDir, "index.js"), indexJs);

console.log(`Built ${agents.length} agents and ${skills.length} skills → dist/`);
