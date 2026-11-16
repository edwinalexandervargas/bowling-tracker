// "1 game", "3 games". Only for nouns that take a plain "s".
export function count(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? '' : 's'}`
}
