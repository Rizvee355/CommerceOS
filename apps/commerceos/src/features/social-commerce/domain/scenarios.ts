import type { SocialCommerceChannel } from "./schema";

export type SocialCommerceScenario = {
  id: string;
  channel: SocialCommerceChannel;
  badgeEn: string;
  badgeBn: string;
  tone: "risk" | "waiting" | "ready";
  titleEn: string;
  titleBn: string;
  summaryEn: string;
  summaryBn: string;
  transcript: string;
};

/**
 * Synthetic, anonymized Bangladeshi social-commerce conversations (Messenger & WhatsApp).
 * Zero real customer names, phone numbers, or street addresses are included.
 */
export const SOCIAL_COMMERCE_SCENARIOS: readonly SocialCommerceScenario[] = [
  {
    id: "bd-banglish-margin-leak",
    channel: "messenger",
    badgeEn: "Banglish · Margin Leak Risk",
    badgeBn: "বাংলিশ · মার্জিন লিক ঝুঁকি",
    tone: "risk",
    titleEn: "Informal chat discount + free delivery",
    titleBn: "চ্যাটে ছাড় ও ফ্রি ডেলিভারির মার্জিন লিক",
    summaryEn:
      "Customer negotiates 2 Black Fleece Hoodies (XL) to Uttara in Banglish for 2600 tk with free delivery and next-day 2pm dispatch.",
    summaryBn:
      "ক্রেতা মেসেঞ্জারে বাংলিশে ২টি কালো ফ্লিস হুডি (XL) উত্তরায় ২৬০০ টাকা ও ফ্রি ডেলিভারিতে আগামীকাল ২টার মধ্যে পাঠাতে অনুরোধ করেছে।",
    transcript: [
      "Customer: Assalamu alaikum vaiya, 2ta Black Fleece Hoodie XL lagbe Uttara sector 7 e.",
      "Customer: Regular price 2900 tk dekhi, apni 2600 taka rakhben r free delivery den please?",
      "Customer: Kal dupur 2tar moddhe pathate parben? Cash on delivery dibo.",
      "Merchant: Walaikum assalam apu, 2ta Black Fleece Hoodie 2600 tk (300 tk discount) r free delivery diye dicchi. Kal 2pm er moddhe dispatch korbo.",
    ].join("\n"),
  },
  {
    id: "bd-bangla-promise-risk",
    channel: "whatsapp",
    badgeEn: "Bangla · Fulfilment Risk",
    badgeBn: "বাংলা · ডিসপ্যাচ ঝুঁকি",
    tone: "risk",
    titleEn: "Urgent Bangla order on out-of-stock size",
    titleBn: "স্টক না থাকা সাইজে জরুরি বাংলা অর্ডার",
    summaryEn:
      "Customer orders 1 Cotton Panjabi (XL) to Chattogram in Bangla for tomorrow dispatch via bKash, while XL stock is not secured.",
    summaryBn:
      "ক্রেতা হোয়াটসঅ্যাপে বাংলায় চট্টগ্রামে আগামীকালের মধ্যে ১টি কটন পাঞ্জাবি (XL) অর্ডার করেছে, কিন্তু XL সাইজের স্টক নিশ্চিত নয়।",
    transcript: [
      "ক্রেতা: আসসালামু আলাইকুম, ১টা কটন পাঞ্জাবি XL সাইজ চট্টগ্রামে পাঠাতে হবে।",
      "ক্রেতা: আগামীকালের মধ্যে ডিসপ্যাচ লাগবে, শুক্রবার অনুষ্ঠান আছে।",
      "ক্রেতা: দাম ১৮৫০ টাকা আর ডেলিভারি চার্জ ১৩০ টাকা বিকাশে দিয়ে দিচ্ছি।",
      "দোকান: জ্বী অর্ডার নোট করেছি, স্টক ও ডিসপ্যাচ টাইম চেক করে জানাচ্ছি।",
    ].join("\n"),
  },
  {
    id: "bd-ambiguous-missing-info",
    channel: "messenger",
    badgeEn: "Banglish · Incomplete Info",
    badgeBn: "বাংলিশ · অসম্পূর্ণ তথ্য",
    tone: "waiting",
    titleEn: "Ambiguous chat with missing price, area & deadline",
    titleBn: "দাম, ঠিকানা ও সময় ছাড়া অস্পষ্ট চ্যাট",
    summaryEn:
      "Customer asks for Vitamin C Serum 'taratari' with 'kichu discount' and no quantity, price, or delivery area — proving missing facts stay missing.",
    summaryBn:
      "ক্রেতা সিরামের জন্য 'তাড়াতাড়ি' এবং 'কিছু ডিসকাউন্ট' চেয়েছে কিন্তু পরিমাণ, দাম বা এলাকা দেয়নি — যাচাই ছাড়া কোনো তথ্য অনুমান করা হবে না।",
    transcript: [
      "Customer: Bhaiya Vitamin C serum ta hobe?",
      "Customer: Taratari pathaben, kichu discount diyen, address pore dicchi.",
      "Merchant: Ji apu, kotogulo lagbe ar kon area te delivery lagbe bolle confirm korte parbo.",
    ].join("\n"),
  },
  {
    id: "bd-healthy-order",
    channel: "whatsapp",
    badgeEn: "Mixed · Supported & Healthy",
    badgeBn: "মিশ্র · নিরাপদ অর্ডার",
    tone: "ready",
    titleEn: "Full-price Dhaka order with secured stock",
    titleBn: "স্টক নিশ্চিত ও সঠিক মার্জিনের ঢাকা অর্ডার",
    summaryEn:
      "Customer confirms 1 Handcrafted Leather Tote Bag to Dhanmondi at full price (2400 tk + 70 tk delivery) with stock secured and clear timeline.",
    summaryBn:
      "ক্রেতা ধানমন্ডিতে ১টি লেদার টোট ব্যাগ পূর্ণ মূল্যে (২৪০০ টাকা + ৭০ টাকা ডেলিভারি) কনফার্ম করেছে, স্টক ও মার্জিন দুটিই নিরাপদ।",
    transcript: [
      "Customer: Hello bhaiya, 1ta Handcrafted Leather Tote Bag lagbe Dhanmondi te.",
      "Merchant: Price 2400 tk and inside Dhaka delivery charge 70 tk. Tomorrow 4pm er moddhe dispatch korte parbo.",
      "Customer: Perfect, 2400 tk + 70 tk delivery confirm, cash on delivery dibo. Tomorrow 4pm dispatch is fine.",
    ].join("\n"),
  },
] as const;
