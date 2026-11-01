export function frameScores(rolls: number[]): number[] {
  const totals: number[] = []
  let total = 0
  let i = 0

  for (let frame = 0; frame < 10; frame++) {
    if (i >= rolls.length) break

    if (rolls[i] === 10) {
      if (i + 2 >= rolls.length) break
      total += 10 + rolls[i + 1] + rolls[i + 2]
      i += 1
    } else {
      if (i + 1 >= rolls.length) break
      const frameTotal = rolls[i] + rolls[i + 1]

      if (frameTotal === 10) {
        if (i + 2 >= rolls.length) break
        total += frameTotal + rolls[i + 2]
      } else {
        total += frameTotal
      }
      i += 2
    }

    totals.push(total)
  }

  return totals
}

export function score(rolls: number[]): number {
  const totals = frameScores(rolls)
  return totals[totals.length - 1] ?? 0
}