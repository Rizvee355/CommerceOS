export type UiLocale = "en" | "bn";

export const UI_COPY = {
  en: {
    eyebrow: "DIU AIBC 2026 · Domain 9 (CommerceSphere AI) · Synthetic Demo",
    title: "Social-Commerce Operations Intelligence",
    tagline:
      "Understand every order. Protect every promise. Protect every margin.",
    subtitle:
      "Convert messy Bangla, Banglish, and English Messenger/WhatsApp chats into structured, evidence-linked order drafts — then verify dispatch readiness (PromiseGuard) and exact BDT profitability (MarginLeak) before a human confirms the order.",
    demoBannerTitle: "Honest Demonstration Scope:",
    demoBannerBody:
      "Uses synthetic/anonymized conversations and a demo merchant catalog. No live Meta/WhatsApp webhooks and no autonomous order confirmation. Missing facts stay missing until verified by a human.",
    step1Tag: "Step 1 · Conversation Intake",
    step1Title: "Paste or select a customer conversation",
    step1Hint:
      "Supports Bangla (বাংলা), romanized Banglish, and English messages from Messenger, WhatsApp, or Facebook comments.",
    channelLabel: "Channel",
    transcriptLabel: "Customer & merchant conversation",
    transcriptPlaceholder:
      "Customer: Bhaiya 2ta Black Fleece Hoodie XL lagbe Uttara e, 2600 taka rakhben?\nMerchant: Accha apu, kal 2pm er moddhe dispatch korbo.",
    extractBtn: "Extract Structured Order",
    extractingBtn: "Extracting order…",
    resetBtn: "Reset",
    step2Tag: "Step 2 · Extracted Order Draft & Evidence Review",
    step2Title: "Verify extracted facts, uncertainties & operational evidence",
    modeLive: "Live LLM Extraction",
    modeDeterministic:
      "Simulated AI · Deterministic Bangla/Banglish Parser (Live LLM Offline)",
    detectedLang: "Detected language",
    uncertaintiesTitle:
      "Uncertain or missing information — human verification required",
    uncertaintiesHint:
      "CommerceOS never guesses missing prices, discounts, stock, or delivery deadlines. Review and update below before confirming.",
    evidenceQuotesTitle: "Supporting conversation evidence",
    noEvidence: "No supporting quote found in chat",
    catalogMatchLabel: "Demo catalog reference matched (synthetic)",
    catalogNoMatch:
      "Not matched in demo catalog — supply real stock and cost figures manually.",
    orderCardTitle: "Order summary (editable)",
    pgCardTitle: "PromiseGuard fulfilment evidence",
    mlCardTitle: "MarginLeak order economics (BDT ৳)",
    mlCardHint:
      "Leave any unverified amount blank — MarginLeak never turns missing financial inputs into ৳0.00.",
    evaluateBtn: "Run PromiseGuard & MarginLeak Audit",
    evaluatingBtn: "Evaluating…",
    step3Tag: "Step 3 · Deterministic Fulfilment, Margin & Human Review",
    step3Title: "Operational decision report",
    humanGateTitle: "Human-in-the-loop control",
    humanGateNote:
      "Autonomous order confirmation and customer messaging are disabled by design. A human operator must decide the next step.",
    holdForReview: "Hold for Human Review",
    readyForConfirmation: "Ready for Manual Confirmation",
    pgResultTitle: "PromiseGuard — Fulfilment Readiness",
    mlResultTitle: "MarginLeak — Contribution Margin (BDT)",
    actionsTitle: "Recommended next actions",
    decisionConfirmBtn: "Approve & Mark Ready (Local Demo)",
    decisionFollowUpBtn: "Flag for Customer Clarification (Local Demo)",
    decisionConfirmedMsg:
      "Human review recorded locally: Order approved for manual fulfillment (no external message or order mutation performed).",
    decisionFollowUpMsg:
      "Human review recorded locally: Order held pending customer reply in Messenger/WhatsApp.",
    archSummary:
      "Architecture, AI model boundaries & Responsible AI safeguards",
  },
  bn: {
    eyebrow: "DIU AIBC 2026 · CommerceSphere AI · সিন্থেটিক ডেমো",
    title: "সোশ্যাল-কমার্স অপারেশনস ইন্টেলিজেন্স",
    tagline: "প্রতিটি অর্ডার বুঝুন। প্রতিটি প্রতিশ্রুতি ও লাভ রক্ষা করুন।",
    subtitle:
      "মেসেঞ্জার বা হোয়াটসঅ্যাপের বাংলা, বাংলিশ ও ইংরেজি চ্যাট থেকে প্রমাণসহ স্ট্রাকচার্ড অর্ডার তৈরি করুন — এরপর মানুষের অনুমোদনের আগে PromiseGuard দিয়ে ডিসপ্যাচ ঝুঁকি এবং MarginLeak দিয়ে টাকায় (৳) নিখুঁত লাভ যাচাই করুন।",
    demoBannerTitle: "স্বচ্ছ ডেমো সীমারেখা:",
    demoBannerBody:
      "এখানে সিন্থেটিক/বেনামী চ্যাট ও ডেমো ক্যাটালগ ব্যবহৃত হয়েছে। কোনো লাইভ Meta/WhatsApp ওয়েবহুক বা স্বয়ংক্রিয় অর্ডার কনফার্মেশন নেই। অজানা তথ্য কখনোই অনুমান করা হয় না।",
    step1Tag: "ধাপ ১ · ক্রেতার চ্যাট ইনপুট",
    step1Title: "ক্রেতার কথোপকথন পেস্ট করুন বা নমুনা বেছে নিন",
    step1Hint:
      "মেসেঞ্জার, হোয়াটসঅ্যাপ বা ফেসবুক কমেন্টের বাংলা, বাংলিশ ও ইংরেজি চ্যাট সমর্থিত।",
    channelLabel: "চ্যানেল",
    transcriptLabel: "ক্রেতা ও বিক্রেতার কথোপকথন",
    transcriptPlaceholder:
      "ক্রেতা: ভাইয়া ২টা কালো হুডি XL উত্তরায় পাঠাতে হবে...\nদোকান: জ্বী আগামীকাল ২টার মধ্যে ডিসপ্যাচ করবো।",
    extractBtn: "অর্ডার তথ্য বের করুন",
    extractingBtn: "বিশ্লেষণ চলছে…",
    resetBtn: "রিসেট",
    step2Tag: "ধাপ ২ · প্রাপ্ত অর্ডার তথ্য ও প্রমাণ যাচাই",
    step2Title: "প্রাপ্ত তথ্য, অস্পষ্টতা এবং স্টক/খরচের প্রমাণ যাচাই করুন",
    modeLive: "লাইভ LLM এক্সট্রাকশন",
    modeDeterministic:
      "সিমুলেটেড AI · ডিটারমিনিস্টিক বাংলা/বাংলিশ পার্সার (লাইভ LLM অফলাইন)",
    detectedLang: "শনাক্তকৃত ভাষা",
    uncertaintiesTitle: "অনিশ্চিত বা অনুপস্থিত তথ্য — মানুষের যাচাই প্রয়োজন",
    uncertaintiesHint:
      "CommerceOS কখনোই দাম, ছাড়, স্টক বা সময়সীমা অনুমান করে না। কনফার্ম করার আগে নিচে যাচাই করুন।",
    evidenceQuotesTitle: "চ্যাট থেকে সমর্থনকারী উদ্ধৃতি",
    noEvidence: "চ্যাটে কোনো সরাসরি প্রমাণ পাওয়া যায়নি",
    catalogMatchLabel: "ডেমো ক্যাটালগ রেফারেন্স মিলেছে (সিন্থেটিক)",
    catalogNoMatch:
      "ডেমো ক্যাটালগে পাওয়া যায়নি — আসল স্টক ও খরচের তথ্য ম্যানুয়ালি দিন।",
    orderCardTitle: "অর্ডার সারসংক্ষেপ (সম্পাদনাযোগ্য)",
    pgCardTitle: "PromiseGuard ডিসপ্যাচ ও স্টক তথ্য",
    mlCardTitle: "MarginLeak অর্ডার লাভ-ক্ষতির হিসাব (BDT ৳)",
    mlCardHint:
      "অজানা খরচের ঘর খালি রাখুন — অনুপস্থিত তথ্য কখনোই ৳০.০০ ধরা হয় না।",
    evaluateBtn: "PromiseGuard ও MarginLeak যাচাই করুন",
    evaluatingBtn: "হিসাব চলছে…",
    step3Tag: "ধাপ ৩ · ডিটারমিনিস্টিক ডিসপ্যাচ, মার্জিন ও মানবিক অনুমোদন",
    step3Title: "অপারেশনাল সিদ্ধান্ত রিপোর্ট",
    humanGateTitle: "মানবিক নিয়ন্ত্রণ (Human-in-the-Loop)",
    humanGateNote:
      "স্বয়ংক্রিয় অর্ডার কনফার্মেশন বা ক্রেতাকে মেসেজ পাঠানো বন্ধ রাখা আছে। চূড়ান্ত সিদ্ধান্ত একজন মানুষ নেবেন।",
    holdForReview: "মানবিক যাচাইয়ের জন্য স্থগিত",
    readyForConfirmation: "ম্যানুয়াল কনফার্মেশনের জন্য প্রস্তুত",
    pgResultTitle: "PromiseGuard — ডিসপ্যাচ প্রস্তুতি",
    mlResultTitle: "MarginLeak — কন্ট্রিবিউশন মার্জিন (BDT)",
    actionsTitle: "পরবর্তী করণীয়",
    decisionConfirmBtn: "অনুমোদন ও প্রস্তুত চিহ্নিত করুন (লোকাল ডেমো)",
    decisionFollowUpBtn: "ক্রেতার সাথে যাচাইয়ের জন্য রাখুন (লোকাল ডেমো)",
    decisionConfirmedMsg:
      "লোকাল ডেমো সিদ্ধান্ত সংরক্ষিত: অর্ডারটি ম্যানুয়াল ডিসপ্যাচের জন্য অনুমোদিত (কোনো বাহ্যিক মেসেজ পাঠানো হয়নি)।",
    decisionFollowUpMsg:
      "লোকাল ডেমো সিদ্ধান্ত সংরক্ষিত: ক্রেতার উত্তরের জন্য অর্ডারটি হোল্ড করা হয়েছে।",
    archSummary: "আর্কিটেকচার, AI মডেল সীমারেখা ও দায়িত্বশীল AI সুরক্ষা",
  },
} as const;

