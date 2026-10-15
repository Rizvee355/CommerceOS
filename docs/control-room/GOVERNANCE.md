# Control Room governance

The Mission 001 placeholder directories represented gates, not separate deployable applications. G1 replaced them with one application architecture while preserving these controls:

- PromiseGuard business implementation remains off.
- MarginLeak business implementation remains off.
- RescueCart is disabled and excluded.
- Generic shared contracts and the application skeleton are authorized only for G2.
- AMD live inference remains blocked pending account-issued credentials and proof.

Shared root configuration, contracts, and inference code have one foundation owner during G2. Antigravity and later product branches consume those boundaries and submit proposed changes to the Control Room rather than editing shared paths independently.

## Agent isolation and integration

- Each agent uses an independent checkout or Git worktree and a dedicated branch.
- Codex foundation work uses `codex/g2-foundation`; Antigravity work uses only a separately authorized `antigravity/*` branch.
- Agents branch from the latest approved `main` SHA and do not merge agent branches into one another.
- Shared-path changes flow through a focused pull request to `main`, pass CI, and receive Control Room review before merge.
- Never force-push, rewrite the bootstrap history, or bypass a failed required check.

## Solo-maintainer exception

CommerceOS currently has one maintainer, `Rizvee355`. Control Room approval
therefore sets required approving reviews to zero and disables mandatory Code
Owner review; GitHub does not allow the PR author to approve their own change.
`CODEOWNERS` remains the ownership reference, and independent review remains
desirable when another qualified reviewer is available.

This exception does not permit direct integration. Changes to `main` still use
pull requests with up-to-date `quality` and `browser-smoke` checks, resolved
conversations, linear history, administrator enforcement, and force-push and
deletion protection. Revisit mandatory review when a second maintainer joins.
