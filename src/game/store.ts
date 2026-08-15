import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type InputState = {
  forward: number
  backward: number
  left: number
  right: number
  brake: number
  boost: number
}

export type NearbyAction = 'cat' | 'shelter' | 'reality' | 'dream' | null
export type CatAnimation = 'idle' | 'eat' | 'walk' | 'dance'
export type DonationBadge = 'bowl-bringer' | 'gentle-hands' | 'storykeeper' | 'bright-bite' | 'safe-passage' | 'dream-builder' | 'garden-keeper'

export type GameState = {
  started: boolean
  foodFound: string[]
  partsFound: string[]
  food: number
  parts: number
  hunger: number
  trust: number
  safety: number
  carePoints: number
  hasFed: boolean
  hasBonded: boolean
  shelterStage: number
  bondVisits: number
  lastBondAt: number | null
  nextBondAt: number | null
  bondingMode: boolean
  realityVisits: number
  dreamVisits: number
  dreamDiscoveries: string[]
  donationBadges: DonationBadge[]
  verifiedDonationTotal: number
  nearby: NearbyAction
  catAnimation: CatAnimation
  playerPosition: [number, number, number]
  notification: string | null
  resetToken: number
  input: InputState
  start: () => void
  collectFood: (id: string) => void
  collectPart: (id: string) => void
  feed: () => boolean
  bond: () => boolean
  build: () => boolean
  beginBonding: () => boolean
  cancelBonding: () => void
  completeBondVisit: () => { advanced: boolean; visit: number } | null
  visitReality: () => void
  enterDream: () => boolean
  discoverDream: (id: string) => void
  grantDonation: (amount: number, badge: DonationBadge) => void
  setVerifiedDonations: (amount: number, badges: DonationBadge[]) => void
  setNearby: (nearby: NearbyAction) => void
  setCatAnimation: (animation: CatAnimation) => void
  setPlayerPosition: (position: [number, number, number]) => void
  setNotification: (notification: string | null) => void
  setInput: (input: Partial<InputState>) => void
  resetRover: () => void
  resetGame: () => void
}

