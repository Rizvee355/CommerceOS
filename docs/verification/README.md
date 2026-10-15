# Foundation verification

Mission G2 is verified without AMD credentials or live provider calls. Run the
same gates locally from the repository root:

```powershell
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm contracts:check
pnpm test:coverage
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
pnpm security:secrets
pnpm security:deps
```

The CI workflow runs these checks in `quality` and `browser-smoke` jobs. Neither
job receives or expects AMD Token Factory credentials.

Generated contract artifacts are committed for consumers, but Zod schemas in
`packages/contracts/src/v1` remain canonical. `pnpm contracts:check` fails when
the generated OpenAPI or JSON Schema output has drifted.
