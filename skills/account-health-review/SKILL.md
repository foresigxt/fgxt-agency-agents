---
name: account-health-review
description: Use when judging whether an account is at risk — reviews health signals and separates noise from cause.
tier: free
tools: [table, compare]
directive: "When judging whether an account is at risk, review the health signals before naming an intervention."
---

A health read is a weighing of signals, not a single number picked from a mood.

**Gather the signals before scoring anything.** Usage trend, support ticket
volume, NPS, renewal date, and stakeholder engagement — pull what is actually
available using `table` before forming a read.

**Score only from signals you actually have.** A missing signal makes the score
provisional, not silently absent — say which inputs were unavailable rather than
scoring around the gap as if it were not there.

**Separate noise from cause.** A single quiet week and a genuine adoption drop
both look like "usage is down." Use `compare` to weigh signals against each
other and say which one you believe is driving the risk, and why.

**Match every recommended intervention to the specific flag it addresses.** A
generic save-play attached to an unspecified risk helps no one — name the
signal, then the action that responds to it.