const emptyInput: InputState = {
  forward: 0,
  backward: 0,
  left: 0,
  right: 0,
  brake: 0,
  boost: 0,
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      started: false,
      foodFound: [],
      partsFound: [],
      food: 0,
      parts: 0,
      hunger: 18,
      trust: 0,
      safety: 12,
      carePoints: 0,
      hasFed: false,
      hasBonded: false,
      shelterStage: 0,
      bondVisits: 0,
      lastBondAt: null,
      nextBondAt: null,
      bondingMode: false,
      realityVisits: 0,
      dreamVisits: 0,
      dreamDiscoveries: [],
      donationBadges: [],
      verifiedDonationTotal: 0,
      nearby: null,
      catAnimation: 'idle',
      playerPosition: [0, 0, -9],
      notification: null,
      resetToken: 0,
      input: emptyInput,
      start: () => set({ started: true, notification: 'Splotch is a relationship, not a checklist. Begin with food.' }),
      collectFood: (id) => {
        if (get().foodFound.includes(id)) return
        set((state) => ({
          foodFound: [...state.foodFound, id],
          food: state.food + 1,
          carePoints: state.carePoints + 10,
          notification: state.foodFound.length === 2 ? 'Food secured. Bring all three crates to Splotch.' : 'Food crate recovered · +10 care',
        }))
      },
      collectPart: (id) => {
        if (get().partsFound.includes(id)) return
        set((state) => ({
          partsFound: [...state.partsFound, id],
          parts: state.parts + 1,
          carePoints: state.carePoints + 15,
          notification: state.partsFound.length === 3 ? 'All shelter parts found. Return to the warm build pad.' : 'Shelter part recovered · +15 care',
        }))
      },
      feed: () => {
        const state = get()
        if (state.hasFed || state.food < 3 || state.nearby !== 'cat') return false
        set({
          food: state.food - 3,
          hasFed: true,
          hunger: 92,
          trust: 15,
          carePoints: state.carePoints + 50,
          catAnimation: 'eat',
          notification: 'Splotch is eating. Stay after the bowl is empty. · +50 care',
        })
        return true
      },
      bond: () => {
        const state = get()
        if (!state.hasFed || state.hasBonded || state.nearby !== 'cat') return false
        set({
          hasBonded: true,
          trust: 48,
          carePoints: state.carePoints + 75,
          catAnimation: 'dance',
          notification: 'Splotch recognizes your arrival. The relationship has begun. · +75 care',
        })
        return true
      },
      build: () => {
        const state = get()
        if (!state.hasBonded || state.parts < 1 || state.shelterStage >= 4 || state.nearby !== 'shelter') return false
        const nextStage = state.shelterStage + 1
        set({
          parts: state.parts - 1,
          shelterStage: nextStage,
          safety: nextStage === 4 ? 82 : 12 + nextStage * 17,
          trust: nextStage === 4 ? Math.max(78, state.trust) : state.trust,
          carePoints: state.carePoints + (nextStage === 4 ? 100 : 25),
          catAnimation: nextStage === 4 ? 'dance' : state.catAnimation,
          notification: nextStage === 4 ? 'Warm, full and sheltered. Splotch can dream now. · +100 care' : `Shelter built ${nextStage}/4 · +25 care`,
        })
        return true
      },
      beginBonding: () => {
        const state = get()
        if (!state.hasBonded) return false
        set({ bondingMode: true, input: emptyInput, catAnimation: 'idle', notification: null })
        return true
      },
      cancelBonding: () => set({ bondingMode: false, input: emptyInput, catAnimation: 'idle' }),
      completeBondVisit: () => {
        const state = get()
        if (!state.bondingMode || !state.hasBonded) return null
        const now = Date.now()
        const canAdvance = state.bondVisits < 6
        const nextVisits = canAdvance ? state.bondVisits + 1 : state.bondVisits
        const nextVisit = Math.min(7, nextVisits + 1)
        set({
          bondingMode: false,
          bondVisits: nextVisits,
          lastBondAt: now,
          nextBondAt: null,
          trust: canAdvance ? Math.min(100, state.trust + 7) : state.trust,
          carePoints: canAdvance ? state.carePoints + 35 : state.carePoints,
          catAnimation: 'idle',
          notification: canAdvance ? `Relationship memory ${nextVisit} saved · +35 care` : 'You stayed without needing another reward.',
        })
        return { advanced: canAdvance, visit: nextVisit }
      },
      visitReality: () => set((state) => ({
        realityVisits: state.realityVisits + 1,
        carePoints: state.carePoints + (state.realityVisits === 0 ? 40 : 0),
        notification: state.realityVisits === 0 ? 'Reality Portal opened · +40 care' : null,
      })),
      enterDream: () => {
        const state = get()
        if (!state.hasFed || state.shelterStage < 4) return false
        set({
          dreamVisits: state.dreamVisits + 1,
          carePoints: state.carePoints + (state.dreamVisits === 0 ? 75 : 0),
          notification: state.dreamVisits === 0 ? 'Splotch let you into his dream · +75 care' : 'Welcome back to Splotch’s dream.',
        })
        return true
      },
      discoverDream: (id) => {
        if (get().dreamDiscoveries.includes(id)) return
        set((state) => ({
          dreamDiscoveries: [...state.dreamDiscoveries, id],
          carePoints: state.carePoints + 20,
          notification: 'Dream discovered · +20 care',
        }))
      },
      grantDonation: (amount, badge) => set((state) => ({
        donationBadges: state.donationBadges.includes(badge) ? state.donationBadges : [...state.donationBadges, badge],
        verifiedDonationTotal: state.verifiedDonationTotal + amount,
        carePoints: state.carePoints + Math.max(50, Math.round(amount * 10)),
        notification: `Donation verified · badge earned · +${Math.max(50, Math.round(amount * 10))} care`,
      })),
      setVerifiedDonations: (amount, badges) => set({
        verifiedDonationTotal: Math.max(0, amount),
        donationBadges: [...new Set(badges)],
      }),
      setNearby: (nearby) => {
        if (get().nearby !== nearby) set({ nearby })
      },
      setCatAnimation: (catAnimation) => set({ catAnimation }),
      setPlayerPosition: (playerPosition) => set({ playerPosition }),
      setNotification: (notification) => set({ notification }),
      setInput: (input) => set((state) => ({ input: { ...state.input, ...input } })),
      resetRover: () => set((state) => ({ resetToken: state.resetToken + 1, notification: 'Rover returned to the garden gate.' })),
      resetGame: () => set((state) => ({
        started: false,
        foodFound: [],
        partsFound: [],
        food: 0,
        parts: 0,
        hunger: 18,
        trust: 0,
        safety: 12,
        carePoints: 0,
        hasFed: false,
        hasBonded: false,
        shelterStage: 0,
        bondVisits: 0,
        lastBondAt: null,
        nextBondAt: null,
        bondingMode: false,
        realityVisits: 0,
        dreamVisits: 0,
        dreamDiscoveries: [],
        donationBadges: [],
        verifiedDonationTotal: 0,
        nearby: null,
        playerPosition: [0, 0, -9],
        notification: null,
        resetToken: state.resetToken + 1,
        input: emptyInput,
      })),
    }),
    {
      name: 'cat-gardens-splotch-relationship-v3',
      version: 3,
      migrate: (persistedState) => {
        const state = persistedState as Partial<GameState>
        return {
          ...state,
          bondVisits: state.bondVisits ?? 0,
          lastBondAt: state.lastBondAt ?? null,
          nextBondAt: null,
          bondingMode: false,
          realityVisits: state.realityVisits ?? 0,
          dreamVisits: state.dreamVisits ?? 0,
          dreamDiscoveries: state.dreamDiscoveries ?? [],
          donationBadges: state.donationBadges ?? [],
          verifiedDonationTotal: state.verifiedDonationTotal ?? 0,
        } as GameState
      },
      partialize: (state) => ({
        started: state.started,
        foodFound: state.foodFound,
        partsFound: state.partsFound,
        food: state.food,
        parts: state.parts,
        hunger: state.hunger,
        trust: state.trust,
        safety: state.safety,
        carePoints: state.carePoints,
        hasFed: state.hasFed,
        hasBonded: state.hasBonded,
        shelterStage: state.shelterStage,
        bondVisits: state.bondVisits,
        lastBondAt: state.lastBondAt,
        nextBondAt: state.nextBondAt,
        realityVisits: state.realityVisits,
        dreamVisits: state.dreamVisits,
        dreamDiscoveries: state.dreamDiscoveries,
        donationBadges: state.donationBadges,
        verifiedDonationTotal: state.verifiedDonationTotal,
      }),
    },
  ),
)

