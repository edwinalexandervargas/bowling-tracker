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
  ballId?: string        // which ball was used this frame
}

export type Game = {
  id: string
  frames: Frame[]
}

export type SessionType = 'league' | 'tournament' | 'practice'

export type Session =
  | {
      id: string
      date: string
      type: 'league'
      eventName: string      // e.g. "Thursday Night Mixed"
      patternId?: string
      games: Game[]
    }
  | {
      id: string
      date: string
      type: 'tournament'
      eventName: string      // e.g. "City Championship"
      patternId?: string
      games: Game[]
    }
  | {
      id: string
      date: string
      type: 'practice'
      eventName?: string
      patternId?: string
      games: Game[]
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