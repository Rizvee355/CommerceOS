"use client";

import type { PromiseGuardPresetId } from "../domain/presets";
import { scenarioOptions } from "./labels";

export type ScenarioPickerProps = {
  selectedId: PromiseGuardPresetId;
  onSelect: (presetId: PromiseGuardPresetId) => void;
  disabled?: boolean;
};

export const ScenarioPicker = ({
  selectedId,
  onSelect,
  disabled = false,
}: ScenarioPickerProps) => {
  return (
    <section
      aria-labelledby="pg-scenarios-heading"
      className="pg-scenario-section"
    >
      <div className="pg-section-intro">
        <h2 id="pg-scenarios-heading" className="pg-section-title">
          1. Select a Synthetic Scenario
        </h2>
        <p className="pg-section-hint">
          Choose a scenario preset relative to current server time to populate
          the evidence form below, or customize the facts directly.
        </p>
      </div>

      <div
        className="pg-scenario-grid"
        role="radiogroup"
        aria-labelledby="pg-scenarios-heading"
      >
        {scenarioOptions.map((scenario) => {
          const isSelected = selectedId === scenario.id;
          return (
            <button
              key={scenario.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              className={`pg-scenario-card ${isSelected ? "is-selected" : ""}`}
              onClick={() => onSelect(scenario.id)}
            >
              <div className="pg-scenario-card-header">
                <span className="pg-scenario-ordinal">
                  Preset {scenario.ordinal}
                </span>
                <span className="pg-scenario-badge" data-preset={scenario.id}>
                  {scenario.id.replace("_", " ")}
                </span>
              </div>
              <h3 className="pg-scenario-title">{scenario.title}</h3>
              <p className="pg-scenario-desc">{scenario.description}</p>
              <div className="pg-scenario-intent">
                <span className="pg-scenario-intent-label">Design intent:</span>{" "}
                {scenario.intent}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
