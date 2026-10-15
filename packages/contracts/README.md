# Shared contracts

This package contains the approved generic CommerceOS v1 foundation contracts. Zod schemas under `src/v1/` are canonical; OpenAPI 3.1 and JSON Schema files under `generated/` are generated artifacts.

It intentionally contains no PromiseGuard or MarginLeak domain fields or evaluation rules.

```powershell
pnpm --filter @commerceos/contracts generate
pnpm --filter @commerceos/contracts generate:check
pnpm --filter @commerceos/contracts test
```
