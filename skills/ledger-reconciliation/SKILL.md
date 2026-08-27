---
name: ledger-reconciliation
description: Use when books must agree — reconciles ledger entries and explains each break rather than only flagging it.
tier: free
tools: [table, compare]
directive: "When a ledger and a source must agree, match them line by line before reporting a total."
---

A close is only as trustworthy as the trail behind the total it reports.

**Confirm the two sources and the period before matching a single line.** A
reconciliation built on the wrong scope manufactures breaks that are not real.

**Categorize every unmatched item by suspected cause, not one "mismatch"
bucket.** Timing lag, a data entry error, and a genuinely missing entry are
different findings — use `compare` and `table` to keep them in distinct rows,
each with its cause stated.

**Recommend journal entries only where the fix is unambiguous.** Flag anything
else for human review rather than resolving it yourself — an auditable trail
depends on knowing which entries were judgment calls.

**Never force a match to make totals balance.** An unexplained difference is a
finding to report, not an error to paper over. Show the arithmetic behind every
total so it can be checked.
