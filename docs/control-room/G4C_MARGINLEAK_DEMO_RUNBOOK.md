# CommerceOS — G4C MarginLeak Synthetic Demonstration Runbook

**Module:** `marginleak` (Order-Level Contribution-Margin Variance & Leakage Intelligence)  
**Contract Version:** `schemaVersion: "1.0"`  
**Ruleset Version:** `marginleak-deterministic-v1`  
**Human-Review Policy:** `marginleak-review-policy-v1`  
**Capability Registry State:** `planned` (`routes: []`)

---

## 1. Why `MarginLeak` Remains `"planned"` in Production

In CommerceOS, `moduleRegistry` (`apps/commerceos/src/features/module-registry.ts`) is the single source of truth for public capability status across the Overview page (`/`), the unified `SiteHeader`, and `GET /api/v1/capabilities`.

During Milestone G4 (G4A Domain + G4B Contracts/API + G4C Synthetic Product Experience):

- `MarginLeak` evaluates **synthetic order-level fixtures only** (`scenario.synthetic: true`) using a deterministic ruleset (`marginleak-deterministic-v1`).
- It does not yet ingest live merchant ERP/settlement webhooks or authenticated tenant ledgers.
- Therefore, `MarginLeak` remains honestly classified as **`planned`** (`routes: []`) in `moduleRegistry`, and `SiteHeader` renders `MarginLeak Planned` as inert text rather than a public production navigation link.

---

## 2. Why `POST /api/v1/marginleak/analyze` Returns HTTP `403` Outside `development` and `test`

The G4B route handler (`apps/commerceos/src/app/api/v1/marginleak/analyze/route.ts`) enforces a strict runtime gate:

```ts
const isPreviewRuntimeAllowed = (): boolean =>
  process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";
```

When `NODE_ENV` is `"production"` (or any value other than `"development"` or `"test"`), `POST /api/v1/marginleak/analyze` fails closed immediately before reading the request body:

- **HTTP Status:** `403 Forbidden`
- **Error Code:** `MARGINLEAK_PREVIEW_UNAVAILABLE`
- **Category:** `authorization`
- **Retryable:** `false`
- **Message:** `"The MarginLeak synthetic preview is unavailable."`

This guarantees that an unauthenticated production deployment cannot be used as an open financial calculation endpoint for a module whose public capability state is still `"planned"`.

---

## 3. Why `/marginleak` Is Server-Restricted in Production

To align the frontend route with the G4B API boundary, `apps/commerceos/src/app/marginleak/page.tsx` enforces the same environment check **on the server** (`export const dynamic = "force-dynamic"`):

- **In `development` and `test` (`NODE_ENV === "development" || NODE_ENV === "test"`):**
  - Renders the interactive synthetic workspace clearly badged:
    `PLANNED · SYNTHETIC DEVELOPMENT PREVIEW`
- **In `production` (`NODE_ENV === "production"`):**
  - Invokes Next.js `notFound()` on the server, returning **HTTP `404`** without rendering or hydrating any form, scenario picker, or operational dashboard.
- **Defence-in-depth UI handling:**
  - If the client workspace ever receives an HTTP `403` `MARGINLEAK_PREVIEW_UNAVAILABLE` envelope from `/api/v1/marginleak/analyze`, it renders the non-retryable `#ml-restricted-state` governance explanation panel and never displays copyable commands encouraging visitors to launch a development server on a public host.

---

## 4. Launching the Local Synthetic Development Demo Safely

Run the local development server bound strictly to loopback (`127.0.0.1`):

```bash
pnpm --filter @commerceos/app dev --hostname 127.0.0.1 --port 3000
```

Then open:

```text
http://127.0.0.1:3000/marginleak
```

> **Safety Note:** Always bind `--hostname 127.0.0.1` for local demonstrations so the development server is only reachable on the local machine.

---

## 5. 3–4 Minute Presenter Walkthrough

### Minute 0:00–0:45 — Framing & Scenario 1: Confirmed Margin Leakage (`leak_detected`)

