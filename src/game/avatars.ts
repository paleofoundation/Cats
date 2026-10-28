export type AvatarBodyFrame = 'feminine' | 'masculine' | 'androgynous'
export type AvatarHairStyle = 'short' | 'long' | 'bun' | 'close-cropped' | 'ponytail' | 'bald'
export type AvatarStyle = {
  displayName: string
  bodyFrame: AvatarBodyFrame
  hairStyle: AvatarHairStyle
  skin: string
  hair: string
  eyes: string
  clothing: string
  pants: string
  shoes: string
  topStyle: 'tee' | 'tank' | 'long-sleeve'
  bottomStyle: 'trousers' | 'shorts' | 'skirt'
  footwear: 'trainers' | 'flip-flops' | 'boots' | 'barefoot'
  height: number
  build: number
}

export const defaultAvatarStyle: AvatarStyle = {
  displayName: 'Garden caretaker', bodyFrame: 'androgynous', hairStyle: 'short',
  skin: '#d59b78', hair: '#5b3825', eyes: '#4f9fd2', clothing: '#718e3e', pants: '#765c48',
  shoes: '#463b32', topStyle: 'tee', bottomStyle: 'trousers', footwear: 'trainers', height: 1.7, build: 1,
}

export const karenAvatar: AvatarStyle = {
  ...defaultAvatarStyle, displayName: 'Karen', bodyFrame: 'feminine', hairStyle: 'long',
  hair: '#916538', clothing: '#67442e', pants: '#fff9ee', shoes: '#69503c',
  topStyle: 'tank', bottomStyle: 'skirt', footwear: 'flip-flops',
}

// Chanda's outfit and hair follow the existing sanctuary photograph.
export const chandaAvatar: AvatarStyle = {
  ...defaultAvatarStyle, displayName: 'Chanda', bodyFrame: 'feminine', height: 1.5,
  skin: '#bd855f', hair: '#191512', eyes: '#4b3025', hairStyle: 'ponytail',
  clothing: '#252830', pants: '#dce4ed', topStyle: 'tee', bottomStyle: 'shorts', footwear: 'barefoot',
}

export const avatarPresets = [
  { name: 'Karen’s garden look', style: karenAvatar },
  { name: 'Garden explorer', style: { ...defaultAvatarStyle, displayName: 'Garden explorer', bodyFrame: 'masculine' as const, skin: '#87583d', hairStyle: 'close-cropped' as const, hair: '#241b16', clothing: '#46665c', pants: '#c6ac82', bottomStyle: 'shorts' as const, height: 1.8 } },
  { name: 'Quiet gardener', style: { ...defaultAvatarStyle, displayName: 'Quiet gardener', skin: '#e7bfa0', hairStyle: 'bun' as const, hair: '#77716a', clothing: '#79728d', pants: '#354c55', topStyle: 'long-sleeve' as const } },
]

/** Old saves gain new choices without resetting their existing appearance. */
export function normalizeAvatarStyle(value?: Partial<AvatarStyle> | null): AvatarStyle {
  const next = { ...defaultAvatarStyle, ...value }
  const enumFields = {
    bodyFrame: ['feminine', 'masculine', 'androgynous'], hairStyle: ['short', 'long', 'bun', 'close-cropped', 'ponytail', 'bald'],
    topStyle: ['tee', 'tank', 'long-sleeve'], bottomStyle: ['trousers', 'shorts', 'skirt'], footwear: ['trainers', 'flip-flops', 'boots', 'barefoot'],
  } as const
  for (const key of Object.keys(enumFields) as Array<keyof typeof enumFields>) {
    if (!(enumFields[key] as readonly string[]).includes(next[key])) Object.assign(next, { [key]: defaultAvatarStyle[key] })
  }
  for (const key of ['skin', 'hair', 'eyes', 'clothing', 'pants', 'shoes'] as const) {
    if (!/^#[0-9a-f]{6}$/i.test(next[key])) next[key] = defaultAvatarStyle[key]
  }
  next.height = Number.isFinite(next.height) ? Math.min(1.95, Math.max(1.4, next.height)) : defaultAvatarStyle.height
  next.build = Number.isFinite(next.build) ? Math.min(1.3, Math.max(.8, next.build)) : defaultAvatarStyle.build
  next.displayName = typeof next.displayName === 'string' ? next.displayName.trim().slice(0, 30) || 'Garden caretaker' : 'Garden caretaker'
  return next
}
