// This is the offline, earned game economy. It is not a purchased-currency ledger.
export type ItemKind = "litter" | "collar" | "sign" | "bowl";
export type CollectionItem = {
  id: string;
  name: string;
  kind: ItemKind;
  collection: string;
  color: string;
  accent: string;
  detail: string;
  cost: number;
};
export const collectionItems: CollectionItem[] = [
  {
    id: "fern-litter",
    name: "Fern hideaway",
    kind: "litter",
    collection: "Wildflower",
    color: "#6f927a",
    accent: "#d9e5c4",
    detail: "A roomy, open litter tray with a leafy rim.",
    cost: 35,
  },
  {
    id: "fern-collar",
    name: "Little leaf collar",
    kind: "collar",
    collection: "Wildflower",
    color: "#65866b",
    accent: "#e4c179",
    detail: "A soft green band with a tiny golden tag.",
    cost: 35,
  },
  {
    id: "fern-sign",
    name: "A garden of our own",
    kind: "sign",
    collection: "Wildflower",
    color: "#698775",
    accent: "#f4ebd4",
    detail: "A welcome sign for your own little sanctuary.",
    cost: 35,
  },
  {
    id: "fern-bowl",
    name: "Meadow ceramic",
    kind: "bowl",
    collection: "Wildflower",
    color: "#7a9e85",
    accent: "#ece8c9",
    detail: "A glazed water bowl in gentle meadow green.",
    cost: 35,
  },
  {
    id: "coast-litter",
    name: "Seaside tray",
    kind: "litter",
    collection: "Coastal morning",
    color: "#7eaeb9",
    accent: "#f5ddbb",
    detail: "Sandy cream and sea blue, with a low entry.",
    cost: 35,
  },
  {
    id: "coast-collar",
    name: "Sea-glass collar",
    kind: "collar",
    collection: "Coastal morning",
    color: "#689cae",
    accent: "#f4d69d",
    detail: "A sea-glass blue band and a sunshine tag.",
    cost: 35,
  },
  {
    id: "coast-sign",
    name: "The sunny corner",
    kind: "sign",
    collection: "Coastal morning",
    color: "#729cab",
    accent: "#fff0d4",
    detail: "A little blue welcome for a sunlit garden.",
    cost: 35,
  },
  {
    id: "coast-bowl",
    name: "Tidepool ceramic",
    kind: "bowl",
    collection: "Coastal morning",
    color: "#89b9c2",
    accent: "#e2f0e8",
    detail: "A shallow water bowl with a soft blue glaze.",
    cost: 35,
  },
  {
    id: "moon-litter",
    name: "Twilight tray",
    kind: "litter",
    collection: "Moonlit garden",
    color: "#9b8eae",
    accent: "#e9dded",
    detail: "A soft lavender tray for a peaceful corner.",
    cost: 35,
  },
  {
    id: "moon-collar",
    name: "Moonbeam collar",
    kind: "collar",
    collection: "Moonlit garden",
    color: "#8b7eab",
    accent: "#f3d991",
    detail: "A lavender band with a warm gold tag.",
    cost: 35,
  },
  {
    id: "moon-sign",
    name: "Dreamers welcome",
    kind: "sign",
    collection: "Moonlit garden",
    color: "#8b80a0",
    accent: "#f3e9d5",
    detail: "A moonlit welcome for cats and their people.",
    cost: 35,
  },
  {
    id: "moon-bowl",
    name: "Evening ceramic",
    kind: "bowl",
    collection: "Moonlit garden",
    color: "#a498bb",
    accent: "#ebe2f4",
    detail: "A pale violet water bowl with a cream rim.",
    cost: 35,
  },
];
export const itemById = (id?: string) =>
  collectionItems.find((item) => item.id === id);
