"use client";

import {
  MARGIN_LEAK_FINANCIAL_CATEGORIES,
  type MarginLeakFinancialCategory,
} from "@commerceos/contracts";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  DHAKA_TIMEZONE_LABEL_BN,
  DHAKA_TIMEZONE_LABEL_EN,
  dhakaInputToUtcIso,
  formatDhakaDateTime,
  formatUtcDateTime,
} from "../../../lib/dhaka-time";
import { SOCIAL_COMMERCE_SCENARIOS } from "../domain/scenarios";
import {
  socialCommerceEvaluateResponseSchema,
  socialCommerceExtractResponseSchema,
  type EvidenceSpan,
  type FieldConfidence,
  type SocialCommerceChannel,
  type SocialCommerceEvaluateResponse,
  type SocialCommerceExtractResponse,
} from "../domain/schema";
import {
  buildEvaluatePayloadFromForm,
  extractionToReviewForm,
  type SocialCommerceReviewForm,
} from "./draft-mapper";
import { formatMinorCurrency } from "./format";
import {
  ACTION_SOURCE_LABELS,
  CATEGORY_LABELS_BILINGUAL,
  CONFIDENCE_LABELS,
  FIELD_LABELS_BILINGUAL,
  humanizeCode,
  ML_VERDICT_LABELS,
  PG_FINDING_LABELS,
  PG_VERDICT_LABELS,
  REVIEW_REASON_LABELS,
  UI_COPY,
  type UiLocale,
} from "./i18n";

type ExtractedFieldBadgeProps = {
  label: string;
  valueText: string;
  confidence: FieldConfidence;
  needsVerification: boolean;
  reason?: string;
  evidence: EvidenceSpan[];
  locale: UiLocale;
};

function ExtractedFieldCard({
  label,
  valueText,
  confidence,
  needsVerification,
  reason,
  evidence,
  locale,
}: ExtractedFieldBadgeProps) {
  const copy = UI_COPY[locale];
  const confLabel = CONFIDENCE_LABELS[locale][confidence];

  return (
    <article
      className="sc-field-card"
      data-confidence={confidence}
      data-verify={needsVerification ? "true" : "false"}
    >
      <div className="sc-field-card-top">
        <span className="sc-field-card-label">{label}</span>
        <span className="sc-conf-pill" data-confidence={confidence}>
          {confLabel}
        </span>
      </div>
      <div className="sc-field-card-value">{valueText}</div>
      {reason ? <p className="sc-field-card-reason">{reason}</p> : null}
      <div className="sc-field-evidence">
        {evidence.length > 0 ? (
          evidence.map((span, idx) => (
            <p key={`${span.lineNumber}-${idx}`} className="sc-quote-line">
              <span className="sc-quote-meta">
                L{span.lineNumber} · {span.speaker}:
              </span>{" "}
              &ldquo;{span.quote}&rdquo;
            </p>
          ))
        ) : (
          <p className="sc-quote-empty">{copy.noEvidence}</p>
        )}
      </div>
    </article>
  );
}

