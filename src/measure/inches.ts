// Bowling measurements are in 1/16" steps. Every 1/16 multiple is exact in floating point,
// so we store decimal inches and convert to/from fractions only at input and display.

const STEPS_PER_INCH = 16

// "4 1/2" | "5/8" | "4" | "4.5"  ->  decimal inches, or null if invalid or off the 1/16 grid
export function parseInches(input: string): number | null {
  const s = input.trim().replace(/"$/, '').trim()

  let value: number
  const mixed = s.match(/^(\d+)\s+(\d+)\/(\d+)$/)
  const fraction = s.match(/^(\d+)\/(\d+)$/)

  if (mixed) {
    const [, whole, num, den] = mixed.map(Number)
    if (den === 0) return null
    value = whole + num / den
  } else if (fraction) {
    const [, num, den] = fraction.map(Number)
    if (den === 0) return null
    value = num / den
  } else if (/^\d+(\.\d+)?$/.test(s)) {
    value = Number(s)
  } else {
    return null
  }

  // Reject anything that isn't a whole number of sixteenths (e.g. 1/3, 4.3)
  return Number.isInteger(value * STEPS_PER_INCH) ? value : null
}

// 4.5 -> "4 1/2", 0.625 -> "5/8", 4 -> "4"
export function formatInches(value: number): string {
  const sixteenths = Math.round(value * STEPS_PER_INCH)
  const whole = Math.floor(sixteenths / STEPS_PER_INCH)
  let num = sixteenths % STEPS_PER_INCH
  let den = STEPS_PER_INCH

  if (num === 0) return String(whole)

  // Reduce: halve while both are even (den is a power of two)
  while (num % 2 === 0) {
    num /= 2
    den /= 2
  }

  return whole === 0 ? `${num}/${den}` : `${whole} ${num}/${den}`
}
