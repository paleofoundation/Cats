import type { CareNeed } from './data'

export type TvChannel = {
  id: string
  label: string
  title: string
  description: string
  schedule: string
  youtubeId: string
  localVideo?: string
  poster?: string
  watchPage?: string
  kind: 'live' | 'episode'
}

const cleanYouTubeId = (value: string | undefined) => {
  if (!value) return ''
  const trimmed = value.trim()
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|live\/))([A-Za-z0-9_-]{11})/)
  const candidate = match?.[1] || trimmed
  return /^[A-Za-z0-9_-]{11}$/.test(candidate) ? candidate : ''
}

// Paste a YouTube video/live URL or its 11-character ID into the matching
// environment value. The player automatically switches from its safe holding
// screen to the privacy-enhanced YouTube embed—no component edit required.
export const tvChannels: TvChannel[] = [
  {
    id: 'splotch-today',
    label: 'SPLOTCH TODAY',
    title: 'Splotch asks for more pets.',
    description: 'Meet the real big orange boy behind the game. Splotch approaches Karen for affection while his Cat Gardens friends gather nearby.',
    schedule: 'REAL CAT · 00:34 · CYPRUS',
    youtubeId: cleanYouTubeId(import.meta.env.VITE_YOUTUBE_SPLOTCH),
    localVideo: '/videos/splotch-petting.mp4',
    poster: '/videos/splotch-petting.jpg',
    watchPage: '/watch-splotch.html',
    kind: 'episode',
  },
  {
    id: 'mabel-sunbeam',
    label: 'MABEL IN THE SUN',
    title: 'A quiet morning with Mabel.',
    description: 'The real Mabel grooms herself in a warm sunbeam. She is an FIV-positive Cat Gardens resident whose advanced care routine helps protect ordinary moments like this one.',
    schedule: 'REAL CAT · 00:11 · CYPRUS',
    youtubeId: cleanYouTubeId(import.meta.env.VITE_YOUTUBE_MABEL),
    localVideo: '/videos/mabel-sunbeam.mp4',
    poster: '/videos/mabel-sunbeam.jpg',
    watchPage: '/watch-mabel.html',
    kind: 'episode',
  },
  {
    id: 'garden-cam',
    label: 'GARDEN CAM',
    title: 'The garden, as it is today.',
    description: 'A delayed, privacy-masked view of shared outdoor cat space. No public audio, entrances, roads, plates, or private living areas.',
    schedule: 'Continuous safe window · delayed',
    youtubeId: cleanYouTubeId(import.meta.env.VITE_YOUTUBE_GARDEN_CAM),
    kind: 'live',
  },
  {
    id: 'breakfast-live',
    label: 'BREAKFAST LIVE',
    title: 'Ninety-plus bowls. One morning rhythm.',
    description: 'A scheduled, human-reviewed view of feeding time and the real work behind clean bowls, fresh water, supplements, and observation.',
    schedule: 'Scheduled broadcast · Cyprus time',
    youtubeId: cleanYouTubeId(import.meta.env.VITE_YOUTUBE_BREAKFAST_LIVE),
    kind: 'live',
  },
  {
    id: 'care-alerts',
    label: 'CARE ALERTS',
    title: 'What changed—and what is needed.',
    description: 'Reviewed sanctuary updates, veterinary context, fulfilled needs, and safety notices. Medical emergencies are never streamed as spectacle.',
    schedule: 'Published when a verified update is ready',
    youtubeId: cleanYouTubeId(import.meta.env.VITE_YOUTUBE_CARE_ALERTS),
    kind: 'episode',
  },
  {
    id: 'brush-hour',
    label: 'BRUSH HOUR',
    title: 'Gabriel and Poly’s Fluff Forecast.',
    description: 'Gentle socialization and warm-weather coat care for two long-haired siblings—with consent, patience, and supervised human hands.',
    schedule: 'Weekly premiere · safe replay between episodes',
    youtubeId: cleanYouTubeId(import.meta.env.VITE_YOUTUBE_BRUSH_HOUR),
    kind: 'episode',
  },
]

export const tvFundingNeeds: CareNeed[] = [
  {
    id: 'tv-pilot',
    category: 'story',
    eyebrow: 'CAT GARDENS TV · INSTALLATION',
    title: 'Build the first privacy-safe camera station',
    detail: 'Support the site survey, fixed camera, privacy masking, isolated network, local recording, battery backup, installation, and a public proof report.',
    status: 'Accepting restricted support · procurement total will be published after vendor quotes',
    suggestedAmount: 50,
    badge: 'broadcast-builder',
    catId: 'cat-gardens',
    program: 'cat-gardens-tv',
  },
  {
    id: 'tv-operations',
    category: 'recurring',
    eyebrow: 'CAT GARDENS TV · KEEP IT ON',
    title: 'Keep the real-world channel operating',
    detail: 'Support connectivity, storage, equipment maintenance, privacy review, captions, moderation, and the human time required to publish trustworthy updates.',
    status: 'Recurring operations fund · monthly costs will be reconciled to the sanctuary ledger',
    suggestedAmount: 25,
    badge: 'garden-keeper',
    catId: 'cat-gardens',
    program: 'cat-gardens-tv',
  },
  {
    id: 'gabriel-trust',
    category: 'enrichment',
    eyebrow: 'GABRIEL · TRUST TEAM',
    title: 'Fund patient human time for Gabriel',
    detail: 'Support supervised volunteer coordination, gentle trust sessions, brushing, and reviewed media that documents Gabriel’s real relationship journey.',
    status: 'Program slot ready · staffing cost awaits sanctuary approval',
    suggestedAmount: 15,
    badge: 'trust-keeper',
    catId: 'gabriel',
    program: 'cat-care',
  },
  {
    id: 'fluff-care',
    category: 'recurring',
    eyebrow: 'GABRIEL + POLY · SUMMER CARE',
    title: 'Join the Fluff Crew',
    detail: 'Support brushes, cooling, fresh-water infrastructure, coat checks, and dedicated human care for the long-haired siblings during Cyprus heat.',
    status: 'Recurring care fund · purchases and completed sessions will appear in the proof register',
    suggestedAmount: 10,
    badge: 'fluff-crew',
    catId: 'gabriel-and-poly',
    program: 'cat-care',
  },
]