export type AdventureProgress = {
  owned: string[];
  equipped: Partial<Record<ItemKind, string>>;
  equippedAt: number;
  chapters: string[];
  freeBoxes: number;
  freeBoxesUsed: number;
  boxesOpened: number;
  memoryWins: number;
  trailWins: number;
  lastReveal: string[];
};
export const initialAdventure = (): AdventureProgress => ({
  owned: [],
  equipped: {},
  equippedAt: 0,
  chapters: [],
  freeBoxes: 0,
  freeBoxesUsed: 0,
  boxesOpened: 0,
  memoryWins: 0,
  trailWins: 0,
  lastReveal: [],
});
const count = (n: unknown) =>
  typeof n === "number" && Number.isFinite(n)
    ? Math.max(0, Math.min(100000, Math.floor(n)))
    : 0;
export function normalizeAdventure(value: unknown): AdventureProgress {
  const s =
    value && typeof value === "object"
      ? (value as Partial<AdventureProgress>)
      : {};
  const owned = Array.isArray(s.owned)
    ? collectionItems
        .filter((item) => s.owned!.includes(item.id))
        .map((item) => item.id)
    : [];
  const equipped: AdventureProgress["equipped"] = {};
  for (const kind of ["litter", "collar", "sign", "bowl"] as const) {
    const id = s.equipped?.[kind];
    if (id && owned.includes(id) && itemById(id)?.kind === kind)
      equipped[kind] = id;
  }
  return {
    owned,
    equipped,
    equippedAt:
      typeof s.equippedAt === "number" && Number.isFinite(s.equippedAt)
        ? Math.max(
            0,
            Math.min(Number.MAX_SAFE_INTEGER, Math.floor(s.equippedAt)),
          )
        : 0,
    chapters: Array.isArray(s.chapters)
      ? [...new Set(s.chapters.filter((id) => chapterIds.includes(id)))]
      : [],
    freeBoxes: count(s.freeBoxes),
    freeBoxesUsed: count(s.freeBoxesUsed),
    boxesOpened: count(s.boxesOpened),
    memoryWins: count(s.memoryWins),
    trailWins: count(s.trailWins),
    lastReveal: Array.isArray(s.lastReveal)
      ? s.lastReveal.filter((id) => owned.includes(id)).slice(0, 3)
      : [],
  };
}

export function boxOffer(progress: AdventureProgress) {
  const pool = collectionItems.filter(
    (item) => !progress.owned.includes(item.id),
  );
  const size = Math.min(3, pool.length);
  return {
    pool,
    size,
    cost: size * 20,
    chance: pool.length ? size / pool.length : 0,
  };
}
export function shuffled<T>(items: T[], random = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.max(0, Math.floor(random() * (i + 1))));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
export function openCollectionBox(
  progress: AdventureProgress,
  balance: number,
  random = Math.random,
) {
  const offer = boxOffer(progress);
  const free = progress.freeBoxes > 0;
  if (!offer.size || (!free && balance < offer.cost)) return null;
  const reward = shuffled(offer.pool, random)
    .slice(0, offer.size)
    .map((item) => item.id);
  return {
    balance: balance - (free ? 0 : offer.cost),
    progress: {
      ...progress,
      owned: [...progress.owned, ...reward],
      freeBoxes: progress.freeBoxes - (free ? 1 : 0),
      freeBoxesUsed: progress.freeBoxesUsed + (free ? 1 : 0),
      boxesOpened: progress.boxesOpened + 1,
      lastReveal: reward,
    },
  };
}
export function purchaseCollectionItem(
  progress: AdventureProgress,
  balance: number,
  id: string,
) {
  const item = itemById(id);
  if (!item || progress.owned.includes(id) || balance < item.cost) return null;
  return {
    balance: balance - item.cost,
    progress: { ...progress, owned: [...progress.owned, id] },
  };
}

