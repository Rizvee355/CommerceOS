# CommerceOS

CommerceOS is one unified commerce-intelligence application prepared for the AMD Developer Hackathon ACT III. Its product modules remain gated:

- PromiseGuard — core product; foundation stub only.
- MarginLeak — secondary product; planned only.
- RescueCart — disabled and excluded from implementation.

Mission 002/G2 authorizes only the modular-monolith skeleton, shared generic contracts, inference abstraction, deterministic mock provider, governance, and automated verification. No product evaluation logic is active.

## Workspace

- `apps/commerceos/` — the only deployable application.
- `packages/contracts/` — canonical Zod contracts and generated OpenAPI/JSON Schema.
- `packages/inference/` — server-only inference interface and deterministic mock.
- `docs/` — architecture, control-room gates, security, and verification records.
- `scripts/` — contract, security, and credential-handling utilities.

## Requirements

- Node.js `24.16.0`
- pnpm `12.4.2`

```powershell
pnpm install --frozen-lockfile
pnpm check
pnpm dev
```

The application runs at `http://localhost:3000`. Health and capability metadata are available at `/api/v1/health` and `/api/v1/capabilities`.

## Safety boundaries

- Never commit secrets or put inference credentials in browser-visible variables.
- CI makes no live provider calls; tests use deterministic mock or explicitly disabled inference.
- Production starts only with inference explicitly `disabled` during G2; mock mode is limited to development and test.
- Live AMD integration remains inactive until authenticated Token Factory proof and a separately approved adapter implementation.
- Shared contracts and inference infrastructure are foundation-owned; product agents submit contract change requests rather than editing those paths independently.
- Verify public GitHub visibility and repository history before hackathon submission.

See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and `docs/control-room/GOVERNANCE.md` before changing shared paths.
