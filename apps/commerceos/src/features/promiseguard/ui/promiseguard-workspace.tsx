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

export const PromiseGuardWorkspace = () => {
  const [selectedPreset, setSelectedPreset] =
    useState<PromiseGuardPresetId>("supported");
  const [serverTimestamp, setServerTimestamp] = useState<string | null>(null);
  const [draft, setDraft] = useState<PromiseGuardDraft>(() =>
    presetToDraft(
      createPromiseGuardPreset("supported", new Date()),
      "supported",
    ),
  );
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeRequest, setActiveRequest] =
    useState<PromiseGuardEvaluationRequest | null>(null);
  const [activeResponse, setActiveResponse] =
    useState<PromiseGuardEvaluationResponse | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const errorSummaryRef = useRef<HTMLDivElement | null>(null);
  const formHeadingRef = useRef<HTMLHeadingElement | null>(null);

  // Synchronize with server clock on mount
  useEffect(() => {
    let ignore = false;
    const initServerClock = async () => {
      const outcome = await fetchServerTime();
      if (!ignore && outcome.ok) {
        setServerTimestamp(outcome.timestamp);
        setDraft(
          presetToDraft(
            createPromiseGuardPreset("supported", outcome.asOf),
            "supported",
          ),
        );
      }
    };
    void initServerClock();
    return () => {
      ignore = true;
    };
  }, []);

  const handleSelectPreset = useCallback(
    async (presetId: PromiseGuardPresetId) => {
      setSelectedPreset(presetId);
      setFieldErrors([]);
      setGeneralError(null);

      // Fetch fresh server time to avoid skew
      const outcome = await fetchServerTime();
      const asOf = outcome.ok ? outcome.asOf : new Date();
      if (outcome.ok) {
        setServerTimestamp(outcome.timestamp);
      }

      const newDraft = presetToDraft(
        createPromiseGuardPreset(presetId, asOf),
        presetId,
      );
      setDraft(newDraft);
    },
    [],
  );

  const handleResetToPreset = useCallback(async () => {
    setFieldErrors([]);
    setGeneralError(null);

    const outcome = await fetchServerTime();
    const asOf = outcome.ok ? outcome.asOf : new Date();
    if (outcome.ok) {
      setServerTimestamp(outcome.timestamp);
    }

    setDraft(
      presetToDraft(
        createPromiseGuardPreset(selectedPreset, asOf),
        selectedPreset,
      ),
    );
  }, [selectedPreset]);

  const handleDraftChange = useCallback(
    (nextDraft: PromiseGuardDraft) => {
      setDraft(nextDraft);
      // Clear field errors as user edits
      if (fieldErrors.length > 0) {
        setFieldErrors([]);
      }
    },
    [fieldErrors.length],
  );

  const handleSubmit = useCallback(async () => {
    setFieldErrors([]);
    setGeneralError(null);

    const validation = validateDraft(draft);
    if (!validation.ok) {
      setFieldErrors(validation.errors);
      setTimeout(() => {
        errorSummaryRef.current?.focus();
        errorSummaryRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 50);
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsAnalyzing(true);
    setActiveRequest(validation.request);

    const outcome = await requestPromiseGuardAnalysis(
      validation.request,
      controller.signal,
    );

    setIsAnalyzing(false);
    abortControllerRef.current = null;

    if (outcome.kind === "success") {
      setActiveResponse(outcome.response);
      setTimeout(() => {
        const resultsEl = document.getElementById("pg-results-view");
        resultsEl?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      return;
    }

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
  }, [draft]);

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsAnalyzing(false);
  }, []);

  const handleFocusField = useCallback((key: FieldKey) => {
    const domId = fieldDomId(key);
    const el = document.getElementById(domId);
    if (el) {
      el.focus();
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      formHeadingRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, []);

  const handleReviseEvidence = useCallback(() => {
    formHeadingRef.current?.scrollIntoView({
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

        <ErrorSummary
          ref={errorSummaryRef}
          generalMessage={generalError}
          fieldErrors={fieldErrors}
          onFieldClick={handleFocusField}
        />

        {isAnalyzing && <AnalysisProgress onCancel={handleCancel} />}

        <EvidenceForm
          draft={draft}
          errors={errorsMap}
          disabled={isAnalyzing}
          serverTime={serverTimestamp}
          headingRef={formHeadingRef}
          onChange={handleDraftChange}
          onSubmit={handleSubmit}
          onReset={handleResetToPreset}
        />

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
