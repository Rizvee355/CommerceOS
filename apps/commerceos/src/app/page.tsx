import Link from "next/link";
import { SiteHeader } from "../components/site-header";
import { moduleRegistry } from "../features/module-registry";

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Paste customer chat",
    detail:
      "Works with Bangla, Banglish, and English messages from Messenger or WhatsApp.",
  },
  {
    step: "02",
    title: "Verify structured order",
    detail:
      "Every extracted item, price, discount, and area is tied to exact message quotes. Missing facts stay blank.",
  },
  {
    step: "03",
    title: "Check fulfilment & profit",
    detail:
      "Validate stock and dispatch timelines alongside an 8-category BDT contribution margin breakdown.",
  },
  {
    step: "04",
    title: "Make the human call",
    detail:
      "Review clear next actions and decide whether to approve or follow up—no order is ever confirmed automatically.",
  },
] as const;

const CAPABILITIES = [
  {
    id: "order-intake",
    badge: "Active workflow",
    badgeTone: "ready" as const,
    title: "Chat-to-Order Intake",
    description:
      "Convert unstructured Bangla, Banglish, and English conversations into structured order drafts with evidence quotes and visible verification flags.",
    href: "/social-commerce",
    cta: "Open Order Workspace",
  },
  {
    id: "promiseguard",
    badge: "Active workflow",
    badgeTone: "ready" as const,
    title: "Fulfilment Readiness (PromiseGuard)",
    description:
      "Check inventory allocation, operational blockers, and packing estimates against customer dispatch deadlines before you commit to delivery.",
    href: "/promiseguard",
    cta: "Check Fulfilment Readiness",
  },
  {
    id: "marginleak",
    badge: "Inside Order Workspace",
    badgeTone: "signal" as const,
    title: "Profit Protection (MarginLeak)",
    description:
      "Compare expected vs. observed BDT contribution margin across discounts, delivery concessions, COGS, courier fees, and COD/bKash charges—never treating missing costs as ৳0.",
    href: "/social-commerce",
    cta: "Analyze Order Profit",
  },
] as const;

const titleCase = (value: string): string =>
  `${value.charAt(0).toUpperCase()}${value.slice(1)}`;

export default function HomePage() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <SiteHeader current="overview" />
      <main id="main-content" className="overview">
        <section className="hero-saas" id="top">
          <div className="hero-saas-copy">
            <p className="eyebrow">
              CommerceOS · Social Commerce Operations Intelligence
            </p>
            <h1>
              Understand every order. Protect every promise. Protect every
              margin.
            </h1>
            <p className="hero-summary">
              Built for Bangladeshi Facebook, Messenger, and WhatsApp sellers.
              Turn messy Bangla, Banglish, and English customer chats into
              verified orders, check fulfilment readiness before promising
              delivery, and catch hidden discount or delivery margin loss before
              dispatch.
            </p>
            <div className="hero-cta-row">
              <Link className="btn-primary" href="/social-commerce">
                Open Order Workspace <span aria-hidden="true">→</span>
              </Link>
              <Link className="btn-secondary" href="/promiseguard">
                Check Fulfilment Readiness
              </Link>
            </div>
            <p className="hero-trust-note">
              Interactive sample workspace · Human approval required for every
              order · No automated messages or live Meta/WhatsApp webhooks
            </p>
          </div>

          <aside
            className="workflow-card"
            aria-label="How CommerceOS works in four steps"
          >
            <p className="workflow-card-title">How the workspace runs</p>
            <ol className="workflow-steps">
              {WORKFLOW_STEPS.map((item) => (
                <li key={item.step} className="workflow-step">
                  <span className="workflow-step-num" aria-hidden="true">
                    {item.step}
                  </span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </aside>
        </section>

        <section
          className="module-section"
          aria-labelledby="capabilities-heading"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">Operations Suite</p>
              <h2 id="capabilities-heading">
                Everything needed to verify an order before dispatch
              </h2>
            </div>
          </div>

          <div className="product-cards-grid">
            {CAPABILITIES.map((cap) => (
              <article
                className="product-card"
                key={cap.id}
                data-testid={`product-card-${cap.id}`}
              >
                <div className="product-card-top">
                  <span className="status-pill-saas" data-tone={cap.badgeTone}>
                    {cap.badge}
                  </span>
                </div>
                <h3>{cap.title}</h3>
                <p>{cap.description}</p>
                <div className="product-card-footer">
                  <Link className="text-link" href={cap.href}>
                    {cap.cta} <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className="roadmap-footnote" data-testid="roadmap-rescuecart">
            <span className="status-pill-saas" data-tone="muted">
              Coming later
            </span>
            <p>
              <strong>RescueCart (Cart &amp; Follow-up Recovery)</strong> is not
              enabled yet and has no active routes in this workspace.
            </p>
          </div>
        </section>

        <section
          className="governance-section"
          aria-label="System and governance details"
        >
          <details className="governance-drawer">
            <summary>
              System &amp; Governance Details (Sample Data, AI Posture &amp;
              Module Registry)
            </summary>
            <div className="governance-body">
              <div className="governance-grid">
                <div>
                  <h3>Safe Demonstration Posture</h3>
                  <p>
                    This workspace uses an anonymized sample Bangladeshi SME
                    catalog and synthetic customer chats. Live Meta/WhatsApp
                    connectors, persistent order databases, and autonomous order
                    confirmations are intentionally disabled.
                  </p>
                  <p>
                    Public live LLM inference remains disabled by default to
                    protect API credentials; deterministic extraction and
                    rule-based evaluations run safely on the server.
                  </p>
                </div>
                <div>
                  <h3>API Capability Registry</h3>
                  <dl className="governance-dl">
                    {moduleRegistry.map((mod) => (
                      <div
                        key={mod.id}
                        data-testid={`capability-${mod.id}`}
                        className="governance-dl-row"
                      >
                        <dt>{mod.label}</dt>
                        <dd>{titleCase(mod.state)}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="governance-links">
                    <a className="text-link" href="/api/v1/capabilities">
                      Inspect /api/v1/capabilities{" "}
                      <span aria-hidden="true">↗</span>
                    </a>
                    <a className="text-link" href="/api/v1/health">
                      Inspect /api/v1/health <span aria-hidden="true">↗</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </details>
        </section>

        <footer className="site-footer">
          <span>CommerceOS · Social Commerce Operations Intelligence</span>
          <span>Sample Workspace · Human-in-the-loop verification</span>
        </footer>
      </main>
    </>
  );
}
