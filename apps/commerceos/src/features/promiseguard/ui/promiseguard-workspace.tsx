"use client";

import type {
  PromiseGuardEvaluationRequest,
  PromiseGuardEvaluationResponse,
} from "@commerceos/contracts";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createPromiseGuardPreset,
  type PromiseGuardPresetId,
} from "../domain/presets";
import { AnalysisProgress } from "./analysis-progress";
import { fetchServerTime, requestPromiseGuardAnalysis } from "./client";
import { ErrorSummary } from "./error-summary";
import { EvidenceForm } from "./evidence-form";
import {
  fieldDomId,
  mapServerFieldErrors,
  presetToDraft,
  validateDraft,
  type FieldError,
  type FieldKey,
  type PromiseGuardDraft,
} from "./form-model";
import { ResultView } from "./result-view";
import { ScenarioPicker } from "./scenario-picker";

export type ClockSyncState =
  | { status: "syncing" }
  | { status: "synced"; timestamp: string; asOf: Date }
  | { status: "error"; message: string };

const safeScrollIntoView = (
  el: HTMLElement | null,
  options?: ScrollIntoViewOptions,
) => {
  if (typeof el?.scrollIntoView === "function") {
    el.scrollIntoView(options);
  }
};

export const PromiseGuardWorkspace = () => {
  const [selectedPreset, setSelectedPreset] =
    useState<PromiseGuardPresetId>("supported");
  const [clockSyncState, setClockSyncState] = useState<ClockSyncState>({
    status: "syncing",
  });
  const [serverTimestamp, setServerTimestamp] = useState<string | null>(null);
  const [draft, setDraft] = useState<PromiseGuardDraft | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeRequest, setActiveRequest] =
    useState<PromiseGuardEvaluationRequest | null>(null);
  const [activeResponse, setActiveResponse] =
    useState<PromiseGuardEvaluationResponse | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const clockAbortRef = useRef<AbortController | null>(null);
  const errorSummaryRef = useRef<HTMLDivElement | null>(null);
  const formHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const clockRequestIdRef = useRef(0);
  const analysisRequestIdRef = useRef(0);

  // Helper to invalidate any previous evaluation results
  const clearResults = useCallback(() => {
    setActiveResponse(null);
    setActiveRequest(null);
  }, []);

  const syncServerClock = useCallback(
    async (presetToApply?: PromiseGuardPresetId) => {
      clockAbortRef.current?.abort();
      const controller = new AbortController();
      clockAbortRef.current = controller;

      const clockRequestId = ++clockRequestIdRef.current;
      setClockSyncState({ status: "syncing" });

      const outcome = await fetchServerTime(controller.signal);

      // If a newer clock request or user edit arrived, discard this late response
      if (clockRequestId !== clockRequestIdRef.current) return;

      if (outcome.ok) {
        setServerTimestamp(outcome.timestamp);
        setClockSyncState({
          status: "synced",
          timestamp: outcome.timestamp,
          asOf: outcome.asOf,
        });

        if (presetToApply) {
          setDraft(
            presetToDraft(
              createPromiseGuardPreset(presetToApply, outcome.asOf),
              presetToApply,
            ),
          );
        }
      } else {
        if (outcome.kind === "cancelled") return;
        setServerTimestamp(null);
        setClockSyncState({
          status: "error",
          message:
            "Failed to synchronize with CommerceOS server clock. Authoritative server time is required to evaluate synthetic presets.",
        });
      }
    },
    [],
  );

  // Synchronize with server clock on mount — no browser clock fallback
  useEffect(() => {
    let ignore = false;
    const initServerClock = async () => {
      const controller = new AbortController();
      clockAbortRef.current = controller;
      const clockRequestId = ++clockRequestIdRef.current;

      const outcome = await fetchServerTime(controller.signal);
      if (ignore || clockRequestId !== clockRequestIdRef.current) return;

      if (outcome.ok) {
        setServerTimestamp(outcome.timestamp);
        setClockSyncState({
          status: "synced",
          timestamp: outcome.timestamp,
          asOf: outcome.asOf,
        });
        setDraft(
          presetToDraft(
            createPromiseGuardPreset("supported", outcome.asOf),
            "supported",
          ),
        );
      } else {
        if (outcome.kind === "cancelled") return;
        setServerTimestamp(null);
        setClockSyncState({
          status: "error",
          message:
            "Failed to synchronize with CommerceOS server clock. Authoritative server time is required to evaluate synthetic presets.",
        });
      }
    };

    void initServerClock();

    return () => {
      ignore = true;
      clockAbortRef.current?.abort();
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleSelectPreset = useCallback(
    async (presetId: PromiseGuardPresetId) => {
      clearResults();
      setFieldErrors([]);
      setGeneralError(null);

      // Invalidate any active analysis
      analysisRequestIdRef.current++;
      abortControllerRef.current?.abort();
      setIsAnalyzing(false);

      setSelectedPreset(presetId);

      // Fetch fresh server time to avoid skew, and populate preset
      await syncServerClock(presetId);
    },
    [clearResults, syncServerClock],
  );

  const handleResetToPreset = useCallback(async () => {
    clearResults();
    setFieldErrors([]);
    setGeneralError(null);

    // Invalidate any active analysis
    analysisRequestIdRef.current++;
    abortControllerRef.current?.abort();
    setIsAnalyzing(false);

    // Fetch fresh server time and reapply selected preset
    await syncServerClock(selectedPreset);
  }, [clearResults, selectedPreset, syncServerClock]);

  const handleRetryClockSync = useCallback(async () => {
    setGeneralError(null);
    // If draft was never loaded (mount failed), apply preset. If user edited draft, sync clock only.
    await syncServerClock(draft === null ? selectedPreset : undefined);
  }, [draft, selectedPreset, syncServerClock]);

  const handleDraftChange = useCallback(
    (nextDraft: PromiseGuardDraft) => {
      // Invalidate any in-flight clock requests so late arrivals don't overwrite user edits
      clockRequestIdRef.current++;
      clockAbortRef.current?.abort();

      // Invalidate any in-flight analysis
      analysisRequestIdRef.current++;
      abortControllerRef.current?.abort();
      setIsAnalyzing(false);

      // Invalidate previous evaluation results immediately
      clearResults();

      setDraft(nextDraft);

      if (fieldErrors.length > 0) {
        setFieldErrors([]);
      }
      if (generalError) {
        setGeneralError(null);
      }
    },
    [clearResults, fieldErrors.length, generalError],
  );

  const handleSubmit = useCallback(async () => {
    clearResults();
    setFieldErrors([]);
    setGeneralError(null);

    // Fail safely if server clock is not synchronized
    if (clockSyncState.status !== "synced" || !serverTimestamp) {
      setGeneralError(
        "Cannot evaluate scenario: authoritative server clock synchronization is required. Please synchronize with the server clock.",
      );
      return;
    }

    if (!draft) {
      setGeneralError("Evidence draft is empty.");
      return;
    }

    const validation = validateDraft(draft);
    if (!validation.ok) {
      setFieldErrors(validation.errors);
      setTimeout(() => {
        errorSummaryRef.current?.focus();
        safeScrollIntoView(errorSummaryRef.current, {
          behavior: "smooth",
          block: "start",
        });
      }, 50);
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const analysisRequestId = ++analysisRequestIdRef.current;

    setIsAnalyzing(true);
    setActiveRequest(validation.request);

    const outcome = await requestPromiseGuardAnalysis(
      validation.request,
      controller.signal,
    );

    // If cancelled, edited, or superseded by a newer request, discard
    if (analysisRequestId !== analysisRequestIdRef.current) return;

    setIsAnalyzing(false);
    abortControllerRef.current = null;

    if (outcome.kind === "success") {
      setActiveResponse(outcome.response);
      setTimeout(() => {
        safeScrollIntoView(document.getElementById("pg-results-view"), {
          behavior: "smooth",
          block: "start",
        });
      }, 100);
      return;
    }

    // Results remain cleared on any non-success outcome
    clearResults();

    if (outcome.kind === "cancelled") {
      setGeneralError("Evaluation was cancelled.");
      return;
    }

    if (outcome.kind === "network") {
      setGeneralError(
        "Network connection error. Check your connection to the CommerceOS server.",
      );
      setTimeout(() => {
        errorSummaryRef.current?.focus();
      }, 50);
      return;
    }

    if (outcome.kind === "api_error") {
      const serverErrors = mapServerFieldErrors(
        outcome.envelope.error.fieldErrors,
      );
      setGeneralError(outcome.envelope.error.message);
      if (serverErrors.length > 0) {
        setFieldErrors(serverErrors);
      }
      setTimeout(() => {
        errorSummaryRef.current?.focus();
      }, 50);
      return;
    }

    if (outcome.kind === "contract_mismatch") {
      setGeneralError(
        "The server returned a response that did not match the expected PromiseGuard contract schema.",
      );
      setTimeout(() => {
        errorSummaryRef.current?.focus();
      }, 50);
      return;
    }

    setGeneralError("An unexpected server error occurred during evaluation.");
    setTimeout(() => {
      errorSummaryRef.current?.focus();
    }, 50);
  }, [clearResults, clockSyncState.status, draft, serverTimestamp]);

  const handleCancel = useCallback(() => {
    analysisRequestIdRef.current++;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsAnalyzing(false);
    clearResults();
  }, [clearResults]);

  const handleFocusField = useCallback((key: FieldKey) => {
    const domId = fieldDomId(key);
    const el = document.getElementById(domId);
    if (el) {
      el.focus();
      safeScrollIntoView(el, { behavior: "smooth", block: "center" });
    } else {
      safeScrollIntoView(formHeadingRef.current, {
        behavior: "smooth",
        block: "start",
      });
    }
  }, []);

  const handleReviseEvidence = useCallback(() => {
    safeScrollIntoView(formHeadingRef.current, {
      behavior: "smooth",
      block: "start",
    });
    formHeadingRef.current?.focus();
  }, []);

  const errorsMap = useMemo(() => {
    const map: Partial<Record<FieldKey, string>> = {};
    for (const err of fieldErrors) {
      if (err.key && !map[err.key]) {
        map[err.key] = err.message;
      }
    }
    return map;
  }, [fieldErrors]);

  return (
    <div className="pg-workspace">
      <div className="pg-workspace-container">
        <ScenarioPicker
          selectedId={selectedPreset}
          onSelect={handleSelectPreset}
          disabled={isAnalyzing}
        />

        {clockSyncState.status === "error" && (
          <div
            className="pg-clock-error-banner"
            role="alert"
            data-testid="clock-sync-error"
          >
            <div className="pg-clock-error-content">
              <strong className="pg-clock-error-title">
                Server Clock Synchronization Failed
              </strong>
              <p className="pg-clock-error-msg">{clockSyncState.message}</p>
            </div>
            <button
              type="button"
              className="pg-button pg-button-secondary"
              onClick={handleRetryClockSync}
            >
              Retry Clock Synchronization
            </button>
          </div>
        )}

        {clockSyncState.status === "syncing" && !draft && (
          <div className="pg-clock-syncing" role="status">
            <span className="sync-spinner" aria-hidden="true" />
            <p>Synchronizing with CommerceOS server clock…</p>
          </div>
        )}

        <ErrorSummary
          ref={errorSummaryRef}
          generalMessage={generalError}
          fieldErrors={fieldErrors}
          onFieldClick={handleFocusField}
        />

        {isAnalyzing && <AnalysisProgress onCancel={handleCancel} />}

        {draft && (
          <EvidenceForm
            draft={draft}
            errors={errorsMap}
            disabled={isAnalyzing || clockSyncState.status !== "synced"}
            serverTime={serverTimestamp}
            headingRef={formHeadingRef}
            onChange={handleDraftChange}
            onSubmit={handleSubmit}
            onReset={handleResetToPreset}
          />
        )}

        {activeResponse && activeRequest && (
          <ResultView
            response={activeResponse}
            request={activeRequest}
            onReviseEvidence={handleReviseEvidence}
            onFocusField={handleFocusField}
          />
        )}
      </div>
    </div>
  );
};
