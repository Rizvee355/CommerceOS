import type { Metadata } from "next";

import { SiteHeader } from "../../components/site-header";
import { SocialCommerceWorkspace } from "../../features/social-commerce/ui/social-commerce-workspace";

export const metadata: Metadata = {
  title: "Social-Commerce Operations Demo — CommerceOS (DIU AIBC 2026)",
  description:
    "Convert Bangla, Banglish, and English Messenger/WhatsApp conversations into structured order drafts with deterministic PromiseGuard fulfilment and MarginLeak BDT margin checks.",
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
