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
        name: /Run PromiseGuard & MarginLeak Audit/i,
      }),
    );

    await waitFor(() => {
      expect(screen.getByTestId("sc-human-gate")).toBeInTheDocument();
    });
    expect(screen.getByTestId("sc-promiseguard-card")).toHaveTextContent(
      /supported/i,
    );
    expect(screen.getByTestId("sc-marginleak-card")).toHaveTextContent(
      /leak detected/i,
    );
    expect(screen.getByTestId("sc-marginleak-card")).toHaveTextContent(
      /৳396\.00/,
    );

    // Toggle Bangla localization
    fireEvent.click(screen.getByRole("button", { name: "বাংলা" }));
    expect(
      screen.getByText(/সোশ্যাল-কমার্স অপারেশনস ইন্টেলিজেন্স/),
    ).toBeInTheDocument();

    // Record local human review decision
    fireEvent.click(
      screen.getByRole("button", { name: /ক্রেতার সাথে যাচাইয়ের জন্য রাখুন/ }),
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
      /MISSING_QUANTITY/,
    );
    expect(screen.getByTestId("sc-uncertainties")).toHaveTextContent(
      /AMBIGUOUS_DISCOUNT/,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /Run PromiseGuard & MarginLeak Audit/i,
      }),
    );

    await waitFor(() => {
      expect(screen.getByTestId("sc-marginleak-card")).toBeInTheDocument();
    });
    expect(screen.getByTestId("sc-promiseguard-card")).toHaveTextContent(
      /Deadline missing/i,
    );
    expect(screen.getByTestId("sc-marginleak-card")).toHaveTextContent(
      /Withheld \(incomplete\)/i,
    );
  });
});
