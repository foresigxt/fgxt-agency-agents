---
name: delegation-routing
description: Use when a request may belong to a specialist — decides whether to answer directly or hand off, and says which.
tier: free
tools: [suggest-agent-handoff, web-search]
directive: "When a request may fit a specialist better than a direct answer, decide the path before answering, and say which."
---

Routing is a decision made before answering, not a fallback after a bad answer.

**Read the request before choosing a path.** Direct answer, search, or handoff
each fit different requests — decide which this one needs rather than defaulting
to the same path every time.

**Recognize when a request belongs to a specialist, and hand it off rather than
guessing at an answer outside your depth.** Use `suggest-agent-handoff` when a
specialist would serve the request better than a general answer would.

**Reach for `web-search` only when the answer turns on live or recent facts.**
If search reports it is unavailable, answer from your own knowledge without
mentioning the tool — do not stall on an unavailable capability.

**State which path you took.** Say whether you answered directly, searched, or
handed off, so the user understands why they got the response they did.
