# Shared contracts

This package contains the approved CommerceOS v1 foundation contracts and the synthetic-only PromiseGuard G3B domain contracts. Zod schemas under `src/v1/` are canonical; OpenAPI 3.1 and JSON Schema files under `generated/` are generated artifacts.

MarginLeak domain fields and all live-provider protocols remain intentionally absent. PromiseGuard deterministic rules live in the application feature boundary rather than in this contract package.

```powershell
pnpm --filter @commerceos/contracts generate
pnpm --filter @commerceos/contracts generate:check
pnpm --filter @commerceos/contracts test
```
