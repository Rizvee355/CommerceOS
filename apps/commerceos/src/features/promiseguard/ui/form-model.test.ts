import { describe, expect, it } from "vitest";
import { createPromiseGuardPreset } from "../domain/presets";
import {
  focusKeyForFinding,
  keyForPointer,
  mapServerFieldErrors,
  presetToDraft,
  validateDraft,
} from "./form-model";

describe("PromiseGuard form model", () => {
  const asOf = new Date("2026-10-15T12:00:00.000Z");

  it("converts all presets to drafts and validates them successfully", () => {
    for (const presetId of ["supported", "at_risk", "indeterminate"] as const) {
      const presetRequest = createPromiseGuardPreset(presetId, asOf);
      const draft = presetToDraft(presetRequest, presetId);

      expect(draft.presetId).toBe(presetId);
      expect(draft.scenarioId).toBe(presetRequest.scenario.scenarioId);
      expect(draft.fulfillmentRef).toBe(presetRequest.fulfillmentRef);

      const validation = validateDraft(draft);
      expect(validation.ok).toBe(true);
      if (validation.ok) {
        expect(validation.request.fulfillmentRef).toBe(
          presetRequest.fulfillmentRef,
        );
        expect(validation.request.scenario.scenarioId).toBe(
          presetRequest.scenario.scenarioId,
        );
      }
    }
  });

  it("catches validation errors on invalid draft fields and boundary inputs", () => {
    const valid = presetToDraft(
      createPromiseGuardPreset("supported", asOf),
      "supported",
    );

    // 1. Empty / whitespace-only fulfillment reference
    const emptyRef = { ...valid, fulfillmentRef: "   " };
    const resRef = validateDraft(emptyRef);
    expect(resRef.ok).toBe(false);
    if (!resRef.ok) {
      expect(resRef.errors.some((e) => e.key === "fulfillmentRef")).toBe(true);
    }

    // 2. Oversized fulfillment reference (>128 chars)
    const longRef = { ...valid, fulfillmentRef: "A".repeat(129) };
    const resLongRef = validateDraft(longRef);
    expect(resLongRef.ok).toBe(false);
    if (!resLongRef.ok) {
      expect(resLongRef.errors.some((e) => e.key === "fulfillmentRef")).toBe(
        true,
      );
    }

    // 3. Active blocker with no blocker codes
    const activeNoCodes = {
      ...valid,
      blocking: {
        ...valid.blocking,
        status: "active" as const,
        codes: [],
      },
    };
    const resBlocker = validateDraft(activeNoCodes);
    expect(resBlocker.ok).toBe(false);
    if (!resBlocker.ok) {
      expect(resBlocker.errors.some((e) => e.key === "blocking.codes")).toBe(
        true,
      );
    }

    // 4. Missing validUntil when validityUnknown is false
    const missingValidUntil = {
      ...valid,
      inventory: {
        ...valid.inventory,
        validUntil: "",
        validityUnknown: false,
      },
    };
    const resValidUntil = validateDraft(missingValidUntil);
    expect(resValidUntil.ok).toBe(false);
    if (!resValidUntil.ok) {
      expect(
        resValidUntil.errors.some((e) => e.key === "inventory.validUntil"),
      ).toBe(true);
    }

    // 5. Missing estimatedReadyAt when estimate.include is true
    const missingEstimateReady = {
      ...valid,
      estimate: {
        ...valid.estimate,
        include: true,
        estimatedReadyAt: "not-a-valid-date",
      },
    };
    const resEstimate = validateDraft(missingEstimateReady);
    expect(resEstimate.ok).toBe(false);
    if (!resEstimate.ok) {
      expect(
        resEstimate.errors.some((e) => e.key === "estimate.estimatedReadyAt"),
      ).toBe(true);
    }
  });

  it("maps server field errors to form field keys and preserves unmapped errors", () => {
    const mapped = mapServerFieldErrors([
      { path: "/fulfillmentRef" },
      {
        path: "/operationalEvidence/blockingState/codes",
      },
      { path: "/unknownPointer" },
    ]);

    expect(mapped).toEqual([
      {
        key: "fulfillmentRef",
        message:
          "The server did not accept this value. Check it and try again.",
      },
      {
        key: "blocking.codes",
        message:
          "The server did not accept this value. Check it and try again.",
      },
      {
        key: null,
        message: "The server did not accept the value at /unknownPointer.",
      },
    ]);
  });

  it("correctly maps JSON pointers to form keys", () => {
    expect(keyForPointer("/fulfillmentRef")).toBe("fulfillmentRef");
    expect(keyForPointer("/commitment/dispatchBy")).toBe("dispatchBy");
    expect(
      keyForPointer("/operationalEvidence/inventoryAllocation/status"),
    ).toBe("inventory.status");
    expect(keyForPointer("/operationalEvidence/blockingState/status")).toBe(
      "blocking.status",
    );
    expect(keyForPointer("/operationalEvidence/blockingState/codes")).toBe(
      "blocking.codes",
    );
    expect(
      keyForPointer("/operationalEvidence/readyTimeEstimate/estimatedReadyAt"),
    ).toBe("estimate.estimatedReadyAt");
  });

  it("resolves finding focus keys correctly", () => {
    const supportedReq = createPromiseGuardPreset("supported", asOf);

    // Supporting finding returns null
    expect(
      focusKeyForFinding(
        {
          code: "INVENTORY_SECURED",
          impact: "supporting",
          trace: {
            kind: "evidence",
            evidenceIds: [
              supportedReq.operationalEvidence.inventoryAllocation.evidenceId,
            ],
          },
        },
        supportedReq,
      ),
    ).toBeNull();

    // Adverse inventory finding resolves to inventory.status
    expect(
      focusKeyForFinding(
        {
          code: "INVENTORY_NOT_SECURED",
          impact: "adverse",
          trace: {
            kind: "evidence",
            evidenceIds: [
              supportedReq.operationalEvidence.inventoryAllocation.evidenceId,
            ],
          },
        },
        supportedReq,
      ),
    ).toBe("inventory.status");

    // Missing readiness estimate resolves to estimate.include via field_path
    expect(
      focusKeyForFinding(
        {
          code: "MISSING_READY_ESTIMATE",
          impact: "uncertain",
          trace: {
            kind: "field_path",
            fieldPaths: ["/operationalEvidence/readyTimeEstimate"],
          },
        },
        supportedReq,
      ),
    ).toBe("estimate.include");
  });

  it("displays preset timestamps in Bangladesh time (UTC+6) and converts back to exact UTC without drift", () => {
    const baseUtc = new Date("2026-11-20T04:00:00.000Z"); // 10:00 AM BD
    const presetReq = createPromiseGuardPreset("supported", baseUtc);
    const draft = presetToDraft(presetReq, "supported");

    // Round-trip: UTC -> Bangladesh input -> UTC must match exact original commitment & ready estimate
    const validated = validateDraft(draft);
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;
    expect(validated.request.commitment.dispatchBy).toBe(
      presetReq.commitment.dispatchBy,
    );
    expect(
      validated.request.operationalEvidence.readyTimeEstimate?.estimatedReadyAt,
    ).toBe(presetReq.operationalEvidence.readyTimeEstimate?.estimatedReadyAt);

    // Edit dispatchBy (10:00 AM BD -> 04:00 UTC) and estimatedReadyAt (02:30 AM BD Nov 21 -> 20:30 UTC Nov 20) independently
    const editedDraft = {
      ...draft,
      commitment: { ...draft.commitment, dispatchBy: "2026-11-20T10:00" },
      estimate: {
        ...draft.estimate,
        include: true,
        estimatedReadyAt: "2026-11-21T02:30",
      },
    };
    const editedResult = validateDraft(editedDraft);
    expect(editedResult.ok).toBe(true);
    if (!editedResult.ok) return;
    expect(editedResult.request.commitment.dispatchBy).toBe(
      "2026-11-20T04:00:00.000Z",
    );
    expect(
      editedResult.request.operationalEvidence.readyTimeEstimate
        ?.estimatedReadyAt,
    ).toBe("2026-11-20T20:30:00.000Z");

    // Re-loading the validated request into draft preserves exact edited Bangladesh local strings
    const reloaded = presetToDraft(editedResult.request, "supported");
    expect(reloaded.commitment.dispatchBy).toBe("2026-11-20T10:00");
    expect(reloaded.estimate.estimatedReadyAt).toBe("2026-11-21T02:30");
  });
});
