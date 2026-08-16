import { useEffect } from 'react'
import { useGardenAccount } from './account'
import { useGame, type DonationBadge, type GameState } from './game/store'

const allowedBadges: DonationBadge[] = ['bowl-bringer', 'gentle-hands', 'storykeeper', 'bright-bite', 'safe-passage', 'dream-builder', 'garden-keeper', 'broadcast-builder', 'trust-keeper', 'fluff-crew']

type SavedGame = Partial<Pick<GameState,
  'storyVersion' | 'started' | 'selectedCompanionId' | 'companionProgress' | 'avatarStyle' | 'splotchDiscovered' | 'foodFound' | 'partsFound' | 'food' | 'parts' | 'hunger' | 'trust' | 'safety' | 'carePoints' |
  'waterUnits' | 'treats' | 'gardenTokens' | 'hasFed' | 'hasBonded' | 'shelterStage' | 'bondVisits' | 'lastBondAt' |
  'lastDailyClaim' | 'lastChandaVisitDate' | 'lastDayCompleted' | 'completedDays' | 'loginDays' | 'lastFedDate' | 'lastWateredDate' | 'plantStage' | 'plantHydration' |
  'blanketLevel' | 'waterBowlLevel' | 'cuddleboxLevel' | 'benchPlaced' | 'pathStyle' | 'collarName' |
  'npcVisits' | 'chandaHelped' | 'shareRewardClaimed' | 'realityVisits' | 'dreamVisits' | 'dreamDiscoveries'
  | 'tvVisits' | 'lastTvVisitDate' | 'tvChannelsVisited'
>>

function snapshot(state: GameState): SavedGame {
  return {
    storyVersion: state.storyVersion,
    started: state.started,
    selectedCompanionId: state.selectedCompanionId,
    companionProgress: state.companionProgress,
    avatarStyle: state.avatarStyle,
    splotchDiscovered: state.splotchDiscovered,
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
    tvVisits: state.tvVisits,
    lastTvVisitDate: state.lastTvVisitDate,
    tvChannelsVisited: state.tvChannelsVisited,
  }
}

function union(local: string[], remote: unknown) {
  return [...new Set([...local, ...(Array.isArray(remote) ? remote.filter((item): item is string => typeof item === 'string') : [])])]
}

