import {
  matchDemoCatalogItem,
  type DemoCatalogEntry,
  DEMO_CATALOG,
} from "./demo-catalog";
import {
  socialCommerceOrderDraftSchema,
  type DeliveryZone,
  type DemoCatalogMatch,
  type EvidenceSpan,
  type ExtractionUncertainty,
  type SocialCommerceLanguage,
  type SocialCommerceOrderDraft,
} from "./schema";

type ParsedLine = {
  lineNumber: number;
  speaker: "customer" | "merchant" | "unknown";
  raw: string;
  text: string;
  normalized: string;
};

const BENGALI_DIGITS: Record<string, string> = {
  "০": "0",
  "১": "1",
  "২": "2",
  "৩": "3",
  "৪": "4",
  "৫": "5",
  "৬": "6",
  "৭": "7",
  "৮": "8",
  "৯": "9",
};

export const normalizeBengaliDigits = (input: string): string =>
  input.replace(/[০-৯]/g, (digit) => BENGALI_DIGITS[digit] ?? digit);

const BANGLISH_MARKERS = [
  "vaiya",
  "bhaiya",
  "apu",
  "lagbe",
  "rakhben",
  "pathaben",
  "pathate",
  "parben",
  "dibo",
  "dicchi",
  "korbo",
  "moddhe",
  "taratari",
  "kichu",
  "pore",
  "koto",
  "kotogulo",
  "accha",
  "taka",
  "dupur",
  "kal",
  "ajke",
  "ta ",
  "bolle",
];

const INSIDE_DHAKA_AREAS: readonly { pattern: RegExp; label: string }[] = [
  {
    pattern: /\buttara(?:\s+sector\s*\d+)?\b|উত্তরা(?:\s*সেক্টর\s*\d+)?/i,
    label: "Uttara, Dhaka",
  },
  {
    pattern: /\bmirpur(?:\s*\d+)?\b|মিরপুর(?:\s*\d+)?/i,
    label: "Mirpur, Dhaka",
  },
  { pattern: /\bdhanmondi\b|ধানমন্ডি/i, label: "Dhanmondi, Dhaka" },
  { pattern: /\bbanani\b|বনানী/i, label: "Banani, Dhaka" },
  { pattern: /\bgulshan\b|গুলশান/i, label: "Gulshan, Dhaka" },
  { pattern: /\bmohammadpur\b|মোহাম্মদপুর/i, label: "Mohammadpur, Dhaka" },
  { pattern: /\bbashundhara\b|বসুন্ধরা/i, label: "Bashundhara, Dhaka" },
  { pattern: /\bmotijheel\b|মতিঝিল/i, label: "Motijheel, Dhaka" },
  { pattern: /\bfarmgate\b|ফার্মগেট/i, label: "Farmgate, Dhaka" },
  {
    pattern: /\binside\s+dhaka\b|\bdhaka\b|ঢাকার?\s*ভিতরে|ঢাকা/i,
    label: "Dhaka (Inside Dhaka)",
  },
];

const OUTSIDE_DHAKA_AREAS: readonly { pattern: RegExp; label: string }[] = [
  {
    pattern: /\bchattogram\b|\bchittagong\b|\bctg\b|চট্টগ্রাম/i,
    label: "Chattogram",
  },
  { pattern: /\bsylhet\b|সিলেট/i, label: "Sylhet" },
  { pattern: /\brajshahi\b|রাজশাহী/i, label: "Rajshahi" },
  { pattern: /\bkhulna\b|খুলনা/i, label: "Khulna" },
  { pattern: /\bbarishal\b|\bbarisal\b|বরিশাল/i, label: "Barishal" },
  { pattern: /\brangpur\b|রংপুর/i, label: "Rangpur" },
  { pattern: /\bmymensingh\b|ময়মনসিংহ|ময়মনসিংহ/i, label: "Mymensingh" },
  { pattern: /\bcomilla\b|\bcumilla\b|কুমিল্লা/i, label: "Cumilla" },
  { pattern: /\bgazipur\b|গাজীপুর/i, label: "Gazipur" },
  { pattern: /\bsavar\b|সাভার/i, label: "Savar" },
  { pattern: /\bnarayanganj\b|নারায়ণগঞ্জ|নারায়ণগঞ্জ/i, label: "Narayanganj" },
  { pattern: /\boutside\s+dhaka\b|ঢাকার\s*বাইরে/i, label: "Outside Dhaka" },
];

const toEvidenceSpan = (line: ParsedLine): EvidenceSpan => ({
  lineNumber: line.lineNumber,
  speaker: line.speaker,
  quote: line.raw.slice(0, 300),
});

