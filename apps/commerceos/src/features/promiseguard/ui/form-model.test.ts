import { describe, expect, it } from "vitest";
import { createPromiseGuardPreset } from "../domain/presets";
import {
  focusKeyForFinding,
  keyForPointer,
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

  it("catches validation errors on invalid draft fields", () => {
    const valid = presetToDraft(
      createPromiseGuardPreset("supported", asOf),
      "supported",
    );

    // Empty fulfillment reference
    const emptyRef = { ...valid, fulfillmentRef: "   " };
    const resRef = validateDraft(emptyRef);
    expect(resRef.ok).toBe(false);
    if (!resRef.ok) {
      expect(resRef.errors.some((e) => e.key === "fulfillmentRef")).toBe(true);
    }

    // Active blocker with no blocker codes
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
});