function mergeProgress(local: GameState, remote: SavedGame | null): SavedGame {
  if (!remote || remote.storyVersion !== local.storyVersion) return snapshot(local)
  const sameCompanion = !remote.selectedCompanionId || remote.selectedCompanionId === local.selectedCompanionId
  return {
    storyVersion: local.storyVersion,
    started: local.started || Boolean(remote.started),
    selectedCompanionId: remote.selectedCompanionId || local.selectedCompanionId,
    companionProgress: { ...(local.companionProgress || {}), ...(remote.companionProgress || {}) },
    avatarStyle: { ...local.avatarStyle, ...(remote.avatarStyle || {}) },
    splotchDiscovered: sameCompanion ? local.splotchDiscovered || Boolean(remote.splotchDiscovered) : Boolean(remote.splotchDiscovered),
    foodFound: union(local.foodFound, remote.foodFound),
    partsFound: union(local.partsFound, remote.partsFound),
    food: Math.max(local.food, remote.food || 0),
    parts: Math.max(local.parts, remote.parts || 0),
    waterUnits: Math.max(local.waterUnits, remote.waterUnits || 0),
    treats: Math.max(local.treats, remote.treats || 0),
    gardenTokens: Math.max(local.gardenTokens, remote.gardenTokens || 0),
    hunger: sameCompanion ? Math.max(local.hunger, remote.hunger || 0) : remote.hunger ?? 62,
    trust: sameCompanion ? Math.max(local.trust, remote.trust || 0) : remote.trust ?? 8,
    safety: sameCompanion ? Math.max(local.safety, remote.safety || 0) : remote.safety ?? 28,
    carePoints: Math.max(local.carePoints, remote.carePoints || 0),
    hasFed: sameCompanion ? local.hasFed || Boolean(remote.hasFed) : Boolean(remote.hasFed),
    hasBonded: sameCompanion ? local.hasBonded || Boolean(remote.hasBonded) : Boolean(remote.hasBonded),
    shelterStage: Math.max(local.shelterStage, remote.shelterStage || 0),
    bondVisits: sameCompanion ? Math.max(local.bondVisits, remote.bondVisits || 0) : remote.bondVisits ?? 0,
    lastBondAt: sameCompanion ? Math.max(local.lastBondAt || 0, remote.lastBondAt || 0) || null : remote.lastBondAt ?? null,
    lastDailyClaim: [local.lastDailyClaim, remote.lastDailyClaim].filter((value): value is string => Boolean(value)).sort().at(-1) || null,
    lastChandaVisitDate: [local.lastChandaVisitDate, remote.lastChandaVisitDate].filter((value): value is string => Boolean(value)).sort().at(-1) || null,
    lastDayCompleted: [local.lastDayCompleted, remote.lastDayCompleted].filter((value): value is string => Boolean(value)).sort().at(-1) || null,
    completedDays: Math.max(local.completedDays, remote.completedDays || 0),
    loginDays: Math.max(local.loginDays, remote.loginDays || 0),
    lastFedDate: sameCompanion ? [local.lastFedDate, remote.lastFedDate].filter((value): value is string => Boolean(value)).sort().at(-1) || null : remote.lastFedDate ?? null,
    lastWateredDate: [local.lastWateredDate, remote.lastWateredDate].filter((value): value is string => Boolean(value)).sort().at(-1) || null,
    plantStage: Math.max(local.plantStage, remote.plantStage || 0),
    plantHydration: Math.max(local.plantHydration, remote.plantHydration || 0),
    blanketLevel: Math.max(local.blanketLevel, remote.blanketLevel || 0),
    waterBowlLevel: Math.max(local.waterBowlLevel, remote.waterBowlLevel || 0),
    cuddleboxLevel: Math.max(local.cuddleboxLevel, remote.cuddleboxLevel || 0),
    benchPlaced: local.benchPlaced || Boolean(remote.benchPlaced),
    pathStyle: local.pathStyle === 'gravel' || remote.pathStyle === 'gravel' ? 'gravel' : 'dirt',
    collarName: local.collarName || remote.collarName || null,
    npcVisits: {
      chanda: Math.max(local.npcVisits.chanda, remote.npcVisits?.chanda || 0),
      karen: Math.max(local.npcVisits.karen, remote.npcVisits?.karen || 0),
      kimberly: Math.max(local.npcVisits.kimberly, remote.npcVisits?.kimberly || 0),
    },
    chandaHelped: local.chandaHelped || Boolean(remote.chandaHelped),
    shareRewardClaimed: local.shareRewardClaimed || Boolean(remote.shareRewardClaimed),
    realityVisits: sameCompanion ? Math.max(local.realityVisits, remote.realityVisits || 0) : remote.realityVisits ?? 0,
    dreamVisits: Math.max(local.dreamVisits, remote.dreamVisits || 0),
    dreamDiscoveries: union(local.dreamDiscoveries, remote.dreamDiscoveries),
    tvVisits: Math.max(local.tvVisits, remote.tvVisits || 0),
    lastTvVisitDate: [local.lastTvVisitDate, remote.lastTvVisitDate].filter((value): value is string => Boolean(value)).sort().at(-1) || null,
    tvChannelsVisited: union(local.tvChannelsVisited, remote.tvChannelsVisited),
  }
}

export function GameSync() {
  const account = useGardenAccount()

  useEffect(() => {
    if (!account.loaded || !account.signedIn || !account.userId) return
    let cancelled = false
    let saveTimer: number | undefined
    let unsubscribe: (() => void) | undefined

    const save = async (state: GameState) => {
      const token = await account.getToken()
      if (!token || cancelled) return
      await fetch('/api/game-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ state: snapshot(state), email: account.email, displayName: account.name }),
      })
    }

    const begin = async () => {
      try {
        const token = await account.getToken()
        if (!token || cancelled) return
        const response = await fetch('/api/game-profile', { headers: { Authorization: `Bearer ${token}` } })
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.error || 'Unable to sync the garden.')
        if (cancelled) return
        const merged = mergeProgress(useGame.getState(), payload.state)
        const badges = Array.isArray(payload.donationBadges)
          ? payload.donationBadges.filter((badge: unknown): badge is DonationBadge => allowedBadges.includes(badge as DonationBadge))
          : []
        useGame.setState({ ...merged, verifiedDonationTotal: Number(payload.verifiedDonationTotal || 0), donationBadges: badges })
        await save(useGame.getState())
        if (cancelled) return
        let lastSavedSnapshot = JSON.stringify(snapshot(useGame.getState()))
        unsubscribe = useGame.subscribe((state, previous) => {
          if (state === previous) return
          const nextSnapshot = JSON.stringify(snapshot(state))
          if (nextSnapshot === lastSavedSnapshot) return
          lastSavedSnapshot = nextSnapshot
          window.clearTimeout(saveTimer)
          saveTimer = window.setTimeout(() => { save(state).catch(() => undefined) }, 900)
        })
      } catch {
        useGame.getState().setNotification('Your local garden is safe. Account sync will retry when you return.')
      }
    }

    begin()
    return () => {
      cancelled = true
      window.clearTimeout(saveTimer)
      unsubscribe?.()
    }
  }, [account.email, account.getToken, account.loaded, account.name, account.signedIn, account.userId])

  return null
}