const parseLines = (transcript: string): ParsedLine[] =>
  transcript
    .split(/\r?\n/)
    .map((raw, index) => {
      const trimmed = raw.trim();
      if (!trimmed) return null;
      let speaker: ParsedLine["speaker"] = "unknown";
      let text = trimmed;
      const speakerMatch =
        /^(customer|buyer|client|ক্রেতা|seller|merchant|page|shop|admin|দোকান|বিক্রেতা)\s*:\s*(.+)$/i.exec(
          trimmed,
        );
      if (speakerMatch) {
        const prefix = speakerMatch[1]!.toLowerCase();
        speaker =
          prefix === "customer" ||
          prefix === "buyer" ||
          prefix === "client" ||
          prefix === "ক্রেতা"
            ? "customer"
            : "merchant";
        text = speakerMatch[2]!.trim();
      }
      const normalized = normalizeBengaliDigits(text);
      return {
        lineNumber: index + 1,
        speaker,
        raw: trimmed,
        text,
        normalized,
      };
    })
    .filter((line): line is ParsedLine => line !== null);

const detectLanguage = (transcript: string): SocialCommerceLanguage => {
  const hasBengaliScript = /[\u0980-\u09FF]/.test(transcript);
  const lower = transcript.toLowerCase();
  const hasLatin = /[a-z]{3,}/.test(lower);
  const banglishHits = BANGLISH_MARKERS.filter((marker) =>
    lower.includes(marker),
  ).length;

  if (hasBengaliScript && !hasLatin) return "bn";
  if (hasBengaliScript && hasLatin) return "mixed";
  if (banglishHits >= 2) return "banglish";
  if (banglishHits === 1) return "mixed";
  return "en";
};

const findCatalogInLines = (
  lines: ParsedLine[],
): { match: DemoCatalogMatch; evidence: EvidenceSpan[] } | null => {
  for (const entry of DEMO_CATALOG as readonly DemoCatalogEntry[]) {
    const matchedLines = lines.filter((line) =>
      entry.aliases.some((alias) =>
        line.normalized.toLowerCase().includes(alias.toLowerCase()),
      ),
    );
    if (matchedLines.length > 0) {
      const match = matchDemoCatalogItem(matchedLines[0]!.normalized);
      if (match) {
        return {
          match,
          evidence: matchedLines.slice(0, 2).map(toEvidenceSpan),
        };
      }
    }
  }
  return null;
};

const extractQuantity = (
  lines: ParsedLine[],
): {
  value: number | null;
  confidence: "high" | "medium" | "missing";
  evidence: EvidenceSpan[];
} => {
  const numericQtyPatterns = [
    /(?:^|[^\d])(\d{1,3})\s*(?:(?:ta|ti|pcs?|pieces?|units?|pair|pairs|box|boxes)\b|টা|টি|পিস)/i,
    /(?:qty|quantity|পরিমাণ)\s*[:=-]?\s*(\d{1,3})\b/i,
  ];
  const wordQuantities: readonly { pattern: RegExp; qty: number }[] = [
    { pattern: /\b(?:ekta|akta|one)\b|একটা|একটি/i, qty: 1 },
    { pattern: /\b(?:duta|duita|two)\b|দুটা|দুইটা|দুটি/i, qty: 2 },
    { pattern: /\b(?:tinta|three)\b|তিনটা|তিনটি/i, qty: 3 },
    { pattern: /\b(?:charta|four)\b|চারটা|চারটি/i, qty: 4 },
    { pattern: /\b(?:panchta|five)\b|পাঁচটা|পাঁচটি/i, qty: 5 },
  ];

  // Prefer merchant confirmation line if present, otherwise customer line
  const ordered = [
    ...lines.filter((line) => line.speaker === "merchant"),
    ...lines.filter((line) => line.speaker !== "merchant"),
  ];

  for (const line of ordered) {
    for (const pattern of numericQtyPatterns) {
      const match = pattern.exec(line.normalized);
      if (match) {
        const qty = Number(match[1]);
        if (Number.isInteger(qty) && qty >= 1 && qty <= 1_000) {
          return {
            value: qty,
            confidence: "high",
            evidence: [toEvidenceSpan(line)],
          };
        }
      }
    }
  }

  for (const line of ordered) {
    for (const entry of wordQuantities) {
      if (entry.pattern.test(line.normalized)) {
        return {
          value: entry.qty,
          confidence: "medium",
          evidence: [toEvidenceSpan(line)],
        };
      }
    }
  }

  return { value: null, confidence: "missing", evidence: [] };
};

const DISCOUNT_KEYWORD_PATTERN =
  "(?:\\b(?:discount|discont|discnt|disc|dis|off|less|kom|char|chhar|chhaar|rebate)\\b|ডিসকাউন্ট|ছাড়|ছাড়|কম)";
const DISCOUNT_PREFIX_KEYWORD_PATTERN =
  "(?:\\b(?:discount|discont|discnt|disc|dis|off|less|char|chhar|chhaar|rebate)\\b|ডিসকাউন্ট|ছাড়|ছাড়)";
const CURRENCY_TOKEN_PATTERN = "(?:(?:tk|taka|bdt)\\b|৳|টাকা)";

