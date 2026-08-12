import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const agents = require("./agents.json");
const skills = require("./skills.json");
export { agents, skills };
export default { agents, skills };
