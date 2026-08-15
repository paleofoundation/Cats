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

export type PersonId = 'chanda' | 'karen' | 'kimberly'
export type NearbyAction = 'cat' | 'plant' | 'chanda' | 'karen' | 'kimberly' | 'reality' | 'dream' | null
export type CatAnimation = 'idle' | 'eat' | 'walk' | 'dance'
export type DonationBadge = 'bowl-bringer' | 'gentle-hands' | 'storykeeper' | 'bright-bite' | 'safe-passage' | 'dream-builder' | 'garden-keeper'
export type GardenUpgrade = 'blanket' | 'simple-bowl' | 'automatic-bowl' | 'cuddlebox' | 'bench' | 'gravel' | 'collar'

export const upgradeCatalog: Record<GardenUpgrade, { title: string; detail: string; cost: number }> = {
  blanket: { title: 'Soft blanket', detail: 'A washable blanket for Splotch’s basic cuddlebox.', cost: 20 },
  'simple-bowl': { title: 'Water bowl', detail: 'A sturdy bowl for the garden house.', cost: 20 },
  'automatic-bowl': { title: 'Automatic water station', detail: 'A larger virtual reservoir with a quiet recirculating bowl.', cost: 120 },
  cuddlebox: { title: 'Upgraded cuddlebox', detail: 'A roomier insulated nook with a deep cushion.', cost: 150 },
  bench: { title: 'Petting bench', detail: 'A place to sit beside Splotch instead of standing over him.', cost: 70 },
  gravel: { title: 'Pea-gravel path', detail: 'Replace the dusty path with a soft garden route.', cost: 80 },
  collar: { title: 'Engraved virtual collar', detail: 'Add your chosen name to Splotch’s virtual garden collar.', cost: 100 },
}

