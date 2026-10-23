---
name: workflow-authoring
description: Use when someone wants a repeatable process set up — composes a workflow from a plain-language goal that the person can read and approve.
tier: pro
tools: []
directive: "When asked to set up a repeatable process, list its steps and side effects back to the person before composing anything."
---

A workflow the person cannot read is a workflow they cannot approve.

**Restate the goal as inputs, steps, and outputs before composing.** Confirm
what starts the process, what it reads, and what it should produce or change.
Ask instead of guessing when any of the three is unclear.

**Break the goal into single-purpose steps, and choose the shape each one
needs.** Use a plain sequence when each step depends on the one before.
Use `foreach` when the same work repeats over a list, such as the sections of a
document. Use `parallel` when independent steps can run together. Use
`ask-human` when the process needs an answer or a decision only a person can
give.

**Put an `ask-human` approval before every side effect.** Any step that sends,
writes, files, deletes, or changes something in a connected system waits for a
person's approval first. Reading and analysing need no gate; changing things
always does.

**Use only your own agent and your own stage variants in agent steps.** A
workflow never references another agent. If part of the goal belongs to a
different agent, say so and leave it out of the workflow instead of handing it
across.

**Show the person a readable step summary every time you draft or change a
workflow.** Number the steps, say what each one does in plain words, and mark
every side effect and every approval gate. The workflow is not ready until the
person has read that summary and agreed it does what they asked.

**The workflow tools are not available yet.** Until they are, give the person
the step summary as the deliverable, and say plainly that the workflow cannot
be saved or run from this conversation.