if (import.meta.env.DEV) {
  ;(window as typeof window & { __CAT_GARDENS_GAME__?: typeof useGame }).__CAT_GARDENS_GAME__ = useGame
}

export const getObjective = (state: Pick<GameState, 'foodFound' | 'hasFed' | 'hasBonded' | 'partsFound' | 'shelterStage' | 'bondVisits' | 'realityVisits' | 'dreamVisits'>) => {
  if (state.foodFound.length < 3) return { chapter: 'CARE · FOOD', title: 'Recover three food crates', detail: 'Follow the amber beacons. Drive through a crate to collect it.', progress: state.foodFound.length, total: 3 }
  if (!state.hasFed) return { chapter: 'CARE · DELIVER', title: 'Bring the food to Splotch', detail: 'Find the green cat marker, stop nearby, and feed him.', progress: 0, total: 1 }
  if (!state.hasBonded) return { chapter: 'RELATIONSHIP · BEGIN', title: 'Stay after the bowl is empty', detail: 'Food fixes hunger. Your attention begins the relationship.', progress: 0, total: 1 }
  if (state.partsFound.length < 4) return { chapter: 'CARE · WARMTH', title: 'Find four shelter parts', detail: 'The white beacons mark timber and weatherproof panels.', progress: state.partsFound.length, total: 4 }
  if (state.shelterStage < 4) return { chapter: 'CARE · BUILD', title: 'Build a warm sleeping place', detail: 'Use one part at a time at the green construction pad.', progress: state.shelterStage, total: 4 }
  if (state.realityVisits < 1) return { chapter: 'REALITY · VERIFIED LIFE', title: 'Open Splotch’s Reality Portal', detail: 'Find the white portal. Real media and reviewed expenses live there.', progress: 0, total: 1 }
  if (state.dreamVisits < 1) return { chapter: 'DREAM · MATHIKOLONI', title: 'Enter Splotch’s dream', detail: 'He is full, warm and asleep. The violet portal is open.', progress: 0, total: 1 }
  if (state.bondVisits < 6) return { chapter: `RELATIONSHIP · MEMORY ${String(state.bondVisits + 2).padStart(2, '0')}`, title: 'Leave the rover and spend time with Splotch', detail: 'Each visit is free. Trust comes from attention, not transactions.', progress: state.bondVisits + 1, total: 7 }
  return { chapter: 'RELATIONSHIP · CONTINUES', title: 'Splotch knows you now', detail: 'Explore, care, return to the dream, or simply sit with him again.', progress: 7, total: 7 }
}

export const getRelationshipText = (trust: number) => {
  if (trust >= 100) return 'He comes to greet you.'
  if (trust >= 90) return 'He looks for you at the gate.'
  if (trust >= 78) return 'He remembers you.'
  if (trust > 0) return 'He is learning your sound.'
  return 'He is watching from a distance.'
}
