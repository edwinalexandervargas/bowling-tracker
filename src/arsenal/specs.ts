import type { BallSpec } from '../types'

const key = (s: string) => s.trim().toLowerCase()

// Two copies of the same ball share one spec, so match on brand + name before creating a new one.
export function findSpec(specs: BallSpec[], brand: string, name: string): BallSpec | undefined {
  return specs.find((s) => key(s.brand) === key(brand) && key(s.name) === key(name))
}
