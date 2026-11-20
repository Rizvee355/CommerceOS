"use client";

import {
  MARGIN_LEAK_FINANCIAL_CATEGORIES,
  type MarginLeakFinancialCategory,
} from "@commerceos/contracts";
import { useCallback, useRef, useState } from "react";

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
  CATEGORY_LABELS_BILINGUAL,
  CONFIDENCE_LABELS,
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

  const step2HeadingRef = useRef<HTMLHeadingElement | null>(null);
  const step3HeadingRef = useRef<HTMLHeadingElement | null>(null);

  const copy = UI_COPY[locale];

  const handleSelectScenario = useCallback((scenarioId: string) => {
    const found = SOCIAL_COMMERCE_SCENARIOS.find((s) => s.id === scenarioId);
    if (!found) return;
    setSelectedScenarioId(found.id);
    setChannel(found.channel);
    setTranscript(found.transcript);
    setExtraction(null);
    setReviewForm(null);
    setEvaluation(null);
    setExtractError(null);
    setEvaluateError(null);
    setHumanDecision("none");
  }, []);

  const handleTranscriptChange = useCallback((next: string) => {
    setTranscript(next);
    setExtraction(null);
    setReviewForm(null);
    setEvaluation(null);
    setExtractError(null);
    setEvaluateError(null);
    setHumanDecision("none");
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
      });
      const json: unknown = await response.json();
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
      setReviewForm(
        extractionToReviewForm(parsed.data, selectedScenarioId, serverAsOf),
      );
      setTimeout(() => {
        step2HeadingRef.current?.focus();
      }, 40);
    } catch {
      setExtractError(
        locale === "bn"
          ? "সার্ভারের সাথে সংযোগ করা যায়নি।"
          : "Unable to reach CommerceOS extraction endpoint.",
      );
    } finally {
      setIsExtracting(false);
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

    setIsEvaluating(true);
    try {
      const response = await fetch("/api/v1/social-commerce/evaluate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(built.payload),
        cache: "no-store",
      });
      const json: unknown = await response.json();
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
      setEvaluateError(
        locale === "bn"
          ? "মূল্যায়ন এন্ডপয়েন্টে সংযোগ করা যায়নি।"
          : "Unable to reach CommerceOS evaluation endpoint.",
      );
    } finally {
      setIsEvaluating(false);
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
                {extraction.draft.uncertainties.map((item) => (
                  <li key={`${item.field}-${item.code}`}>
                    <code>{item.code}</code> —{" "}
                    {locale === "bn" ? item.messageBn : item.messageEn}
                  </li>
                ))}
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
          <div className="sc-review-grid">
            <fieldset className="pg-group">
              <legend>{copy.orderCardTitle}</legend>
              <div className="pg-grid-2">
                <div className="pg-field">
                  <label htmlFor="sc-product" className="pg-label">
                    {locale === "bn" ? "পণ্যের নাম" : "Product"}
                  </label>
                  <input
                    id="sc-product"
                    className="pg-input"
                    value={reviewForm.productSummary}
                    placeholder="Enter product name"
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
                    className="pg-input"
                    inputMode="numeric"
                    value={reviewForm.quantity}
                    placeholder="Missing"
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
                    className="pg-input"
                    value={reviewForm.deliveryLocation}
                    placeholder="Missing"
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
                    <span className="pg-utc-badge">UTC</span>
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
                    <span className="pg-utc-badge">UTC</span>
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
                </div>
              ) : null}
            </fieldset>
          </div>

          <fieldset className="pg-group">
            <legend>{copy.mlCardTitle}</legend>
            <p className="pg-fieldset-desc">{copy.mlCardHint}</p>

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
                  Final (Confirmed pricing & known fees)
                </option>
                <option value="provisional">
                  Provisional (Pre-settlement courier/COD estimate)
                </option>
              </select>
            </div>

            <div className="sc-money-grid">
              {MARGIN_LEAK_FINANCIAL_CATEGORIES.map((category) => {
                const pair = reviewForm.categories[category];
                const label = CATEGORY_LABELS_BILINGUAL[category][locale];
                return (
                  <div key={category} className="sc-money-row">
                    <span className="sc-money-label">{label}</span>
                    <div className="sc-money-inputs">
                      <label className="sc-money-input-wrap">
                        <span>
                          {locale === "bn" ? "প্রত্যাশিত (৳)" : "Expected (৳)"}
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          className="pg-input"
                          placeholder="Missing"
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
                            : "Chat / Actual (৳)"}
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          className="pg-input"
                          placeholder="Missing"
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
      {evaluation ? (
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
                {evaluation.combinedReview.overallStatus === "hold_for_review"
                  ? `▲ ${copy.holdForReview}`
                  : `✓ ${copy.readyForConfirmation}`}
              </span>
              <span className="sc-meta-chip">
                {copy.humanGateTitle} ·{" "}
                <code>{evaluation.combinedReview.policyVersion}</code>
              </span>
            </div>
            <p className="sc-gate-note">{copy.humanGateNote}</p>
            {evaluation.combinedReview.reasonCodes.length > 0 ? (
              <div className="sc-reason-pills">
                {evaluation.combinedReview.reasonCodes.map((code) => (
                  <code key={code} className="pg-code-pill">
                    {code}
                  </code>
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
                {evaluation.promiseGuard ? (
                  <span
                    className="sc-verdict-pill"
                    data-verdict={
                      evaluation.promiseGuard.deterministic.data.assessment
                    }
                  >
                    {evaluation.promiseGuard.deterministic.data.assessment.replace(
                      "_",
                      " ",
                    )}
                  </span>
                ) : (
                  <span
                    className="sc-verdict-pill"
                    data-verdict="indeterminate"
                  >
                    Deadline missing
                  </span>
                )}
              </div>

              {evaluation.promiseGuard ? (
                <>
                  <p className="sc-engine-sub">
                    Ruleset:{" "}
                    <code>
                      {evaluation.promiseGuard.deterministic.rulesetVersion}
                    </code>{" "}
                    · Completeness:{" "}
                    <strong>
                      {
                        evaluation.promiseGuard.deterministic.data
                          .evidenceCompleteness
                      }
                    </strong>
                  </p>
                  <ul className="sc-findings-compact">
                    {evaluation.promiseGuard.deterministic.data.findings.map(
                      (finding, index) => (
                        <li
                          key={`${finding.code}-${index}`}
                          data-impact={finding.impact}
                        >
                          <span className="sc-impact-dot" aria-hidden="true" />
                          <code>{finding.code}</code>
                        </li>
                      ),
                    )}
                  </ul>
                </>
              ) : (
                <p className="sc-engine-sub">
                  {evaluation.promiseGuardSkippedReason}
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
                  data-verdict={
                    evaluation.marginLeak.deterministic.data.assessment
                  }
                >
                  {evaluation.marginLeak.deterministic.data.assessment.replaceAll(
                    "_",
                    " ",
                  )}
                </span>
              </div>

              <p className="sc-engine-sub">
                Ruleset:{" "}
                <code>
                  {evaluation.marginLeak.deterministic.rulesetVersion}
                </code>{" "}
                · Completeness:{" "}
                <strong>
                  {
                    evaluation.marginLeak.deterministic.data
                      .evidenceCompleteness
                  }
                </strong>{" "}
                · State:{" "}
                <strong>
                  {evaluation.marginLeak.deterministic.data.observationState}
                </strong>
              </p>

              <div className="sc-kpi-grid">
                <div className="sc-kpi-box">
                  <span>
                    {locale === "bn" ? "প্রত্যাশিত লাভ" : "Expected Margin"}
                  </span>
                  <strong>
                    {evaluation.marginLeak.deterministic.data.totals
                      .expectedContributionMargin
                      ? formatMinorCurrency(
                          evaluation.marginLeak.deterministic.data.totals
                            .expectedContributionMargin.amountMinor,
                          evaluation.currency,
                        )
                      : "Withheld (incomplete)"}
                  </strong>
                </div>
                <div className="sc-kpi-box">
                  <span>
                    {locale === "bn" ? "প্রকৃত / চ্যাট লাভ" : "Observed Margin"}
                  </span>
                  <strong>
                    {evaluation.marginLeak.deterministic.data.totals
                      .observedContributionMargin
                      ? formatMinorCurrency(
                          evaluation.marginLeak.deterministic.data.totals
                            .observedContributionMargin.amountMinor,
                          evaluation.currency,
                        )
                      : "Withheld (incomplete)"}
                  </strong>
                </div>
                <div className="sc-kpi-box">
                  <span>
                    {locale === "bn" ? "মোট পার্থক্য" : "Net Variance"}
                  </span>
                  <strong>
                    {evaluation.marginLeak.deterministic.data.totals
                      .netContributionVariance
                      ? formatMinorCurrency(
                          evaluation.marginLeak.deterministic.data.totals
                            .netContributionVariance.amountMinor,
                          evaluation.currency,
                          { signed: true },
                        )
                      : "Withheld (incomplete)"}
                  </strong>
                </div>
                <div className="sc-kpi-box" data-highlight="leak">
                  <span>
                    {locale === "bn" ? "নিশ্চিত লিক" : "Confirmed Leak"}
                  </span>
                  <strong>
                    {evaluation.marginLeak.deterministic.data.totals.leakAmount
                      ? formatMinorCurrency(
                          evaluation.marginLeak.deterministic.data.totals
                            .leakAmount.amountMinor,
                          evaluation.currency,
                        )
                      : evaluation.marginLeak.deterministic.data
                            .observationState === "provisional"
                        ? "Unconfirmed (provisional)"
                        : "Not calculable"}
                  </strong>
                </div>
              </div>

              {evaluation.marginLeak.deterministic.data.categoryComparisons.some(
                (item) => item.direction !== "neutral",
              ) ? (
                <ul className="sc-findings-compact">
                  {evaluation.marginLeak.deterministic.data.categoryComparisons
                    .filter((item) => item.direction !== "neutral")
                    .map((item) => (
                      <li
                        key={item.category}
                        data-impact={
                          item.direction === "adverse"
                            ? "adverse"
                            : "supporting"
                        }
                      >
                        <span className="sc-impact-dot" aria-hidden="true" />
                        <span>
                          <strong>
                            {CATEGORY_LABELS_BILINGUAL[item.category][locale]}
                          </strong>
                          :{" "}
                          {formatMinorCurrency(
                            item.expected.amountMinor,
                            evaluation.currency,
                          )}{" "}
                          →{" "}
                          {formatMinorCurrency(
                            item.observed.amountMinor,
                            evaluation.currency,
                          )}{" "}
                          ({item.direction})
                        </span>
                      </li>
                    ))}
                </ul>
              ) : null}
            </article>
          </div>

          {/* RECOMMENDED ACTIONS */}
          <div className="sc-actions-panel">
            <h3>{copy.actionsTitle}</h3>
            <ol className="sc-recommended-list">
              {evaluation.recommendedActions.map((action) => (
                <li key={action.code} className="sc-recommended-item">
                  <div className="sc-recommended-top">
                    <span className="pg-action-priority-badge">
                      P{action.priority} · {action.source}
                    </span>
                    <strong>
                      {locale === "bn" ? action.titleBn : action.titleEn}
                    </strong>
                  </div>
                  <p>{locale === "bn" ? action.detailBn : action.detailEn}</p>
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
      ) : null}

      {/* ARCHITECTURE & RESPONSIBLE AI DISCLOSURE */}
      <details className="pg-details sc-arch-details">
        <summary>{copy.archSummary}</summary>
        <div className="sc-arch-body">
          <p className="sc-arch-flow">
            <code>
              Bangla/Banglish Chat → AI Extraction (LLM / Deterministic Parser)
              → Strict Zod Validation &amp; Demo Catalog Grounding →
              Deterministic PromiseGuard + MarginLeak (Integer BDT Minor Units)
              → Mandatory Human Review
            </code>
          </p>
          <ul>
            <li>
              <strong>Privacy &amp; Data Sovereignty:</strong> Demonstration
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
