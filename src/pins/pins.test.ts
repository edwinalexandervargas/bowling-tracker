import { describe, it, expect } from "vitest";
import { isPinStanding } from "./pins";

describe("isPinStanding", () => {
  it("says whether a pin is standing", () => {
    // 520 = 10-pin + 4-pin standing
    expect(isPinStanding(520, 10)).toBe(true);
    expect(isPinStanding(520, 4)).toBe(true);
    expect(isPinStanding(520, 7)).toBe(false);
  });
});
