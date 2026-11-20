export type UiLocale = "en" | "bn";

export const UI_COPY = {
  en: {
    eyebrow: "Order Operations Workspace · Sample Data",
    title: "Social-Commerce Order Workspace",
    tagline:
      "Understand every order. Protect every promise. Protect every margin.",
    subtitle:
      "Turn messy Bangla, Banglish, and English Messenger or WhatsApp chats into structured orders, verify fulfilment readiness, and check exact BDT profitability before confirming.",
    demoBannerTitle: "Sample Workspace:",
    demoBannerBody:
      "Uses anonymized chats and a sample Bangladeshi SME catalog. Live Meta/WhatsApp webhooks and automatic order confirmations are off—missing details stay blank until you confirm them.",
    step1Short: "Customer Chat",
    step2Short: "Verify Order & Costs",
    step3Short: "Readiness & Profit",
    step1Tag: "Step 1 · Conversation Intake",
    step1Title: "Paste or select a customer conversation",
    step1Hint:
      "Supports Bangla (বাংলা), Banglish, and English messages from Messenger, WhatsApp, or Facebook comments.",
    channelLabel: "Channel",
    transcriptLabel: "Customer & merchant conversation",
    transcriptPlaceholder:
      "Customer: Bhaiya 2ta Black Fleece Hoodie XL lagbe Uttara e, 2600 taka rakhben?\nMerchant: Accha apu, kal 2pm er moddhe dispatch korbo.",
    extractBtn: "Extract Structured Order",
    extractingBtn: "Extracting order…",
    resetBtn: "Reset Sample",
    step2Tag: "Step 2 · Order Verification & Economics",
    step2Title: "Verify extracted details, stock status & BDT costs",
    modeLive: "Live AI Extraction",
    modeDeterministic: "Deterministic Bangla/Banglish Parser (Live AI offline)",
    detectedLang: "Detected language",
    uncertaintiesTitle: "Needs your confirmation before approving",
    uncertaintiesHint:
      "CommerceOS never invents missing prices, discounts, stock, or delivery deadlines. Review flagged items below.",
    evidenceQuotesTitle: "Supporting message quote",
    noEvidence: "Not stated in chat",
    catalogMatchLabel: "Sample catalog reference matched",
    catalogNoMatch:
      "Not in sample catalog — enter real stock and cost figures manually below.",
    orderCardTitle: "Order summary (editable)",
    pgCardTitle: "Fulfilment & dispatch details",
    mlCardTitle: "Order pricing & costs (BDT ৳)",
    mlCardHint:
      "Leave any unknown amount blank — missing financial values are never treated as ৳0.00.",
    evaluateBtn: "Check Fulfilment & Profit",
    evaluatingBtn: "Checking…",
    step3Tag: "Step 3 · Fulfilment Readiness & Profit Report",
    step3Title: "Order decision summary",
    humanGateTitle: "Human Approval Required",
    humanGateNote:
      "CommerceOS never sends customer replies or confirms orders automatically. Review the findings below and choose your next step.",
    holdForReview: "Hold for Review",
    readyForConfirmation: "Ready for Manual Confirmation",
    pgResultTitle: "Fulfilment Readiness (PromiseGuard)",
    mlResultTitle: "Profit & Margin Analysis (MarginLeak)",
    ledgerTitle: "8-Category Contribution Margin Ledger (BDT)",
    actionsTitle: "Recommended next steps",
    decisionConfirmBtn: "Approve & Mark Ready (Local Demo)",
    decisionFollowUpBtn: "Hold for Customer Reply (Local Demo)",
    decisionConfirmedMsg:
      "Decision saved locally: Order marked ready for manual fulfilment (no external message or order change sent).",
    decisionFollowUpMsg:
      "Decision saved locally: Order held pending customer confirmation in Messenger or WhatsApp.",
    archSummary: "Technical Audit Details & Governance Boundaries",
  },
  bn: {
    eyebrow: "অর্ডার অপারেশনস ওয়ার্কস্পেস · নমুনা ডেটা",
    title: "সোশ্যাল-কমার্স অর্ডার ওয়ার্কস্পেস",
    tagline: "প্রতিটি অর্ডার বুঝুন। প্রতিটি প্রতিশ্রুতি ও লাভ রক্ষা করুন।",
    subtitle:
      "মেসেঞ্জার বা হোয়াটসঅ্যাপের বাংলা, বাংলিশ ও ইংরেজি চ্যাট থেকে প্রমাণসহ স্ট্রাকচার্ড অর্ডার তৈরি করুন, ডিসপ্যাচ প্রস্তুতি যাচাই করুন এবং কনফার্ম করার আগে টাকায় (৳) আসল লাভ দেখুন।",
    demoBannerTitle: "নমুনা ওয়ার্কস্পেস:",
    demoBannerBody:
      "এখানে বেনামী চ্যাট ও নমুনা বাংলাদেশি ক্যাটালগ ব্যবহৃত হয়েছে। লাইভ Meta/WhatsApp সংযোগ বা স্বয়ংক্রিয় কনফার্মেশন বন্ধ আছে—অজানা তথ্য আপনার যাচাই ছাড়া পূরণ করা হয় না।",
    step1Short: "ক্রেতার চ্যাট",
    step2Short: "অর্ডার ও খরচ যাচাই",
    step3Short: "প্রস্তুতি ও লাভ রিপোর্ট",
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
    step2Tag: "ধাপ ২ · অর্ডার ও খরচের প্রমাণ যাচাই",
    step2Title: "প্রাপ্ত তথ্য, স্টক অবস্থা এবং টাকার (৳) খরচ যাচাই করুন",
    modeLive: "লাইভ AI এক্সট্রাকশন",
    modeDeterministic: "ডিটারমিনিস্টিক বাংলা/বাংলিশ পার্সার (লাইভ AI অফলাইন)",
    detectedLang: "শনাক্তকৃত ভাষা",
    uncertaintiesTitle: "অনুমোদনের আগে আপনার যাচাই প্রয়োজন",
    uncertaintiesHint:
      "CommerceOS কখনোই দাম, ছাড়, স্টক বা সময়সীমা অনুমান করে না। নিচের চিহ্নিত বিষয়গুলো যাচাই করুন।",
    evidenceQuotesTitle: "চ্যাটের উদ্ধৃতি",
    noEvidence: "চ্যাটে উল্লেখ পাওয়া যায়নি",
    catalogMatchLabel: "নমুনা ক্যাটালগ রেফারেন্স মিলেছে",
    catalogNoMatch:
      "নমুনা ক্যাটালগে পাওয়া যায়নি — আসল স্টক ও খরচের তথ্য নিচে ম্যানুয়ালি দিন।",
    orderCardTitle: "অর্ডার সারসংক্ষেপ (সম্পাদনাযোগ্য)",
    pgCardTitle: "ডিসপ্যাচ ও স্টক তথ্য",
    mlCardTitle: "অর্ডার মূল্য ও খরচের হিসাব (BDT ৳)",
    mlCardHint:
      "অজানা খরচের ঘর খালি রাখুন — অনুপস্থিত তথ্য কখনোই ৳০.০০ ধরা হয় না।",
    evaluateBtn: "ডিসপ্যাচ ও লাভ যাচাই করুন",
    evaluatingBtn: "হিসাব চলছে…",
    step3Tag: "ধাপ ৩ · ডিসপ্যাচ প্রস্তুতি ও লাভ রিপোর্ট",
    step3Title: "অর্ডার সিদ্ধান্ত সারসংক্ষেপ",
    humanGateTitle: "মানবিক অনুমোদন প্রয়োজন",
    humanGateNote:
      "CommerceOS কখনোই স্বয়ংক্রিয়ভাবে ক্রেতাকে রিপ্লাই দেয় না বা অর্ডার কনফার্ম করে না। নিচের ফলাফল দেখে চূড়ান্ত সিদ্ধান্ত নিন।",
    holdForReview: "যাচাইয়ের জন্য স্থগিত",
    readyForConfirmation: "ম্যানুয়াল কনফার্মেশনের জন্য প্রস্তুত",
    pgResultTitle: "ডিসপ্যাচ প্রস্তুতি (PromiseGuard)",
    mlResultTitle: "লাভ ও মার্জিন বিশ্লেষণ (MarginLeak)",
    ledgerTitle: "৮-ক্যাটাগরি কন্ট্রিবিউশন মার্জিন লেজার (BDT)",
    actionsTitle: "পরবর্তী করণীয়",
    decisionConfirmBtn: "অনুমোদন ও প্রস্তুত চিহ্নিত করুন (লোকাল ডেমো)",
    decisionFollowUpBtn: "ক্রেতার উত্তরের জন্য হোল্ড করুন (লোকাল ডেমো)",
    decisionConfirmedMsg:
      "লোকাল ডেমো সিদ্ধান্ত সংরক্ষিত: অর্ডারটি ম্যানুয়াল ডিসপ্যাচের জন্য প্রস্তুত চিহ্নিত হয়েছে (কোনো বাহ্যিক মেসেজ পাঠানো হয়নি)।",
    decisionFollowUpMsg:
      "লোকাল ডেমো সিদ্ধান্ত সংরক্ষিত: ক্রেতার উত্তরের জন্য অর্ডারটি হোল্ড করা হয়েছে।",
    archSummary: "টেকনিক্যাল অডিট ও গভর্ন্যান্স বিবরণ",
  },
} as const;

