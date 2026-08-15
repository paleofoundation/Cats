import { useEffect } from 'react'
import { useGardenAccount } from './account'
import { useGame, type DonationBadge, type GameState } from './game/store'

const allowedBadges: DonationBadge[] = ['bowl-bringer', 'gentle-hands', 'storykeeper', 'bright-bite', 'safe-passage', 'dream-builder', 'garden-keeper']

type SavedGame = Partial<Pick<GameState,
  'started' | 'foodFound' | 'partsFound' | 'food' | 'parts' | 'hunger' | 'trust' | 'safety' | 'carePoints' |
  'hasFed' | 'hasBonded' | 'shelterStage' | 'bondVisits' | 'lastBondAt' | 'realityVisits' | 'dreamVisits' | 'dreamDiscoveries'
>>

function snapshot(state: GameState): SavedGame {
  return {
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
    realityVisits: state.realityVisits,
    dreamVisits: state.dreamVisits,
    dreamDiscoveries: state.dreamDiscoveries,
  }
}

function union(local: string[], remote: unknown) {
  return [...new Set([...local, ...(Array.isArray(remote) ? remote.filter((item): item is string => typeof item === 'string') : [])])]
}

function mergeProgress(local: GameState, remote: SavedGame | null): SavedGame {
  if (!remote) return snapshot(local)
  return {
    started: local.started || Boolean(remote.started),
    foodFound: union(local.foodFound, remote.foodFound),
    partsFound: union(local.partsFound, remote.partsFound),
    food: Math.max(local.food, remote.food || 0),
    parts: Math.max(local.parts, remote.parts || 0),
    hunger: Math.max(local.hunger, remote.hunger || 0),
    trust: Math.max(local.trust, remote.trust || 0),
    safety: Math.max(local.safety, remote.safety || 0),
    carePoints: Math.max(local.carePoints, remote.carePoints || 0),
    hasFed: local.hasFed || Boolean(remote.hasFed),
    hasBonded: local.hasBonded || Boolean(remote.hasBonded),
    shelterStage: Math.max(local.shelterStage, remote.shelterStage || 0),
    bondVisits: Math.max(local.bondVisits, remote.bondVisits || 0),
    lastBondAt: Math.max(local.lastBondAt || 0, remote.lastBondAt || 0) || null,
    realityVisits: Math.max(local.realityVisits, remote.realityVisits || 0),
    dreamVisits: Math.max(local.dreamVisits, remote.dreamVisits || 0),
    dreamDiscoveries: union(local.dreamDiscoveries, remote.dreamDiscoveries),
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
        unsubscribe = useGame.subscribe((state, previous) => {
          if (state === previous) return
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
