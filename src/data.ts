import splotch from '../assets/splotch.jpg'
import showPony from '../assets/profile_ziggy.jpg'
import mabel from '../assets/mabel.jpg'
import charlie from '../assets/charlie_v2.jpg'
import markos from '../assets/dr_ktori.jpg'
import gardenConcept from '../assets/0_0.jpeg'
import dreamGardenConcept from '../assets/mathikoloni-dream-proposal-v2.png'
import type { DonationBadge } from './game/store'

export type Cat = {
  id: string
  name: string
  nickname: string
  image?: string
  color: string
  role: string
  story: string
  difficulty: 'easy' | 'advanced'
  status: 'active' | 'passed'
  careSummary: string
  careTasks: string[]
}

export type Place = {
  id: string
  label: string
  eyebrow: string
  title: string
  description: string
  detail: string
  points: number
  position: [number, number, number]
  accent: string
  image?: string
  imageAlt?: string
  imageNote?: string
  actions: Array<{ label: string; href: string; primary?: boolean; external?: boolean }>
}

export type CareNeed = {
  id: string
  category: 'completed' | 'recurring' | 'preventive' | 'enrichment' | 'story' | 'safety' | 'dream'
  eyebrow: string
  title: string
  detail: string
  status: string
  suggestedAmount: number
  badge: DonationBadge
  catId?: string
  program?: 'cat-care' | 'cat-gardens-tv' | 'sanctuary'
}

export type SplotchNeed = CareNeed

export type DreamSpace = {
  id: string
  number: string
  title: string
  detail: string
}

export const splotchNeeds: SplotchNeed[] = [
  {
    id: 'dental-complete',
    category: 'completed',
    eyebrow: 'RECENT CARE · DATE PENDING',
    title: 'Dental cleaning completed',
    detail: 'Splotch recently had his teeth cleaned. The date, provider note and redacted expense will be added after sanctuary review.',
    status: 'Awaiting documentation',
    suggestedAmount: 25,
    badge: 'bright-bite',
  },
  {
    id: 'food',
    category: 'recurring',
    eyebrow: 'EVERYDAY CARE',
    title: 'Food for a big, healthy boy',
    detail: 'A recurring need. The reviewed monthly cost and food allocation will come from the sanctuary ledger rather than a fabricated game total.',
    status: 'Cost awaiting QuickBooks review',
    suggestedAmount: 10,
    badge: 'bowl-bringer',
  },
  {
    id: 'future-dental',
    category: 'preventive',
    eyebrow: 'PREVENTIVE HEALTH',
    title: 'His next dental cleaning',
    detail: 'Splotch has no current health crisis. This is a future preventive-care reserve, with timing to be confirmed by Markos.',
    status: 'Timing awaiting Markos',
    suggestedAmount: 25,
    badge: 'bright-bite',
  },
  {
    id: 'petting',
    category: 'enrichment',
    eyebrow: 'HUMAN ATTENTION',
    title: 'A real petting session',
    detail: 'Fund dedicated human time for the thing Splotch values most: unhurried attention. A completed session can become a verified garden update.',
    status: 'Provider and cost awaiting review',
    suggestedAmount: 15,
    badge: 'gentle-hands',
  },
  {
    id: 'media',
    category: 'story',
    eyebrow: 'REALITY PORTAL',
    title: 'Photography or videography',
    detail: 'A documented session creates new real-world photographs and video for Splotch’s journal and supporter garden.',
    status: 'Scope awaiting review',
    suggestedAmount: 25,
    badge: 'storykeeper',
  },
  {
    id: 'tracker',
    category: 'safety',
    eyebrow: 'ROAD SAFETY',
    title: 'A suitable safety tracker',
    detail: 'Splotch lives near a busy street. The sanctuary will compare a breakaway-mounted location tag with a true GPS pet tracker before naming the final equipment.',
    status: 'Equipment decision pending',
    suggestedAmount: 35,
    badge: 'safe-passage',
  },
  {
    id: 'mathikoloni',
    category: 'dream',
    eyebrow: 'THE GREAT DREAM',
    title: 'A safe home in Mathikoloni',
    detail: 'Land away from traffic, warm winter rooms, friends, gardens, visitors, resident caretakers and places to hide. Cat Gardens does not own the property.',
    status: 'Proposed future · property not owned',
    suggestedAmount: 100,
    badge: 'dream-builder',
  },
]

export const dreamSpaces: DreamSpace[] = [
  { id: 'warm-rooms', number: '01', title: 'Winter warmth', detail: 'The lower level becomes protected indoor habitat: warm rooms, worn blankets, quiet corners and no cold outdoor box as the only option.' },
  { id: 'friend-garden', number: '02', title: 'Friends in the garden', detail: 'Distinct planted territories give compatible cats room to rest together—and plenty of space to retreat when they want solitude.' },
  { id: 'visitor-court', number: '03', title: 'The visitation garden', detail: 'The small court becomes a supervised place where people can sit at cat level, volunteer, pet and build real relationships.' },
  { id: 'safe-distance', number: '04', title: 'Far from fast traffic', detail: 'The hillside setting moves Splotch’s daily life away from the immediate danger of a busy road.' },
  { id: 'human-team', number: '05', title: 'People whose job is care', detail: 'Resident keepers, feeders, cleaners and dedicated petters turn safety into a dependable daily practice.' },
]

