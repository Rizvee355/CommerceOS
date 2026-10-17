// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PromiseGuardEvaluationResponse } from "@commerceos/contracts";
import {
  fetchServerTime,
  requestPromiseGuardAnalysis,
  type AnalyzeOutcome,
  type ServerTimeOutcome,
} from "./client";
import { PromiseGuardWorkspace } from "./promiseguard-workspace";

vi.mock("./client", () => ({
  fetchServerTime: vi.fn(),
  requestPromiseGuardAnalysis: vi.fn(),
}));

const mockSuccessfulAnalysisResponse: PromiseGuardEvaluationResponse = {
  schemaVersion: "1.0",
  moduleId: "promiseguard",
  analysisStatus: "complete",
  metadata: {
    requestId: "req-test-123",
    traceId: "trace-test-456",
    receivedAt: "2026-10-15T12:00:00.000Z",
    respondedAt: "2026-10-15T12:00:00.050Z",
  },
  scenario: {
    scenarioId: "pg-supported",
    synthetic: true,
  },
  deterministic: {
    rulesetVersion: "pg-rules-v1.0",
    evidenceRefs: [],
    data: {
      assessment: "supported",
      decisionScope: "dispatch_readiness_not_delivery_guarantee",
      evidenceCompleteness: "complete",
      findings: [],
      derived: {
        deadlineState: "open",
        readyByDeadline: true,
      },
    },
  },
  humanReview: {
    required: false,
    reasonCodes: [],
    decidedBy: "deterministic_policy",
    policyVersion: "review-policy-v1",
  },
  inference: {
    status: "available",
    providerId: "deterministic-mock",
    modelId: "mock-model",
    adapterVersion: "1.0",
    generatedAt: "2026-10-15T12:00:00.010Z",
    durationMs: 15,
    provenance: "synthetic_mock",
  },
};