1. Open `http://127.0.0.1:3000/marginleak` and point out the top badge: **`PLANNED · SYNTHETIC DEVELOPMENT PREVIEW`** and the inert **`MarginLeak Planned`** tag in the header.
2. Explain that **Scenario 1 (`Confirmed margin leakage`)** is selected by default (`ORDER-SYN-LEAK-01`, `USD`, `observationState: "final"`).
3. Click **Run Margin Analysis**.
4. Highlight the 4 KPI cards:
   - **Expected Contribution Margin:** `$49.00` (`4,900` minor units)
   - **Observed Contribution Margin:** `$43.50` (`4,350` minor units)
   - **Net Contribution Variance:** `+$5.50 · Adverse to expected margin` (`+550` minor units)
   - **Confirmed Leak Amount:** `$5.50` (`550` minor units · Final confirmed variance, not guaranteed recoverable cash)
5. Scroll to the **8-Category Variance Ledger** and **Deterministic Audit Findings** (`4` adverse drivers: Gross item revenue `+$2.00` adverse, Discounts `+$1.50` adverse, Carrier shipping cost `+$1.75` adverse, Payment processing fee `+$0.25` adverse).
6. Point out **Human Review Required** (`MARGINLEAK_LEAK_DETECTED`).

### Minute 0:45–1:30 — Scenario 2: Favorable Cost Offset / No Leak (`no_leak`)

1. Select **Scenario 2 (`Favorable cost offset`)** (`ORDER-SYN-NO-LEAK-01`). Notice how switching scenarios **immediately clears** the Scenario 1 results so stale numbers never linger.
2. Click **Run Margin Analysis**.
3. Highlight the math:
   - Although **Gross item revenue** dipped by `$1.00` (`+$1.00 adverse`), **COGS** came in `$2.50` lower (`-$2.50 favorable`) and **Carrier shipping cost** came in `$1.50` lower (`-$1.50 favorable`).
   - **Expected Contribution Margin:** `$49.00` (`4,900` minor units)
   - **Observed Contribution Margin:** `$52.00` (`5,200` minor units)
   - **Net Contribution Variance:** `-$3.00 · Favorable to expected margin` (`-300` minor units)
   - **Confirmed Leak Amount:** `$0.00` (`0` minor units)
   - **Governance:** `No Review Required` (`analysisStatus: "complete"`).

### Minute 1:30–2:15 — Scenario 3: Provisional Unsettled Evidence (`provisional`)

1. Select **Scenario 3 (`Provisional unsettled evidence`)** (`ORDER-SYN-PROV-01`, `observationState: "provisional"`).
2. Click **Run Margin Analysis**.
3. Contrast the variance card with the leak card:
   - **Expected Contribution Margin:** `$49.00` (`4,900` minor units)
   - **Observed Contribution Margin:** `$46.75` (`4,675` minor units)
   - **Net Contribution Variance:** `+$2.25 · Adverse to expected margin` (`+225` minor units)
   - **Confirmed Leak Amount:** **`Unconfirmed — provisional evidence`** (`leakAmount: null`)
   - Explain why: pre-settlement carrier bills and discounts can still change, so MarginLeak refuses to book provisional variance as confirmed leakage and routes to **Human Review Required** (`MARGINLEAK_PROVISIONAL_INPUTS`).

### Minute 2:15–3:15 — Scenario 4: Incomplete Evidence & Live Recovery (`incomplete`)

1. Select **Scenario 4 (`Incomplete financial evidence`)** (`ORDER-SYN-INCOMPLETE-01`).
2. Click **Run Margin Analysis**.
3. Point out that all 4 KPI cards display **`Not calculable — evidence incomplete`** (`null`), and the ledger flags **`Observed COGS`** (`/financials/cogs/observed`) and **`Expected Platform fee`** (`/financials/platformCost/expected`) as missing.
4. Emphasize the core rule: **MarginLeak never substitutes `$0.00` for missing financial inputs.**
5. Click **`Supply Observed COGS`** in the findings card—focus jumps directly to the `Include observed` checkbox for COGS. Check it (`4000` minor units), then check `Include expected` for **Platform / marketplace fee** (`200` minor units).
6. Click **Run Margin Analysis** again: all `16/16` observations are now present, and the order resolves cleanly!

