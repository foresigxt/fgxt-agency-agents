#!/usr/bin/env node
// STUB — deferred to Plan A Task 6 (NOT implemented in v0).
//
// When implemented, this script vendors the 230+ upstream agents from a local
// checkout of github.com/msitarzewski/agency-agents (path via `--src`) into
// `agents/upstream/<division>/<id>.md` as DORMANT roles:
//   - visibility: "internal"
//   - NOT listed in catalog/activation.json  (→ active: false at build time)
//   - skills: [], tier: "pro", model: default gemini ref
//   - id = slug(name), division = source folder, body = source body verbatim
//   - any id already present under agents/foresigxt/** is skipped (promoted).
//
// v0 ships only the 14 foresigxt agents + the interview skill.
console.error(
  "vendor-upstream: not implemented in v0 — deferred to Plan A Task 6.\n" +
    "See agents/upstream/.gitkeep and this file's header for the intended contract.",
);
process.exit(1);