export const CONFIDENCE_LABELS = {
  en: {
    high: "Verified from chat",
    medium: "Verify detail",
    low: "Ambiguous",
    missing: "Missing",
  },
  bn: {
    high: "চ্যাট থেকে নিশ্চিত",
    medium: "যাচাই করুন",
    low: "অস্পষ্ট",
    missing: "অনুপস্থিত",
  },
} as const;

export const FIELD_LABELS_BILINGUAL: Record<
  string,
  { en: string; bn: string }
> = {
  productName: { en: "Product", bn: "পণ্য" },
  quantity: { en: "Quantity", bn: "পরিমাণ" },
  agreedTotalPriceMinor: {
    en: "Agreed Selling Price",
    bn: "সম্মত বিক্রয়মূল্য",
  },
  agreedDiscountMinor: { en: "Discount", bn: "ছাড় / ডিসকাউন্ট" },
  deliveryLocation: { en: "Delivery Address", bn: "ডেলিভারি ঠিকানা" },
  deliveryChargeMinor: { en: "Delivery Charge", bn: "ডেলিভারি চার্জ" },
  promisedTimelineText: { en: "Dispatch Timeline", bn: "ডিসপ্যাচ সময়সীমা" },
};

export const CATEGORY_LABELS_BILINGUAL = {
  grossItemRevenue: {
    en: "Gross item revenue",
    bn: "মোট পণ্যের বিক্রয়মূল্য",
    hintEn:
      "Selling price before chat discounts (list price vs. quoted price).",
    hintBn: "ছাড় বাদ দেওয়ার আগের বিক্রয়মূল্য (ক্যাটালগ বনাম চ্যাটের দাম)।",
    role: "revenue" as const,
  },
  shippingRevenue: {
    en: "Customer delivery charge",
    bn: "ক্রেতার ডেলিভারি চার্জ",
    hintEn: "Delivery fee paid by the customer (৳0 if free delivery promised).",
    hintBn: "ক্রেতার দেওয়া ডেলিভারি চার্জ (ফ্রি ডেলিভারি হলে ৳০)।",
    role: "revenue" as const,
  },
  discounts: {
    en: "Discounts & chat concessions",
    bn: "ছাড় ও ডিসকাউন্ট",
    hintEn: "Price reductions or coupons agreed in the chat.",
    hintBn: "চ্যাটে সম্মত ছাড় বা ডিসকাউন্টের পরিমাণ।",
    role: "deduction" as const,
  },
  cogs: {
    en: "Cost of goods sold (COGS)",
    bn: "পণ্যের ক্রয়মূল্য (COGS)",
    hintEn: "Wholesale or manufacturing cost multiplied by order quantity.",
    hintBn: "প্রতি পিসের ক্রয়মূল্য × মোট পণ্যের সংখ্যা।",
    role: "deduction" as const,
  },
  shippingCost: {
    en: "Courier shipping cost",
    bn: "কুরিয়ার খরচ",
    hintEn: "Actual courier fee you pay (e.g., inside/outside Dhaka rate).",
    hintBn: "কুরিয়ার কোম্পানিকে আপনার পরিশোধিত ডেলিভারি খরচ।",
    role: "deduction" as const,
  },
  fulfillmentCost: {
    en: "Packaging & handling",
    bn: "প্যাকেজিং ও হ্যান্ডলিং",
    hintEn: "Box, polybag, label, and packing handling cost.",
    hintBn: "বক্স, পলিব্যাগ, লেবেল ও প্যাকিং খরচ।",
    role: "deduction" as const,
  },
  paymentCost: {
    en: "COD / bKash payment fee",
    bn: "COD / বিকাশ চার্জ",
    hintEn: "Estimated 1.0% COD or 1.5% bKash/Nagad settlement charge.",
    hintBn: "আনুমানিক ১.০% COD অথবা ১.৫% বিকাশ/নগদ চার্জ।",
    role: "deduction" as const,
  },
  platformCost: {
    en: "Platform / ad commission",
    bn: "প্ল্যাটফর্ম কমিশন",
    hintEn: "Direct Messenger/WhatsApp orders default to ৳0 unless edited.",
    hintBn: "সরাসরি মেসেঞ্জার/হোয়াটসঅ্যাপ অর্ডারে সাধারণত ৳০।",
    role: "deduction" as const,
  },
} as const;

