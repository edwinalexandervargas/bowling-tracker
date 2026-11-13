// Whole pounds, 6-16 (the range USBC balls come in). null = invalid.
export function parseBallWeight(text: string): number | null {
  const trimmed = text.trim()
  if (!/^\d+$/.test(trimmed)) return null
  const lbs = Number(trimmed)
  return lbs >= 6 && lbs <= 16 ? lbs : null
}

// USBC member number: digits with optional dashes (e.g. 1234-56789).
// We don't enforce an exact length because the format has changed over the years.
// undefined = left blank (allowed), null = invalid.
export function parseUsbcNumber(text: string): string | undefined | null {
  const trimmed = text.trim()
  if (trimmed === '') return undefined
  if (trimmed.length > 20) return null
  return /^\d+(-\d+)*$/.test(trimmed) ? trimmed : null
}
