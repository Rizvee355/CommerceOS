// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createSocialCommerceEvaluateHandler } from "../../../app/api/v1/social-commerce/evaluate/route";
import { createSocialCommerceExtractHandler } from "../../../app/api/v1/social-commerce/extract/route";
import { SocialCommerceWorkspace } from "./social-commerce-workspace";

const stubLocalApiFetch = () => {
  let seq = 0;
  const deps = {
    now: () => new Date("2026-11-20T09:00:00.000Z"),
    randomUUID: () => {
      seq += 1;
      return `20000000-0000-4000-8000-${String(seq).padStart(12, "0")}`;
    },
    getLlmConfig: () => null,
    getInferenceProvider: () => null,
  };
  const extractHandler = createSocialCommerceExtractHandler(deps);
  const evaluateHandler = createSocialCommerceEvaluateHandler(deps);

  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/api/v1/social-commerce/extract")) {
        return extractHandler(new Request(`http://localhost${url}`, init));
      }
      if (url.endsWith("/api/v1/social-commerce/evaluate")) {
        return evaluateHandler(new Request(`http://localhost${url}`, init));
      }
      throw new Error(`Unexpected fetch URL in test: ${url}`);
    }),
  );
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("SocialCommerceWorkspace end-to-end UI flow", () => {
  it("extracts Banglish chat, toggles Bangla UI, runs PromiseGuard + MarginLeak, and records human decision", async () => {
    stubLocalApiFetch();
    render(<SocialCommerceWorkspace />);

    // Step 1 -> Extract default Banglish margin-leak scenario
    fireEvent.click(
      screen.getByRole("button", { name: /Extract Structured Order/i }),
    );

    await waitFor(() => {
      expect(
        screen.getAllByText(/Premium Fleece Hoodie \(Black\)/i).length,
      ).toBeGreaterThan(0);
    });
    expect(screen.getAllByText(/Uttara, Dhaka/i).length).toBeGreaterThan(0);

    // Step 2 -> Run deterministic dual evaluation
    fireEvent.click(
      screen.getByRole("button", {
        name: /Check Fulfilment & Profit/i,
      }),
    );

    await waitFor(() => {
      expect(screen.getByTestId("sc-human-gate")).toBeInTheDocument();
    });
    expect(screen.getByTestId("sc-promiseguard-card")).toHaveTextContent(
      /Ready to Fulfil/i,
    );
    expect(screen.getByTestId("sc-marginleak-card")).toHaveTextContent(
      /Margin Loss Detected/i,
    );
    expect(screen.getByTestId("sc-marginleak-card")).toHaveTextContent(
      /-৳366\.30/,
    );
    expect(screen.getByTestId("sc-marginleak-card")).toHaveTextContent(
      /৳366\.30/,
    );
    expect(screen.getByTestId("sc-marginleak-ledger")).toHaveTextContent(
      /8\/8 categories complete/i,
    );
    expect(screen.getByTestId("sc-marginleak-ledger")).toHaveTextContent(
      /Discounts & chat concessions/i,
    );

    // Toggle Bangla localization
    fireEvent.click(screen.getByRole("button", { name: "বাংলা" }));
    expect(
      screen.getByText(/সোশ্যাল-কমার্স অর্ডার ওয়ার্কস্পেস/),
    ).toBeInTheDocument();

    // Record local human review decision
    fireEvent.click(
      screen.getByRole("button", { name: /ক্রেতার উত্তরের জন্য হোল্ড করুন/ }),
    );
    expect(screen.getByRole("status")).toHaveTextContent(/হোল্ড করা হয়েছে/);
  });

  it("flags ambiguous chat uncertainties and withholds MarginLeak totals", async () => {
    stubLocalApiFetch();
    render(<SocialCommerceWorkspace />);

    fireEvent.click(
      screen.getByRole("radio", { name: /Ambiguous chat with missing price/i }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Extract Structured Order/i }),
    );

    await waitFor(() => {
      expect(screen.getByTestId("sc-uncertainties")).toBeInTheDocument();
    });
    expect(screen.getByTestId("sc-uncertainties")).toHaveTextContent(
      /Order quantity was not stated/i,
    );
    expect(screen.getByTestId("sc-uncertainties")).toHaveTextContent(
      /Customer asked for a discount without an agreed BDT amount/i,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /Check Fulfilment & Profit/i,
      }),
    );

    await waitFor(() => {
      expect(screen.getByTestId("sc-marginleak-card")).toBeInTheDocument();
    });
    expect(screen.getByTestId("sc-promiseguard-card")).toHaveTextContent(
      /Deadline Missing/i,
    );
    expect(screen.getByTestId("sc-marginleak-card")).toHaveTextContent(
      /Withheld \(incomplete\)/i,
    );
    expect(screen.getByTestId("sc-marginleak-ledger")).toHaveTextContent(
      /Missing \(not ৳0\)/i,
    );
  });

  it("handles custom Vitamin C Serum chat ('155 tk discnt thkbe') without inventing price or massive discount", async () => {
    stubLocalApiFetch();
    render(<SocialCommerceWorkspace />);

    fireEvent.change(
      screen.getByLabelText(/Customer & merchant conversation/i),
      {
        target: {
          value:
            "Customer: 5ta Vitamin C Glow Serum lagbe Mirpur e, address pore dicchi. koto discount pabo?\nMerchant: 155 tk discnt thkbe",
        },
      },
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Extract Structured Order/i }),
    );

    await waitFor(() => {
      expect(screen.getByTestId("sc-uncertainties")).toBeInTheDocument();
    });
    expect(screen.getAllByText(/Mirpur, Dhaka/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/৳155\.00/i).length).toBeGreaterThan(0);
    expect(document.body).not.toHaveTextContent(/৳4,595/);
    expect(screen.getByTestId("sc-uncertainties")).toHaveTextContent(
      /Agreed selling price was not confirmed/i,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Check Fulfilment & Profit/i }),
    );
    await waitFor(() => {
      expect(screen.getByTestId("sc-marginleak-ledger")).toBeInTheDocument();
    });
    expect(screen.getByTestId("sc-marginleak-card")).toHaveTextContent(
      /Withheld \(incomplete\)/i,
    );
    expect(screen.getByTestId("sc-marginleak-ledger")).toHaveTextContent(
      /-৳155\.00/,
    );
  });
});
