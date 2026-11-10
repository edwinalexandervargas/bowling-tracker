import type { Shot } from "../types";

export function isFrameComplete(shots: Shot[], frameIndex: number): boolean {
  const isTenth = frameIndex === 9;

  if (!isTenth) {
    if (shots.length === 1 && shots[0].pinsAfter === 0) return true;
    if (shots.length >= 2) return true;
    return false;
  }
  if (shots.length === 2 && shots[1].pinsAfter > 0) return true;

  if (shots.length >= 3) return true;
  if (shots.length === 2 && shots[1].pinsAfter > 0) return true;
  return false;
}
