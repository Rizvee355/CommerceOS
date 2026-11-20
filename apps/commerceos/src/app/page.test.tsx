// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "./page";

describe("CommerceOS overview", () => {
  it("presents the merchant social-commerce overview with honest governance disclosures and no disabled module links", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: /Understand every order\. Protect every promise\. Protect every margin\./i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getAllByRole("link", { name: /Open Order Workspace/i })[0],
    ).toHaveAttribute("href", "/social-commerce");
    expect(
      screen.getAllByRole("link", { name: /Check Fulfilment Readiness/i })[0],
    ).toHaveAttribute("href", "/promiseguard");

    // RescueCart remains strictly disabled with no links
    const roadmapRescueCart = screen.getByTestId("roadmap-rescuecart");
    expect(roadmapRescueCart).toHaveTextContent(/Coming later/i);
    expect(
      within(roadmapRescueCart).queryByRole("link"),
    ).not.toBeInTheDocument();

    // Governance drawer honestly reports registry states and live-AI posture
    const promiseGuard = screen.getByTestId("capability-promiseguard");
    const marginLeak = screen.getByTestId("capability-marginleak");
    const rescueCart = screen.getByTestId("capability-rescuecart");

    expect(within(promiseGuard).getByText("Stub")).toBeInTheDocument();
    expect(within(marginLeak).getByText("Planned")).toBeInTheDocument();
    expect(within(rescueCart).getByText("Disabled")).toBeInTheDocument();
    expect(within(rescueCart).queryByRole("link")).not.toBeInTheDocument();

    expect(
      screen.getByText(
        /Public live LLM inference remains disabled by default/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /marginleak/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/orders evaluated|margin saved/i),
    ).not.toBeInTheDocument();
  });
});
