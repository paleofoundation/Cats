export type CatStoryId = 'mabel' | 'splotch' | 'winona-p-gray'
export type StoryFilm = { title: string; detail: string; youtubeId?: string; video?: string; poster: string }

export const catStories = {
  mabel: {
    id: 'mabel', path: '/Mabel', name: 'Mabel', fullName: 'Mabel Fish',
    portrait: '/assets/mabel.jpg', eyebrow: 'A VERY FISHY GIRL',
    intro: 'Shy with other cats. Deeply sweet with people. Unmistakably Mabel.',
    story: 'Mabel arrived at Cat Gardens scratched and struggling, after what appeared to be abandonment. Here in Cyprus, she has the space, patience, and daily care to be herself. Also known as Mabel Fish, she is a gentle girl with people—even when sharing her space with other cats feels harder.',
    care: 'Mabel is FIV positive. Her sanctuary care includes special food, close daily observation, supportive care, and veterinary oversight. Her care team reviews medical details before they are published here.',
    routines: ['Special food and fresh water', 'Close daily observation', 'Patient, quiet company', 'Veterinary oversight'],
    films: [
      { title: 'A very fishy girl.', detail: 'The kind you don’t bring home to mother—and exactly the Mabel Fish the sanctuary knows and loves.', youtubeId: 'aH2YusZRidI', poster: '/assets/mabel.jpg' },
      { title: 'Mabel in the sunbeam.', detail: 'An earlier sanctuary moment, kept here as part of her growing story.', video: '/videos/mabel-sunbeam.mp4', poster: '/videos/mabel-sunbeam.jpg' },
    ],
  },
  splotch: {
    id: 'splotch', path: '/Splotch', name: 'Splotch', fullName: 'Splotch',
    portrait: '/assets/splotch.jpg', eyebrow: 'THE WELCOMING COMMITTEE',
    intro: 'Big, orange, social—and never quite finished being petted.',
    story: 'Splotch is the garden’s welcoming committee. He approaches Karen through the gathering of sanctuary cats and chooses affection for himself. That relationship is why his game journey starts with patience, food, shelter, and letting him close the distance.',
    care: 'His everyday care includes food, fresh water, unhurried attention, road-safety planning, and preventive dental care. His larger dream is a protected home away from the busy street.',
    routines: ['Daily food and fresh water', 'Unhurried petting time', 'Road-safety planning', 'Preventive dental care'],
    films: [{ title: 'Splotch asks for pets.', detail: 'He approaches Karen and leans into an unhurried petting session while sanctuary friends gather nearby.', video: '/videos/splotch-petting.mp4', poster: '/videos/splotch-petting.jpg' }],
  },
  'winona-p-gray': {
    id: 'winona-p-gray', path: '/Winona', name: 'Winona', fullName: 'Winona P. Gray',
    portrait: '/assets/winona-p-gray-youtube.jpg', eyebrow: 'A SMALL CAT. A GROWING STORY.',
    intro: 'A real Cat Gardens resident, and the sister of Gray Power.',
    story: 'Winona P. Gray lives at Cat Gardens in Cyprus. Her first published introduction opens a window into her life and her relationship with her brother, Gray Power. Her fuller history and personality notes will join this page as the sanctuary reviews them.',
    care: 'Winona’s care history is being prepared for publication. Her daily routine includes food, fresh water, observation, and social time. New details will come from her sanctuary care team.',
    routines: ['Daily food and fresh water', 'Observation', 'Social time', 'Preserve her family story'],
    films: [{ title: 'Meet Winona P. Gray.', detail: 'Her first published introduction, and the beginning of her sibling story.', youtubeId: 'avpx0oLfPmU', poster: '/assets/winona-p-gray-youtube.jpg' }],
  },
} satisfies Record<CatStoryId, { id: string; path: string; name: string; fullName: string; portrait: string; eyebrow: string; intro: string; story: string; care: string; routines: string[]; films: StoryFilm[] }>

export function storyFor(id: string) {
  return catStories[id as CatStoryId] || catStories.splotch
}

export function storyIdForPath(path: string): CatStoryId {
  if (/mabel/i.test(path)) return 'mabel'
  if (/winona/i.test(path)) return 'winona-p-gray'
  return 'splotch'
}
