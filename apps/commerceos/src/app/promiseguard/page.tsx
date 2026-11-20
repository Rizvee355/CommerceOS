import type { Metadata } from "next";
import { SiteHeader } from "../../components/site-header";
import { PromiseGuardWorkspace } from "../../features/promiseguard/ui/promiseguard-workspace";

export const metadata: Metadata = {
  title: "Fulfilment Readiness (PromiseGuard) — CommerceOS",
  description:
    "Deterministic dispatch readiness evaluation for order stock, blockers, and packing estimates.",
};

export default function PromiseGuardPage() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <SiteHeader current="promiseguard" />
      <main id="main-content" className="pg-page">
        <section className="pg-hero" aria-labelledby="pg-hero-title">
          <div className="pg-hero-badge-row">
            <span className="mission-tag">
              Fulfilment Readiness · Sample Workspace
            </span>
            <span className="pg-capability-tag">
              PromiseGuard · Deterministic Verification
            </span>
          </div>
          <h1 id="pg-hero-title" className="pg-hero-title">
            Dispatch Readiness Intelligence
          </h1>
          <p className="pg-hero-summary">
            Verify whether current inventory allocation, operational blockers,
            and packing estimates support a customer dispatch commitment before
            the deadline passes.
          </p>
        </section>

        <PromiseGuardWorkspace />
      </main>
    </>
  );
}