export const PG_VERDICT_LABELS: Record<string, { en: string; bn: string }> = {
  supported: { en: "Ready to Fulfil", bn: "ডিসপ্যাচের জন্য প্রস্তুত" },
  at_risk: { en: "Fulfilment at Risk", bn: "ডিসপ্যাচ ঝুঁকিপূর্ণ" },
  indeterminate: { en: "Needs Verification", bn: "যাচাই প্রয়োজন" },
  missing_deadline: { en: "Deadline Missing", bn: "সময়সীমা অনুপস্থিত" },
};

export const ML_VERDICT_LABELS: Record<string, { en: string; bn: string }> = {
  leak_detected: { en: "Margin Loss Detected", bn: "মার্জিন ক্ষতি শনাক্ত" },
  no_leak_detected: { en: "Margin Protected", bn: "মার্জিন নিরাপদ" },
  indeterminate: { en: "Insufficient Data", bn: "তথ্য অসম্পূর্ণ" },
};

export const PG_FINDING_LABELS: Record<string, { en: string; bn: string }> = {
  DISPATCH_DEADLINE_OPEN: {
    en: "Dispatch deadline is still open",
    bn: "ডিসপ্যাচের সময়সীমা এখনো খোলা আছে",
  },
  DISPATCH_DEADLINE_ELAPSED: {
    en: "Promised dispatch deadline has already passed",
    bn: "প্রতিশ্রুত ডিসপ্যাচ সময়সীমা অতিক্রম হয়ে গেছে",
  },
  INVENTORY_SECURED: {
    en: "Inventory is allocated and secured",
    bn: "পণ্যের স্টক নিশ্চিত ও বরাদ্দ আছে",
  },
  INVENTORY_NOT_SECURED: {
    en: "Required stock is not secured",
    bn: "প্রয়োজনীয় পণ্যের স্টক নিশ্চিত নয়",
  },
  INVENTORY_STATUS_UNKNOWN: {
    en: "Inventory status has not been verified",
    bn: "স্টকের অবস্থা যাচাই করা হয়নি",
  },
  FULFILLMENT_READY: {
    en: "Order is packed and ready to dispatch",
    bn: "অর্ডার প্যাক করা ও ডিসপ্যাচের জন্য প্রস্তুত",
  },
  FULFILLMENT_IN_PROGRESS: {
    en: "Fulfilment and packing are in progress",
    bn: "প্যাকিং ও ফুলফিলমেন্ট প্রক্রিয়া চলছে",
  },
  FULFILLMENT_NOT_STARTED: {
    en: "Fulfilment has not started yet",
    bn: "ফুলফিলমেন্ট এখনো শুরু হয়নি",
  },
  FULFILLMENT_BLOCKED: {
    en: "Fulfilment is currently blocked",
    bn: "ফুলফিলমেন্ট বর্তমানে বাধাগ্রস্ত",
  },
  FULFILLMENT_STATE_UNKNOWN: {
    en: "Fulfilment progress is unknown",
    bn: "ফুলফিলমেন্ট অবস্থা অজানা",
  },
  UNKNOWN_FULFILLMENT_STATE: {
    en: "Fulfilment progress is unknown",
    bn: "ফুলফিলমেন্ট অবস্থা অজানা",
  },
  NO_ACTIVE_BLOCKER: {
    en: "No active operational blockers",
    bn: "কোনো সক্রিয় অপারেশনাল বাধা নেই",
  },
  NO_ACTIVE_BLOCKERS: {
    en: "No active operational blockers",
    bn: "কোনো সক্রিয় অপারেশনাল বাধা নেই",
  },
  ACTIVE_BLOCKER_REPORTED: {
    en: "Active operational blocker reported",
    bn: "সক্রিয় অপারেশনাল বাধা পাওয়া গেছে",
  },
  BLOCKING_STATE_UNKNOWN: {
    en: "Blocker status is unverified",
    bn: "বাধার অবস্থা যাচাই করা হয়নি",
  },
  UNKNOWN_BLOCKER_STATE: {
    en: "Blocker status is unverified",
    bn: "বাধার অবস্থা যাচাই করা হয়নি",
  },
  CONTRADICTORY_OPERATIONAL_STATE: {
    en: "Conflicting fulfilment and blocker status — verify manually",
    bn: "ফুলফিলমেন্ট ও বাধার তথ্যে অসঙ্গতি আছে — ম্যানুয়ালি যাচাই করুন",
  },
  READY_ESTIMATE_WITHIN_DEADLINE: {
    en: "Estimated ready time meets the dispatch cutoff",
    bn: "সম্ভাব্য প্রস্তুতির সময় ডিসপ্যাচ ডেডলাইনের ভেতরে আছে",
  },
  READY_ESTIMATE_AFTER_DEADLINE: {
    en: "Estimated ready time misses the dispatch cutoff",
    bn: "সম্ভাব্য প্রস্তুতির সময় ডিসপ্যাচ ডেডলাইন অতিক্রম করছে",
  },
  READY_ESTIMATE_ELAPSED: {
    en: "Estimated ready time has already passed",
    bn: "প্রস্তুতির সম্ভাব্য সময় ইতিমধ্যেই পার হয়ে গেছে",
  },
  READY_ESTIMATE_IGNORED_AFTER_READY: {
    en: "Order is already packed and ready to dispatch",
    bn: "অর্ডার ইতিমধ্যেই প্যাক করা ও ডিসপ্যাচের জন্য প্রস্তুত",
  },
  MISSING_READY_ESTIMATE: {
    en: "Packing ready-time estimate is missing",
    bn: "প্রস্তুতির সম্ভাব্য সময় দেওয়া হয়নি",
  },
  STALE_EVIDENCE: {
    en: "Operational evidence is stale and needs a fresh check",
    bn: "স্টক বা ফুলফিলমেন্ট তথ্য পুরনো; নতুন করে যাচাই করুন",
  },
  UNKNOWN_EVIDENCE_VALIDITY: {
    en: "Stock or operational data freshness is unverified",
    bn: "স্টক তথ্যের হালনাগাদ অবস্থা যাচাই করা হয়নি",
  },
};

