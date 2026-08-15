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

export type NearbyAction = 'cat' | 'shelter' | null
export type CatAnimation = 'idle' | 'eat' | 'walk' | 'dance'

type GameState = {
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
      nearby: null,
      catAnimation: 'idle',
      playerPosition: [0, 0, -9],
      notification: null,
      resetToken: 0,
      input: emptyInput,
      start: () => set({ started: true, notification: 'Find three food crates for Splotch.' }),
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
          notification: state.partsFound.length === 3 ? 'All shelter parts found. Return to the glowing build pad.' : 'Shelter part recovered · +15 care',
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
          notification: 'Splotch is eating. Stay with her a moment. · +50 care',
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
          notification: 'Splotch knows your rover now. Her story is unlocked. · +75 care',
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
          safety: nextStage === 4 ? 96 : 12 + nextStage * 20,
          trust: nextStage === 4 ? 78 : state.trust,
          carePoints: state.carePoints + (nextStage === 4 ? 100 : 25),
          catAnimation: nextStage === 4 ? 'dance' : state.catAnimation,
          notification: nextStage === 4 ? 'A warm, dry place—built by you. · +100 care' : `Shelter built ${nextStage}/4 · +25 care`,
        })
        return true
      },
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
        nearby: null,
        catAnimation: 'idle',
        playerPosition: [0, 0, -9],
        notification: null,
        resetToken: state.resetToken + 1,
        input: emptyInput,
      })),
    }),
    {
      name: 'cat-gardens-first-day-v2',
      version: 1,
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
      }),
    },
  ),
)

export const getObjective = (state: Pick<GameState, 'foodFound' | 'hasFed' | 'hasBonded' | 'partsFound' | 'shelterStage'>) => {
  if (state.foodFound.length < 3) return {
    chapter: '01 · FOOD RUN',
    title: 'Recover three food crates',
    detail: 'Follow the amber beacons. Drive through a crate to collect it.',
    progress: state.foodFound.length,
    total: 3,
  }
  if (!state.hasFed) return {
    chapter: '02 · DELIVER',
    title: 'Bring the food to Splotch',
    detail: 'Find the green cat marker, stop nearby, and feed her.',
    progress: 0,
    total: 1,
  }
  if (!state.hasBonded) return {
    chapter: '03 · TRUST',
    title: 'Stay with Splotch',
    detail: 'Food fixes hunger. Your attention begins a relationship.',
    progress: 0,
    total: 1,
  }
  if (state.partsFound.length < 4) return {
    chapter: '04 · SHELTER',
    title: 'Find four shelter parts',
    detail: 'The white beacons mark timber and weatherproof panels.',
    progress: state.partsFound.length,
    total: 4,
  }
  if (state.shelterStage < 4) return {
    chapter: '05 · BUILD',
    title: 'Build Splotch a dry place',
    detail: 'Use one part at a time at the green construction pad.',
    progress: state.shelterStage,
    total: 4,
  }
  return {
    chapter: 'FIRST DAY COMPLETE',
    title: 'Splotch remembers you',
    detail: 'Explore the garden or return tomorrow. Her care state is saved here.',
    progress: 1,
    total: 1,
  }
}
