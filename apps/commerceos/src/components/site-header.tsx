import Link from "next/link";

export type NavigationSurface = "overview" | "promiseguard" | "social-commerce";

/**
 * Customer-facing CommerceOS navigation shell.
 *
 * Exposes only real, active workflows. Standalone MarginLeak remains gated in
 * production (margin protection is integrated directly inside Order Workspace),
 * and RescueCart remains strictly disabled with no navigation affordance.
 */
export function SiteHeader({ current }: { current: NavigationSurface }) {
  return (
    <header className="site-header-shell">
      <div className="site-header">
        <Link className="wordmark" href="/" aria-label="CommerceOS home">
          <span className="wordmark-mark" aria-hidden="true">
            CO
          </span>
          <span className="wordmark-text">
            <strong>CommerceOS</strong>
            <span className="wordmark-sub">Social Commerce Ops</span>
          </span>
        </Link>

        <nav className="primary-nav" aria-label="Primary">
          <ul>
            <li>
              <Link
                className="nav-item"
                href="/"
                aria-current={current === "overview" ? "page" : undefined}
              >
                Overview
              </Link>
            </li>
            <li>
              <Link
                className="nav-item"
                href="/social-commerce"
                aria-current={
                  current === "social-commerce" ? "page" : undefined
                }
              >
                Order Workspace
              </Link>
            </li>
            <li>
              <Link
                className="nav-item"
                href="/promiseguard"
                aria-current={current === "promiseguard" ? "page" : undefined}
              >
                Fulfilment Readiness
              </Link>
            </li>
          </ul>
        </nav>

        <span
          className="header-env-badge"
          title="Interactive demonstration workspace using synthetic sample data"
        >
          <span className="header-env-dot" aria-hidden="true" />
          Sample Workspace
        </span>
      </div>
    </header>
  );
}