describe("PromiseGuardWorkspace regression and safety suite", () => {
  const mockServerTime = new Date("2026-10-15T12:00:00.000Z");

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe("Server clock fail-safe (Correction 2)", () => {
    it("fails safely when server clock synchronization fails on mount, showing retry and preventing submission", async () => {
      vi.mocked(fetchServerTime).mockResolvedValueOnce({
        ok: false,
        kind: "network",
      });

      render(<PromiseGuardWorkspace />);

      // Clock error banner must appear
      expect(await screen.findByTestId("clock-sync-error")).toBeInTheDocument();
      expect(
        screen.getByText("Server Clock Synchronization Failed"),
      ).toBeInTheDocument();

      // Form is not rendered or unsynchronized presets cannot be submitted
      expect(
        screen.queryByRole("button", { name: /Run analysis/i }),
      ).not.toBeInTheDocument();

      // Recovery path: retry clock sync
      vi.mocked(fetchServerTime).mockResolvedValueOnce({
        ok: true,
        asOf: mockServerTime,
        timestamp: "2026-10-15T12:00:00.000Z",
      });

      const retryBtn = screen.getByRole("button", {
        name: /Retry Clock Synchronization/i,
      });
      fireEvent.click(retryBtn);

      // Error banner disappears, form is loaded and ready
      await waitFor(() => {
        expect(
          screen.queryByTestId("clock-sync-error"),
        ).not.toBeInTheDocument();
      });

      expect(
        await screen.findByRole("button", { name: /Run analysis/i }),
      ).toBeInTheDocument();
    });

    it("does not overwrite user edits if a delayed clock request completes late", async () => {
      // Mount with successful initial time
      vi.mocked(fetchServerTime).mockResolvedValueOnce({
        ok: true,
        asOf: mockServerTime,
        timestamp: "2026-10-15T12:00:00.000Z",
      });

      render(<PromiseGuardWorkspace />);
      const refInput = await screen.findByLabelText(/Fulfillment reference/i);

      // User types custom edits into draft
      fireEvent.change(refInput, { target: { value: "CUSTOM-USER-REF-999" } });
      expect(refInput).toHaveValue("CUSTOM-USER-REF-999");

      // Suppose an earlier asynchronous clock promise resolves late
      let delayedResolve!: (val: ServerTimeOutcome) => void;
      const delayedClockPromise = new Promise<ServerTimeOutcome>((resolve) => {
        delayedResolve = resolve;
      });
      vi.mocked(fetchServerTime).mockReturnValueOnce(delayedClockPromise);

      // Trigger a preset click that starts a slow clock sync
      const atRiskRadio = screen.getByRole("radio", {
        name: /Adverse evidence/i,
      });
      fireEvent.click(atRiskRadio);

      // User immediately continues typing in the form before clock returns
      fireEvent.change(refInput, {
        target: { value: "CUSTOM-USER-REF-PRESERVED" },
      });

      // Now the delayed clock fetch resolves
      await act(async () => {
        delayedResolve({
          ok: true,
          asOf: new Date("2026-10-15T13:00:00.000Z"),
          timestamp: "2026-10-15T13:00:00.000Z",
        });
      });

      // The user's edit must NOT be overwritten!
      expect(refInput).toHaveValue("CUSTOM-USER-REF-PRESERVED");
    });

    it("handles rapid preset switching by discarding superseded clock responses", async () => {
      vi.mocked(fetchServerTime).mockResolvedValueOnce({
        ok: true,
        asOf: mockServerTime,
        timestamp: "2026-10-15T12:00:00.000Z",
      });

      render(<PromiseGuardWorkspace />);
      await screen.findByRole("button", { name: /Run analysis/i });

      let resolvePreset2!: (val: ServerTimeOutcome) => void;
      const promisePreset2 = new Promise<ServerTimeOutcome>((resolve) => {
        resolvePreset2 = resolve;
      });

      let resolvePreset3!: (val: ServerTimeOutcome) => void;
      const promisePreset3 = new Promise<ServerTimeOutcome>((resolve) => {
        resolvePreset3 = resolve;
      });

      // User clicks Preset 2 (slow)
      vi.mocked(fetchServerTime).mockReturnValueOnce(promisePreset2);
      fireEvent.click(screen.getByRole("radio", { name: /Adverse evidence/i }));

      // User immediately clicks Preset 3
      vi.mocked(fetchServerTime).mockReturnValueOnce(promisePreset3);
      fireEvent.click(
        screen.getByRole("radio", { name: /Incomplete evidence/i }),
      );

      // Preset 3 resolves first
      await act(async () => {
        resolvePreset3({
          ok: true,
          asOf: mockServerTime,
          timestamp: "2026-10-15T12:00:00.000Z",
        });
      });

      const refInput = screen.getByLabelText(/Fulfillment reference/i);
      expect(refInput).toHaveValue("FUL-SYN-003");

      // Preset 2 resolves late
      await act(async () => {
        resolvePreset2({
          ok: true,
          asOf: mockServerTime,
          timestamp: "2026-10-15T12:00:00.000Z",
        });
      });

      // Must remain Preset 3 (FUL-SYN-003), not overwritten by Preset 2
      expect(refInput).toHaveValue("FUL-SYN-003");
    });
  });

  describe("Stale assessment presentation prevention (Correction 1)", () => {
    beforeEach(() => {
      vi.mocked(fetchServerTime).mockResolvedValue({
        ok: true,
        asOf: mockServerTime,
        timestamp: "2026-10-15T12:00:00.000Z",
      });
    });

    it("clears visible results when user edits any field in the form draft", async () => {
      vi.mocked(requestPromiseGuardAnalysis).mockResolvedValueOnce({
        kind: "success",
        response: mockSuccessfulAnalysisResponse,
      });

      render(<PromiseGuardWorkspace />);
      const submitBtn = await screen.findByRole("button", {
        name: /Run analysis/i,
      });

      // Run evaluation
      fireEvent.click(submitBtn);

      // Results must appear
      expect(
        await screen.findByRole("heading", { name: "Evaluation Results" }),
      ).toBeInTheDocument();
      expect(screen.getByText("Supported")).toBeInTheDocument();

      // Edit a field in the draft
      const refInput = screen.getByLabelText(/Fulfillment reference/i);
      fireEvent.change(refInput, { target: { value: "MODIFIED-REF" } });

      // Results must immediately disappear
      expect(
        screen.queryByRole("heading", { name: "Evaluation Results" }),
      ).not.toBeInTheDocument();
    });

    it("clears visible results when user switches preset scenario", async () => {
      vi.mocked(requestPromiseGuardAnalysis).mockResolvedValueOnce({
        kind: "success",
        response: mockSuccessfulAnalysisResponse,
      });

      render(<PromiseGuardWorkspace />);
      const submitBtn = await screen.findByRole("button", {
        name: /Run analysis/i,
      });

      fireEvent.click(submitBtn);
      expect(
        await screen.findByRole("heading", { name: "Evaluation Results" }),
      ).toBeInTheDocument();

      // Switch preset scenario
      fireEvent.click(screen.getByRole("radio", { name: /Adverse evidence/i }));

      // Results must immediately disappear
      expect(
        screen.queryByRole("heading", { name: "Evaluation Results" }),
      ).not.toBeInTheDocument();
    });

    it("clears visible results when user resets to preset", async () => {
      vi.mocked(requestPromiseGuardAnalysis).mockResolvedValueOnce({
        kind: "success",
        response: mockSuccessfulAnalysisResponse,
      });

      render(<PromiseGuardWorkspace />);
      const submitBtn = await screen.findByRole("button", {
        name: /Run analysis/i,
      });

      fireEvent.click(submitBtn);
      expect(
        await screen.findByRole("heading", { name: "Evaluation Results" }),
      ).toBeInTheDocument();

      // Click Reset to scenario
      const resetBtn = screen.getByRole("button", {
        name: /Reset to scenario/i,
      });
      fireEvent.click(resetBtn);

      // Results must immediately disappear
      expect(
        screen.queryByRole("heading", { name: "Evaluation Results" }),
      ).not.toBeInTheDocument();
    });

    it("discards late analysis response if user cancelled or edited draft during analysis", async () => {
      let resolveAnalysis!: (val: AnalyzeOutcome) => void;
      const delayedAnalysisPromise = new Promise<AnalyzeOutcome>((resolve) => {
        resolveAnalysis = resolve;
      });

      vi.mocked(requestPromiseGuardAnalysis).mockReturnValueOnce(
        delayedAnalysisPromise,
      );

      render(<PromiseGuardWorkspace />);
      const submitBtn = await screen.findByRole("button", {
        name: /Run analysis/i,
      });

      // Start analysis
      fireEvent.click(submitBtn);

      expect(
        screen.getByText(/Evaluating evidence and orchestrating analysis/i),
      ).toBeInTheDocument();

      // User cancels evaluation
      const cancelBtn = screen.getByRole("button", {
        name: /Cancel evaluation/i,
      });
      fireEvent.click(cancelBtn);

      // Now delayed analysis finishes late
      await act(async () => {
        resolveAnalysis({
          kind: "success",
          response: mockSuccessfulAnalysisResponse,
        });
      });

      // Stale results must NOT be rendered
      expect(
        screen.queryByRole("heading", { name: "Evaluation Results" }),
      ).not.toBeInTheDocument();
    });
  });
});
