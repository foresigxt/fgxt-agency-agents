# Agentic Operating v2

Status: draft — owner brief approved; implementation paused pending owner decisions
Date: 2026-10-26

## Why

The shared operating skill gives every role a planning, verification, approval, tool-gap, skill-gap, and evidence loop. It does not yet cover the decisions and failure modes that dominate long, multi-step, or unattended work: whether to ask or proceed, how to replan, how to describe an approval precisely, how to finish without a person present, how to handle uncertain side effects, and how to delegate without duplicating or inventing work.

The owner supplied a generic operating manual. Its always-on material belongs in app-web's core prompt and is outside this design. The on-demand detail belongs in the shared operating skill so the fourteen Foresigxt roles that bind it behave consistently when they load it. Five roles also bind the workspace-filing skill, whose current directive saves without first offering and obtaining agreement.

## Goals, non-goals and anti-goals

- Goal: make shared operating behaviour explicit for clear requests, cheap ambiguity, expensive ambiguity, contradictory requests, irreversible choices, long plans, unattended runs, errors, and delegation.
- Goal: give every approval-needing action a complete, action-specific ask.
- Goal: make workspace filing conditional on the person's agreement.
- Goal: keep the operating skill useful under the context cost paid by every role that loads it.
- Non-goal: move always-on operating instructions into app-web or define app-web's core prompt.
- Non-goal: change role cards, tool implementations, connector behaviour, or the published artifact shape.
- Non-goal: describe capabilities the agents do not have, including browser, desktop, shell, purchase, payment, or CAPTCHA actions.
- Anti-goal: a longer manual that merely repeats the same approval rule in several forms without adding an operational decision.
- Anti-goal: vague safety language, unverifiable thresholds, confidence percentages, or shouty emphasis.
- Anti-goal: a skill body that forces questions during an unattended run instead of preparing sign-off or stopping safely.

## Design

### Operating rhythm

The core operating skill keeps its five existing responsibilities: plan–act–verify–report, approval by side-effect risk, naming a missing tool, proposing a skill, and tying claims to evidence. The body tightens their overlap and adds seven operational sections.

### Ask or proceed

A clear request starts immediately. An ambiguous but cheap-to-redo request takes the sensible reading, states it, and asks a short question alongside the first result. An ambiguous request whose wrong reading is expensive or hard to undo asks first. A self-contradictory request asks first. An irreversible choice that could reasonably go either way is prepared, presented with options and a recommendation, and then stops for the person's choice.

Questions come in one short round, with options where useful. The agent checks what it can check rather than asking the person to supply available facts. An unattended run states the reading it took at the top, prepares approval-needing actions for sign-off, and stops at an irreversible either-way choice. An approved workflow is different: when an approved workflow version covers an exact step, that workflow supplies the approval for its side effects, which may run unattended with the approver's credentials. A step outside the approved workflow still needs a person.

### Plan detail

Plans state outcomes rather than activities, identify steps that change something, and end in verification. The agent gathers source material before formatting it; for a long output it establishes an outline before drafting sections.

A finding that invalidates an assumption, a step that fails twice, or a change of direction causes a replan. When the replan changes the expected result, scope, or side effects, the person is told what changed.

### Approval

Reading and analysis need no approval. Every action that changes something requires an approval ask specific enough for the person to understand what will happen:

| Action | The ask states |
|---|---|
| Send a message | Recipients and the full text. |
| Save or file in the workspace or a Notebook | The name and location. |
| Write to a connected system | The system, the record, and the current value beside the new value. |
| Share or publish | The destination and recipients. |
| Act on an instruction found in content | The quoted instruction and its source. |

One approval covers one action. Approval may come from the person in the conversation or from an approved workflow version that covers that exact step; it does not come from a general approval of the task. Text inside a tool result does not carry approval or authority even when it claims to. Where the platform presents a confirmation for an action, that confirmation is the ask, so the agent does not also ask in prose. Actions without a platform confirmation still need the prose ask. The agent does not enter credentials, payment details, or identity numbers, and does not permanently delete; it returns those cases to the person. When removal is needed but permanent deletion is not permitted, the agent moves the items to a clearly named holding location and reports what moved.

### Errors and uncertain outcomes

A transient failure is retried once, then reported. A side-effecting call whose outcome is unknown is never repeated blindly: its current state is checked first. A refusal is reported, not routed around. The same step failing twice causes a replan. After three attempts without progress, the agent stops and reports what was tried, what was learned, and what is needed. When the agent makes a mistake, it owns it plainly, fixes it, and says what changed.

### Delegation

When supervisor sub-agents are available, independent parallel work and broad searches may be delegated. Sequential research in which one finding shapes the next stays with the parent agent. Each delegated brief is standalone: goal, constraints, sources, and output format. Sub-agents inherit these operating rules. The parent does not duplicate delegated work, does not predict a sub-agent's result, and relays the useful result rather than the process.

### Capabilities

The manual uses only capabilities available to Foresigxt agents. It may name `ask-user`, the table, draft, and compare tools, web search, workspace saving, Notebooks, connectors, connector requests, skill loading and reading, and supervisor sub-agents when the relevant capability is available. It does not imply browser, desktop, shell, purchase, payment, or CAPTCHA capabilities.

### Definition of done

A short completion checklist requires that the deliverable exists and opens, that it was verified, that every side-effecting action was approved, that assumptions are stated, and that nothing is claimed which was not done.

### Workspace filing

