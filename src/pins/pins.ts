import { isPinStanding, pinsStanding } from './pins'

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