const extractPricesAndDiscount = (
  lines: ParsedLine[],
  catalogMatch: DemoCatalogMatch | null,
  quantity: number | null,
): {
  agreedTotalPriceMinor: number | null;
  agreedPriceConfidence: "high" | "medium" | "low" | "missing";
  agreedPriceEvidence: EvidenceSpan[];
  agreedPriceReason?: string;
  priceUnitAmbiguous: boolean;
  discountMinor: number | null;
  discountConfidence: "high" | "medium" | "low" | "missing";
  discountEvidence: EvidenceSpan[];
  discountRequestedWithoutAmount: boolean;
  discountAmbiguous: boolean;
} => {
  const ordered = [
    ...lines.filter((line) => line.speaker === "merchant"),
    ...lines.filter((line) => line.speaker !== "merchant"),
  ];

  let discountMinor: number | null = null;
  let discountConfidence: "high" | "medium" | "low" | "missing" = "missing";
  let discountEvidence: EvidenceSpan[] = [];
  let discountRequestedWithoutAmount = false;
  let discountAmbiguous = false;

  const explicitDiscountPatterns = [
    new RegExp(
      `(?:^|[^\\d])(?:৳\\s*)?(\\d{2,6})\\s*(?:${CURRENCY_TOKEN_PATTERN})?\\s*${DISCOUNT_KEYWORD_PATTERN}`,
      "i",
    ),
    new RegExp(
      `${DISCOUNT_PREFIX_KEYWORD_PATTERN}\\s*(?:of|is|hobe|thakbe|thkbe|dibo|debo|হবে|থাকবে|দিব|:|-)?\\s*(?:৳\\s*|bdt\\s*)?(\\d{2,6})\\s*(?:${CURRENCY_TOKEN_PATTERN})?`,
      "i",
    ),
  ];

  for (const line of ordered) {
    for (const pattern of explicitDiscountPatterns) {
      const match = pattern.exec(line.normalized);
      if (match) {
        const amountMajor = Number(match[1]);
        if (Number.isInteger(amountMajor) && amountMajor > 0) {
          discountMinor = amountMajor * 100;
          discountConfidence = line.speaker === "merchant" ? "high" : "medium";
          discountEvidence = [toEvidenceSpan(line)];
          break;
        }
      }
    }
    if (discountMinor !== null) break;
  }

  const discountMentionRegex =
    /\b(?:discount|discont|discnt|disc|less|kom|char|chhar|chhaar|offer)\b|ডিসকাউন্ট|ছাড়|ছাড়|কম\s*রাখ/i;

  if (
    discountMinor === null &&
    lines.some((line) => discountMentionRegex.test(line.normalized))
  ) {
    discountRequestedWithoutAmount = true;
    const mention = lines.find((line) =>
      discountMentionRegex.test(line.normalized),
    );
    if (mention) {
      discountEvidence = [toEvidenceSpan(mention)];
    }
  }

  // Extract agreed order/item price, explicitly stripping delivery charges, discounts, list prices, and advance/due clauses
  let agreedTotalPriceMinor: number | null = null;
  let agreedPriceConfidence: "high" | "medium" | "low" | "missing" = "missing";
  let agreedPriceEvidence: EvidenceSpan[] = [];
  let agreedPriceReason: string | undefined;
  let priceUnitAmbiguous = false;

  const stripDeliveryClauseForward = new RegExp(
    `(?:delivery|shipping|courier|ডেলিভারি)\\s*(?:charge|fee|cost|চার্জ)?\\s*(?:is|of|hobe|:|-)?\\s*(?:৳\\s*|bdt\\s*)?\\d{1,5}\\s*(?:${CURRENCY_TOKEN_PATTERN})?`,
    "gi",
  );
  const stripDeliveryClauseReverse = new RegExp(
    `(?:\\+\\s*)?(?:৳\\s*)?\\d{1,5}\\s*${CURRENCY_TOKEN_PATTERN}\\s*(?:delivery|shipping|courier|ডেলিভারি)`,
    "gi",
  );
  const stripDiscountClauseReverse = new RegExp(
    `(?:৳\\s*)?\\d{1,6}\\s*(?:${CURRENCY_TOKEN_PATTERN})?\\s*${DISCOUNT_KEYWORD_PATTERN}`,
    "gi",
  );
  const stripDiscountClauseForward = new RegExp(
    `${DISCOUNT_PREFIX_KEYWORD_PATTERN}\\s*(?:of|is|hobe|thakbe|thkbe|dibo|debo|হবে|থাকবে|দিব|:|-)?\\s*(?:৳\\s*|bdt\\s*)?\\d{1,6}\\s*(?:${CURRENCY_TOKEN_PATTERN})?`,
    "gi",
  );
  const stripRegularPriceClause = new RegExp(
    `(?:regular|original|list|mrp)\\s*(?:price|dam)?\\s*(?:is|was|:|-)?\\s*(?:৳\\s*)?\\d{2,6}\\s*(?:${CURRENCY_TOKEN_PATTERN})?`,
    "gi",
  );
  const stripAdvanceClauseReverse = new RegExp(
    `(?:৳\\s*)?\\d{1,6}\\s*${CURRENCY_TOKEN_PATTERN}\\s*(?:\\b(?:advance|adv|deposit|booking|baki|due)\\b|অগ্রিম|বাকি)`,
    "gi",
  );
  const stripAdvanceClauseForward = new RegExp(
    `(?:\\b(?:advance|adv|deposit|booking|baki|due)\\b|অগ্রিম|বাকি)\\s*(?:is|of|dibo|debo|lagbe|:|-)?\\s*(?:৳\\s*)?\\d{1,6}\\s*(?:${CURRENCY_TOKEN_PATTERN})?`,
    "gi",
  );

  const unitPriceRegex =
    /(?:per\s*(?:pc|pcs|piece|unit|item)\b|\beach\b|\bkore\b|প্রতি\s*পিস|করে)/i;

  for (const line of ordered) {
    const cleaned = line.normalized
      .replace(stripDeliveryClauseForward, " ")
      .replace(stripDeliveryClauseReverse, " ")
      .replace(stripDiscountClauseReverse, " ")
      .replace(stripDiscountClauseForward, " ")
      .replace(stripRegularPriceClause, " ")
      .replace(stripAdvanceClauseReverse, " ")
      .replace(stripAdvanceClauseForward, " ");

    const priceMatches = [
      ...cleaned.matchAll(
        /(?:(?:price|dam|দাম|total|মোট)\s*(?:is|:|-)?\s*)?(?:৳\s*)?(\d{3,6})\s*(?:(?:tk|taka|bdt)\b|টাকা)|৳\s*(\d{3,6})\b/gi,
      ),
    ];

    if (priceMatches.length > 0) {
      // Take the last price mention in the merchant/confirmed sentence
      const chosen = priceMatches[priceMatches.length - 1]!;
      const major = Number(chosen[1] ?? chosen[2]);
      if (Number.isInteger(major) && major >= 100) {
        const matchStart = chosen.index ?? 0;
        const matchEnd = matchStart + chosen[0].length;
        const localWindow = cleaned.slice(
          Math.max(0, matchStart - 20),
          Math.min(cleaned.length, matchEnd + 24),
        );
        const explicitUnitPrice = unitPriceRegex.test(localWindow);

        if (explicitUnitPrice && quantity !== null && quantity > 1) {
          agreedTotalPriceMinor = major * 100 * quantity;
          agreedPriceConfidence = "medium";
          agreedPriceReason = `Unit price (৳${major}) multiplied by quantity (${quantity}); confirm total selling price.`;
          agreedPriceEvidence = [toEvidenceSpan(line)];
          break;
        }

        if (
          !explicitUnitPrice &&
          catalogMatch &&
          quantity !== null &&
          quantity > 1 &&
          major * 100 === catalogMatch.listPriceMinor
        ) {
          agreedTotalPriceMinor = major * 100;
          agreedPriceConfidence = "low";
          priceUnitAmbiguous = true;
          agreedPriceReason =
            "Quoted amount matches single-unit catalog price for a multi-unit order; clarify unit vs. total price.";
          agreedPriceEvidence = [toEvidenceSpan(line)];
          break;
        }

        agreedTotalPriceMinor = major * 100;
        agreedPriceConfidence = line.speaker === "merchant" ? "high" : "medium";
        agreedPriceEvidence = [toEvidenceSpan(line)];
        break;
      }
    }
  }

  // If discount wasn't stated explicitly, but catalog list price * qty > agreedTotalPriceMinor, compute implied discount
  if (
    discountMinor === null &&
    !priceUnitAmbiguous &&
    catalogMatch &&
    quantity !== null &&
    agreedTotalPriceMinor !== null
  ) {
    const grossExpectedMinor = catalogMatch.listPriceMinor * quantity;
    if (agreedTotalPriceMinor < grossExpectedMinor) {
      const implied = grossExpectedMinor - agreedTotalPriceMinor;
      discountMinor = implied;
      if (implied > Math.round(grossExpectedMinor * 0.5)) {
        discountConfidence = "low";
        discountAmbiguous = true;
      } else {
        discountConfidence = "medium";
      }
      discountEvidence = agreedPriceEvidence;
    } else if (
      agreedTotalPriceMinor === grossExpectedMinor &&
      !discountRequestedWithoutAmount
    ) {
      discountMinor = 0;
      discountConfidence = agreedPriceConfidence;
      discountEvidence = agreedPriceEvidence;
    }
  }

  return {
    agreedTotalPriceMinor,
    agreedPriceConfidence,
    agreedPriceEvidence,
    ...(agreedPriceReason ? { agreedPriceReason } : {}),
    priceUnitAmbiguous,
    discountMinor,
    discountConfidence,
    discountEvidence,
    discountRequestedWithoutAmount,
    discountAmbiguous,
  };
};

