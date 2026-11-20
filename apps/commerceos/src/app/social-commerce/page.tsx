import type { Metadata } from "next";

import { SiteHeader } from "../../components/site-header";
import { SocialCommerceWorkspace } from "../../features/social-commerce/ui/social-commerce-workspace";

export const metadata: Metadata = {
  title: "Order Workspace — CommerceOS",
  description:
    "Convert Bangla, Banglish, and English Messenger/WhatsApp conversations into verified order drafts with deterministic fulfilment readiness and BDT profit analysis.",
};

export default function SocialCommercePage() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <SiteHeader current="social-commerce" />
      <main id="main-content" className="pg-page sc-page">
        <SocialCommerceWorkspace />
      </main>
    </>
  );
}
