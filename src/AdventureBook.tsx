import { useRef, useState, type CSSProperties } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Gift,
  Leaf,
  LockKeyhole,
  PawPrint,
  Play,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import { useGame } from "./game/store";
import { getCompanionProfile } from "./game/companions";
import {
  adventureChapters,
  boxOffer,
  collectionItems,
  itemById,
  type CollectionItem,
  type ItemKind,
  type PuzzleKind,
} from "./game/adventures";
import "./adventures.css";

type Tab = "story" | "play" | "collection" | "boxes";
const kindLabels: Record<ItemKind, string> = {
  litter: "Litter trays",
  collar: "Collars",
  sign: "Garden signs",
  bowl: "Water bowls",
};

export function CollectionArt({ item }: { item: CollectionItem }) {
  const c = item.color,
    a = item.accent;
  return (
    <svg
      className="collection-art"
      viewBox="0 0 240 180"
      role="img"
      aria-label={item.name}
    >
      <ellipse cx="120" cy="149" rx="76" ry="12" fill={c} opacity=".13" />
      {item.kind === "litter" && (
        <>
          <path
            d="M42 82 Q42 65 59 65 H182 Q200 65 200 82 L187 132 Q183 145 168 145 H73 Q58 145 54 130Z"
            fill={c}
          />
          <ellipse cx="121" cy="78" rx="79" ry="26" fill={a} />
          <ellipse cx="121" cy="79" rx="63" ry="17" fill="#d8c7a9" />
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <circle
              key={n}
              cx={73 + (n % 5) * 23}
              cy={75 + Math.floor(n / 5) * 10}
              r="2"
              fill="#bba989"
            />
          ))}
          <path
            d="M57 100 Q115 123 186 100"
            stroke={a}
            strokeWidth="3"
            fill="none"
            opacity=".5"
          />
          <path
            d="M113 119 Q100 107 106 104 Q120 102 122 119 Q133 100 139 107 Q138 120 123 125"
            fill={a}
          />
        </>
      )}
      {item.kind === "collar" && (
        <>
          <ellipse
            cx="119"
            cy="84"
            rx="68"
            ry="40"
            fill="none"
            stroke={c}
            strokeWidth="23"
          />
          <path
            d="M57 92 Q120 139 183 92"
            fill="none"
            stroke={a}
            strokeWidth="2"
            strokeDasharray="4 5"
          />
          <rect
            x="66"
            y="98"
            width="26"
            height="22"
            rx="4"
            fill={a}
            transform="rotate(20 80 108)"
          />
          <rect
            x="73"
            y="103"
            width="12"
            height="12"
            rx="2"
            fill={c}
            transform="rotate(20 80 108)"
          />
          <circle
            cx="131"
            cy="126"
            r="7"
            fill="none"
            stroke={a}
            strokeWidth="4"
          />
          <circle cx="131" cy="143" r="17" fill={a} />
          <path
            d="M131 132 L134 140 L142 143 L134 146 L131 154 L128 146 L120 143 L128 140Z"
            fill={c}
          />
        </>
      )}
      {item.kind === "sign" && (
        <>
          <rect x="111" y="90" width="16" height="63" rx="5" fill="#a87f59" />
          <rect x="45" y="43" width="150" height="80" rx="16" fill={c} />
          <rect
            x="52"
            y="50"
            width="136"
            height="66"
            rx="12"
            fill="none"
            stroke={a}
            strokeWidth="2"
          />
          <path
            d="M105 86 Q106 72 119 73 Q133 72 134 86 Q134 97 119 93 Q104 97 105 86"
            fill={a}
          />
          {[
            [-18, -9],
            [-7, -19],
            [8, -19],
            [20, -8],
          ].map(([x, y], i) => (
            <ellipse key={i} cx={119 + x} cy={78 + y} rx="5" ry="7" fill={a} />
          ))}
          <path
            d="M76 102H161"
            stroke={a}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      )}
      {item.kind === "bowl" && (
        <>
          <path d="M46 83 Q49 144 120 145 Q190 143 194 83Z" fill={c} />
          <ellipse cx="120" cy="83" rx="74" ry="30" fill={a} />
          <ellipse cx="120" cy="84" rx="61" ry="21" fill="#82b6bc" />
          <path
            d="M79 83 Q99 73 120 80 M129 88 Q149 80 166 83"
            fill="none"
            stroke="#d7eeea"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M70 117 Q119 141 172 117"
            fill="none"
            stroke={a}
            opacity=".5"
            strokeWidth="3"
          />
        </>
      )}
      <path
        d="M202 31v14m-7-7h14M34 49v10m-5-5h10"
        stroke={c}
        strokeWidth="2"
        strokeLinecap="round"
        opacity=".5"
      />
    </svg>
  );
}

