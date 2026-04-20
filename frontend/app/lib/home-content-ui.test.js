import { describe, expect, it } from "vitest";

import { buildPaginationUi, buildTruncationMessage } from "./home-content-ui";

describe("home-content UI helpers", () => {
  it("returns truncation banner text when response is truncated", () => {
    const message = buildTruncationMessage({
      loadedCount: 100,
      totalCount: 180,
      truncated: true,
    });

    expect(message).toContain(
      "Affichage partiel: 100 tache(s) chargee(s) sur 180",
    );
    expect(message).toContain("pagination API (limit/offset)");
  });

  it("returns empty truncation text when response is complete", () => {
    expect(
      buildTruncationMessage({
        loadedCount: 80,
        totalCount: 80,
        truncated: false,
      }),
    ).toBe("");
  });

  it("exposes pagination control states for first page", () => {
    const ui = buildPaginationUi({
      offset: 0,
      loadedCount: 100,
      totalCount: 180,
      pageSize: 100,
      isLoading: false,
    });

    expect(ui.shouldShow).toBe(true);
    expect(ui.label).toBe("Taches 1 a 100 sur 180");
    expect(ui.canGoPrevious).toBe(false);
    expect(ui.canGoNext).toBe(true);
    expect(ui.previousDisabled).toBe(true);
    expect(ui.nextDisabled).toBe(false);
  });

  it("exposes pagination control states for last page", () => {
    const ui = buildPaginationUi({
      offset: 100,
      loadedCount: 80,
      totalCount: 180,
      pageSize: 100,
      isLoading: false,
    });

    expect(ui.shouldShow).toBe(true);
    expect(ui.label).toBe("Taches 101 a 180 sur 180");
    expect(ui.canGoPrevious).toBe(true);
    expect(ui.canGoNext).toBe(false);
    expect(ui.previousDisabled).toBe(false);
    expect(ui.nextDisabled).toBe(true);
  });

  it("disables both controls while loading", () => {
    const ui = buildPaginationUi({
      offset: 100,
      loadedCount: 80,
      totalCount: 180,
      pageSize: 100,
      isLoading: true,
    });

    expect(ui.previousDisabled).toBe(true);
    expect(ui.nextDisabled).toBe(true);
  });
});