export type ChapterContext = {
  shelterStage: number;
  hasFed: boolean;
  hasBonded: boolean;
  realityVisits: number;
  dreamDiscoveries: string[];
  adventure: AdventureProgress;
};
export type Chapter = {
  id: string;
  title: string;
  scene: string;
  ending: string;
  goal: string;
  current: number;
  total: number;
  reward: number;
  box?: boolean;
  action: "garden" | "play" | "collection" | "boxes" | "reality" | "dream";
};
const chapterIds = [
  "arrival",
  "curiosity",
  "belonging",
  "footsteps",
  "connection",
  "dreamers",
];
export function mergeAdventure(
  local: AdventureProgress,
  remote: unknown,
): AdventureProgress {
  const other = normalizeAdventure(remote);
  const chapters = [...new Set([...local.chapters, ...other.chapters])];
  const freeBoxesUsed = Math.max(local.freeBoxesUsed, other.freeBoxesUsed);
  return normalizeAdventure({
    ...local,
    owned: [...new Set([...local.owned, ...other.owned])],
    equipped:
      other.equippedAt > local.equippedAt ? other.equipped : local.equipped,
    equippedAt: Math.max(local.equippedAt, other.equippedAt),
    chapters,
    freeBoxesUsed,
    freeBoxes: Math.max(
      0,
      ["arrival", "footsteps", "dreamers"].filter((id) => chapters.includes(id))
        .length - freeBoxesUsed,
    ),
    boxesOpened: Math.max(local.boxesOpened, other.boxesOpened),
    memoryWins: Math.max(local.memoryWins, other.memoryWins),
    trailWins: Math.max(local.trailWins, other.trailWins),
    lastReveal: local.lastReveal.length ? local.lastReveal : other.lastReveal,
  });
}
export function adventureChapters(s: ChapterContext, name: string): Chapter[] {
  return [
    {
      id: "arrival",
      title: "A place to begin",
      scene: `${name} pauses at the edge of the new garden. There is room for a home here. First, make it a place worth coming back to.`,
      ending:
        "A roof, a meal, and a little patience. The garden has its first resident—and its first story.",
      goal: "Build the shelter, feed your cat, and spend quiet time together.",
      current:
        Number(s.shelterStage >= 3) + Number(s.hasFed) + Number(s.hasBonded),
      total: 3,
      reward: 30,
      box: true,
      action: "garden",
    },
    {
      id: "curiosity",
      title: "The curious cupboard",
      scene:
        "In your virtual garden, a cupboard of bowls, ribbons, and curious little treasures needs sorting. See what you can remember, then follow the stepping stones home.",
      ending:
        "Everything has a place. A familiar route and a familiar cupboard make a new home feel a little less strange.",
      goal: "Finish one Memory garden and one Garden trail.",
      current:
        Number(s.adventure.memoryWins > 0) + Number(s.adventure.trailWins > 0),
      total: 2,
      reward: 30,
      action: "play",
    },
    {
      id: "belonging",
      title: "This corner is ours",
      scene: `What does ${name}’s corner look like? A seaside blue bowl, a leafy green welcome, or a little moonlight? You get to decide.`,
      ending:
        "A place becomes a home through small choices. This corner now carries a little of you, too.",
      goal: "Place items in three different collection categories.",
      current: Object.keys(s.adventure.equipped).length,
      total: 3,
      reward: 35,
      action: "collection",
    },
    {
      id: "footsteps",
      title: "Familiar footsteps",
      scene:
        "There is no hurry in the garden today. Try a trickier puzzle, find another way through the flowers, and make room for a new discovery.",
      ending:
        "The garden is becoming familiar. Familiar does not mean finished: there is always another way to make it yours.",
      goal: "Complete six puzzles in any mix.",
      current: s.adventure.memoryWins + s.adventure.trailWins,
      total: 6,
      reward: 35,
      box: true,
      action: "play",
    },
    {
      id: "connection",
      title: "The cat beyond the screen",
      scene: `${name} has a real life beyond this garden. Open the real profile to meet the cat who inspired your companion. Game stories are imagined; sanctuary updates come from the care team.`,
      ending:
        "A small digital garden has led you to a real life. That connection is what makes Cat Gardens different.",
      goal: "Visit your companion’s real story.",
      current: Math.min(1, s.realityVisits),
      total: 1,
      reward: 25,
      action: "reality",
    },
    {
      id: "dreamers",
      title: "Room for tomorrow",
      scene:
        "In the dream garden, imagine what more space could mean: quieter corners, more shelter, and room for new arrivals. Bring one of those ideas back to your own garden.",
      ending:
        "The first story is complete. Keep collecting, change your garden, or choose another companion. Your next visit can begin with a new idea.",
      goal: "Discover the seven spaces in the dream garden.",
      current: s.dreamDiscoveries.length,
      total: 7,
      reward: 50,
      box: true,
      action: "dream",
    },
  ];
}
export function claimAdventureChapter(s: ChapterContext, id: string) {
  const chapter = adventureChapters(s, "Your cat").find((c) => c.id === id);
  const nextId = chapterIds.find((key) => !s.adventure.chapters.includes(key));
  if (!chapter || id !== nextId || chapter.current < chapter.total) return null;
  return {
    reward: chapter.reward,
    progress: {
      ...s.adventure,
      chapters: [...s.adventure.chapters, id],
      freeBoxes: s.adventure.freeBoxes + (chapter.box ? 1 : 0),
    },
  };
}

