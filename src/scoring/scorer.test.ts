import { describe, it, expect } from "vitest";
import { score, frameScores } from "./scorer";

describe("score", () => {
  it("scores a gutter game as 0", () => {
    const rolls = Array(20).fill(0);
    const result = score(rolls);
    expect(result).toBe(0);
  });

  it("scores 1 pin per roll", () => {
    const rolls = Array(20).fill(1);
    const result = score(rolls);
    expect(result).toBe(20);
  });

  it("adds the next roll as a bonus after a spare", () => {
    const rolls = [5, 5, 3, ...Array(17).fill(0)];
    const result = score(rolls);
    expect(result).toBe(16);
  });

  it("adds the next two rolls as a bonus after a strike", () => {
    const rolls = [10, 3, 4, ...Array(16).fill(0)];
    const result = score(rolls);
    expect(result).toBe(24);
  });

  it("scores a perfect game as 300", () => {
    const rolls = Array(12).fill(10);
    const result = score(rolls);
    expect(result).toBe(300);
  });

  it("scores a spare in the 10th frame with its bonus roll", () => {
    const rolls = [...Array(18).fill(0), 5, 5, 7];
    const result = score(rolls);
    expect(result).toBe(17);
  });

  it("open frame in the 10th frame", () => {
    const rolls = [...Array(18).fill(0), 5, 3];
    const result = score(rolls);
    expect(result).toBe(8);
  });

  it("scores a mixed game", () => {
    const rolls = [10, 9, 1, 5, 5, 7, 2, 10, 10, 10, 9, 0, 8, 2, 9, 1, 10];
    expect(score(rolls)).toBe(187);
  });
  it("score equals the last frameScores entry for a finished game", () => {
    const rolls = [10, 9, 1, 5, 5, 7, 2, 10, 10, 10, 9, 0, 8, 2, 9, 1, 10];
    const totals = frameScores(rolls);
    expect(totals).toHaveLength(10);
    expect(totals[9]).toBe(score(rolls));
  });
});

describe("frameScores", () => {
  it("returns nothing when a strike has no bonus rolls yet", () => {
    expect(frameScores([10])).toEqual([]);
  });

  it("scores an open frame immediately", () => {
    expect(frameScores([3, 4])).toEqual([7]);
  });

  it("leaves a spare pending until its bonus roll exists", () => {
    expect(frameScores([10, 7, 3])).toEqual([20]);
  });

  it("scores the spare once the bonus roll arrives", () => {
    expect(frameScores([10, 7, 3, 4])).toEqual([20, 34]);
  });
});