export const badgeLabels: Record<DonationBadge, string> = {
  'bowl-bringer': 'Bowl Bringer',
  'gentle-hands': 'Gentle Hands',
  storykeeper: 'Storykeeper',
  'bright-bite': 'Bright Bite',
  'safe-passage': 'Safe Passage',
  'dream-builder': 'Dream Builder',
  'garden-keeper': 'Garden Keeper',
  'broadcast-builder': 'Broadcast Builder',
  'trust-keeper': 'Trust Keeper',
  'fluff-crew': 'Fluff Crew',
}

export { dreamGardenConcept }

export const cats: Cat[] = [
  {
    id: 'splotch',
    name: 'Splotch',
    nickname: 'The Welcoming Committee',
    image: splotch,
    color: '#c86f39',
    role: 'Best first friend',
    story: 'Red, radiant, and never finished being petted. Sit in the garden and Splotch will consider your lap public infrastructure.',
    difficulty: 'easy',
    status: 'active',
    careSummary: 'Social, stable, and reported to have no current health crisis. His routine focuses on food, safety, dental prevention, and human attention.',
    careTasks: ['Daily food and fresh water', 'Unhurried petting time', 'Road-safety planning', 'Preventive dental care'],
  },
  {
    id: 'gabriel',
    name: 'Gabriel',
    nickname: 'The Trust Graduate',
    color: '#b79a7c',
    role: 'Patient relationship companion',
    story: 'Gabriel once made petting nearly impossible. Karen “cracked” the code with patience; today this long-haired boy sits in her lap.',
    difficulty: 'easy',
    status: 'active',
    careSummary: 'Gabriel has no reported special medical needs. His relationship journey simply requires more trust-building sessions than most cats, plus extra summer brushing.',
    careTasks: ['Slow, consent-based trust sessions', 'Supervised volunteer petting', 'Frequent summer brushing', 'Cooling, water, and coat observation'],
  },
  {
    id: 'poly',
    name: 'Poly',
    nickname: 'The Instant Friend',
    color: '#9b826c',
    role: 'Affection-first companion',
    story: 'Gabriel’s equally flufftastic sister wanted pets immediately. Her challenge is not trust—it is keeping that glorious coat comfortable through the Cyprus summer.',
    difficulty: 'easy',
    status: 'active',
    careSummary: 'Poly is socially easy and immediately affectionate. Her recurring care journey centers on brushing, cooling, water, enrichment, and human company.',
    careTasks: ['Daily affection and social time', 'Frequent summer brushing', 'Cooling and fresh water', 'Long-coat observation'],
  },
  {
    id: 'show-pony',
    name: 'Chili Pepper',
    nickname: 'Show Pony',
    image: showPony,
    color: '#d99145',
    role: 'Signature personality',
    story: 'She earned “Show Pony” by leaping for pets with a move nobody can quite describe and everybody remembers.',
    difficulty: 'easy',
    status: 'active',
    careSummary: 'A social resident whose full care profile is awaiting sanctuary review.',
    careTasks: ['Daily food and fresh water', 'Observation', 'Social time'],
  },
  {
    id: 'mabel',
    name: 'Mabel',
    nickname: 'Mabel Fish',
    image: mabel,
    color: '#696a65',
    role: 'Gentle long-term resident',
    story: 'A shy, deeply sweet FIV+ resident who needs a stable environment, her own special food, and carefully managed supportive care. She adores humans.',
    difficulty: 'advanced',
    status: 'active',
    careSummary: 'Mabel is FIV positive and needs a higher-support routine. These tasks are sanctuary-reported; dates, doses, provider notes, and receipts will appear only after review.',
    careTasks: ['Virbagen care with Dr. Stelios Parpounas', 'Scheduled injections', 'Daily red-light session', 'Hypochlorous-acid face care', 'Lactoferrin, Saccharomyces boulardii, and supportive supplements', 'Special food to prevent vomiting'],
  },
  {
    id: 'charlie',
    name: 'Charlie',
    nickname: 'Charlie Barley',
    image: charlie,
    color: '#7e6556',
    role: 'Road-risk rescue',
    story: 'Found with four siblings beside a football field and a busy Germasogeia road. Charlie is safe, healthy, and adoptable.',
    difficulty: 'easy',
    status: 'active',
    careSummary: 'A healthy, adoptable resident whose care profile is awaiting sanctuary review.',
    careTasks: ['Daily food and fresh water', 'Safe housing', 'Adoption preparation'],
  },
]