const extractDeliveryInfo = (
  lines: ParsedLine[],
): {
  location: string | null;
  zone: DeliveryZone;
  locationEvidence: EvidenceSpan[];
  chargeMinor: number | null;
  chargeConfidence: "high" | "medium" | "low" | "missing";
  chargeEvidence: EvidenceSpan[];
  freeDeliveryPromised: boolean;
} => {
  let location: string | null = null;
  let zone: DeliveryZone = "unknown";
  let locationEvidence: EvidenceSpan[] = [];

  for (const line of lines) {
    for (const candidate of OUTSIDE_DHAKA_AREAS) {
      if (candidate.pattern.test(line.normalized)) {
        location = candidate.label;
        zone = "outside_dhaka";
        locationEvidence = [toEvidenceSpan(line)];
        break;
      }
    }
    if (location) break;

    for (const candidate of INSIDE_DHAKA_AREAS) {
      if (candidate.pattern.test(line.normalized)) {
        location = candidate.label;
        zone = "inside_dhaka";
        locationEvidence = [toEvidenceSpan(line)];
        break;
      }
    }
    if (location) break;
  }

  const ordered = [
    ...lines.filter((line) => line.speaker === "merchant"),
    ...lines.filter((line) => line.speaker !== "merchant"),
  ];

  let chargeMinor: number | null = null;
  let chargeConfidence: "high" | "medium" | "low" | "missing" = "missing";
  let chargeEvidence: EvidenceSpan[] = [];
  let freeDeliveryPromised = false;

  for (const line of ordered) {
    if (
      /\bfree\s+delivery\b|\bfree\s+shipping\b|ফ্রি\s*ডেলিভারি/i.test(
        line.normalized,
      )
    ) {
      chargeMinor = 0;
      chargeConfidence = line.speaker === "merchant" ? "high" : "medium";
      chargeEvidence = [toEvidenceSpan(line)];
      freeDeliveryPromised = true;
      break;
    }

    const chargeMatch =
      /(?:delivery|shipping|courier|ডেলিভারি)\s*(?:charge|fee|চার্জ)?\s*(?:is|of|:|-)?\s*(?:৳|bdt)?\s*(\d{2,4})\s*(?:tk|taka|bdt|৳|টাকা)?|\+\s*(\d{2,4})\s*(?:tk|taka|bdt|৳|টাকা)\s*(?:delivery|shipping|ডেলিভারি)/i.exec(
        line.normalized,
      );
    if (chargeMatch) {
      const major = Number(chargeMatch[1] ?? chargeMatch[2]);
      if (Number.isInteger(major) && major >= 0 && major <= 2_000) {
        chargeMinor = major * 100;
        chargeConfidence = line.speaker === "merchant" ? "high" : "medium";
        chargeEvidence = [toEvidenceSpan(line)];
        break;
      }
    }
  }

  return {
    location,
    zone,
    locationEvidence,
    chargeMinor,
    chargeConfidence,
    chargeEvidence,
    freeDeliveryPromised,
  };
};