export type PuzzleKind = "memory" | "trail";
export type PuzzleRound = {
  kind: PuzzleKind;
  level: number;
  size: number;
  cells: number[];
  matched: number[];
  flipped: number[];
  path: number[];
  moves: number;
  complete: boolean;
  reward: number;
};
export function newPuzzle(
  kind: PuzzleKind,
  level: number,
  random = Math.random,
): PuzzleRound {
  const difficulty = Math.max(0, Math.min(2, Math.floor(level)));
  const size = kind === "memory" ? 4 + difficulty * 2 : 5 + difficulty;
  let cells: number[];
  if (kind === "memory")
    cells = shuffled(
      Array.from({ length: size * 2 }, (_, i) => i % size),
      random,
    );
  else {
    // A winding route is guaranteed even when the decorative obstacles vary.
    let x = 0,
      y = 0;
    const safe = new Set([0]);
    while (x < size - 1 || y < size - 1) {
      if (x < size - 1 && (y === size - 1 || random() > 0.5)) x++;
      else y++;
      safe.add(y * size + x);
    }
    cells = Array.from({ length: size * size }, (_, i) =>
      safe.has(i) || random() > 0.34 ? 0 : 1,
    );
  }
  return {
    kind,
    level: difficulty,
    size,
    cells,
    matched: [],
    flipped: [],
    path: [0],
    moves: 0,
    complete: false,
    reward: 10 + difficulty * 5,
  };
}
export function puzzleMove(round: PuzzleRound, index: number): PuzzleRound {
  if (
    round.complete ||
    !Number.isInteger(index) ||
    index < 0 ||
    index >= round.cells.length
  )
    return round;
  if (round.kind === "memory") {
    if (
      round.matched.includes(index) ||
      round.flipped.includes(index) ||
      round.flipped.length === 2
    )
      return round;
    const flipped = [...round.flipped, index];
    const match =
      flipped.length === 2 && round.cells[flipped[0]] === round.cells[index];
    const matched = match ? [...round.matched, ...flipped] : round.matched;
    return {
      ...round,
      flipped: match ? [] : flipped,
      matched,
      moves: round.moves + (flipped.length === 2 ? 1 : 0),
      complete: matched.length === round.cells.length,
    };
  }
  const previous = round.path.at(-1)!;
  if (round.path.length > 1 && index === round.path.at(-2))
    return { ...round, path: round.path.slice(0, -1) };
  if (round.cells[index] || round.path.includes(index)) return round;
  const distance =
    Math.abs((index % round.size) - (previous % round.size)) +
    Math.abs(
      Math.floor(index / round.size) - Math.floor(previous / round.size),
    );
  if (distance !== 1) return round;
  return {
    ...round,
    path: [...round.path, index],
    moves: round.moves + 1,
    complete: index === round.cells.length - 1,
  };
}