export const places: Place[] = [
  {
    id: 'current-garden',
    label: 'The real garden',
    eyebrow: 'RIGHT NOW · CYPRUS',
    title: 'Ninety-plus lives. One working sanctuary.',
    description: 'Food, clean water, shade, medication, vet trips, bedding, and human attention happen every day—not after a game timer ends.',
    detail: 'Cat Gardens is the public-facing project of Gardens of St. Gertrude, the legal nonprofit receiving donations. The game is a window into real work, not a substitute for it.',
    points: 40,
    position: [-5.2, 1.2, 1.8],
    accent: '#d6ff68',
    image: gardenConcept,
    imageAlt: 'Concept visualization of a future cat garden',
    imageNote: 'Concept image — the real-photo field journal will be added next.',
    actions: [
      { label: 'Meet the real cats', href: '/gallery.html', primary: true },
      { label: 'Help with daily care · $10', href: '/checkout.html?amount=10&frequency=once&campaign=daily-care' },
    ],
  },
  {
    id: 'food',
    label: 'Daily care',
    eyebrow: 'REAL NEED · EVERY DAY',
    title: 'Ninety bowls do not fill themselves.',
    description: 'Food is the sanctuary’s repeating heartbeat. Chanda’s care work turns bags, supplements, water, cleaning, and observation into healthy days.',
    detail: 'The next phase will connect a reviewed expense ledger to accounting data. Until the numbers are verified, this game will not manufacture a “live” cost total.',
    points: 25,
    position: [-1.4, 0.9, 3.6],
    accent: '#f2b65f',
    actions: [
      { label: 'Fill the bowls · $10', href: '/checkout.html?amount=10&frequency=once&campaign=food', primary: true },
      { label: 'Make it monthly · $10', href: '/checkout.html?amount=10&frequency=monthly&campaign=food' },
    ],
  },
  {
    id: 'medical',
    label: 'Medical care',
    eyebrow: 'REAL NEED · CLINICAL CARE',
    title: 'Illness does not wait for a campaign goal.',
    description: 'FIP, broken bones, snake bites, infections, supplements, diagnostics, and emergency treatment are real parts of caring for cats in Cyprus.',
    detail: 'Dr. Markos Ktori of Limassol Veterinary Clinic has given permission to be featured and contributes to the sanctuary’s work. Individual medical records will only be published with a welfare-first review.',
    points: 35,
    position: [2.4, 1.05, 2.6],
    accent: '#90e2d2',
    image: markos,
    imageAlt: 'Dr. Markos Ktori at Limassol Veterinary Clinic',
    imageNote: 'Contributor: Dr. Markos Ktori · Limassol Veterinary Clinic',
    actions: [
      { label: 'Support medical care · $25', href: '/checkout.html?amount=25&frequency=once&campaign=medical-care', primary: true },
      { label: 'See a real emergency case', href: '/campaign-oliver.html' },
    ],
  },
  {
    id: 'shelter',
    label: 'Shelter workshop',
    eyebrow: 'BUILD · PROTECT',
    title: 'Warmth is infrastructure.',
    description: 'Cuddleboxes, weatherproof outdoor houses, protected enclosures, shade, and safe sleeping rooms turn exposed ground into sanctuary.',
    detail: 'A $50 gift supports the shelter and land fund. Game construction will only be marked “realized” after a verified expense or completed build is published.',
    points: 30,
    position: [5.1, 0.8, 0.2],
    accent: '#e9c994',
    actions: [
      { label: 'Build safety · $50', href: '/checkout.html?amount=50&frequency=once&campaign=shelter-and-land', primary: true },
      { label: 'See the winter program', href: '/campaign-winter.html' },
    ],
  },
  {
    id: 'mathikoloni',
    label: 'The high garden',
    eyebrow: 'DREAM PROPERTY · MATHIKOLONI',
    title: 'A safer world already has an address.',
    description: 'A secluded 6,818 m² hillside plot with a permitted 683 m² shell: room for gardens, visitors, resident keepers, and cats far from fast traffic.',
    detail: 'The vision: convert the small court for supervised visits; give the lower floor to protected winter habitat; fill the pool rather than leave a hazard; preserve distinct gardens and build around large Cyprus stone. The property is listed for €4.5M. Cat Gardens does not own it.',
    points: 75,
    position: [4.3, 2.4, -5.2],
    accent: '#ffffff',
    actions: [
      { label: 'View the real listing', href: 'https://www.bazaraki.com/adv/5818712_4-bedroom-detached-house-for-sale/', primary: true, external: true },
      { label: 'Support the land fund · $100', href: '/checkout.html?amount=100&frequency=once&campaign=mathikoloni-land' },
    ],
  },
  {
    id: 'record',
    label: 'The long horizon',
    eyebrow: 'LOCKED MILESTONE',
    title: 'A world-record campaign must be earned in daylight.',
    description: 'The ambition is enormous: raise more for animal sanctuary work than anyone thought possible. The application is deliberately not being filed yet.',
    detail: 'This unlocks only after Cat Gardens has audited donation totals, verified fulfillment, independent witnesses, a clear record category, and enough operational capacity to withstand global attention.',
    points: 10,
    position: [-4.1, 2.1, -5.1],
    accent: '#c8c3ff',
    actions: [
      { label: 'See why protection matters', href: '/cat-crisis.html', primary: true },
    ],
  },
]
