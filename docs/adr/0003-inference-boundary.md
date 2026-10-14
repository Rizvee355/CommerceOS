# ADR 0003: Replaceable server-only inference boundary

- Status: Accepted by G1
- Date: 2026-10-15

## Decision

Application code depends on an internal `InferenceProvider` interface. G2 supplies a deterministic fixture provider and reserves, but does not speculate about, an AMD Token Factory adapter.

Provider selection is explicit. Live-to-mock fallback is forbidden. Production refuses mock mode unless a later Control Room decision authorizes a public demo mode.

Endpoint, model, headers, authentication, versioning, and payload format remain unresolved until account-issued AMD documentation and authenticated proof are available.