### Minute 3:15–4:00 — Negative-Margin Loss-Leader Helper (`no_leak_detected`)

1. Click **Load loss-leader example (-$1.00 margin)** in the form toolbar, then click **Run Margin Analysis**.
2. Point out the result:
   - **Expected Contribution Margin:** `-$2.00` (`-200` minor units)
   - **Observed Contribution Margin:** `-$1.00` (`-100` minor units) with badge: **`Negative contribution margin · Not a leak when matching or beating expected margin`**
   - **Net Contribution Variance:** `-$1.00 · Favorable to expected margin` (`-100` minor units)
   - **Confirmed Leak Amount:** `$0.00` (`No Leak Detected`)

---

## 6. Reference Table: Expected Scenario Numbers & Outputs

| Scenario / Helper                                 | Order Ref                 | Completeness         | Finality      | Expected Margin           | Observed Margin           | Signed Net Variance (`Expected − Observed`)      | Confirmed Leak Amount                           | Assessment & Review                                                  |
| :------------------------------------------------ | :------------------------ | :------------------- | :------------ | :------------------------ | :------------------------ | :----------------------------------------------- | :---------------------------------------------- | :------------------------------------------------------------------- |
| **1. Confirmed Leak** (`leak_detected`)           | `ORDER-SYN-LEAK-01`       | `complete` (16/16)   | `final`       | `$49.00` (`4900`)         | `$43.50` (`4350`)         | `+$5.50 · Adverse to expected margin` (`+550`)   | `$5.50` (`550`)                                 | `leak_detected` · Review Required (`MARGINLEAK_LEAK_DETECTED`)       |
| **2. Favorable Offset** (`no_leak`)               | `ORDER-SYN-NO-LEAK-01`    | `complete` (16/16)   | `final`       | `$49.00` (`4900`)         | `$52.00` (`5200`)         | `-$3.00 · Favorable to expected margin` (`-300`) | `$0.00` (`0`)                                   | `no_leak_detected` · No Review Required                              |
| **3. Provisional Evidence** (`provisional`)       | `ORDER-SYN-PROV-01`       | `complete` (16/16)   | `provisional` | `$49.00` (`4900`)         | `$46.75` (`4675`)         | `+$2.25 · Adverse to expected margin` (`+225`)   | `Unconfirmed — provisional evidence` (`null`)   | `indeterminate` · Review Required (`MARGINLEAK_PROVISIONAL_INPUTS`)  |
| **4. Incomplete Evidence** (`incomplete`)         | `ORDER-SYN-INCOMPLETE-01` | `incomplete` (14/16) | `final`       | `Not calculable` (`null`) | `Not calculable` (`null`) | `Not calculable — evidence incomplete` (`null`)  | `Not calculable — evidence incomplete` (`null`) | `indeterminate` · Review Required (`MARGINLEAK_EVIDENCE_INCOMPLETE`) |
| **Loss-Leader Helper** (`ml-loss-leader-no-leak`) | `ORDER-SYN-LOSS-LEADER`   | `complete` (16/16)   | `final`       | `-$2.00` (`-200`)         | `-$1.00` (`-100`)         | `-$1.00 · Favorable to expected margin` (`-100`) | `$0.00` (`0`)                                   | `no_leak_detected` · No Review Required                              |

---

## 7. Security Requirements Before Any Future Hosted Public Demo Is Allowed

Before MarginLeak may be exposed on a publicly hosted deployment outside `NODE_ENV=development` / `NODE_ENV=test`, the following architectural controls are required:

1. **Authenticated Operator Access:** Require verified session authentication or short-lived signed operator capability tokens on both `/marginleak` and `POST /api/v1/marginleak/analyze`.
2. **Per-Identity Rate Limiting & Abuse Controls:** Enforce strict request-rate and payload budgets on `/api/v1/marginleak/analyze`.
3. **Explicit Preview Governance Flag:** Replace raw `NODE_ENV` checks with an explicit, audited preview configuration gate bound to authenticated demo tenants.
4. **Control Room Capability Promotion:** Only update `moduleRegistry` and `SiteHeader` after Control Room sign-off on production readiness.
