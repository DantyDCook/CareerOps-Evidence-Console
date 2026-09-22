import { describe, expect, it } from "vitest";
import { deriveReadViewState } from "../src/lib/view-state";

describe("read UI states", () => {
  it("distinguishes loading, empty, error, and ready states", () => {
    expect(deriveReadViewState(true, null, 0)).toBe("loading");
    expect(deriveReadViewState(false, null, 0)).toBe("empty");
    expect(deriveReadViewState(false, "API failed", 0)).toBe("error");
    expect(deriveReadViewState(false, null, 2)).toBe("ready");
  });
});
