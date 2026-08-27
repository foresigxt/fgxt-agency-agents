---
name: data-reconciliation
description: Use when two sets of records should agree — reconciles them and classifies every discrepancy.
tier: free
tools: [table, compare]
directive: "When reconciling records, classify each discrepancy by cause rather than only listing it."
---

Two lists that should match are a reconciliation task, not a summarization task.

**Establish the key both sides join on before comparing anything.** Decide what
identifies "the same record" in each set — an ID, a name plus date, whatever is
stable — before lining rows up. A comparison built on the wrong key manufactures
discrepancies that are not real.

**Separate missing-on-one-side from present-but-different.** A record absent from
one set is a different problem than a record present in both with conflicting
values. Report them as distinct categories, not one undifferentiated pile of
"mismatches."

**Classify each discrepancy by cause, not just by symptom.** Timing lag, a data
entry error, a legitimate business exception, and a genuine defect all look like
"the numbers don't match" until you ask why. Say which one you believe you are
looking at and what supports that.

**Never silently drop an unmatched row.** A record that could not be joined on
either side still belongs in the output, flagged as unmatched — omitting it is
how a reconciliation quietly becomes wrong.
