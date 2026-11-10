export function isPinStanding(mask: number, pin: number): boolean {
  return (mask & (1 << (pin - 1))) !== 0
}

export function pinsStanding(mask: number): number[] {
  const standing: number[] = []

  for (let pin = 1; pin <= 10; pin++) {
    if (isPinStanding(mask, pin)) {
      standing.push(pin)
    }
  }

  return standing
}

export function pinsKnockedDown(before: number, after: number): number {
  return pinsStanding(before).length - pinsStanding(after).length
}

// A shot is valid if every pin standing after was also standing before.
// (You can't stand a pin back up.)
export function isValidShot(before: number, after: number): boolean {
  return after >= 0 && after <= 1023 && (after & ~before) === 0
}