---
id: 332
uid: 2c14a91f-97a9-46d2-bea6-030758a01603
title: Read every response body before the site budget's page closes
type: bug
status: backlog
milestone: foundations
created: 2026-10-10
updated: 2026-10-10
priority: p2
layer: tooling
effort: s
---

## What happens

The Site budget job fails after every test has passed, with an unhandled `response.body: Target page, context or browser has been closed` (budget.test.ts, where the response bodies are read). It has failed on most PRs today (#170, #203, #247, #253 among them), so a red Site budget means nothing, and the job is not required.

## What should happen

Every response body the test reads is awaited before its page closes, or read in the response handler. A red Site budget means the budget.

## Acceptance criteria

- [ ] The job passes 10 runs in a row on main.
- [ ] Wherever the site's budget lives after #245, the same is true there.