const extractTimeline = (
  lines: ParsedLine[],
): {
  text: string | null;
  confidence: "high" | "medium" | "low" | "missing";
  needsVerification: boolean;
  reason?: string;
  evidence: EvidenceSpan[];
  offsetMinutes: number | null;
} => {
  const ordered = [
    ...lines.filter((line) => line.speaker === "merchant"),
    ...lines.filter((line) => line.speaker !== "merchant"),
  ];

  // Specific day + time (e.g., "kal 2pm", "tomorrow 4pm", "today 5pm")
  for (const line of ordered) {
    const specificMatch =
      /(?:(\b(?:kal|tomorrow|ajke|today)\b|আগামীকাল|আজকে))[^.\n]{0,30}(\d{1,2})\s*(?:pm|am|tar|টা)/i.exec(
        line.normalized,
      );
    if (specificMatch) {
      const dayToken = specificMatch[1]!.toLowerCase();
      const isToday =
        dayToken === "today" || dayToken === "ajke" || dayToken === "আজকে";
      return {
        text: specificMatch[0].trim(),
        confidence: line.speaker === "merchant" ? "high" : "medium",
        needsVerification: line.speaker !== "merchant",
        reason:
          line.speaker === "merchant"
            ? undefined
            : "Timeline requested by customer; confirm merchant dispatch cutoff.",
        evidence: [toEvidenceSpan(line)],
        offsetMinutes: isToday ? 180 : 1_440,
      };
    }
  }

  // Relative day without exact hour (e.g., "আগামীকালের মধ্যে", "tomorrow", "within 24 hours")
  for (const line of lines) {
    const dayMatch =
      /(আগামীকালের\s*মধ্যে|আগামীকাল|আজকের?\s*মধ্যে|\btomorrow\b|\bwithin\s*24\s*hours?\b|\bfriday\b|শুক্রবার)/i.exec(
        line.normalized,
      );
    if (dayMatch) {
      return {
        text: dayMatch[0].trim(),
        confidence: "medium",
        needsVerification: true,
        reason:
          "Day mentioned without an exact cutoff hour; verify exact dispatch deadline.",
        evidence: [toEvidenceSpan(line)],
        offsetMinutes: 1_200,
      };
    }
  }

  // Vague urgency ("taratari", "asap", "urgent")
  for (const line of lines) {
    const vagueMatch =
      /(\btaratari\b|\basap\b|\burgent\b|তাড়াতাড়ি|তাড়াতাড়ি|দ্রুত)/i.exec(
        line.normalized,
      );
    if (vagueMatch) {
      return {
        text: vagueMatch[0].trim(),
        confidence: "low",
        needsVerification: true,
        reason:
          "Vague timeline ('taratari' / 'ASAP') cannot establish a deterministic dispatch commitment.",
        evidence: [toEvidenceSpan(line)],
        offsetMinutes: null,
      };
    }
  }

  return {
    text: null,
    confidence: "missing",
    needsVerification: true,
    reason: "No dispatch or delivery timeline was stated in the conversation.",
    evidence: [],
    offsetMinutes: null,
  };
};