export const CONFIDENCE_LABELS = {
  en: {
    high: "High confidence",
    medium: "Medium — verify",
    low: "Low — ambiguous",
    missing: "Missing",
  },
  bn: {
    high: "উচ্চ নিশ্চয়তা",
    medium: "মাঝারি — যাচাই করুন",
    low: "কম — অস্পষ্ট",
    missing: "অনুপস্থিত",
  },
} as const;

export const CATEGORY_LABELS_BILINGUAL = {
  grossItemRevenue: { en: "Gross item revenue", bn: "মোট পণ্যের বিক্রয়মূল্য" },
  shippingRevenue: {
    en: "Customer delivery charge",
    bn: "ক্রেতার ডেলিভারি চার্জ",
  },
  discounts: { en: "Discounts & chat concessions", bn: "ছাড় ও ডিসকাউন্ট" },
  cogs: { en: "Cost of goods sold (COGS)", bn: "পণ্যের ক্রয়মূল্য (COGS)" },
  shippingCost: { en: "Courier shipping cost", bn: "কুরিয়ার খরচ" },
  fulfillmentCost: { en: "Packaging & handling", bn: "প্যাকেজিং ও হ্যান্ডলিং" },
  paymentCost: { en: "COD / bKash payment fee", bn: "COD / বিকাশ চার্জ" },
  platformCost: { en: "Platform / ad commission", bn: "প্ল্যাটফর্ম কমিশন" },
} as const;
