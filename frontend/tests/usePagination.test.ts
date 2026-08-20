import { describe, it, expect } from "vitest";
import { usePagination } from "~/composables/usePagination";

describe("usePagination", () => {
  it("starts on the first page with nothing to go back to", () => {
    const p = usePagination();

    expect(p.pageNumber.value).toBe(1);
    expect(p.canGoBack.value).toBe(false);
    expect(p.currentCursor.value).toBeUndefined();
  });

  it("cannot go forward until the server offers a next cursor", () => {
    const p = usePagination();
    expect(p.canGoForward.value).toBe(false);

    p.setNextCursor("cursor-page-2");
    expect(p.canGoForward.value).toBe(true);
  });

  it("walks forward and back through pages", () => {
    const p = usePagination();

    p.setNextCursor("cursor-2");
    p.goForward();
    expect(p.pageNumber.value).toBe(2);
    expect(p.currentCursor.value).toBe("cursor-2");

    p.setNextCursor("cursor-3");
    p.goForward();
    expect(p.pageNumber.value).toBe(3);
    expect(p.currentCursor.value).toBe("cursor-3");

    p.goBack();
    expect(p.pageNumber.value).toBe(2);
    expect(p.currentCursor.value).toBe("cursor-2");
  });

  it("returns to the first page when reset", () => {
    const p = usePagination();
    p.setNextCursor("cursor-2");
    p.goForward();

    p.reset();

    expect(p.pageNumber.value).toBe(1);
    expect(p.canGoBack.value).toBe(false);
    expect(p.canGoForward.value).toBe(false);
  });
});
