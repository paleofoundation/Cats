export type CatSex = 'female' | 'male' | 'unknown'
export type CoatPattern = 'solid' | 'tabby' | 'patched' | 'reference-pending'
export type VisualReferenceStatus = 'verified' | 'partial' | 'pending'

export type CompanionPhenotype = {
  baseColor: string
  secondaryColor: string
  eyeColor: string
  scale: number
  width: number
  length: number
  eyeCount: 0 | 1 | 2
  blind: boolean
  pattern: CoatPattern
  referenceStatus: VisualReferenceStatus
}

export type CompanionProfile = {
  id: string
  name: string
  sex: CatSex
  playable: boolean
  pronouns: { subject: string; object: string; possessive: string }
  phenotype: CompanionPhenotype
  visualNote: string
}

const neutralPronouns = { subject: 'they', object: 'them', possessive: 'their' }

export const companionProfiles: CompanionProfile[] = [
  {
    id: 'splotch',
    name: 'Splotch',
    sex: 'male',
    playable: true,
    pronouns: { subject: 'he', object: 'him', possessive: 'his' },
    phenotype: { baseColor: '#d67b3e', secondaryColor: '#8f3f1f', eyeColor: '#b99a58', scale: 1, width: 1.08, length: 1.04, eyeCount: 2, blind: false, pattern: 'tabby', referenceStatus: 'verified' },
    visualNote: 'Large orange adult male · broad frame · orange tabby markings',
  },
  {
    id: 'mabel',
    name: 'Mabel',
    sex: 'female',
    playable: true,
    pronouns: { subject: 'she', object: 'her', possessive: 'her' },
    phenotype: { baseColor: '#f5f2e9', secondaryColor: '#ddd9cf', eyeColor: '#8ea65e', scale: .98, width: .94, length: .98, eyeCount: 2, blind: false, pattern: 'solid', referenceStatus: 'verified' },
    visualNote: 'White adult female · full-size frame · advanced care routine',
  },
  {
    id: 'winona-p-gray',
    name: 'Winona P. Gray',
    sex: 'female',
    playable: true,
    pronouns: { subject: 'she', object: 'her', possessive: 'her' },
    phenotype: { baseColor: '#f7f5ed', secondaryColor: '#dfddd7', eyeColor: '#96a66b', scale: .54, width: .86, length: .92, eyeCount: 2, blind: false, pattern: 'solid', referenceStatus: 'verified' },
    visualNote: 'Very small white adult female · approximately half Mabel’s scale',
  },
  {
    id: 'morpheus',
    name: 'Morpheus',
    sex: 'unknown',
    playable: false,
    pronouns: neutralPronouns,
    phenotype: { baseColor: '#aaa59d', secondaryColor: '#7c7771', eyeColor: '#aaa59d', scale: .88, width: .96, length: .98, eyeCount: 0, blind: true, pattern: 'reference-pending', referenceStatus: 'partial' },
    visualNote: 'Totally blind · no eyes · coat reference still needed before play',
  },
  {
    id: 'cosmo',
    name: 'Cosmo',
    sex: 'male',
    playable: false,
    pronouns: { subject: 'he', object: 'him', possessive: 'his' },
    phenotype: { baseColor: '#a49a8d', secondaryColor: '#5f5852', eyeColor: '#d8d7cc', scale: .9, width: .98, length: 1, eyeCount: 1, blind: true, pattern: 'reference-pending', referenceStatus: 'partial' },
    visualNote: 'Completely blind · one eye · distinctive coat reference still needed before play',
  },
]

const fallbackProfile = companionProfiles[0]

export function getCompanionProfile(id: string | null | undefined) {
  return companionProfiles.find((profile) => profile.id === id) || fallbackProfile
}

export function sexLabel(sex: CatSex) {
  if (sex === 'female') return 'female'
  if (sex === 'male') return 'male'
  return 'sex not yet recorded'
}

export function companionCopy(text: string, companion: CompanionProfile) {
  const subjectTitle = companion.pronouns.subject[0].toUpperCase() + companion.pronouns.subject.slice(1)
  return text
    .replaceAll('Splotch’s', `${companion.name}’s`)
    .replaceAll("Splotch's", `${companion.name}’s`)
    .replaceAll('Splotch', companion.name)
    .replace(/\bHe\b/g, subjectTitle)
    .replace(/\bhe\b/g, companion.pronouns.subject)
    .replace(/\bhim\b/g, companion.pronouns.object)
    .replace(/\bhis\b/g, companion.pronouns.possessive)
}
