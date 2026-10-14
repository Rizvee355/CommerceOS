# CommerceOS — Mission 001 Bootstrap

Status: independent skeleton only; shared-contract and skeleton approval gates remain pending.

No PromiseGuard or MarginLeak product implementation is active. AMD ACT III Token Factory authenticated inference is a mandatory G0 gate for final integration and submission. This repository remains private until the verified public-release gate.

## Layout
- `apps/control-room/` — reserved, no implementation
- `apps/promiseguard/` — reserved, no implementation
- `apps/marginleak/` — reserved, no implementation
- `packages/contracts/` — shared contracts reserved for review and approval
- `docs/` — evidence and gate records
- `scripts/` — PowerShell 5.1-compatible credential entry helper

## Rules
- Do not implement products before shared contracts and skeleton are approved.
- Use only ACT III Token Factory account-issued API details; no assumed Radeon Cloud endpoint.
- Never commit keys or other secrets.
- Verify public GitHub visibility before hackathon submission.
