import type { DemoCatalogMatch, DeliveryZone } from "./schema";

export type DemoCatalogEntry = DemoCatalogMatch & {
  aliases: readonly string[];
};

/**
 * Anonymized, explicitly synthetic Bangladeshi SME demo catalog.
 *
 * Used strictly as optional grounding reference when a pasted conversation
 * mentions a matching demo item. Never invented for unknown items, and always
 * editable or clearable by the merchant before deterministic evaluation.
 */
export const DEMO_CATALOG: readonly DemoCatalogEntry[] = [
  {
    sku: "SKU-HD-BLK",
    nameEn: "Premium Fleece Hoodie (Black)",
    nameBn: "প্রিমিয়াম ফ্লিস হুডি (কালো)",
    listPriceMinor: 145_000, // BDT 1,450.00
    standardCogsMinor: 78_000, // BDT 780.00
    standardFulfillmentCostMinor: 4_500, // BDT 45.00
    currency: "BDT",
    referenceStockStatus: "secured",
    referenceStockNoteEn:
      "Demo catalog reference: 12 units available in Dhaka store.",
    referenceStockNoteBn:
      "ডেমো ক্যাটালগ রেফারেন্স: ঢাকা স্টোরে ১২ পিস স্টকে আছে।",
    referenceBlockerCodes: [],
    syntheticDemoData: true,
    aliases: ["hoodie", "fleece hoodie", "black hoodie", "হুডি", "ফ্লিস হুডি"],
  },
  {
    sku: "SKU-PJ-KOT",
    nameEn: "Cotton Panjabi (Festive Edition)",
    nameBn: "কটন পাঞ্জাবি (ফেস্টিভ এডিশন)",
    listPriceMinor: 185_000, // BDT 1,850.00
    standardCogsMinor: 95_000, // BDT 950.00
    standardFulfillmentCostMinor: 5_000, // BDT 50.00
    currency: "BDT",
    referenceStockStatus: "not_secured",
    referenceStockNoteEn:
      "Demo catalog reference: Size XL is out of stock (restock batch pending).",
    referenceStockNoteBn:
      "ডেমো ক্যাটালগ রেফারেন্স: XL সাইজ স্টকে নেই (নতুন লট অপেক্ষমাণ)।",
    referenceBlockerCodes: ["inventory_shortage"],
    syntheticDemoData: true,
    aliases: [
      "panjabi",
      "punjabi",
      "cotton panjabi",
      "পাঞ্জাবি",
      "কটন পাঞ্জাবি",
    ],
  },
  {
    sku: "SKU-BG-LTH",
    nameEn: "Handcrafted Leather Tote Bag",
    nameBn: "হ্যান্ডক্রাফটেড লেদার টোট ব্যাগ",
    listPriceMinor: 240_000, // BDT 2,400.00
    standardCogsMinor: 130_000, // BDT 1,300.00
    standardFulfillmentCostMinor: 6_000, // BDT 60.00
    currency: "BDT",
    referenceStockStatus: "secured",
    referenceStockNoteEn: "Demo catalog reference: 4 units packed and ready.",
    referenceStockNoteBn:
      "ডেমো ক্যাটালগ রেফারেন্স: ৪ পিস প্যাক করা ও প্রস্তুত আছে।",
    referenceBlockerCodes: [],
    syntheticDemoData: true,
    aliases: [
      "tote bag",
      "leather bag",
      "leather tote",
      "bag",
      "ব্যাগ",
      "টোট ব্যাগ",
    ],
  },
  {
    sku: "SKU-CS-SRM",
    nameEn: "Vitamin C Glow Serum (30ml)",
    nameBn: "ভিটামিন সি গ্লো সিরাম (৩০ মিলি)",
    listPriceMinor: 95_000, // BDT 950.00
    standardCogsMinor: 48_000, // BDT 480.00
    standardFulfillmentCostMinor: 3_500, // BDT 35.00
    currency: "BDT",
    referenceStockStatus: "unknown",
    referenceStockNoteEn:
      "Demo catalog reference: Shelf count not verified today — manual stock check required.",
    referenceStockNoteBn:
      "ডেমো ক্যাটালগ রেফারেন্স: আজকের স্টক যাচাই করা হয়নি — ম্যানুয়াল চেক প্রয়োজন।",
    referenceBlockerCodes: [],
    syntheticDemoData: true,
    aliases: ["serum", "glow serum", "vitamin c", "সিরাম", "ভিটামিন সি"],
  },
] as const;

/**
 * Reference Bangladesh courier & payment rates (BDT minor units / poisha).
 * Explicitly synthetic reference values; merchants can edit or omit any cost.
 */
export const DEMO_COURIER_POLICY = {
  syntheticDemoData: true as const,
  insideDhakaChargeMinor: 7_000, // BDT 70.00
  outsideDhakaChargeMinor: 13_000, // BDT 130.00
  codFeeBasisPoints: 100, // 1.00% COD fee on collected amount
  mfsFeeBasisPoints: 150, // 1.50% bKash/Nagad merchant settlement fee
  directSocialPlatformFeeMinor: 0, // BDT 0 for direct Messenger/WhatsApp order
} as const;

export const matchDemoCatalogItem = (text: string): DemoCatalogMatch | null => {
  const normalized = text.toLowerCase();
  for (const entry of DEMO_CATALOG) {
    if (
      entry.aliases.some((alias) => normalized.includes(alias.toLowerCase()))
    ) {
      return {
        sku: entry.sku,
        nameEn: entry.nameEn,
        nameBn: entry.nameBn,
        listPriceMinor: entry.listPriceMinor,
        standardCogsMinor: entry.standardCogsMinor,
        standardFulfillmentCostMinor: entry.standardFulfillmentCostMinor,
        currency: entry.currency,
        referenceStockStatus: entry.referenceStockStatus,
        referenceStockNoteEn: entry.referenceStockNoteEn,
        referenceStockNoteBn: entry.referenceStockNoteBn,
        referenceBlockerCodes: [...entry.referenceBlockerCodes],
        syntheticDemoData: entry.syntheticDemoData,
      };
    }
  }
  return null;
};

export const referenceShippingMinorForZone = (
  zone: DeliveryZone,
): number | null => {
  if (zone === "inside_dhaka")
    return DEMO_COURIER_POLICY.insideDhakaChargeMinor;
  if (zone === "outside_dhaka")
    return DEMO_COURIER_POLICY.outsideDhakaChargeMinor;
  return null;
};
