export type Layout =
  | {
      system: '2ls'
      pinToPap: number
      pinToCog: number
      psaToPap: number
    }
  | {
      system: 'pin-buffer'
      pinToPap: number
      psaToPap: number
      pinBuffer: number
    }
  | {
      system: 'traditional'
      pinToPap: number
      drillingAngle: number
      valAngle: number
    }

export type Ball = {
  id: string
  name: string           // e.g. "Phase II"
  brand?: string
  layout: Layout
  surface: string        // e.g. "500 Polished", "2000 Abralon"
}

export type Shot = {
  pinsBefore: number     // bitmask of pins standing before the roll
  pinsAfter: number      // bitmask of pins standing after the roll
}

export type Frame = {
  shots: Shot[]          // 1 (strike), 2 (spare/open), or up to 3 in the 10th
}

export type Game = {
  id: string
  frames: Frame[]
  ballId?: string        // which ball was used
}

export type Session = {
  id: string
  date: string           // ISO date, e.g. "2026-11-09"
  patternId?: string     // oil pattern, optional
  games: Game[]          // typically 3 per league night
}

export type Pattern = {
  id: string
  name: string           // e.g. "Kegel Middle Road"
  length: number         // feet
  ratio?: number         // e.g. 3.5
  volume?: string        // e.g. "High", or ml
}

export type BowlerProfile = {
  papOver: number        // inches, horizontal
  papUp: number          // inches, vertical
}