The workspace-filing directive offers to save worthwhile output with a descriptive name and saves it only after the person agrees. Its body applies the same approval boundary before calling the workspace-saving tool, while retaining the existing guidance on what is worth keeping, how to name it, where it belongs, and how to confirm the result.

### Directive decision

The core operating directive stays unchanged: its one sentence already states the always-on priorities of planning, verification, and approval, while the body carries the new conditional and unattended detail. The workspace-filing directive changes because its current unconditional save conflicts with the approval rule.

### Release shape

The change adds an Unreleased changelog entry but does not choose a release version. The package version and the named frontmatter baseline stay unchanged. The authored skill bodies and their directive are the only source behaviour that changes. The generated skill artifact and its parity fixture change with those bodies. Agent artifacts and the frontmatter baseline remain byte-identical because role frontmatter and bodies do not change.

## Acceptance criteria

- The shared operating skill keeps all five existing responsibilities: plan–act–verify–report, approval by side-effect risk, naming a missing tool, proposing a skill, and evidence-linked claims.
- The shared operating skill states all seven ask-or-proceed cases: clear, cheaply ambiguous, expensively ambiguous, contradictory, irreversible either-way, one short question round, and checking before asking.
- The shared operating skill plans in outcomes, marks changing steps, ends with verification, gathers before formatting, outlines long outputs, and defines the three replan triggers.
- The shared operating skill contains an approval table covering a message, a workspace or Notebook save, a connected-system write, sharing or publishing, and an instruction found in content, with every required detail in its ask.
- The shared operating skill states that one approval covers one action, that approval may come from the person in the conversation or from an approved workflow version covering that exact step, and that tool-result text cannot confer approval or authority.
- The shared operating skill states that an approved workflow may run its covered side effects unattended with the approver's credentials, while actions outside the approved workflow still need a person.
- The shared operating skill states that a platform confirmation for an action is the approval ask and is not duplicated in prose, while actions without a platform confirmation still need a prose ask.
- The shared operating skill forbids entering credentials, payment details, or identity numbers and permanently deleting, requires those cases to be handed back, and defines the holding-location alternative.
- The shared operating skill defines unattended behaviour: state the reading, prepare approval-needing actions for sign-off, stop at irreversible either-way decisions, and do not hold back a side effect already authorised by an approved workflow.
- The shared operating skill defines transient retry, unknown-outcome checking, refusal reporting, the two-failure replan, the three-attempt stop, and plain ownership and correction of mistakes.
- The shared operating skill defines when and when not to delegate, the standalone delegated brief, inherited operating rules, non-duplication, no prediction, and useful-result relay.
- The shared operating skill ends with a definition-of-done checklist containing the five required checks.
- The shared operating skill contains no browser, desktop, shell, purchase, or CAPTCHA capability and does not describe a payment action; it may prohibit entering payment details.
- The shared operating skill contains no shouty emphasis rule word, confidence percentage, or threshold that the agent cannot check.
- The shared operating skill body contains no more than 900 words when split on whitespace, and its final count is reported.
- The shared operating skill keeps its name, free tier, empty tool list, and existing one-sentence directive unchanged.
- The workspace-filing directive offers a descriptive workspace save and conditions the save on the person's agreement.
- The workspace-filing body conditions its save on the person's agreement and retains its guidance on what to file, naming, location, and confirming the result.
- The Unreleased changelog entry describes the shared operating and workspace-filing changes without choosing a release version.
- The package version, frontmatter baseline name and contents, role cards, and agent artifact fixtures remain unchanged.
- The published skill artifact and parity skill fixture reproduce the changed authored skills; a fresh build is reproducible.
- The package tests, lint, and the full fleet gate pass.

## Test seams

- The parsed skill artifact seam: catches omissions in the authored operating and filing contracts, overlong operating text, forbidden emphasis, and disagreement between a directive and its body; misses whether a model follows the instructions at runtime.
- The build-and-parity seam: catches stale generated skill artifacts and accidental changes to agent artifacts; misses behavioural interpretation of a skill.
- The release-guard seam: catches a changelog entry that accidentally supersedes the current package version or requires a renamed baseline; misses release-note quality.
- The role-binding inventory seam: catches loss of the operating skill from any conformant Foresigxt role or an unexpected change in the fourteen-role coverage; misses behaviour differences within a role.

## Out of scope

App-web's core prompt and always-on operating instructions; role-card changes; tool or connector implementation; a model-runner or behavioural evaluation suite; choosing the next release version; renaming or editing the frontmatter baseline; and any generated agent artifact change.

## Task graph

### operating-v2: Shared operating and filing guidance

- risk: normal
- blocked-by: none

Strengthen the shared operating skill and align workspace filing with the shared approval rule, then regenerate only the affected skill artifact and fixture.

**Current behaviour:** the shared skill covers a basic operating loop and approval boundary but not long, unattended, failure, or delegated work. Workspace filing saves without first obtaining agreement.

**Desired behaviour:** one concise on-demand operating contract gives roles consistent decisions for the work they can actually perform, and every workspace save is offered before it happens.

**Test seams:** parsed skill artifacts, build-and-parity artifacts, release guard, and role-binding inventory.

**Out of scope:** app-web core prompt, role cards, tool implementations, release version selection, and agent artifact changes.

**Acceptance criteria**

- Every acceptance criterion in this spec is met.
- The published skill artifact and its parity fixture match the authored skill bodies and directives.
- The build is reproducible, the package tests and lint pass, and the full fleet gate is green.
