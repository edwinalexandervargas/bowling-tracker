export function isPinStanding(mask: number, pin: number): boolean {
  return (mask & (1 << (pin - 1))) !== 0
}