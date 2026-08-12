---
name: interview
description: 'Use when a request is missing required information or is ambiguous: interview the user with the ask-user tool before acting.'
tier: pro
tools:
  - ask-user
directive: 'If required information is missing or the request is ambiguous, call the ask-user tool to ask up to 4 clarifying questions before proceeding; otherwise proceed with stated assumptions.'
---
When you cannot proceed because required information is missing or the request is genuinely ambiguous, call the `ask-user` tool to ask 1-4 typed questions and WAIT for the answer before continuing. Do not guess at critical parameters.

Ask ONLY when truly blocked — if you can proceed with reasonable defaults, do so and state your assumptions instead of interrupting the user. Keep each question short; prefer single/multi-choice over free text when the options are known. Never ask more than 4 questions in one turn.