export const REVIEW_REASON_LABELS: Record<string, { en: string; bn: string }> =
  {
    SOCIAL_COMMERCE_UNRESOLVED_EXTRACTION: {
      en: "Missing chat details",
      bn: "অসম্পূর্ণ চ্যাট তথ্য",
    },
    SOCIAL_COMMERCE_MISSING_DISPATCH_DEADLINE: {
      en: "Dispatch deadline missing",
      bn: "ডিসপ্যাচ সময় অনুপস্থিত",
    },
    PROMISEGUARD_AT_RISK: {
      en: "Fulfilment risk",
      bn: "ডিসপ্যাচ ঝুঁকি",
    },
    PROMISEGUARD_INDETERMINATE: {
      en: "Fulfilment unverified",
      bn: "ডিসপ্যাচ অযাচিত",
    },
    PROMISEGUARD_EVIDENCE_INCOMPLETE: {
      en: "Fulfilment details incomplete",
      bn: "ডিসপ্যাচ তথ্য অসম্পূর্ণ",
    },
    PROMISEGUARD_EVIDENCE_CONFLICT: {
      en: "Conflicting fulfilment status",
      bn: "ডিসপ্যাচ তথ্যে অসঙ্গতি",
    },
    MARGINLEAK_LEAK_DETECTED: {
      en: "Margin loss detected",
      bn: "মার্জিন ক্ষতি",
    },
    MARGINLEAK_INCOMPLETE_INPUTS: {
      en: "Missing cost or price inputs",
      bn: "মূল্য বা খরচের তথ্য নেই",
    },
    MARGINLEAK_EVIDENCE_INCOMPLETE: {
      en: "Missing cost or price inputs",
      bn: "মূল্য বা খরচের তথ্য নেই",
    },
    MARGINLEAK_PROVISIONAL_INPUTS: {
      en: "Provisional figures",
      bn: "অস্থায়ী হিসাব",
    },
  };

export const ACTION_SOURCE_LABELS: Record<string, { en: string; bn: string }> =
  {
    extraction: { en: "Chat Review", bn: "চ্যাট যাচাই" },
    promiseguard: { en: "Fulfilment", bn: "ডিসপ্যাচ" },
    marginleak: { en: "Profit", bn: "লাভ-ক্ষতি" },
  };

export const humanizeCode = (
  code: string,
  dict: Record<string, { en: string; bn: string }>,
  locale: UiLocale,
): string => dict[code]?.[locale] ?? code.replaceAll("_", " ").toLowerCase();