export type GameState = {
  started: boolean
  foodFound: string[]
  partsFound: string[]
  food: number
  parts: number
  waterUnits: number
  treats: number
  gardenTokens: number
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
  lastDailyClaim: string | null
  lastChandaVisitDate: string | null
  lastDayCompleted: string | null
  completedDays: number
  loginDays: number
  lastFedDate: string | null
  lastWateredDate: string | null
  plantStage: number
  plantHydration: number
  blanketLevel: number
  waterBowlLevel: number
  cuddleboxLevel: number
  benchPlaced: boolean
  pathStyle: 'dirt' | 'gravel'
  collarName: string | null
  npcVisits: Record<PersonId, number>
  chandaHelped: boolean
  shareRewardClaimed: boolean
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
  claimDailyBasket: () => boolean
  feedDaily: () => boolean
  waterPlant: () => boolean
  visitPerson: (person: PersonId) => void
  purchaseUpgrade: (upgrade: GardenUpgrade, collarName?: string) => boolean
  claimShareReward: () => boolean
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
  completeDay: () => boolean
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

const emptyInput: InputState = { forward: 0, backward: 0, left: 0, right: 0, brake: 0, boost: 0 }
export const localDay = () => new Date().toLocaleDateString('en-CA')

const initialPersistentState = {
  started: false,
  foodFound: [] as string[],
  partsFound: [] as string[],
  food: 0,
  parts: 0,
  waterUnits: 0,
  treats: 0,
  gardenTokens: 45,
  hunger: 62,
  trust: 8,
  safety: 28,
  carePoints: 0,
  hasFed: false,
  hasBonded: false,
  shelterStage: 1,
  bondVisits: 0,
  lastBondAt: null as number | null,
  nextBondAt: null as number | null,
  bondingMode: false,
  lastDailyClaim: null as string | null,
  lastChandaVisitDate: null as string | null,
  lastDayCompleted: null as string | null,
  completedDays: 0,
  loginDays: 0,
  lastFedDate: null as string | null,
  lastWateredDate: null as string | null,
  plantStage: 1,
  plantHydration: 42,
  blanketLevel: 0,
  waterBowlLevel: 0,
  cuddleboxLevel: 1,
  benchPlaced: false,
  pathStyle: 'dirt' as const,
  collarName: null as string | null,
  npcVisits: { chanda: 0, karen: 0, kimberly: 0 } as Record<PersonId, number>,
  chandaHelped: false,
  shareRewardClaimed: false,
  realityVisits: 0,
  dreamVisits: 0,
  dreamDiscoveries: [] as string[],
  donationBadges: [] as DonationBadge[],
  verifiedDonationTotal: 0,
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialPersistentState,
      nearby: null,
      catAnimation: 'idle',
      playerPosition: [0, 0, -9],
      notification: null,
      resetToken: 0,
      input: emptyInput,
      start: () => set({ started: true, notification: 'Walk toward the warm light. Chanda and Splotch are waiting.' }),
      claimDailyBasket: () => {
        const state = get()
        if (state.lastDailyClaim === localDay()) return false
        set({
          lastDailyClaim: localDay(),
          loginDays: state.loginDays + 1,
          food: state.food + 1,
          waterUnits: state.waterUnits + 1,
          treats: state.treats + 1,
          gardenTokens: state.gardenTokens + 30,
          carePoints: state.carePoints + 15,
          notification: 'Morning basket opened · food, water, a treat, and 30 garden tokens',
        })
        return true
      },
      feedDaily: () => {
        const state = get()
        if (state.food < 1 || state.lastFedDate === localDay() || state.nearby !== 'cat') return false
        set({
          food: state.food - 1,
          lastFedDate: localDay(),
          hasFed: true,
          hunger: 100,
          trust: Math.min(100, state.trust + 8),
          carePoints: state.carePoints + 35,
          catAnimation: 'eat',
          notification: 'Virtual Splotch is fed for today · +35 care',
        })
        window.setTimeout(() => useGame.getState().setCatAnimation('idle'), 2600)
        return true
      },
      waterPlant: () => {
        const state = get()
        if (state.waterUnits < 1 || state.lastWateredDate === localDay() || state.nearby !== 'plant') return false
        set({
          waterUnits: state.waterUnits - 1,
          lastWateredDate: localDay(),
          plantStage: Math.min(4, state.plantStage + 1),
          plantHydration: 100,
          chandaHelped: true,
          carePoints: state.carePoints + 30,
          notification: 'Plant watered. Chanda has one less task today · +30 care',
        })
        return true
      },
      visitPerson: (person) => set((state) => ({
        npcVisits: { ...state.npcVisits, [person]: state.npcVisits[person] + 1 },
        lastChandaVisitDate: person === 'chanda' ? localDay() : state.lastChandaVisitDate,
        carePoints: state.carePoints + (state.npcVisits[person] === 0 ? 25 : 0),
      })),
      purchaseUpgrade: (upgrade, collarName) => {
        const state = get()
        const item = upgradeCatalog[upgrade]
        const owned = upgrade === 'blanket' ? state.blanketLevel > 0
          : upgrade === 'simple-bowl' ? state.waterBowlLevel > 0
            : upgrade === 'automatic-bowl' ? state.waterBowlLevel > 1
              : upgrade === 'cuddlebox' ? state.cuddleboxLevel > 1
                : upgrade === 'bench' ? state.benchPlaced
                  : upgrade === 'gravel' ? state.pathStyle === 'gravel'
                    : Boolean(state.collarName)
        if (owned) return false
        if (state.gardenTokens < item.cost) {
          set({ notification: `${item.title} needs ${item.cost - state.gardenTokens} more garden tokens.` })
          return false
        }
        const updates: Partial<GameState> = {
          gardenTokens: state.gardenTokens - item.cost,
          carePoints: state.carePoints + Math.round(item.cost / 2),
          notification: `${item.title} added to Splotch’s virtual garden.`,
        }
        if (upgrade === 'blanket') updates.blanketLevel = 1
        if (upgrade === 'simple-bowl') updates.waterBowlLevel = 1
        if (upgrade === 'automatic-bowl') updates.waterBowlLevel = 2
        if (upgrade === 'cuddlebox') updates.cuddleboxLevel = 2
        if (upgrade === 'bench') updates.benchPlaced = true
        if (upgrade === 'gravel') updates.pathStyle = 'gravel'
        if (upgrade === 'collar') updates.collarName = (collarName || 'Garden Friend').slice(0, 18)
        set(updates)
        return true
      },
      claimShareReward: () => {
        const state = get()
        if (state.shareRewardClaimed) return false
        set({ shareRewardClaimed: true, treats: state.treats + 2, gardenTokens: state.gardenTokens + 25, notification: 'Invitation copied · two treats and 25 garden tokens added' })
        return true
      },
      collectFood: () => undefined,
      collectPart: () => undefined,
      feed: () => get().feedDaily(),
      bond: () => {
        const state = get()
        if (!state.hasFed || state.hasBonded || state.nearby !== 'cat') return false
        set({ hasBonded: true, trust: Math.max(38, state.trust + 18), carePoints: state.carePoints + 50, catAnimation: 'dance', notification: 'Splotch chose to stay beside you · +50 care' })
        return true
      },
      build: () => false,
      beginBonding: () => {
        const state = get()
        if (!state.hasFed || state.nearby !== 'cat') return false
        set({ bondingMode: true, input: emptyInput, catAnimation: 'idle', notification: null })
        return true
      },
      cancelBonding: () => set({ bondingMode: false, input: emptyInput, catAnimation: 'idle' }),
      completeBondVisit: () => {
        const state = get()
        if (!state.bondingMode || !state.hasFed) return null
        const now = Date.now()
        const canAdvance = state.bondVisits < 6
        const nextVisits = canAdvance ? state.bondVisits + 1 : state.bondVisits
        set({
          bondingMode: false,
          hasBonded: true,
          bondVisits: nextVisits,
          lastBondAt: now,
          nextBondAt: null,
          trust: canAdvance ? Math.min(100, state.trust + 7) : state.trust,
          carePoints: canAdvance ? state.carePoints + 35 : state.carePoints,
          catAnimation: 'idle',
          notification: canAdvance ? `A new Splotch memory was saved · +35 care` : 'You stayed without needing another reward.',
        })
        return { advanced: canAdvance, visit: Math.min(7, nextVisits + 1) }
      },
      visitReality: () => set((state) => ({ realityVisits: state.realityVisits + 1, carePoints: state.carePoints + (state.realityVisits === 0 ? 40 : 0), notification: state.realityVisits === 0 ? 'Reality Portal opened · +40 care' : null })),
      enterDream: () => {
        const state = get()
        if (!state.hasFed || state.blanketLevel < 1 || state.waterBowlLevel < 1) {
          set({ notification: 'Splotch dreams after food, a blanket, and a water bowl are ready.' })
          return false
        }
        set({ dreamVisits: state.dreamVisits + 1, carePoints: state.carePoints + (state.dreamVisits === 0 ? 75 : 0), notification: state.dreamVisits === 0 ? 'Splotch let you into his dream · +75 care' : 'Welcome back to Splotch’s dream.' })
        return true
      },
      completeDay: () => {
        const state = get()
        const today = localDay()
        if (state.lastDayCompleted === today) {
          set({ notification: 'Tonight’s dream is already in your journal.' })
          return true
        }
        const progress = getDailyProgress(state)
        if (progress.complete < progress.total) {
          set({ notification: `${progress.total - progress.complete} daily ${progress.total - progress.complete === 1 ? 'step remains' : 'steps remain'} before Splotch dreams.` })
          return false
        }
        set({
          lastDayCompleted: today,
          completedDays: state.completedDays + 1,
          dreamVisits: state.dreamVisits + 1,
          carePoints: state.carePoints + (state.dreamVisits === 0 ? 75 : 25),
          notification: `Day ${state.completedDays + 1} saved · Splotch is dreaming`,
        })
        return true
      },
      discoverDream: (id) => {
        if (get().dreamDiscoveries.includes(id)) return
        set((state) => ({ dreamDiscoveries: [...state.dreamDiscoveries, id], carePoints: state.carePoints + 20, notification: 'Dream discovered · +20 care' }))
      },
      grantDonation: (amount, badge) => set((state) => {
        const careReward = Math.max(50, Math.round(amount * 10))
        const tokenReward = Math.max(0, Math.floor(amount / 10) * 250)
        return {
          donationBadges: state.donationBadges.includes(badge) ? state.donationBadges : [...state.donationBadges, badge],
          verifiedDonationTotal: state.verifiedDonationTotal + amount,
          carePoints: state.carePoints + careReward,
          gardenTokens: state.gardenTokens + tokenReward,
          notification: `Gift verified · ${tokenReward} thank-you garden tokens added`,
        }
      }),
      setVerifiedDonations: (amount, badges) => set({ verifiedDonationTotal: Math.max(0, amount), donationBadges: [...new Set(badges)] }),
      setNearby: (nearby) => { if (get().nearby !== nearby) set({ nearby }) },
      setCatAnimation: (catAnimation) => set({ catAnimation }),
      setPlayerPosition: (playerPosition) => set({ playerPosition }),
      setNotification: (notification) => set({ notification }),
      setInput: (input) => set((state) => ({ input: { ...state.input, ...input } })),
      resetRover: () => set((state) => ({ resetToken: state.resetToken + 1, notification: 'Caretaker returned to the garden gate.' })),
      resetGame: () => set((state) => ({
        ...initialPersistentState,
        nearby: null,
        catAnimation: 'idle',
        playerPosition: [0, 0, -9],
        notification: null,
        resetToken: state.resetToken + 1,
        input: emptyInput,
      })),
    }),
    {
      name: 'cat-gardens-splotch-relationship-v4',
      version: 4,
      migrate: (persistedState) => {
        const state = persistedState as Partial<GameState>
        return {
          ...initialPersistentState,
          ...state,
          started: false,
          food: Math.min(3, state.food ?? 0),
          shelterStage: 1,
          nextBondAt: null,
          bondingMode: false,
          npcVisits: { ...initialPersistentState.npcVisits, ...(state.npcVisits || {}) },
          pathStyle: state.pathStyle === 'gravel' ? 'gravel' : 'dirt',
        } as GameState
      },
      partialize: (state) => ({
        started: state.started,
        foodFound: state.foodFound,
        partsFound: state.partsFound,
        food: state.food,
        parts: state.parts,
        waterUnits: state.waterUnits,
        treats: state.treats,
        gardenTokens: state.gardenTokens,
        hunger: state.hunger,
        trust: state.trust,
        safety: state.safety,
        carePoints: state.carePoints,
        hasFed: state.hasFed,
        hasBonded: state.hasBonded,
        shelterStage: state.shelterStage,
        bondVisits: state.bondVisits,
        lastBondAt: state.lastBondAt,
        lastDailyClaim: state.lastDailyClaim,
        lastChandaVisitDate: state.lastChandaVisitDate,
        lastDayCompleted: state.lastDayCompleted,
        completedDays: state.completedDays,
        loginDays: state.loginDays,
        lastFedDate: state.lastFedDate,
        lastWateredDate: state.lastWateredDate,
        plantStage: state.plantStage,
        plantHydration: state.plantHydration,
        blanketLevel: state.blanketLevel,
        waterBowlLevel: state.waterBowlLevel,
        cuddleboxLevel: state.cuddleboxLevel,
        benchPlaced: state.benchPlaced,
        pathStyle: state.pathStyle,
        collarName: state.collarName,
        npcVisits: state.npcVisits,
        chandaHelped: state.chandaHelped,
        shareRewardClaimed: state.shareRewardClaimed,
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

type DailyProgressState = Pick<GameState, 'lastDailyClaim' | 'lastChandaVisitDate' | 'lastFedDate' | 'lastWateredDate' | 'blanketLevel' | 'waterBowlLevel' | 'hasBonded' | 'realityVisits' | 'completedDays' | 'lastDayCompleted'>

export const getDailyProgress = (state: DailyProgressState) => {
  const today = localDay()
  const firstDay = state.completedDays === 0
  const steps = [
    state.lastDailyClaim === today,
    state.lastChandaVisitDate === today,
    state.lastFedDate === today,
    state.lastWateredDate === today,
    ...(firstDay ? [state.blanketLevel > 0 && state.waterBowlLevel > 0, state.hasBonded && state.realityVisits > 0] : []),
  ]
  return { complete: steps.filter(Boolean).length, total: steps.length, ready: steps.every(Boolean) && state.lastDayCompleted !== today }
}

export const getObjective = (state: Pick<GameState, 'lastDailyClaim' | 'lastChandaVisitDate' | 'lastDayCompleted' | 'completedDays' | 'lastFedDate' | 'lastWateredDate' | 'blanketLevel' | 'waterBowlLevel' | 'hasBonded' | 'realityVisits' | 'dreamVisits'>) => {
  const today = localDay()
  if (state.lastDailyClaim !== today) return { chapter: 'MORNING · DAY BEGINS', title: 'Open today’s free care basket', detail: 'Food, water, a treat, and garden tokens are waiting.', progress: 0, total: 1 }
  if (state.lastChandaVisitDate !== today) return { chapter: 'PEOPLE · CHANDA', title: 'Check in with Chanda', detail: 'Some days she needs hands; every day she deserves to be seen.', progress: 0, total: 1 }
  if (state.lastFedDate !== today) return { chapter: 'CARE · SPLOTCH', title: 'Feed virtual Splotch', detail: 'The real Splotch is always cared for. This ritual grows your persistent garden.', progress: 0, total: 1 }
  if (state.lastWateredDate !== today) return { chapter: 'GARDEN · GROW', title: 'Water the young plant', detail: 'Chanda asked for one small, useful action.', progress: 0, total: 1 }
  if (state.blanketLevel < 1 || state.waterBowlLevel < 1) return { chapter: 'HOME · MAKE IT HIS', title: 'Add a blanket and water bowl', detail: 'Your 45 starter tokens cover both essentials.', progress: state.blanketLevel + Math.min(1, state.waterBowlLevel), total: 2 }
  if (state.completedDays === 0 && !state.hasBonded) return { chapter: 'RELATIONSHIP · CHOICE', title: 'Sit at Splotch’s level', detail: 'Petting is attention, not a purchase. Let him choose the final step.', progress: 0, total: 1 }
  if (state.completedDays === 0 && state.realityVisits < 1) return { chapter: 'REALITY · ONE LIFE', title: 'Open Splotch’s real-world portal', detail: 'See the real cat, reviewed needs, and the fulfillment trail.', progress: 0, total: 1 }
  if (state.lastDayCompleted !== today) return { chapter: 'EVENING · DREAM', title: 'End today’s adventure', detail: 'Splotch is ready to sleep—and show you the road from reality to Mathikoloni.', progress: 1, total: 1 }
  return { chapter: 'LIVING GARDEN · TOMORROW', title: 'Tonight’s dream is saved', detail: 'Keep designing, meet another cat, or return for tomorrow’s free basket.', progress: 1, total: 1 }
}

export const getRelationshipText = (trust: number) => {
  if (trust >= 90) return 'He looks for you at the gate.'
  if (trust >= 65) return 'He remembers your footsteps.'
  if (trust >= 35) return 'He chooses to stay nearby.'
  if (trust > 0) return 'He is learning your scent.'
  return 'He is watching from a safe distance.'
}
