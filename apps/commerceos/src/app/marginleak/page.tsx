import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  SiteHeader,
  type NavigationSurface,
} from "../../components/site-header";
import { MarginLeakWorkspace } from "../../features/marginleak/ui/marginleak-workspace";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "MarginLeak Synthetic Development Preview — CommerceOS",
  description:
    "Deterministic order-level contribution-margin variance and leakage reconciliation (synthetic development preview).",
};

const isMarginLeakPreviewAllowed = (): boolean =>
  process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";

export default function MarginLeakPage() {
  if (!isMarginLeakPreviewAllowed()) {
    notFound();
  }

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <SiteHeader current={"marginleak" as unknown as NavigationSurface} />
      <main id="main-content" className="pg-page ml-page">
        <section className="pg-hero ml-hero" aria-labelledby="ml-hero-title">
          <div className="pg-hero-badge-row">
            <span className="mission-tag">
              PLANNED · SYNTHETIC DEVELOPMENT PREVIEW
            </span>
            <span className="pg-capability-tag">
              Module: MarginLeak (G4C Local Preview · Capability: Planned)
            </span>
          </div>
          <h1 id="ml-hero-title" className="pg-hero-title">
            Contribution-Margin Variance &amp; Leakage Intelligence
          </h1>
          <p className="pg-hero-summary">
            Reconcile expected versus observed order economics across all eight
            canonical financial categories in exact minor currency units.
            Distinguish confirmed final leakage from favorable cost offsets,
            provisional pre-settlement variance, and incomplete financial
            evidence.
          </p>
        </section>

        <MarginLeakWorkspace />
      </main>
    </>
  );
}
