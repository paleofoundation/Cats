import { useCallback, useEffect, useMemo, useState } from 'react'
import type { GardenAccount } from './account'

export type RealityNeed = {
  need_id: string
  cat_id: string | null
  program: string
  title: string
  detail: string
  goal_cents: number | null
  suggested_cents: number
  currency: string
  status: string
  fulfillment_status: string
  overflow_policy: string
  received_cents: number
  pending_cents: number
  allocated_cents: number
  updated_at: string
}

export type RealityEvent = {
  event_id: number
  event_key: string | null
  event_type: string
  cat_id: string | null
  need_id: string | null
  title: string
  detail: string
  metadata: Record<string, unknown>
  occurred_at: string
}

export type RealityProof = {
  proof_id: number
  proof_key: string | null
  event_id: number | null
  need_id: string | null
  cat_id: string | null
  kind: string
  title: string
  url: string
  source: string | null
  redacted: boolean
  published_at: string | null
  verified_by: string | null
}

export type RealityFeed = {
  asOf: string
  catId: string
  cats: Array<{ cat_id: string; name: string; summary: string; difficulty: string; life_status: string; profile_path: string | null }>
  needs: RealityNeed[]
  events: RealityEvent[]
  proofs: RealityProof[]
  worldArtifacts: string[]
  truthBoundary: { virtual: string; real: string }
}

export type GardenNotification = {
  notification_id: number
  cat_id: string | null
  title: string
  body: string
  action_url: string | null
  created_at: string
  read: boolean
}

export const splotchEpisode = [
  {
    day: 1,
    eyebrow: 'ARRIVAL · NOTHING BUILT YET',
    title: 'Build safety before nightfall',
    detail: 'Find Splotch, build his first shelter, and let him decide whether to stay.',
    memory: 'You arrived before anything was built.',
  },
  {
    day: 2,
    eyebrow: 'ROUTINE · FOOD + WATER',
    title: 'Make ordinary care reliable',
    detail: 'Feed Splotch, refresh the garden, and learn why uneventful days matter.',
    memory: 'A full bowl became part of the morning.',
  },
  {
    day: 3,
    eyebrow: 'TRUST · STAY LOW',
    title: 'Let Splotch close the distance',
    detail: 'Return without demanding affection. Familiar footsteps become safety.',
    memory: 'Splotch remembered your footsteps.',
  },
  {
    day: 4,
    eyebrow: 'REALITY · CYPRUS',
    title: 'Open the window behind the world',
    detail: 'Watch a verified field dispatch and meet the real orange cat behind your companion.',
    memory: 'The real Splotch crossed the screen.',
  },
  {
    day: 5,
    eyebrow: 'SAFETY · THE ROAD',
    title: 'Understand what the garden protects',
    detail: 'Explore the safety record and the published tracker decision without inventing a cost or emergency.',
    memory: 'You learned why safe distance matters.',
  },
  {
    day: 6,
    eyebrow: 'COMMUNITY · INVITE',
    title: 'Make the circle larger',
    detail: 'Invite a friend, share Splotch’s real page, or return simply to sit with him.',
    memory: 'Care became something another person could enter.',
  },
  {
    day: 7,
    eyebrow: 'DREAM · MATHIKOLONI',
    title: 'Carry the garden into the future',
    detail: 'See the real property, the transformation plan, and the sanctuary Splotch dreams about.',
    memory: 'The first week became a promise to keep returning.',
  },
] as const

export function episodeFor(completedDays: number) {
  return splotchEpisode[Math.min(Math.max(completedDays, 0), splotchEpisode.length - 1)]
}

export function useRealityFeed(catId = 'splotch') {
  const [feed, setFeed] = useState<RealityFeed | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/reality-thread?cat=${encodeURIComponent(catId)}`, { headers: { Accept: 'application/json' } })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Unable to load the sanctuary record.')
      setFeed(payload)
      setError(null)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load the sanctuary record.')
    } finally {
      setLoading(false)
    }
  }, [catId])

  useEffect(() => {
    refresh()
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') refresh()
    }, 60_000)
    return () => window.clearInterval(timer)
  }, [refresh])

  return { feed, error, loading, refresh }
}

export function useGardenNotifications(account: GardenAccount) {
  const [notifications, setNotifications] = useState<GardenNotification[]>([])

  const refresh = useCallback(async () => {
    if (!account.loaded || !account.signedIn) {
      setNotifications([])
      return
    }
    const token = await account.getToken()
    if (!token) return
    const response = await fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
    if (!response.ok) return
    const payload = await response.json()
    setNotifications(Array.isArray(payload.notifications) ? payload.notifications : [])
  }, [account.getToken, account.loaded, account.signedIn])

  useEffect(() => {
    refresh().catch(() => undefined)
  }, [refresh])

  const markRead = useCallback(async (notificationId: number) => {
    const token = await account.getToken()
    if (!token) return
    setNotifications((items) => items.map((item) => item.notification_id === notificationId ? { ...item, read: true } : item))
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ notificationId }),
    })
  }, [account.getToken])

  const unread = useMemo(() => notifications.filter((item) => !item.read).length, [notifications])
  return { notifications, unread, markRead, refresh }
}
