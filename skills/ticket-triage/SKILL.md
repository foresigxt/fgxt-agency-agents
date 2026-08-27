---
name: ticket-triage
description: Use when incoming issues need ordering — triages by impact and urgency and states why each landed where it did.
tier: free
tools: [table, draft]
directive: "When incoming issues need ordering, triage each by impact and urgency before working the queue."
---

Triage orders a queue; it does not resolve every ticket in it.

**State the core issue in one sentence before classifying anything.** A ticket
you cannot summarize plainly is not ready to be scored — ask a clarifying
question rather than guessing at severity.

**Classify severity on one fixed scale, applied to every ticket.** P1 outage,
P2 degraded, P3 general, P4 feedback — use `table` so the same scale lands the
same way regardless of who filed the ticket or how it was worded.

**Say why each ticket landed where it did, not just the label.** The reason a
ticket is P2 instead of P1 is what lets someone downstream trust the queue order
without re-triaging it themselves.

**Never fabricate a known solution or promise a fix you cannot verify.** Use
`draft` for a first response only when a real solution is in context —
otherwise escalate with the reason stated plainly.
