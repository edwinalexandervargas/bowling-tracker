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

// The ball model: same for every copy ever made. Manual entry now; a specs API could fill these later.
export type BallSpec = {
  id: string
  name: string           // e.g. "Phase II"
  brand: string          // e.g. "Storm"
  rg?: number            // e.g. 2.48
  differential?: number  // e.g. 0.051
  massBiasDiff?: number  // asymmetric balls only
  coverstock?: string
  core?: string
}

// Your physical copy: points at its spec, carries its own drilling and surface.
export type Ball = {
  id: string
  specId: string         // -> BallSpec.id
  nickname?: string      // e.g. "Phase II #2" when you own two
  weight?: number        // lbs
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