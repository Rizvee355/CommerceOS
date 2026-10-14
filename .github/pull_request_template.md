## Scope

- Authorized gate/mission:
- Base SHA:
- Summary:

## Verification

- [ ] `pnpm install --frozen-lockfile`
- [ ] `pnpm check`
- [ ] `pnpm test:e2e`
- [ ] `pnpm security:deps`

## Safety review

- [ ] No credentials, customer PII, or raw provider responses
- [ ] No unapproved product behavior or routes
- [ ] No false AMD availability claim
- [ ] Contract changes are approved and generated artifacts are synchronized
- [ ] Mock inference cannot be used silently in production

## Control Room decisions or follow-ups

List unresolved decisions without expanding this pull request's scope.