export function SocialCommerceWorkspace() {
  const [locale, setLocale] = useState<UiLocale>("en");
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    SOCIAL_COMMERCE_SCENARIOS[0]!.id,
  );
  const [channel, setChannel] = useState<SocialCommerceChannel>(
    SOCIAL_COMMERCE_SCENARIOS[0]!.channel,
  );
  const [transcript, setTranscript] = useState<string>(
    SOCIAL_COMMERCE_SCENARIOS[0]!.transcript,
  );

  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extraction, setExtraction] =
    useState<SocialCommerceExtractResponse | null>(null);
  const [reviewForm, setReviewForm] = useState<SocialCommerceReviewForm | null>(
    null,
  );

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluateError, setEvaluateError] = useState<string | null>(null);
  const [evaluation, setEvaluation] =
    useState<SocialCommerceEvaluateResponse | null>(null);
  const [humanDecision, setHumanDecision] = useState<
    "none" | "approved" | "follow_up"
  >("none");
  const [editedCategories, setEditedCategories] = useState<
    Partial<Record<MarginLeakFinancialCategory, boolean>>
  >({});

  const step2HeadingRef = useRef<HTMLHeadingElement | null>(null);
  const step3HeadingRef = useRef<HTMLHeadingElement | null>(null);
  const extractAbortRef = useRef<AbortController | null>(null);
  const extractRequestIdRef = useRef(0);
  const evaluateAbortRef = useRef<AbortController | null>(null);
  const evaluateRequestIdRef = useRef(0);

  useEffect(
    () => () => {
      extractAbortRef.current?.abort();
      evaluateAbortRef.current?.abort();
    },
    [],
  );

  const copy = UI_COPY[locale];

  const handleSelectScenario = useCallback((scenarioId: string) => {
    const found = SOCIAL_COMMERCE_SCENARIOS.find((s) => s.id === scenarioId);
    if (!found) return;
    extractRequestIdRef.current += 1;
    evaluateRequestIdRef.current += 1;
    extractAbortRef.current?.abort();
    evaluateAbortRef.current?.abort();
    setIsExtracting(false);
    setIsEvaluating(false);
    setSelectedScenarioId(found.id);
    setChannel(found.channel);
    setTranscript(found.transcript);
    setExtraction(null);
    setReviewForm(null);
    setEvaluation(null);
    setExtractError(null);
    setEvaluateError(null);
    setHumanDecision("none");
    setEditedCategories({});
  }, []);

  const handleTranscriptChange = useCallback((next: string) => {
    extractRequestIdRef.current += 1;
    evaluateRequestIdRef.current += 1;
    extractAbortRef.current?.abort();
    evaluateAbortRef.current?.abort();
    setIsExtracting(false);
    setIsEvaluating(false);
    setTranscript(next);
    setExtraction(null);
    setReviewForm(null);
    setEvaluation(null);
    setExtractError(null);
    setEvaluateError(null);
    setHumanDecision("none");
    setEditedCategories({});
  }, []);

  const handleExtract = useCallback(async () => {
    setExtractError(null);
    setEvaluateError(null);
    setEvaluation(null);
    setHumanDecision("none");

    const trimmed = transcript.trim();
    if (trimmed.length < 5) {
      setExtractError(
        locale === "bn"
          ? "বিশ্লেষণের জন্য অন্তত একটি ক্রেতার মেসেজ পেস্ট করুন।"
          : "Paste a customer conversation (at least 5 characters) before extracting.",
      );
      return;
    }

    extractAbortRef.current?.abort();
    const controller = new AbortController();
    extractAbortRef.current = controller;
    const requestSeq = ++extractRequestIdRef.current;

    setIsExtracting(true);
    try {
      const response = await fetch("/api/v1/social-commerce/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          schemaVersion: "1.0",
          channel,
          transcript: trimmed,
          scenario: { scenarioId: selectedScenarioId, synthetic: true },
        }),
        cache: "no-store",
        signal: controller.signal,
      });
      if (requestSeq !== extractRequestIdRef.current) return;
      const json: unknown = await response.json();
      if (requestSeq !== extractRequestIdRef.current) return;
      if (!response.ok) {
        setExtractError(
          locale === "bn"
            ? "চ্যাট এক্সট্রাকশন ব্যর্থ হয়েছে। ইনপুট যাচাই করে আবার চেষ্টা করুন।"
            : "Conversation extraction request was rejected. Check the transcript and try again.",
        );
        return;
      }

      const parsed = socialCommerceExtractResponseSchema.safeParse(json);
      if (!parsed.success) {
        setExtractError("Extraction response failed contract verification.");
        return;
      }

      const serverAsOf = new Date(parsed.data.metadata.receivedAt);
      setExtraction(parsed.data);
      setEditedCategories({});
      setReviewForm(
        extractionToReviewForm(parsed.data, selectedScenarioId, serverAsOf),
      );
      setTimeout(() => {
        step2HeadingRef.current?.focus();
      }, 40);
    } catch {
      if (
        controller.signal.aborted ||
        requestSeq !== extractRequestIdRef.current
      )
        return;
      setExtractError(
        locale === "bn"
          ? "সার্ভারের সাথে সংযোগ করা যায়নি।"
          : "Unable to reach CommerceOS extraction endpoint.",
      );
    } finally {
      if (requestSeq === extractRequestIdRef.current) {
        setIsExtracting(false);
      }
    }
  }, [channel, locale, selectedScenarioId, transcript]);

  const updateForm = useCallback(
    (updater: (prev: SocialCommerceReviewForm) => SocialCommerceReviewForm) => {
      setReviewForm((prev) => (prev ? updater(prev) : prev));
      setEvaluation(null);
      setEvaluateError(null);
      setHumanDecision("none");
    },
    [],
  );

  const updateCategoryField = useCallback(
    (
      category: MarginLeakFinancialCategory,
      side: "expectedMajor" | "observedMajor",
      value: string,
    ) => {
      setEditedCategories((prev) => ({ ...prev, [category]: true }));
      updateForm((prev) => ({
        ...prev,
        categories: {
          ...prev.categories,
          [category]: {
            ...prev.categories[category],
            [side]: value,
          },
        },
      }));
    },
    [updateForm],
  );

  const handleEvaluate = useCallback(async () => {
    if (!reviewForm) return;
    setEvaluateError(null);
    setHumanDecision("none");

    const built = buildEvaluatePayloadFromForm(reviewForm, channel);
    if (!built.ok) {
      setEvaluateError(built.error);
      return;
    }

    evaluateAbortRef.current?.abort();
    const controller = new AbortController();
    evaluateAbortRef.current = controller;
    const requestSeq = ++evaluateRequestIdRef.current;

    setIsEvaluating(true);
    try {
      const response = await fetch("/api/v1/social-commerce/evaluate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(built.payload),
        cache: "no-store",
        signal: controller.signal,
      });
      if (requestSeq !== evaluateRequestIdRef.current) return;
      const json: unknown = await response.json();
      if (requestSeq !== evaluateRequestIdRef.current) return;
      if (!response.ok) {
        setEvaluateError(
          locale === "bn"
            ? "PromiseGuard ও MarginLeak যাচাই ব্যর্থ হয়েছে। তারিখ ও টাকার ঘর পরীক্ষা করুন।"
            : "Deterministic evaluation rejected the submitted evidence. Check timestamps and BDT inputs.",
        );
        return;
      }

      const parsed = socialCommerceEvaluateResponseSchema.safeParse(json);
      if (!parsed.success) {
        setEvaluateError("Evaluation response failed contract verification.");
        return;
      }

      setEvaluation(parsed.data);
      setTimeout(() => {
        step3HeadingRef.current?.focus();
      }, 40);
    } catch {
      if (
        controller.signal.aborted ||
        requestSeq !== evaluateRequestIdRef.current
      )
        return;
      setEvaluateError(
        locale === "bn"
          ? "মূল্যায়ন এন্ডপয়েন্টে সংযোগ করা যায়নি।"
          : "Unable to reach CommerceOS evaluation endpoint.",
      );
    } finally {
      if (requestSeq === evaluateRequestIdRef.current) {
        setIsEvaluating(false);
      }
    }
  }, [channel, locale, reviewForm]);

  return (
    <div className="sc-workspace">
      <section className="sc-hero" aria-labelledby="sc-hero-title">
        <div className="sc-hero-top">
          <div className="pg-hero-badge-row">
            <span className="mission-tag">{copy.eyebrow}</span>
          </div>
          <div
            className="sc-locale-toggle"
            role="group"
            aria-label="Language selection"
          >
            <button
              type="button"
              className={`sc-locale-btn ${locale === "en" ? "is-active" : ""}`}
              aria-pressed={locale === "en"}
              onClick={() => setLocale("en")}
            >
              English
            </button>
            <button
              type="button"
              className={`sc-locale-btn ${locale === "bn" ? "is-active" : ""}`}
              aria-pressed={locale === "bn"}
              onClick={() => setLocale("bn")}
            >
              বাংলা
            </button>
          </div>
        </div>

        <h1 id="sc-hero-title" className="pg-hero-title">
          {copy.title}
        </h1>
        <p className="sc-tagline">{copy.tagline}</p>
        <p className="pg-hero-summary">{copy.subtitle}</p>

        <div className="sc-honesty-banner" role="note">
          <strong>{copy.demoBannerTitle}</strong> {copy.demoBannerBody}
        </div>

        <ol
          className="sc-stepper"
          aria-label={
            locale === "bn" ? "অর্ডার যাচাইয়ের ধাপ" : "Workflow steps"
          }
        >
          <li
            className="sc-step-item"
            data-state={extraction ? "done" : "active"}
          >
            <span className="sc-step-num" aria-hidden="true">
              {extraction ? "✓" : "1"}
            </span>
            <span>{copy.step1Short}</span>
          </li>
          <li
            className="sc-step-item"
            data-state={evaluation ? "done" : extraction ? "active" : "pending"}
          >
            <span className="sc-step-num" aria-hidden="true">
              {evaluation ? "✓" : "2"}
            </span>
            <span>{copy.step2Short}</span>
          </li>
          <li
            className="sc-step-item"
            data-state={evaluation ? "active" : "pending"}
          >
            <span className="sc-step-num" aria-hidden="true">
              3
            </span>
            <span>{copy.step3Short}</span>
          </li>
        </ol>
      </section>

      {/* STEP 1: CONVERSATION INTAKE */}
      <section className="sc-card" aria-labelledby="sc-step1-heading">
        <div className="sc-section-head">
          <p className="eyebrow">{copy.step1Tag}</p>
          <h2 id="sc-step1-heading" className="sc-section-title">
            {copy.step1Title}
          </h2>
          <p className="pg-section-hint">{copy.step1Hint}</p>
        </div>

        <div
          className="sc-scenario-grid"
          role="radiogroup"
          aria-label="Sample Bangladeshi social-commerce conversations"
        >
          {SOCIAL_COMMERCE_SCENARIOS.map((scenario) => {
            const selected = selectedScenarioId === scenario.id;
            return (
              <button
                key={scenario.id}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`sc-scenario-btn ${selected ? "is-selected" : ""}`}
                onClick={() => handleSelectScenario(scenario.id)}
              >
                <span className="sc-scenario-pill" data-tone={scenario.tone}>
                  {locale === "bn" ? scenario.badgeBn : scenario.badgeEn}
                </span>
                <strong className="sc-scenario-name">
                  {locale === "bn" ? scenario.titleBn : scenario.titleEn}
                </strong>
                <span className="sc-scenario-summary">
                  {locale === "bn" ? scenario.summaryBn : scenario.summaryEn}
                </span>
              </button>
            );
          })}
        </div>

        <div className="sc-intake-controls">
          <div className="pg-field">
            <label htmlFor="sc-channel" className="pg-label">
              {copy.channelLabel}
            </label>
            <select
              id="sc-channel"
              className="pg-select"
              value={channel}
              onChange={(event) =>
                setChannel(event.target.value as SocialCommerceChannel)
              }
            >
              <option value="messenger">Facebook Messenger</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="facebook_comment">Facebook Page Comment</option>
            </select>
          </div>

          <div className="pg-field">
            <label htmlFor="sc-transcript" className="pg-label">
              {copy.transcriptLabel}
            </label>
            <textarea
              id="sc-transcript"
              className="sc-textarea"
              rows={6}
              value={transcript}
              placeholder={copy.transcriptPlaceholder}
              onChange={(event) => handleTranscriptChange(event.target.value)}
            />
          </div>
        </div>

        {extractError ? (
          <div className="pg-error-summary" role="alert">
            <p className="pg-error-summary-general">{extractError}</p>
          </div>
        ) : null}

        <div className="sc-actions-row">
          <button
            type="button"
            className="pg-button pg-button-primary"
            disabled={isExtracting}
            onClick={handleExtract}
          >
            {isExtracting ? copy.extractingBtn : copy.extractBtn}
          </button>
          <button
            type="button"
            className="pg-button pg-button-secondary"
            onClick={() => handleSelectScenario(selectedScenarioId)}
          >
            {copy.resetBtn}
          </button>
        </div>
      </section>

      {/* STEP 2: EXTRACTED ORDER DRAFT + UNCERTAINTIES + EDITABLE EVIDENCE */}
      {extraction && reviewForm ? (
        <section className="sc-card" aria-labelledby="sc-step2-heading">
          <div className="sc-section-head">
            <p className="eyebrow">{copy.step2Tag}</p>
            <h2
              id="sc-step2-heading"
              ref={step2HeadingRef}
              tabIndex={-1}
              className="sc-section-title"
            >
              {copy.step2Title}
            </h2>
            <div className="sc-meta-chips">
              <span
                className="sc-mode-chip"
                data-mode={extraction.extractionMode}
              >
                {extraction.extractionMode === "live_llm"
                  ? `${copy.modeLive} (${extraction.inference.status === "available" ? extraction.inference.modelId : ""})`
                  : copy.modeDeterministic}
              </span>
              <span className="sc-meta-chip">
                {copy.detectedLang}:{" "}
                <strong>
                  {extraction.draft.detectedLanguage.toUpperCase()}
                </strong>
              </span>
            </div>
          </div>

          {extraction.draft.uncertainties.length > 0 ? (
            <div
              className="sc-uncertainty-box"
              role="alert"
              data-testid="sc-uncertainties"
            >
              <h3 className="sc-uncertainty-title">
                ▲ {copy.uncertaintiesTitle} (
                {extraction.draft.uncertainties.length})
              </h3>
              <p className="sc-uncertainty-hint">{copy.uncertaintiesHint}</p>
              <ul className="sc-uncertainty-list">
                {extraction.draft.uncertainties.map((item) => {
                  const fieldLabel =
                    FIELD_LABELS_BILINGUAL[item.field]?.[locale] ?? item.field;
                  return (
                    <li
                      key={`${item.field}-${item.code}`}
                      data-code={item.code}
                    >
                      <strong>{fieldLabel}:</strong>{" "}
                      {locale === "bn" ? item.messageBn : item.messageEn}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          <div className="sc-extracted-grid">
            <ExtractedFieldCard
              label={locale === "bn" ? "পণ্য" : "Product"}
              valueText={
                extraction.draft.productName.value ??
                (locale === "bn" ? "অনুপস্থিত" : "Missing")
              }
              confidence={extraction.draft.productName.confidence}
              needsVerification={extraction.draft.productName.needsVerification}
              reason={extraction.draft.productName.reason}
              evidence={extraction.draft.productName.evidence}
              locale={locale}
            />
            <ExtractedFieldCard
              label={locale === "bn" ? "পরিমাণ" : "Quantity"}
              valueText={
                extraction.draft.quantity.value !== null
                  ? String(extraction.draft.quantity.value)
                  : locale === "bn"
                    ? "অনুপস্থিত"
                    : "Missing"
              }
              confidence={extraction.draft.quantity.confidence}
              needsVerification={extraction.draft.quantity.needsVerification}
              reason={extraction.draft.quantity.reason}
              evidence={extraction.draft.quantity.evidence}
              locale={locale}
            />
            <ExtractedFieldCard
              label={locale === "bn" ? "সম্মত মূল্য" : "Agreed Price"}
              valueText={
                extraction.draft.agreedTotalPriceMinor.value !== null
                  ? formatMinorCurrency(
                      extraction.draft.agreedTotalPriceMinor.value,
                      "BDT",
                    )
                  : locale === "bn"
                    ? "অনুপস্থিত"
                    : "Missing"
              }
              confidence={extraction.draft.agreedTotalPriceMinor.confidence}
              needsVerification={
                extraction.draft.agreedTotalPriceMinor.needsVerification
              }
              reason={extraction.draft.agreedTotalPriceMinor.reason}
              evidence={extraction.draft.agreedTotalPriceMinor.evidence}
              locale={locale}
            />
            <ExtractedFieldCard
              label={locale === "bn" ? "ছাড় / ডিসকাউন্ট" : "Agreed Discount"}
              valueText={
                extraction.draft.agreedDiscountMinor.value !== null
                  ? formatMinorCurrency(
                      extraction.draft.agreedDiscountMinor.value,
                      "BDT",
                    )
                  : locale === "bn"
                    ? "অনিশ্চিত / অনুপস্থিত"
                    : "Unconfirmed / Missing"
              }
              confidence={extraction.draft.agreedDiscountMinor.confidence}
              needsVerification={
                extraction.draft.agreedDiscountMinor.needsVerification
              }
              reason={extraction.draft.agreedDiscountMinor.reason}
              evidence={extraction.draft.agreedDiscountMinor.evidence}
              locale={locale}
            />
            <ExtractedFieldCard
              label={locale === "bn" ? "ডেলিভারি এলাকা" : "Delivery Location"}
              valueText={
                extraction.draft.deliveryLocation.value ??
                (locale === "bn" ? "অনুপস্থিত" : "Missing")
              }
              confidence={extraction.draft.deliveryLocation.confidence}
              needsVerification={
                extraction.draft.deliveryLocation.needsVerification
              }
              reason={extraction.draft.deliveryLocation.reason}
              evidence={extraction.draft.deliveryLocation.evidence}
              locale={locale}
            />
            <ExtractedFieldCard
              label={locale === "bn" ? "ডেলিভারি চার্জ" : "Delivery Charge"}
              valueText={
                extraction.draft.deliveryChargeMinor.value !== null
                  ? formatMinorCurrency(
                      extraction.draft.deliveryChargeMinor.value,
                      "BDT",
                    )
                  : locale === "bn"
                    ? "অনুপস্থিত"
                    : "Missing"
              }
              confidence={extraction.draft.deliveryChargeMinor.confidence}
              needsVerification={
                extraction.draft.deliveryChargeMinor.needsVerification
              }
              reason={extraction.draft.deliveryChargeMinor.reason}
              evidence={extraction.draft.deliveryChargeMinor.evidence}
              locale={locale}
            />
            <ExtractedFieldCard
              label={locale === "bn" ? "সময়সীমা" : "Promised Timeline"}
              valueText={
                extraction.draft.promisedTimelineText.value ??
                (locale === "bn" ? "অনুপস্থিত" : "Missing")
              }
              confidence={extraction.draft.promisedTimelineText.confidence}
              needsVerification={
                extraction.draft.promisedTimelineText.needsVerification
              }
              reason={extraction.draft.promisedTimelineText.reason}
              evidence={extraction.draft.promisedTimelineText.evidence}
              locale={locale}
            />
            <article className="sc-field-card" data-confidence="high">
              <div className="sc-field-card-top">
                <span className="sc-field-card-label">
                  {locale === "bn"
                    ? "ক্রেতার শর্ত ও পেমেন্ট"
                    : "Requirements & Payment"}
                </span>
                <span className="sc-conf-pill" data-confidence="high">
                  {extraction.draft.paymentMethod.toUpperCase()}
                </span>
              </div>
              <div className="sc-field-card-value">
                {extraction.draft.customerRequirements.length > 0
                  ? extraction.draft.customerRequirements.join(" · ")
                  : locale === "bn"
                    ? "কোনো অতিরিক্ত শর্ত পাওয়া যায়নি"
                    : "No additional notes detected"}
              </div>
            </article>
          </div>

          <div className="sc-catalog-note">
            {extraction.catalogMatch ? (
              <>
                <strong>{copy.catalogMatchLabel}:</strong>{" "}
                <code>{extraction.catalogMatch.sku}</code> —{" "}
                {locale === "bn"
                  ? `${extraction.catalogMatch.nameBn} · ${extraction.catalogMatch.referenceStockNoteBn}`
                  : `${extraction.catalogMatch.nameEn} · ${extraction.catalogMatch.referenceStockNoteEn}`}
              </>
            ) : (
              <strong>{copy.catalogNoMatch}</strong>
            )}
          </div>

          {/* EDITABLE REVIEW FORM */}
          <div className="sc-review-grid" key={extraction.metadata.requestId}>
            <fieldset className="pg-group">
              <legend>{copy.orderCardTitle}</legend>
              <div className="pg-grid-2">
                <div className="pg-field">
                  <label htmlFor="sc-product" className="pg-label">
                    {locale === "bn" ? "পণ্যের নাম" : "Product"}
                  </label>
                  <input
                    id="sc-product"
                    name="order-product"
                    type="text"
                    autoComplete="off"
                    className="pg-input"
                    value={reviewForm.productSummary}
                    placeholder={
                      locale === "bn"
                        ? "পণ্যের নাম লিখুন"
                        : "Enter product name"
                    }
                    onChange={(event) =>
                      updateForm((prev) => ({
                        ...prev,
                        productSummary: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="pg-field">
                  <label htmlFor="sc-quantity" className="pg-label">
                    {locale === "bn" ? "পরিমাণ" : "Quantity"}
                  </label>
                  <input
                    id="sc-quantity"
                    name="order-quantity"
                    type="text"
                    autoComplete="off"
                    className="pg-input sc-tabular"
                    inputMode="numeric"
                    value={reviewForm.quantity}
                    placeholder={locale === "bn" ? "অনুপস্থিত" : "Missing"}
                    onChange={(event) =>
                      updateForm((prev) => ({
                        ...prev,
                        quantity: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="pg-field">
                  <label htmlFor="sc-location" className="pg-label">
                    {locale === "bn" ? "ডেলিভারি এলাকা" : "Delivery area"}
                  </label>
                  <input
                    id="sc-location"
                    name="order-location"
                    type="text"
                    autoComplete="off"
                    className="pg-input"
                    value={reviewForm.deliveryLocation}
                    placeholder={locale === "bn" ? "অনুপস্থিত" : "Missing"}
                    onChange={(event) =>
                      updateForm((prev) => ({
                        ...prev,
                        deliveryLocation: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="pg-field">
                  <label htmlFor="sc-order-ref" className="pg-label">
                    {locale === "bn" ? "অর্ডার রেফারেন্স" : "Order reference"}
                  </label>
                  <input
                    id="sc-order-ref"
                    name="order-ref"
                    type="text"
                    autoComplete="off"
                    className="pg-input"
                    value={reviewForm.orderRef}
                    onChange={(event) =>
                      updateForm((prev) => ({
                        ...prev,
                        orderRef: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className="pg-group">
              <legend>{copy.pgCardTitle}</legend>
              <div className="pg-grid-2">
                <div className="pg-field">
                  <label htmlFor="sc-dispatch-by" className="pg-label">
                    {locale === "bn"
                      ? "প্রতিশ্রুত ডিসপ্যাচ সময়"
                      : "Promised dispatch by"}{" "}
                    <span className="pg-utc-badge">
                      {locale === "bn"
                        ? DHAKA_TIMEZONE_LABEL_BN
                        : DHAKA_TIMEZONE_LABEL_EN}
                    </span>
                  </label>
                  <input
                    id="sc-dispatch-by"
                    type="datetime-local"
                    className="pg-input"
                    value={reviewForm.dispatchByLocal}
                    onChange={(event) =>
                      updateForm((prev) => ({
                        ...prev,
                        dispatchByLocal: event.target.value,
                      }))
                    }
                  />
                  <p className="pg-hint">
                    {locale === "bn"
                      ? "বাংলাদেশ সময়ে (UTC+6) লিখুন; সার্ভারে স্বয়ংক্রিয়ভাবে UTC-তে রূপান্তর হবে।"
                      : "Entered in Bangladesh time (UTC+6) and converted to UTC automatically."}
                  </p>
                </div>
                <div className="pg-field">
                  <label htmlFor="sc-stock" className="pg-label">
                    {locale === "bn" ? "স্টক অবস্থা" : "Inventory allocation"}
                  </label>
                  <select
                    id="sc-stock"
                    className="pg-select"
                    value={reviewForm.inventoryStatus}
                    onChange={(event) =>
                      updateForm((prev) => ({
                        ...prev,
                        inventoryStatus: event.target
                          .value as SocialCommerceReviewForm["inventoryStatus"],
                      }))
                    }
                  >
                    <option value="secured">Secured (In stock)</option>
                    <option value="not_secured">
                      Not secured (Out of stock)
                    </option>
                    <option value="unknown">Unknown (Needs shelf check)</option>
                  </select>
                </div>
                <div className="pg-field">
                  <label htmlFor="sc-fulfillment-state" className="pg-label">
                    {locale === "bn"
                      ? "ফুলফিলমেন্ট অবস্থা"
                      : "Fulfilment state"}
                  </label>
                  <select
                    id="sc-fulfillment-state"
                    className="pg-select"
                    value={reviewForm.fulfillmentState}
                    onChange={(event) =>
                      updateForm((prev) => ({
                        ...prev,
                        fulfillmentState: event.target
                          .value as SocialCommerceReviewForm["fulfillmentState"],
                      }))
                    }
                  >
                    <option value="not_started">Not started</option>
                    <option value="in_progress">In progress</option>
                    <option value="ready">Ready to dispatch</option>
                    <option value="blocked">Blocked</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
                <div className="pg-field">
                  <label htmlFor="sc-blocking-status" className="pg-label">
                    {locale === "bn" ? "ব্লকার অবস্থা" : "Blocking status"}
                  </label>
                  <select
                    id="sc-blocking-status"
                    className="pg-select"
                    value={reviewForm.blockingStatus}
                    onChange={(event) =>
                      updateForm((prev) => ({
                        ...prev,
                        blockingStatus: event.target
                          .value as SocialCommerceReviewForm["blockingStatus"],
                      }))
                    }
                  >
                    <option value="none_known">No known blockers</option>
                    <option value="active">
                      Active blocker (Inventory shortage)
                    </option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
              </div>

              <div className="sc-checkbox-row">
                <label className="pg-check">
                  <input
                    type="checkbox"
                    checked={reviewForm.inventoryValidityKnown}
                    onChange={(event) =>
                      updateForm((prev) => ({
                        ...prev,
                        inventoryValidityKnown: event.target.checked,
                      }))
                    }
                  />
                  <span>
                    {locale === "bn"
                      ? "স্টকের তথ্য আজ যাচাই করা হয়েছে"
                      : "Stock freshness verified today"}
                  </span>
                </label>
                <label className="pg-check">
                  <input
                    type="checkbox"
                    checked={reviewForm.includeReadyEstimate}
                    onChange={(event) =>
                      updateForm((prev) => ({
                        ...prev,
                        includeReadyEstimate: event.target.checked,
                      }))
                    }
                  />
                  <span>
                    {locale === "bn"
                      ? "প্রস্তুতির সম্ভাব্য সময় যুক্ত করুন"
                      : "Include packing readiness estimate"}
                  </span>
                </label>
              </div>

              {reviewForm.includeReadyEstimate ? (
                <div className="pg-field">
                  <label htmlFor="sc-ready-at" className="pg-label">
                    {locale === "bn"
                      ? "প্রস্তুত হওয়ার সম্ভাব্য সময়"
                      : "Estimated ready at"}{" "}
                    <span className="pg-utc-badge">
                      {locale === "bn"
                        ? DHAKA_TIMEZONE_LABEL_BN
                        : DHAKA_TIMEZONE_LABEL_EN}
                    </span>
                  </label>
                  <input
                    id="sc-ready-at"
                    type="datetime-local"
                    className="pg-input"
                    value={reviewForm.estimatedReadyAtLocal}
                    onChange={(event) =>
                      updateForm((prev) => ({
                        ...prev,
                        estimatedReadyAtLocal: event.target.value,
                      }))
                    }
                  />
                  <p className="pg-hint">
                    {locale === "bn"
                      ? "বাংলাদেশ সময়ে (UTC+6) সম্ভাব্য প্যাকিং শেষ হওয়ার সময়।"
                      : "Expected packing completion in Bangladesh time (UTC+6)."}
                  </p>
                </div>
              ) : null}
            </fieldset>
          </div>

          <fieldset className="pg-group">
            <legend>{copy.mlCardTitle}</legend>
            <p className="pg-fieldset-desc">{copy.mlCardHint}</p>

            <div
              className="sc-finance-legend"
              aria-label="Financial source legend"
            >
              <span className="sc-source-pill" data-tone="chat">
                {locale === "bn" ? "চ্যাট থেকে প্রাপ্ত" : "From chat"}
              </span>
              <span className="sc-source-pill" data-tone="catalog">
                {locale === "bn"
                  ? "নমুনা ক্যাটালগ / হার"
                  : "Sample catalog / rate"}
              </span>
              <span className="sc-source-pill" data-tone="estimate">
                {locale === "bn" ? "আনুমানিক ফি" : "Estimated fee"}
              </span>
              <span className="sc-source-pill" data-tone="missing">
                {locale === "bn"
                  ? "অনুপস্থিত — ম্যানুয়াল ইনপুট প্রয়োজন"
                  : "Missing — blocks profit total"}
              </span>
              <span className="sc-source-pill" data-tone="edited">
                {locale === "bn" ? "আপনার সম্পাদনা" : "Edited by you"}
              </span>
            </div>

            <div className="pg-field sc-settlement-field">
              <label htmlFor="sc-observation-state" className="pg-label">
                {locale === "bn"
                  ? "আর্থিক তথ্যের চূড়ান্ত অবস্থা"
                  : "Financial observation finality"}
              </label>
              <select
                id="sc-observation-state"
                className="pg-select"
                value={reviewForm.observationState}
                onChange={(event) =>
                  updateForm((prev) => ({
                    ...prev,
                    observationState: event.target.value as
                      "final" | "provisional",
                  }))
                }
              >
                <option value="final">
                  Final (Confirmed pricing &amp; known fees)
                </option>
                <option value="provisional">
                  Provisional (Pre-settlement courier/COD estimate)
                </option>
              </select>
            </div>

            <div className="sc-money-grid">
              {MARGIN_LEAK_FINANCIAL_CATEGORIES.map((category) => {
                const pair = reviewForm.categories[category];
                const meta = CATEGORY_LABELS_BILINGUAL[category];
                const label = meta[locale];
                const hint = locale === "bn" ? meta.hintBn : meta.hintEn;
                const isEdited = Boolean(editedCategories[category]);
                const expectedMissing = !pair.expectedMajor.trim();
                const observedMissing = !pair.observedMajor.trim();
                const isMissing = expectedMissing || observedMissing;

                const sourceTag = isEdited
                  ? {
                      text: locale === "bn" ? "সম্পাদিত" : "Edited by you",
                      tone: "edited" as const,
                    }
                  : isMissing
                    ? {
                        text:
                          locale === "bn"
                            ? "অনুপস্থিত — ম্যানুয়াল ইনপুট প্রয়োজন"
                            : "Missing — blocks profit total",
                        tone: "missing" as const,
                      }
                    : category === "grossItemRevenue" ||
                        category === "shippingRevenue" ||
                        category === "discounts"
                      ? {
                          text:
                            locale === "bn"
                              ? "চ্যাট থেকে প্রাপ্ত"
                              : "From chat",
                          tone: "chat" as const,
                        }
                      : category === "paymentCost"
                        ? {
                            text:
                              locale === "bn" ? "আনুমানিক ফি" : "Estimated fee",
                            tone: "estimate" as const,
                          }
                        : {
                            text:
                              locale === "bn"
                                ? "নমুনা ক্যাটালগ / হার"
                                : "Sample catalog / rate",
                            tone: "catalog" as const,
                          };
                return (
                  <div
                    key={category}
                    className="sc-money-row"
                    data-missing={isMissing ? "true" : "false"}
                  >
                    <div className="sc-money-row-head">
                      <span className="sc-money-label">{label}</span>
                      <span
                        className="sc-source-pill"
                        data-tone={sourceTag.tone}
                      >
                        {sourceTag.text}
                      </span>
                    </div>
                    <p className="sc-money-hint">{hint}</p>
                    <div className="sc-money-inputs">
                      <label className="sc-money-input-wrap">
                        <span>
                          {locale === "bn"
                            ? "প্রত্যাশিত / বেসলাইন (৳)"
                            : "Expected / Baseline (৳)"}
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          className="pg-input sc-tabular"
                          placeholder={
                            locale === "bn" ? "অনুপস্থিত" : "Missing"
                          }
                          value={pair.expectedMajor}
                          onChange={(event) =>
                            updateCategoryField(
                              category,
                              "expectedMajor",
                              event.target.value,
                            )
                          }
                        />
                      </label>
                      <label className="sc-money-input-wrap">
                        <span>
                          {locale === "bn"
                            ? "চ্যাট / প্রকৃত (৳)"
                            : "Observed / Chat (৳)"}
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          className="pg-input sc-tabular"
                          placeholder={
                            locale === "bn" ? "অনুপস্থিত" : "Missing"
                          }
                          value={pair.observedMajor}
                          onChange={(event) =>
                            updateCategoryField(
                              category,
                              "observedMajor",
                              event.target.value,
                            )
                          }
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </fieldset>

          {evaluateError ? (
            <div className="pg-error-summary" role="alert">
              <p className="pg-error-summary-general">{evaluateError}</p>
            </div>
          ) : null}

          <div className="sc-actions-row">
            <button
              type="button"
              className="pg-button pg-button-primary"
              disabled={isEvaluating}
              onClick={handleEvaluate}
            >
              {isEvaluating ? copy.evaluatingBtn : copy.evaluateBtn}
            </button>
          </div>
        </section>
      ) : null}

      {/* STEP 3: DUAL DETERMINISTIC EVALUATION + HUMAN REVIEW GATE */}
      {evaluation
        ? (() => {
            const pgData = evaluation.promiseGuard?.deterministic.data ?? null;
            const mlData = evaluation.marginLeak.deterministic.data;
            const netVarMinor =
              mlData.totals.netContributionVariance?.amountMinor ?? null;
            // In MarginLeak, netContributionVariance = expected - observed:
            // > 0 means observed margin is LOWER than expected (adverse impact)
            // < 0 means observed margin is HIGHER than expected (favorable impact)
            const netImpactDisplay =
              netVarMinor === null
                ? locale === "bn"
                  ? "স্থগিত (তথ্য অসম্পূর্ণ)"
                  : "Withheld (incomplete)"
                : netVarMinor > 0
                  ? `-${formatMinorCurrency(netVarMinor, evaluation.currency)}`
                  : netVarMinor < 0
                    ? `+${formatMinorCurrency(Math.abs(netVarMinor), evaluation.currency)}`
                    : formatMinorCurrency(0, evaluation.currency);
            const netImpactTone =
              netVarMinor === null
                ? "muted"
                : netVarMinor > 0
                  ? "adverse"
                  : netVarMinor < 0
                    ? "favorable"
                    : "neutral";

            const comparisonByCategory = new Map(
              mlData.categoryComparisons.map((item) => [item.category, item]),
            );
            const missingPathSet = new Set(mlData.missingEvidencePaths);

            return (
              <section
                className="sc-card sc-results-section"
                aria-labelledby="sc-step3-heading"
              >
                <div className="sc-section-head">
                  <p className="eyebrow">{copy.step3Tag}</p>
                  <h2
                    id="sc-step3-heading"
                    ref={step3HeadingRef}
                    tabIndex={-1}
                    className="sc-section-title"
                  >
                    {copy.step3Title}
                  </h2>
                </div>

                <div
                  className="sc-gate-banner"
                  data-status={evaluation.combinedReview.overallStatus}
                  data-testid="sc-human-gate"
                >
                  <div className="sc-gate-top">
                    <span className="sc-gate-pill">
                      {evaluation.combinedReview.overallStatus ===
                      "hold_for_review"
                        ? `▲ ${copy.holdForReview}`
                        : `✓ ${copy.readyForConfirmation}`}
                    </span>
                    <span className="sc-meta-chip">{copy.humanGateTitle}</span>
                  </div>
                  <p className="sc-gate-note">{copy.humanGateNote}</p>
                  {evaluation.combinedReview.reasonCodes.length > 0 ? (
                    <div className="sc-reason-pills">
                      {evaluation.combinedReview.reasonCodes.map((code) => (
                        <span
                          key={code}
                          className="sc-reason-pill"
                          data-code={code}
                        >
                          {humanizeCode(code, REVIEW_REASON_LABELS, locale)}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="sc-dual-grid">
                  {/* PROMISEGUARD RESULT CARD */}
                  <article
                    className="sc-engine-card"
                    data-testid="sc-promiseguard-card"
                  >
                    <div className="sc-engine-header">
                      <h3>{copy.pgResultTitle}</h3>
                      {pgData ? (
                        <span
                          className="sc-verdict-pill"
                          data-verdict={pgData.assessment}
                        >
                          {humanizeCode(
                            pgData.assessment,
                            PG_VERDICT_LABELS,
                            locale,
                          )}
                        </span>
                      ) : (
                        <span
                          className="sc-verdict-pill"
                          data-verdict="indeterminate"
                        >
                          {PG_VERDICT_LABELS.missing_deadline![locale]}
                        </span>
                      )}
                    </div>

                    {pgData ? (
                      <>
                        {reviewForm?.dispatchByLocal ? (
                          <p className="sc-engine-tz-meta">
                            <strong>
                              {locale === "bn"
                                ? "ডিসপ্যাচ সময়সীমা:"
                                : "Dispatch deadline:"}
                            </strong>{" "}
                            {formatDhakaDateTime(
                              dhakaInputToUtcIso(reviewForm.dispatchByLocal) ??
                                evaluation.metadata.respondedAt,
                            )}
                          </p>
                        ) : null}
                        <p className="sc-engine-sub">
                          {locale === "bn"
                            ? pgData.evidenceCompleteness === "complete"
                              ? "সব অপারেশনাল তথ্য যাচাই করা হয়েছে।"
                              : "কিছু স্টক বা প্রস্তুতির তথ্য অসম্পূর্ণ রয়েছে।"
                            : pgData.evidenceCompleteness === "complete"
                              ? "All fulfilment readiness checks evaluated with complete inputs."
                              : "Some fulfilment or freshness details are incomplete and need verification."}
                        </p>
                        <ul className="sc-findings-compact">
                          {pgData.findings.map((finding, index) => (
                            <li
                              key={`${finding.code}-${index}`}
                              data-impact={finding.impact}
                            >
                              <span
                                className="sc-impact-dot"
                                aria-hidden="true"
                              />
                              <span>
                                {humanizeCode(
                                  finding.code,
                                  PG_FINDING_LABELS,
                                  locale,
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <p className="sc-engine-sub">
                        {locale === "bn"
                          ? "চ্যাটে বা ফর্মে কোনো নির্দিষ্ট ডিসপ্যাচ সময় দেওয়া হয়নি। ক্রেতার সাথে ডিসপ্যাচ সময় নিশ্চিত না করে প্রতিশ্রুতি দেওয়া যাবে না।"
                          : evaluation.promiseGuardSkippedReason}
                      </p>
                    )}
                  </article>

                  {/* MARGINLEAK RESULT CARD */}
                  <article
                    className="sc-engine-card"
                    data-testid="sc-marginleak-card"
                  >
                    <div className="sc-engine-header">
                      <h3>{copy.mlResultTitle}</h3>
                      <span
                        className="sc-verdict-pill"
                        data-verdict={mlData.assessment}
                      >
                        {humanizeCode(
                          mlData.assessment,
                          ML_VERDICT_LABELS,
                          locale,
                        )}
                      </span>
                    </div>

                    <p className="sc-engine-sub">
                      {mlData.evidenceCompleteness === "incomplete"
                        ? locale === "bn"
                          ? `${mlData.missingEvidencePaths.length}টি মূল্য বা খরচের তথ্য অনুপস্থিত থাকায় মোট লাভ হিসাব স্থগিত রাখা হয়েছে। অনুপস্থিত তথ্য কখনোই ৳০ ধরা হয় না।`
                          : `Totals withheld because ${mlData.missingEvidencePaths.length} pricing or cost input(s) are missing. Missing inputs are never treated as ৳0.`
                        : mlData.observationState === "provisional"
                          ? locale === "bn"
                            ? "বর্তমান হিসাবটি অস্থায়ী (প্রাক-সেটেলমেন্ট)। চূড়ান্ত কুরিয়ার ও COD চার্জ নিশ্চিত হলে পুনরায় যাচাই করুন।"
                            : "Figures are marked provisional (pre-settlement). Confirmed margin loss is withheld until final courier/COD settlement."
                          : locale === "bn"
                            ? "সকল ৮টি আয় ও খরচের ক্যাটাগরি পূর্ণাঙ্গ তথ্যের ভিত্তিতে হিসাব করা হয়েছে।"
                            : "Calculated across all 8 revenue and cost categories using exact BDT minor-unit arithmetic."}
                    </p>

                    <div className="sc-kpi-grid">
                      <div className="sc-kpi-box">
                        <span>
                          {locale === "bn"
                            ? "প্রত্যাশিত লাভ"
                            : "Expected Profit"}
                        </span>
                        <strong className="sc-tabular">
                          {mlData.totals.expectedContributionMargin
                            ? formatMinorCurrency(
                                mlData.totals.expectedContributionMargin
                                  .amountMinor,
                                evaluation.currency,
                              )
                            : locale === "bn"
                              ? "স্থগিত (অসম্পূর্ণ)"
                              : "Withheld (incomplete)"}
                        </strong>
                      </div>
                      <div className="sc-kpi-box">
                        <span>
                          {locale === "bn"
                            ? "প্রকৃত / চ্যাট লাভ"
                            : "Actual / Chat Profit"}
                        </span>
                        <strong className="sc-tabular">
                          {mlData.totals.observedContributionMargin
                            ? formatMinorCurrency(
                                mlData.totals.observedContributionMargin
                                  .amountMinor,
                                evaluation.currency,
                              )
                            : locale === "bn"
                              ? "স্থগিত (অসম্পূর্ণ)"
                              : "Withheld (incomplete)"}
                        </strong>
                      </div>
                      <div className="sc-kpi-box" data-tone={netImpactTone}>
                        <span>
                          {locale === "bn"
                            ? "লাভের ওপর প্রভাব"
                            : "Net Profit Impact"}
                        </span>
                        <strong className="sc-tabular">
                          {netImpactDisplay}
                        </strong>
                      </div>
                      <div
                        className="sc-kpi-box"
                        data-tone={
                          mlData.totals.leakAmount ? "adverse" : "muted"
                        }
                      >
                        <span>
                          {locale === "bn"
                            ? "নিশ্চিত মার্জিন ক্ষতি"
                            : "Confirmed Margin Loss"}
                        </span>
                        <strong className="sc-tabular">
                          {mlData.totals.leakAmount
                            ? formatMinorCurrency(
                                mlData.totals.leakAmount.amountMinor,
                                evaluation.currency,
                              )
                            : mlData.observationState === "provisional"
                              ? locale === "bn"
                                ? "অনিশ্চিত (অস্থায়ী)"
                                : "Unconfirmed (provisional)"
                              : mlData.assessment === "no_leak_detected"
                                ? formatMinorCurrency(0, evaluation.currency)
                                : locale === "bn"
                                  ? "হিসাবযোগ্য নয়"
                                  : "Not calculable"}
                        </strong>
                      </div>
                    </div>
                  </article>
                </div>

                {/* FULL 8-CATEGORY CONTRIBUTION MARGIN LEDGER */}
                <div
                  className="sc-ledger-card"
                  data-testid="sc-marginleak-ledger"
                >
                  <div className="sc-ledger-head">
                    <h3>{copy.ledgerTitle}</h3>
                    <span className="sc-meta-chip">
                      {mlData.evidenceCompleteness === "complete"
                        ? locale === "bn"
                          ? "৮/৮ ক্যাটাগরি সম্পূর্ণ"
                          : "8/8 categories complete"
                        : locale === "bn"
                          ? `${mlData.categoryComparisons.length}/৮ ক্যাটাগরি সম্পূর্ণ`
                          : `${mlData.categoryComparisons.length}/8 categories complete`}
                    </span>
                  </div>
                  <div className="sc-ledger-table-wrap">
                    <table className="sc-ledger-table">
                      <thead>
                        <tr>
                          <th scope="col">
                            {locale === "bn" ? "ক্যাটাগরি" : "Category"}
                          </th>
                          <th scope="col" className="sc-num-col">
                            {locale === "bn" ? "প্রত্যাশিত" : "Expected"}
                          </th>
                          <th scope="col" className="sc-num-col">
                            {locale === "bn"
                              ? "চ্যাট / প্রকৃত"
                              : "Actual / Chat"}
                          </th>
                          <th scope="col" className="sc-num-col">
                            {locale === "bn"
                              ? "মার্জিন প্রভাব"
                              : "Margin Impact"}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {MARGIN_LEAK_FINANCIAL_CATEGORIES.map((category) => {
                          const meta = CATEGORY_LABELS_BILINGUAL[category];
                          const comparison = comparisonByCategory.get(category);
                          const expectedMissing = missingPathSet.has(
                            `/financials/${category}/expected`,
                          );
                          const observedMissing = missingPathSet.has(
                            `/financials/${category}/observed`,
                          );
                          const formPair = reviewForm?.categories[category];
                          const formatFallback = (val?: string) =>
                            val && val.trim() !== ""
                              ? `৳${Number(val).toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}`
                              : locale === "bn"
                                ? "অনুপস্থিত"
                                : "Missing";

                          return (
                            <tr
                              key={category}
                              data-direction={
                                comparison ? comparison.direction : "missing"
                              }
                            >
                              <td>
                                <span className="sc-ledger-cat-name">
                                  {meta[locale]}
                                </span>
                                <span
                                  className="sc-ledger-role"
                                  data-role={meta.role}
                                >
                                  {meta.role === "revenue"
                                    ? locale === "bn"
                                      ? "+ আয়"
                                      : "+ Revenue"
                                    : locale === "bn"
                                      ? "− খরচ"
                                      : "− Deduction"}
                                </span>
                              </td>
                              <td
                                className="sc-num-col sc-tabular"
                                data-label={
                                  locale === "bn" ? "প্রত্যাশিত" : "Expected"
                                }
                              >
                                {comparison ? (
                                  formatMinorCurrency(
                                    comparison.expected.amountMinor,
                                    evaluation.currency,
                                  )
                                ) : expectedMissing ? (
                                  <span className="sc-missing-val">
                                    {locale === "bn" ? "অনুপস্থিত" : "Missing"}
                                  </span>
                                ) : (
                                  formatFallback(formPair?.expectedMajor)
                                )}
                              </td>
                              <td
                                className="sc-num-col sc-tabular"
                                data-label={
                                  locale === "bn"
                                    ? "চ্যাট / প্রকৃত"
                                    : "Actual / Chat"
                                }
                              >
                                {comparison ? (
                                  formatMinorCurrency(
                                    comparison.observed.amountMinor,
                                    evaluation.currency,
                                  )
                                ) : observedMissing ? (
                                  <span className="sc-missing-val">
                                    {locale === "bn" ? "অনুপস্থিত" : "Missing"}
                                  </span>
                                ) : (
                                  formatFallback(formPair?.observedMajor)
                                )}
                              </td>
                              <td
                                className="sc-num-col sc-tabular"
                                data-label={
                                  locale === "bn"
                                    ? "মার্জিন প্রভাব"
                                    : "Margin Impact"
                                }
                              >
                                {comparison ? (
                                  <span
                                    className="sc-impact-badge"
                                    data-direction={comparison.direction}
                                  >
                                    {comparison.direction === "adverse"
                                      ? `-${formatMinorCurrency(comparison.varianceAmount.amountMinor, evaluation.currency)}`
                                      : comparison.direction === "favorable"
                                        ? `+${formatMinorCurrency(comparison.varianceAmount.amountMinor, evaluation.currency)}`
                                        : formatMinorCurrency(
                                            0,
                                            evaluation.currency,
                                          )}
                                  </span>
                                ) : (
                                  <span
                                    className="sc-impact-badge"
                                    data-direction="missing"
                                  >
                                    {locale === "bn"
                                      ? "অনুপস্থিত (৳০ নয়)"
                                      : "Missing (not ৳0)"}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* RECOMMENDED ACTIONS */}
                <div className="sc-actions-panel">
                  <h3>{copy.actionsTitle}</h3>
                  <ol className="sc-recommended-list">
                    {evaluation.recommendedActions.map((action) => (
                      <li key={action.code} className="sc-recommended-item">
                        <div className="sc-recommended-top">
                          <span className="sc-action-source-badge">
                            #{action.priority} ·{" "}
                            {humanizeCode(
                              action.source,
                              ACTION_SOURCE_LABELS,
                              locale,
                            )}
                          </span>
                          <strong>
                            {locale === "bn" ? action.titleBn : action.titleEn}
                          </strong>
                        </div>
                        <p>
                          {locale === "bn" ? action.detailBn : action.detailEn}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* INTERACTIVE HUMAN REVIEW DECISION */}
                <div className="sc-decision-bar">
                  <button
                    type="button"
                    className="pg-button pg-button-primary"
                    onClick={() => setHumanDecision("approved")}
                  >
                    {copy.decisionConfirmBtn}
                  </button>
                  <button
                    type="button"
                    className="pg-button pg-button-secondary"
                    onClick={() => setHumanDecision("follow_up")}
                  >
                    {copy.decisionFollowUpBtn}
                  </button>
                </div>

                {humanDecision !== "none" ? (
                  <div className="sc-decision-recorded" role="status">
                    {humanDecision === "approved"
                      ? copy.decisionConfirmedMsg
                      : copy.decisionFollowUpMsg}
                  </div>
                ) : null}
              </section>
            );
          })()
        : null}

      {/* TECHNICAL AUDIT & GOVERNANCE DISCLOSURE */}
      <details className="pg-details sc-arch-details">
        <summary>{copy.archSummary}</summary>
        <div className="sc-arch-body">
          <p className="sc-arch-flow">
            <code>
              Bangla/Banglish Chat → Structured Extraction → Human Verification
              → Deterministic PromiseGuard + MarginLeak (Exact BDT Minor Units)
              → Human Approval Gate
            </code>
          </p>
          {evaluation ? (
            <>
              <dl className="sc-audit-dl">
                <div>
                  <dt>Review Policy</dt>
                  <dd>
                    <code>{evaluation.combinedReview.policyVersion}</code>
                  </dd>
                </div>
                {evaluation.promiseGuard ? (
                  <div>
                    <dt>PromiseGuard Ruleset</dt>
                    <dd>
                      <code>
                        {evaluation.promiseGuard.deterministic.rulesetVersion}
                      </code>
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt>MarginLeak Ruleset</dt>
                  <dd>
                    <code>
                      {evaluation.marginLeak.deterministic.rulesetVersion}
                    </code>
                  </dd>
                </div>
                <div>
                  <dt>Trace ID</dt>
                  <dd>
                    <code>{evaluation.metadata.traceId}</code>
                  </dd>
                </div>
                <div>
                  <dt>Evaluated (Bangladesh / UTC)</dt>
                  <dd>
                    {formatDhakaDateTime(evaluation.metadata.respondedAt)} ·{" "}
                    <code>
                      {formatUtcDateTime(evaluation.metadata.respondedAt)}
                    </code>
                  </dd>
                </div>
                {reviewForm?.dispatchByLocal ? (
                  <div>
                    <dt>Submitted Dispatch Deadline (UTC)</dt>
                    <dd>
                      <code>
                        {dhakaInputToUtcIso(reviewForm.dispatchByLocal) ?? "—"}
                      </code>
                    </dd>
                  </div>
                ) : null}
                {reviewForm?.includeReadyEstimate &&
                reviewForm.estimatedReadyAtLocal ? (
                  <div>
                    <dt>Submitted Ready Estimate (UTC)</dt>
                    <dd>
                      <code>
                        {dhakaInputToUtcIso(reviewForm.estimatedReadyAtLocal) ??
                          "—"}
                      </code>
                    </dd>
                  </div>
                ) : null}
              </dl>
              <details className="pg-raw-details sc-raw-json-wrap">
                <summary className="pg-raw-summary">
                  View raw evaluation response payload (JSON)
                </summary>
                <pre className="pg-raw-json">
                  <code>{JSON.stringify(evaluation, null, 2)}</code>
                </pre>
              </details>
            </>
          ) : null}
          <ul>
            <li>
              <strong>Privacy &amp; Data Sovereignty:</strong> Sample workspace
              uses anonymized conversations with no personal phone numbers or
              street addresses. No data is persisted externally or used for
              model training.
            </li>
            <li>
              <strong>Deterministic Safeguards:</strong> AI never computes
              financial margins, never replaces missing costs with ৳0, and never
              overrides PromiseGuard or MarginLeak verdicts.
            </li>
            <li>
              <strong>Truthful Provenance:</strong> When a server-side live LLM
              credential is not active, CommerceOS transparently labels the
              deterministic Bangla/Banglish parser preview rather than
              simulating live model provenance.
            </li>
          </ul>
        </div>
      </details>
    </div>
  );
}
