# G3B implementation clarifications

The repository owner approved the G3A reconciliation and authorized G3B on 2026-10-15. These implementation clarifications do not change the approved product semantics:

- Required inventory, fulfillment, and blocking evidence objects are contract requirements. Their absence is a `422` validation error. A missing optional readiness estimate is a valid analytical input and is traced to `/operationalEvidence/readyTimeEstimate` without fabricating an evidence identifier.
- The current synthetic-only request schema accepts only `origin: "synthetic_fixture"`. Future real-source origins require another gate and can be added compatibly later.
- When a current fulfillment snapshot says `ready`, a supplied readiness estimate is retained as evidence but ignored for the decision and reported with `READY_ESTIMATE_IGNORED_AFTER_READY`.
- Disabled inference is represented as unavailable with reason `configuration`; deterministic findings remain available and the generic status is `limited`.
- PromiseGuard-specific deterministic mock fixtures live in the shared inference package under Codex ownership. They make no network requests, cannot identify as AMD, and are released only when the registered assessment and deterministic-finding fingerprint match the fixture.
- AI mitigation compatibility is enforced by action code, deterministic finding, ordering, and action-specific validated evidence references. Invalid AI composition degrades to a limited deterministic response; the AI cannot change the assessment or review requirement.
- The API reads request streams incrementally and cancels once the body exceeds 16 KiB, including when no trustworthy `Content-Length` is supplied.
- Relative preset generation accepts an injected clock and exists as a domain utility for the later Antigravity-owned UI; this branch adds no product UI.