const extractCustomerRequirementsAndPayment = (
  lines: ParsedLine[],
): {
  requirements: string[];
  paymentMethod: SocialCommerceOrderDraft["paymentMethod"];
} => {
  const full = lines.map((line) => line.normalized).join("\n");
  const requirements: string[] = [];

  const sizeMatch =
    /\b(?:size\s*)?(XXL|XL|L|M|S)\b|সাইজ\s*(XXL|XL|L|M|S)/i.exec(full);
  if (sizeMatch) {
    const size = (sizeMatch[1] ?? sizeMatch[2])!.toUpperCase();
    requirements.push(`Size: ${size}`);
  }

  const colorMap: readonly { pattern: RegExp; label: string }[] = [
    { pattern: /\bblack\b|কালো/i, label: "Color: Black" },
    { pattern: /\bwhite\b|সাদা/i, label: "Color: White" },
    { pattern: /\bnavy\b|নেভি/i, label: "Color: Navy" },
    { pattern: /\bmaroon\b|মেরুন/i, label: "Color: Maroon" },
  ];
  for (const color of colorMap) {
    if (color.pattern.test(full)) {
      requirements.push(color.label);
      break;
    }
  }

  let paymentMethod: SocialCommerceOrderDraft["paymentMethod"] = "unknown";
  if (/\bcod\b|\bcash\s+on\s+delivery\b|ক্যাশ\s*অন\s*ডেলিভারি/i.test(full)) {
    paymentMethod = "cod";
    requirements.push("Payment: Cash on Delivery (COD)");
  } else if (/\bbkash\b|বিকাশ/i.test(full)) {
    paymentMethod = "bkash";
    requirements.push("Payment: bKash");
  } else if (/\bnagad\b|নগদ/i.test(full)) {
    paymentMethod = "nagad";
    requirements.push("Payment: Nagad");
  }

  if (/\bfree\s+delivery\b|ফ্রি\s*ডেলিভারি/i.test(full)) {
    requirements.push("Requested: Free delivery");
  }
  if (/শুক্রবার\s*অনুষ্ঠান|\bevent\b|\bgift\b/i.test(full)) {
    requirements.push("Event / time-sensitive occasion noted");
  }
  if (
    /(?:\bfull\s+)?address\s+pore|\baddress\s+later\b|ঠিকানা\s*পরে/i.test(full)
  ) {
    requirements.push("Full delivery address pending from customer");
  }

  return { requirements: requirements.slice(0, 12), paymentMethod };
};

export type DeterministicExtractionOutput = {
  draft: SocialCommerceOrderDraft;
  catalogMatch: DemoCatalogMatch | null;
};

/**
 * Deterministic Bangla / Banglish / English structured order extractor.
 *
 * Strictly grounded in the pasted conversation lines. Missing or vague fields
 * remain null and are explicitly flagged in `uncertainties` for human review.
 */
