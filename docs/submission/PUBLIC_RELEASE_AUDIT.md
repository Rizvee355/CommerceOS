# Public-Release Audit

Audit date: 2026-10-18 Asia/Dhaka

Baseline: `f98264d22eba4e9dfef0359d4b088913ab8993bd`

## Result

**Conditional — do not make public yet.** Code and dependency checks pass, but a root project license has not been selected and public publication remains an explicit operator approval gate.

## Verified

- Current-tree secret scan passed.
- Full-history scan examined 270 unique Git blobs and found zero recognized credential patterns.
- Tracked sensitive-file inventory found only `.env.example`; it contains placeholders, not credentials.
- Production dependency audit found no known high-severity vulnerabilities.
- Production dependency licenses are MIT, Apache-2.0, CC-BY-4.0, ISC, BSD-3-Clause, and 0BSD.
- No real AMD API credential, authorization header, cookie, or provider response was written to the repository.
- Repository remains private.
- MarginLeak production `404`/`403` restrictions passed browser tests.
- Production mock inference remains forbidden.

## Publication blockers

1. **No root license:** the operator must choose and approve the project license before public release.
2. **Commit identity exposure:** Git history contains two author email identities. Publication will expose existing Git metadata; the operator must accept that consequence or decide on a history-rewrite strategy before release.
3. **Internal documentation review:** `docs/control-room/` contains engineering governance and milestone records. No credential was detected, but the operator should decide whether those records are intended for public readers.
4. **AMD eligibility:** live AMD inference is unverified. Public copy must retain the pending-entitlement disclosure.

## Local verification caveat

On this Windows checkout, Git converted tracked LF files to CRLF. `prettier --check .` and generated-contract byte comparisons therefore report every untouched file as different even while `git status` is clean. Substantive checks were run independently. CI on a clean LF checkout is the authoritative format/contract gate for the pull request.