function WrappedGift({ open = false }: { open?: boolean }) {
  return (
    <div
      className={`wrapped-gift ${open ? "unwrapped" : ""}`}
      aria-hidden="true"
    >
      <div className="gift-glow" />
      <div className="gift-base">
        <i />
      </div>
      <div className="gift-lid">
        <b />
        <i />
      </div>
      <span className="gift-spark one">✦</span>
      <span className="gift-spark two">✧</span>
      <span className="gift-spark three">✦</span>
    </div>
  );
}

function PuzzleRoom() {
  const round = useGame((s) => s.puzzle);
  const start = useGame((s) => s.startPuzzle),
    move = useGame((s) => s.movePuzzle),
    clear = useGame((s) => s.clearPuzzleCards);
  const [kind, setKind] = useState<PuzzleKind>(round?.kind || "memory");
  const [level, setLevel] = useState(round?.level || 0);
  return (
    <section className="adventure-play">
      <div className="adventure-section-heading">
        <div>
          <p className="eyebrow">A LITTLE CURIOSITY GOES A LONG WAY</p>
          <h3>Stay for another adventure.</h3>
          <p>
            Fresh puzzles, whenever you want. No lives, energy meters, or
            waiting for tomorrow.
          </p>
        </div>
        <span className="adventure-pill">
          <Sun size={16} /> Earn 10–20 each round
        </span>
      </div>
      <div className="puzzle-options">
        <button
          className={kind === "memory" ? "selected" : ""}
          onClick={() => setKind("memory")}
          aria-pressed={kind === "memory"}
        >
          <Sparkles />
          <b>Memory garden</b>
          <span>Find the matching treasures.</span>
        </button>
        <button
          className={kind === "trail" ? "selected" : ""}
          onClick={() => setKind("trail")}
          aria-pressed={kind === "trail"}
        >
          <Leaf />
          <b>Garden trail</b>
          <span>Trace a path through the flowers.</span>
        </button>
      </div>
      <div className="puzzle-settings">
        <label>
          Challenge{" "}
          <select
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
          >
            <option value={0}>Gentle · 10 tokens</option>
            <option value={1}>Curious · 15 tokens</option>
            <option value={2}>Clever · 20 tokens</option>
          </select>
        </label>
        <button className="adventure-button" onClick={() => start(kind, level)}>
          <Play size={16} />
          {round && !round.complete ? "Start a fresh puzzle" : "Start playing"}
        </button>
      </div>
      {round && (
        <div className="puzzle-table">
          <div className="puzzle-status">
            <h4>
              {round.kind === "memory" ? "Memory garden" : "Garden trail"}
            </h4>
            <span>
              {round.moves} {round.kind === "memory" ? "guesses" : "steps"} ·{" "}
              {round.reward} tokens on completion
            </span>
          </div>
          <p id="puzzle-instructions">
            {round.kind === "memory"
              ? "Turn over two cards. Remember their places and find every matching pair."
              : "Start at the paw. Tap adjacent stepping stones to reach the little home. Avoid the flowers; tap the previous stone to go back."}
          </p>
          {round.kind === "memory" ? (
            <>
              <div
                className="memory-board"
                aria-describedby="puzzle-instructions"
              >
                {round.cells.map((value, index) => {
                  const revealed =
                    round.flipped.includes(index) ||
                    round.matched.includes(index);
                  const matched = round.matched.includes(index);
                  return (
                    <button
                      key={index}
                      className={`${revealed ? "face-up" : ""} ${matched ? "matched" : ""}`}
                      aria-label={
                        revealed
                          ? `${collectionItems[value].name}${matched ? ", matched" : ""}`
                          : `Hidden card ${index + 1}`
                      }
                      disabled={
                        matched ||
                        round.flipped.includes(index) ||
                        round.flipped.length === 2 ||
                        round.complete
                      }
                      onClick={() => move(index)}
                    >
                      {revealed ? (
                        <CollectionArt item={collectionItems[value]} />
                      ) : (
                        <PawPrint />
                      )}
                      {matched && <Check className="pair-check" size={16} />}
                    </button>
                  );
                })}
              </div>
              {round.flipped.length === 2 && (
                <button className="adventure-button quiet" onClick={clear}>
                  Keep looking <ArrowRight size={16} />
                </button>
              )}
            </>
          ) : (
            <div
              className="trail-board"
              style={{ "--trail-size": round.size } as CSSProperties}
              aria-describedby="puzzle-instructions"
            >
              {round.cells.map((blocked, index) => {
                const onPath = round.path.includes(index),
                  current = round.path.at(-1) === index;
                return (
                  <button
                    key={index}
                    className={`${blocked ? "flower" : ""} ${onPath ? "on-path" : ""} ${current ? "current" : ""}`}
                    disabled={Boolean(blocked) || round.complete}
                    onClick={() => move(index)}
                    aria-label={`Row ${Math.floor(index / round.size) + 1}, column ${(index % round.size) + 1}${blocked ? ", flowers" : index === 0 ? ", start" : index === round.cells.length - 1 ? ", home" : onPath ? ", on your path" : ", stepping stone"}`}
                    aria-current={current ? "step" : undefined}
                  >
                    {blocked ? (
                      <Leaf />
                    ) : index === 0 ? (
                      <PawPrint />
                    ) : index === round.cells.length - 1 ? (
                      "⌂"
                    ) : onPath ? (
                      <span />
                    ) : (
                      <i />
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {round.complete && (
            <div className="puzzle-complete" role="status">
              <Sparkles />
              <div>
                <h4>
                  {round.kind === "memory"
                    ? "Every treasure found."
                    : "A lovely way home."}
                </h4>
                <p>
                  {round.reward} tokens added. Spend them on something for your
                  cat, or try a fresh puzzle.
                </p>
              </div>
              <button
                className="adventure-button"
                onClick={() => start(round.kind, round.level)}
              >
                Play again
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default function AdventureBook({
  onClose,
  onReality,
  onDream,
}: {
  onClose: () => void;
  onReality: () => void;
  onDream: () => void;
}) {
  const shelterStage = useGame((s) => s.shelterStage),
    hasFed = useGame((s) => s.hasFed),
    hasBonded = useGame((s) => s.hasBonded);
  const realityVisits = useGame((s) => s.realityVisits),
    dreamDiscoveries = useGame((s) => s.dreamDiscoveries),
    adventure = useGame((s) => s.adventure);
  const context = {
    shelterStage,
    hasFed,
    hasBonded,
    realityVisits,
    dreamDiscoveries,
    adventure,
  };
  const balance = useGame((s) => s.gardenTokens);
  const name = getCompanionProfile(useGame((s) => s.selectedCompanionId)).name;
  const buy = useGame((s) => s.buyCollectionItem),
    equip = useGame((s) => s.equipCollectionItem),
    remove = useGame((s) => s.removeCollectionItem),
    openBox = useGame((s) => s.openGiftBox),
    claim = useGame((s) => s.claimChapter);
  const [tab, setTab] = useState<Tab>("story");
  const [filter, setFilter] = useState<ItemKind | "all" | "owned">("all");
  const [reveal, setReveal] = useState(false);
  const [message, setMessage] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLElement>(null);
  const progress = context.adventure,
    chapters = adventureChapters(context, name);
  const nextIndex = chapters.findIndex(
    (chapter) => !progress.chapters.includes(chapter.id),
  );
  const [selectedChapter, setSelectedChapter] = useState(
    Math.max(0, nextIndex),
  );
  const chapter = chapters[selectedChapter];
  const done = progress.chapters.includes(chapter.id),
    unlocked = done || selectedChapter === nextIndex;
  const offer = boxOffer(progress);
  const free = progress.freeBoxes > 0;
  const switchTab = (next: Tab) => {
    setTab(next);
    setMessage("");
    contentRef.current?.scrollTo({ top: 0, behavior: "instant" });
  };
  const go = () => {
    if (chapter.action === "garden") onClose();
    else if (chapter.action === "reality") onReality();
    else if (chapter.action === "dream") onDream();
    else switchTab(chapter.action);
  };
  return (
    <div className="adventure-backdrop">
      <article
        className="adventure-book"
        role="dialog"
        aria-modal="true"
        aria-labelledby="adventure-title"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            onClose();
          }
        }}
      >
        <header className="adventure-header">
          <div>
            <p className="eyebrow">CAT GARDENS · THE LITTLE THINGS</p>
            <h2 id="adventure-title">A world to make your own.</h2>
          </div>
          <div className="adventure-wallet">
            <Sun size={20} />
            <b>{balance.toLocaleString()}</b>
            <span>garden tokens</span>
          </div>
          <button
            className="adventure-close"
            aria-label="Close adventures"
            autoFocus
            onClick={onClose}
          >
            <X />
          </button>
        </header>
        <nav className="adventure-tabs" aria-label="Garden adventures">
          {(
            [
              ["story", "Your story", BookOpen],
              ["play", "Play & earn", Play],
              ["collection", "Collection", Leaf],
              ["boxes", "Gift boxes", Gift],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              className={tab === id ? "active" : ""}
              onClick={() => switchTab(id)}
              aria-current={tab === id ? "page" : undefined}
            >
              <Icon size={17} />
              {label}
              {id === "boxes" && free && <b>{progress.freeBoxes}</b>}
            </button>
          ))}
        </nav>
        <div className="adventure-content" ref={contentRef}>
          {tab === "story" && (
            <>
              <section className="adventure-story-hero">
                <div>
                  <p className="eyebrow">
                    VOLUME ONE · {name.toUpperCase()}’S GARDEN
                  </p>
                  <h3>
                    Small beginnings.
                    <br />
                    Wonderful possibilities.
                  </h3>
                  <p>
                    Build a home, follow your curiosity, and turn little
                    discoveries into a place that feels like yours.
                  </p>
                  <span>
                    {progress.chapters.length} of {chapters.length} chapters
                    complete · play at your pace
                  </span>
                </div>
                <div className="story-objects">
                  <CollectionArt item={collectionItems[2]} />
                  <CollectionArt item={collectionItems[7]} />
                </div>
              </section>
              <div className="chapter-layout">
                <nav className="chapter-list" aria-label="Story chapters">
                  {chapters.map((c, index) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedChapter(index)}
                      className={index === selectedChapter ? "selected" : ""}
                      aria-current={
                        index === selectedChapter ? "step" : undefined
                      }
                    >
                      <span>
                        {progress.chapters.includes(c.id) ? (
                          <Check size={16} />
                        ) : (
                          String(index + 1).padStart(2, "0")
                        )}
                      </span>
                      <div>
                        <b>{c.title}</b>
                        <small>
                          {progress.chapters.includes(c.id)
                            ? "Memory saved"
                            : index === nextIndex
                              ? "Your next chapter"
                              : "Read a preview"}
                        </small>
                      </div>
                    </button>
                  ))}
                </nav>
                <section className="chapter-page">
                  <p className="eyebrow">
                    CHAPTER {selectedChapter + 1} · A VIRTUAL GARDEN STORY
                  </p>
                  <h3>{chapter.title}</h3>
                  <p>{done ? chapter.ending : chapter.scene}</p>
                  <div className="chapter-goal">
                    <b>{chapter.goal}</b>
                    <progress
                      value={Math.min(chapter.current, chapter.total)}
                      max={chapter.total}
                    />
                    <small>
                      {Math.min(chapter.current, chapter.total)} /{" "}
                      {chapter.total} · Reward: {chapter.reward} tokens
                      {chapter.box ? " + a gift box" : ""}
                    </small>
                  </div>
                  {done ? (
                    <p className="chapter-saved">
                      <Check size={16} /> This memory is yours.
                    </p>
                  ) : !unlocked ? (
                    <p className="chapter-saved">
                      <LockKeyhole size={16} /> Finish the previous chapter to
                      collect this reward.
                    </p>
                  ) : chapter.current >= chapter.total ? (
                    <button
                      className="adventure-button"
                      onClick={() => {
                        if (claim(chapter.id))
                          setMessage(
                            `Chapter complete. ${chapter.reward} tokens${chapter.box ? " and a gift box" : ""} added.`,
                          );
                      }}
                    >
                      Save this chapter <Sparkles size={16} />
                    </button>
                  ) : (
                    <button className="adventure-button" onClick={go}>
                      {chapter.action === "garden"
                        ? "Back to the garden"
                        : chapter.action === "play"
                          ? "Find a puzzle"
                          : chapter.action === "collection"
                            ? "Decorate my garden"
                            : chapter.action === "reality"
                              ? `Meet the real ${name}`
                              : "Visit the dream garden"}
                      <ArrowRight size={16} />
                    </button>
                  )}
                  {done && nextIndex >= 0 && (
                    <button
                      className="adventure-button quiet"
                      onClick={() => setSelectedChapter(nextIndex)}
                    >
                      Next chapter <ArrowRight size={16} />
                    </button>
                  )}
                </section>
              </div>
            </>
          )}
          {tab === "play" && <PuzzleRoom />}
          {tab === "collection" && (
            <>
              <div className="adventure-section-heading">
                <div>
                  <p className="eyebrow">KEEP WHAT YOU DISCOVER</p>
                  <h3>Little treasures. Lots of personality.</h3>
                  <p>
                    Choose an exact item for 35 tokens, or discover three new
                    items in a gift box for 60. Everything you collect stays
                    yours.
                  </p>
                </div>
                <span className="collection-count">
                  <b>{progress.owned.length}</b> / {collectionItems.length}{" "}
                  collected
                </span>
              </div>
              <div
                className="collection-filters"
                aria-label="Filter collection"
              >
                {(
                  ["all", "owned", "litter", "collar", "sign", "bowl"] as const
                ).map((kind) => (
                  <button
                    key={kind}
                    aria-pressed={filter === kind}
                    className={filter === kind ? "active" : ""}
                    onClick={() => setFilter(kind)}
                  >
                    {kind === "all"
                      ? "Everything"
                      : kind === "owned"
                        ? "My collection"
                        : kindLabels[kind]}
                  </button>
                ))}
              </div>
              {filter === "owned" && !progress.owned.length && (
                <p className="collection-empty">
                  Your collection is waiting to begin. Finish the first story
                  chapter for a gift box, or play a puzzle to earn tokens.
                </p>
              )}
              <div className="collection-grid">
                {collectionItems
                  .filter(
                    (item) =>
                      filter === "all" ||
                      (filter === "owned"
                        ? progress.owned.includes(item.id)
                        : item.kind === filter),
                  )
                  .map((item) => {
                    const owned = progress.owned.includes(item.id),
                      placed = progress.equipped[item.kind] === item.id;
                    return (
                      <article key={item.id} className={placed ? "placed" : ""}>
                        <div
                          className="collection-visual"
                          style={{ background: `${item.color}16` }}
                        >
                          <CollectionArt item={item} />
                          {owned && (
                            <span>
                              <Check size={13} />
                              {placed ? "In your garden" : "Yours"}
                            </span>
                          )}
                        </div>
                        <div className="collection-description">
                          <p>{item.collection}</p>
                          <h4>{item.name}</h4>
                          <small>{item.detail}</small>
                          <button
                            disabled={!owned && balance < item.cost}
                            onClick={() => {
                              if (placed) {
                                remove(item.kind);
                                setMessage(
                                  `${item.name} returned to your collection.`,
                                );
                              } else if (owned) {
                                equip(item.id);
                                setMessage(
                                  `${item.name} placed in your garden.`,
                                );
                              } else if (buy(item.id)) {
                                equip(item.id);
                                setMessage(
                                  `${item.name} is yours and has been placed in the garden.`,
                                );
                              }
                            }}
                          >
                            {placed ? (
                              "Put away"
                            ) : owned ? (
                              "Place in my garden"
                            ) : (
                              <>
                                <Sun size={14} />
                                {item.cost} · Choose this item
                              </>
                            )}
                          </button>
                        </div>
                      </article>
                    );
                  })}
              </div>
              <p className="adventure-footnote">
                One item per category is displayed at a time. Swapping is free.
                Collars follow your companion; trays, signs, and bowls sit
                beside the shelter.
              </p>
            </>
          )}
          {tab === "boxes" && (
            <>
              <section className="gift-feature">
                <div className="gift-feature-art">
                  <WrappedGift open={reveal} />
                  <span>THE LITTLE THINGS COLLECTION</span>
                </div>
                <div>
                  <p className="eyebrow">A SURPRISE TO MAKE THEIR DAY</p>
                  <h3>
                    Something lovely
                    <br />
                    is waiting inside.
                  </h3>
                  <p>
                    {offer.size
                      ? `${offer.size} new ${offer.size === 1 ? "item" : "items"} for your garden. No duplicates. Every remaining item has the same chance of being included.`
                      : "You have the complete collection. Enjoy your garden, or switch things around whenever you like."}
                  </p>
                  <div className="gift-guarantees">
                    <span>
                      <Check size={15} /> Yours to keep
                    </span>
                    <span>
                      <Check size={15} /> No repeats
                    </span>
                    <span>
                      <Check size={15} /> Free to place
                    </span>
                  </div>
                  <button
                    className="adventure-button"
                    disabled={!offer.size || (!free && balance < offer.cost)}
                    onClick={() => {
                      if (openBox()) {
                        setReveal(true);
                        setMessage(
                          "Your new items are saved in your collection.",
                        );
                        requestAnimationFrame(() =>
                          revealRef.current?.scrollIntoView({
                            block: "start",
                            behavior: window.matchMedia(
                              "(prefers-reduced-motion: reduce)",
                            ).matches
                              ? "instant"
                              : "smooth",
                          }),
                        );
                      }
                    }}
                  >
                    <Gift size={18} />
                    {!offer.size
                      ? "Collection complete"
                      : free
                        ? `Open your free gift · ${progress.freeBoxes} available`
                        : `Open a box · ${offer.cost} tokens`}
                  </button>
                  {!free && offer.size > 0 && balance < offer.cost && (
                    <button
                      className="adventure-button quiet"
                      onClick={() => switchTab("play")}
                    >
                      Play to earn {offer.cost - balance} more{" "}
                      <ArrowRight size={15} />
                    </button>
                  )}
                  <small className="gift-payment-note">
                    Use garden tokens earned in play. Real-money token packs are
                    not available here.
                  </small>
                </div>
              </section>
              {progress.lastReveal.length > 0 && (
                <section
                  className="gift-reveal"
                  ref={revealRef}
                  aria-label="Your latest gift"
                >
                  <div className="adventure-section-heading">
                    <div>
                      <p className="eyebrow">YOUR LATEST DISCOVERIES</p>
                      <h3>Make room for these.</h3>
                    </div>
                    <button
                      className="adventure-button quiet"
                      onClick={() => {
                        setFilter("owned");
                        switchTab("collection");
                      }}
                    >
                      See my collection <ArrowRight size={16} />
                    </button>
                  </div>
                  <div className="gift-reveal-grid">
                    {progress.lastReveal.map((id) => {
                      const item = itemById(id)!;
                      return (
                        <article key={id}>
                          <CollectionArt item={item} />
                          <h4>{item.name}</h4>
                          <p>{item.collection}</p>
                          <button
                            className="adventure-button quiet"
                            disabled={progress.equipped[item.kind] === id}
                            onClick={() => {
                              equip(id);
                              setMessage(`${item.name} placed in your garden.`);
                            }}
                          >
                            {progress.equipped[item.kind] === id
                              ? "In your garden"
                              : "Place in garden"}
                          </button>
                        </article>
                      );
                    })}
                  </div>
                </section>
              )}
              <details className="gift-odds">
                <summary>
                  What can be inside? See the exact chances before opening.
                </summary>
                <p>
                  Each box selects {offer.size} distinct items uniformly from
                  the {offer.pool.length} you do not yet own. These are the
                  chances for each item to appear anywhere in your next box.
                  They change as your collection grows.
                </p>
                <ul>
                  {offer.pool.map((item) => (
                    <li key={item.id}>
                      <span>{item.name}</span>
                      <b>{(offer.chance * 100).toFixed(2)}%</b>
                    </li>
                  ))}
                </ul>
                <p>
                  When fewer than three items remain, the price falls to 20
                  tokens per remaining item. Once everything is owned, boxes
                  stop. You can always choose an exact item in Collection.
                </p>
              </details>
            </>
          )}
        </div>
        <footer className="adventure-footer">
          <span role="status">
            {message || "Care is always free. Curiosity can take you further."}
          </span>
          <button onClick={onClose}>
            <ArrowLeft size={15} /> Back to garden
          </button>
        </footer>
      </article>
    </div>
  );
}