export const extractOrderFromConversation = (
  transcript: string,
): DeterministicExtractionOutput => {
  const lines = parseLines(transcript);
  const detectedLanguage = detectLanguage(transcript);
  const uncertainties: ExtractionUncertainty[] = [];

  const catalogResult = findCatalogInLines(lines);
  const catalogMatch = catalogResult?.match ?? null;

  let productValue: string | null = catalogMatch?.nameEn ?? null;
  let productConfidence: "high" | "medium" | "low" | "missing" = catalogMatch
    ? "high"
    : "missing";
  let productEvidence: EvidenceSpan[] = catalogResult?.evidence ?? [];
  let productReason: string | undefined;

  if (!productValue && lines.length > 0) {
    // Attempt non-catalog product phrase fallback (e.g. "2ta blue shirt lagbe")
    const firstCustomer =
      lines.find((line) => line.speaker === "customer") ?? lines[0]!;
    const phraseMatch =
      /\b\d{1,2}\s*(?:ta|ti|pcs?|pieces?|টা|টি)\s+([A-Za-z\u0980-\u09FF][A-Za-z0-9\u0980-\u09FF\s-]{2,40}?)(?:\s+(?:lagbe|nibo|chai|order|pathaben|লাগবে|নিব|চাই)\b|[.,?!]|$)/i.exec(
        firstCustomer.normalized,
      );
    if (phraseMatch?.[1]) {
      productValue = phraseMatch[1].trim();
      productConfidence = "low";
      productEvidence = [toEvidenceSpan(firstCustomer)];
      productReason =
        "Item phrase extracted from chat, but no matching SKU exists in the demo catalog.";
    }
  }

  if (!productValue) {
    productReason = "No identifiable product was found in the conversation.";
    uncertainties.push({
      field: "productName",
      code: "MISSING_PRODUCT",
      messageEn: "Product could not be confidently identified from the chat.",
      messageBn: "চ্যাট থেকে নির্দিষ্ট পণ্য শনাক্ত করা যায়নি।",
    });
  } else if (productConfidence === "low") {
    uncertainties.push({
      field: "productName",
      code: "UNMATCHED_CATALOG_PRODUCT",
      messageEn:
        "Extracted item is not in the reference catalog; verify exact SKU, COGS, and stock manually.",
      messageBn:
        "পণ্যটি রেফারেন্স ক্যাটালগে নেই; SKU, ক্রয়মূল্য ও স্টক ম্যানুয়ালি যাচাই করুন।",
    });
  }

  const quantity = extractQuantity(lines);
  if (quantity.value === null) {
    uncertainties.push({
      field: "quantity",
      code: "MISSING_QUANTITY",
      messageEn: "Order quantity was not stated in the conversation.",
      messageBn: "চ্যাটে পণ্যের পরিমাণ উল্লেখ করা হয়নি।",
    });
  }

  const pricing = extractPricesAndDiscount(lines, catalogMatch, quantity.value);
  if (pricing.agreedTotalPriceMinor === null) {
    uncertainties.push({
      field: "agreedTotalPriceMinor",
      code: "MISSING_AGREED_PRICE",
      messageEn: "Agreed selling price was not confirmed in the conversation.",
      messageBn: "চ্যাটে চূড়ান্ত বিক্রয়মূল্য নিশ্চিত করা হয়নি।",
    });
  } else if (pricing.priceUnitAmbiguous) {
    uncertainties.push({
      field: "agreedTotalPriceMinor",
      code: "AMBIGUOUS_UNIT_VS_TOTAL_PRICE",
      messageEn:
        "Quoted price matches a single unit while multiple units were ordered; confirm unit vs. total price.",
      messageBn:
        "উল্লিখিত দাম এক পিসের দামের সমান অথচ একাধিক পিস অর্ডার করা হয়েছে; একক না মোট দাম তা যাচাই করুন।",
    });
  }
  if (pricing.discountRequestedWithoutAmount) {
    uncertainties.push({
      field: "agreedDiscountMinor",
      code: "AMBIGUOUS_DISCOUNT",
      messageEn:
        "Customer asked for a discount without an agreed BDT amount; do not assume ৳0.",
      messageBn:
        "ক্রেতা ছাড় চেয়েছে কিন্তু নির্দিষ্ট টাকার পরিমাণ ঠিক হয়নি; ৳০ ধরে নেওয়া যাবে না।",
    });
  } else if (pricing.discountAmbiguous) {
    uncertainties.push({
      field: "agreedDiscountMinor",
      code: "AMBIGUOUS_DISCOUNT",
      messageEn:
        "Implied discount is unusually large relative to list price; verify the agreed selling price and discount.",
      messageBn:
        "তালিকাভুক্ত দামের তুলনায় আনুমানিক ছাড় অনেক বেশি; চূড়ান্ত বিক্রয়মূল্য ও ছাড় যাচাই করুন।",
    });
  } else if (pricing.discountMinor === null) {
    uncertainties.push({
      field: "agreedDiscountMinor",
      code: "MISSING_DISCOUNT_CONFIRMATION",
      messageEn: "Discount amount is not confirmed from chat evidence.",
      messageBn: "চ্যাটের তথ্য থেকে ছাড়ের পরিমাণ নিশ্চিত নয়।",
    });
  }

  const delivery = extractDeliveryInfo(lines);
  const fullTranscript = lines.map((line) => line.normalized).join("\n");
  const fullAddressPending =
    /(?:\bfull\s+)?address\s+pore|\baddress\s+later\b|ঠিকানা\s*পরে/i.test(
      fullTranscript,
    );

  if (!delivery.location) {
    uncertainties.push({
      field: "deliveryLocation",
      code: "MISSING_DELIVERY_LOCATION",
      messageEn: "Delivery area/city is missing from the conversation.",
      messageBn: "ডেলিভারি এলাকা বা শহরের নাম চ্যাটে পাওয়া যায়নি।",
    });
  } else if (fullAddressPending) {
    uncertainties.push({
      field: "deliveryLocation",
      code: "FULL_ADDRESS_PENDING",
      messageEn: `Delivery area (${delivery.location}) is captured, but the full street address is still pending from the customer.`,
      messageBn: `ডেলিভারি এলাকা (${delivery.location}) পাওয়া গেছে, তবে পূর্ণ ঠিকানা এখনো ক্রেতার কাছ থেকে বাকি আছে।`,
    });
  }
  if (delivery.chargeMinor === null) {
    uncertainties.push({
      field: "deliveryChargeMinor",
      code: "MISSING_DELIVERY_CHARGE",
      messageEn: "Customer delivery charge was not explicitly agreed in chat.",
      messageBn: "চ্যাটে ডেলিভারি চার্জ স্পষ্টভাবে নির্ধারিত হয়নি।",
    });
  }

  const timeline = extractTimeline(lines);
  if (timeline.needsVerification) {
    uncertainties.push({
      field: "promisedTimelineText",
      code:
        timeline.confidence === "missing"
          ? "MISSING_TIMELINE"
          : "AMBIGUOUS_TIMELINE",
      messageEn:
        timeline.reason ??
        "Dispatch timeline requires merchant verification before confirming.",
      messageBn:
        timeline.confidence === "missing"
          ? "চ্যাটে ডিসপ্যাচ বা ডেলিভারির সময়সীমা উল্লেখ নেই।"
          : "সময়সীমা অস্পষ্ট বা এখনো মার্চেন্ট নিশ্চিত করেননি; সঠিক কাটঅফ যাচাই করুন।",
    });
  }

  const { requirements, paymentMethod } =
    extractCustomerRequirementsAndPayment(lines);

  const draft = socialCommerceOrderDraftSchema.parse({
    detectedLanguage,
    productName: {
      value: productValue,
      confidence: productConfidence,
      needsVerification: productConfidence !== "high",
      ...(productReason ? { reason: productReason } : {}),
      evidence: productEvidence,
    },
    quantity: {
      value: quantity.value,
      confidence: quantity.confidence,
      needsVerification: quantity.confidence !== "high",
      ...(quantity.value === null
        ? { reason: "Quantity not explicitly stated in the conversation." }
        : {}),
      evidence: quantity.evidence,
    },
    agreedTotalPriceMinor: {
      value: pricing.agreedTotalPriceMinor,
      confidence: pricing.agreedPriceConfidence,
      needsVerification: pricing.agreedPriceConfidence !== "high",
      ...(pricing.agreedPriceReason
        ? { reason: pricing.agreedPriceReason }
        : pricing.agreedTotalPriceMinor === null
          ? { reason: "No agreed order price found in the conversation." }
          : {}),
      evidence: pricing.agreedPriceEvidence,
    },
    agreedDiscountMinor: {
      value: pricing.discountMinor,
      confidence: pricing.discountConfidence,
      needsVerification:
        pricing.discountConfidence !== "high" ||
        pricing.discountRequestedWithoutAmount ||
        pricing.discountAmbiguous,
      ...(pricing.discountRequestedWithoutAmount
        ? { reason: "Discount requested in chat without an agreed BDT amount." }
        : pricing.discountAmbiguous
          ? {
              reason:
                "Implied discount is unusually large; confirm selling price and discount.",
            }
          : pricing.discountMinor === null
            ? { reason: "Discount not confirmed in the conversation." }
            : {}),
      evidence: pricing.discountEvidence,
    },
    deliveryLocation: {
      value: delivery.location,
      confidence: delivery.location
        ? fullAddressPending
          ? "medium"
          : "high"
        : "missing",
      needsVerification: !delivery.location || fullAddressPending,
      ...(!delivery.location
        ? { reason: "No Dhaka area or district mentioned in the conversation." }
        : fullAddressPending
          ? {
              reason:
                "Delivery area captured, but full street address is pending from customer.",
            }
          : {}),
      evidence: delivery.locationEvidence,
    },
    deliveryZone: delivery.zone,
    deliveryChargeMinor: {
      value: delivery.chargeMinor,
      confidence: delivery.chargeConfidence,
      needsVerification: delivery.chargeConfidence !== "high",
      ...(delivery.freeDeliveryPromised
        ? {
            reason:
              "Free delivery mentioned (৳0 customer charge); verify actual carrier cost in MarginLeak.",
          }
        : delivery.chargeMinor === null
          ? { reason: "Delivery charge not stated in the conversation." }
          : {}),
      evidence: delivery.chargeEvidence,
    },
    promisedTimelineText: {
      value: timeline.text,
      confidence: timeline.confidence,
      needsVerification: timeline.needsVerification,
      ...(timeline.reason ? { reason: timeline.reason } : {}),
      evidence: timeline.evidence,
    },
    suggestedDispatchByOffsetMinutes: timeline.offsetMinutes,
    customerRequirements: requirements,
    paymentMethod,
    uncertainties,
    // Always require human verification if any uncertainty exists, or before confirming an order
    requiresHumanVerification: true,
  });

  return { draft, catalogMatch };
};
