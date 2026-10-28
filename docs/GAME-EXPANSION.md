# Cat Gardens: a world worth returning to

Design and implementation notes · 28 October 2026

The promise: **make a home for a cat you love, discover their world, and help real cats live better lives.** The game should be enjoyable even before a player considers spending money. Monetization succeeds when players want to personalize a world they already care about.

## What this update actually implements

The local game now has an **Adventures** book with four sections:

- **Your story:** six connected chapters with requirements, previews, saved endings, token rewards, and three possible complimentary boxes. The chapters use existing shelter, feeding, relationship, real-story, and dream-garden progress. They are fictional garden narration, explicitly distinguished from verified sanctuary history. Chapter rewards are once per garden save, not once per cat switch.
- **Play & earn:** Memory garden and Garden trail, each with three challenge settings, fresh layouts, unlimited attempts, and 10/15/20 token rewards. No energy charge or daily gate. Trail layouts have a guaranteed solution; memory puzzles reward completion without requiring fast reactions. A completed round cannot pay twice. Switching away and back preserves the current round during the session; unfinished rounds are not saved across reloads.
- **Collection:** twelve permanent furnishings across Wildflower, Coastal morning, and Moonlit garden. Each collection contains a litter tray, collar, sign, and water bowl. Players can choose any exact item for 35 existing garden tokens. Owned items can be swapped or put away freely. Equipped furnishings appear in the 3D garden, with the collar attached to the companion. Furnishings are cosmetic; they do not unlock better animal welfare or replace the existing basic-care goals.
- **Gift boxes:** three distinct unowned items for 60 existing garden tokens; earned complimentary boxes are used first. No rarity tiers, no duplicates, no resale or cash value. Each remaining item has inclusion probability `min(3, remaining) / remaining`. Exact current chances are visible before opening. With two items left, the box costs 40; with one, 20. At collection completion, opening stops. Revealed items are saved immediately and remain available after closing or reloading.

The daily basket now provides at least **three meals and three waters**, a treat, and the existing 120 first-crate / 40 subsequent-day token allowance. Meals are available before optional decorating. Additional food can still be obtained from the existing shelf. The character update, avatar choices, food bowl, watering animations, driving, shelter construction, profiles, donations, and native app project remain in place.

This is a playable first slice, **not yet a full multi-hour content release**. Two puzzle families are repeatable, but repetition alone is not the promised depth. No new real-money checkout or paid token pack is enabled by this update. The new screen uses the existing saved game-token balance; existing donation thank-you grants have not been redesigned or represented as a secure premium wallet.

## The psychology to build around

Research on game motivation identifies competence, autonomy, and relatedness as useful foundations for enjoyment and continued play. Applying that research here is a design hypothesis, not a guarantee of retention or a prescription to maximize screen time. [Ryan, Rigby & Przybylski, 2006](https://www.rochester.edu/warner/lida/wp-content/uploads/2022/11/02bfe513dd59366750000000.pdf)

| Motivation | Cat Gardens expression | Evidence to seek in playtests |
| --- | --- | --- |
| Choice | Pick a cat, personal avatar, style, activity, and exact furnishing | Players pursue different goals without asking what they are “supposed” to do |
| Mastery | Legible controls, gentle first puzzles, optional harder variants, useful feedback | Players improve and voluntarily try a harder challenge |
| Connection | A recognizable companion, small character moments, real films and caretaker updates | Players remember their cat and want to see their story continue |
| Anticipation | Preview future regions, browse collections, earn a surprise box | Players name something they are looking forward to |
| Visible progress | A garden that changes when furnished, a growing storybook, finished sets | Players can explain what changed during their session |
| Creative pride | Decorate a whole space, save designs, eventually share a visitable garden | Players enjoy their own choices even without a reward |

The token/box example most closely matches **Redecor**: its official FAQ describes tokens earned through challenges, available to purchase, and used for décor boxes. “Redesign” is also a separate app, so this is a likely reference match rather than a confirmed correction. Cat Gardens should adapt the creative collection loop to cat care instead of copying another game's identity. [Redecor FAQ](https://www.redecor.com/faq_category/general/)

Avoid making hunger, an injured real cat, a lost streak, or a closing countdown the reason someone pays. A player who leaves should return to a welcoming game. Basic care remains available, purchased currency does not expire, and collection progress does not decay. Surprise should reward curiosity; a direct purchase option should remain equally understandable.

## What makes a two-hour session possible

Build a repeatable cycle: **choose a story goal → play an activity → earn tokens/materials → discover or choose an item → decorate → see a character response → unlock the next meaningful choice.** The activity and decorating must be enjoyable in themselves.

A proposed two-hour session, to be validated rather than advertised as measured playtime:

| Approximate time | Player experience | Lasting result |
| --- | --- | --- |
| 0–10 minutes | Collect free care supplies; feed, water, and greet the companion | Care complete; a story lead appears |
| 10–30 | A chapter with two short activities and a meaningful choice of location or style | A new corner becomes usable |
| 30–50 | Browse furnishings; solve a few varied puzzles; open a box or choose an item | A visible home makeover |
| 50–65 | Explore a new part of the garden and find a character memory | Storybook scene and discovery collectible |
| 65–85 | Complete a design brief using pieces already owned | Saved design, token reward, character reaction |
| 85–105 | A different activity family: enrichment setup, path planning, or a search scene | New skill and progress toward the next chapter |
| 105–120 | Visit the real-cat story; finish a personal design; preview another region | A satisfying stopping point and a reason to return |

None of these blocks should require a purchase, a timer reset, or a return on a particular day. Let people stop after ten minutes with something complete, or continue while enjoying themselves.

## Content production plan

**First full release target:** four playable regions, 24 authored chapters, four genuinely different activity families, three distinct companion arcs, and roughly 120 useful furnishings. These are production targets, not assets already present. Timings and the size of the catalog need playtesting and art estimates before a release commitment.

1. **The first garden:** shelter, belonging, simple creative choices, existing six-chapter opening expanded with in-world moments.
2. **The wildflower court:** plant placement, shade routes, insect observation, enrichment puzzles, botanical furnishings.
3. **The sunlit terrace:** spatial decorating challenges, visitor stories, social corners, seaside furnishings.
4. **The moon garden:** a new lighting palette, quiet observation scenes, nighttime search activities, twilight furnishings.

Mabel, Splotch, and Winona should not simply swap names in the same plot. Each needs a researched, caretaker-reviewed character brief, a fictional game arc appropriate to the real cat, distinctive animation responses, and separate verified real-life updates. Do not invent rescue events or medical facts to fill chapters.

Every new chapter should define its prerequisites, activity, dialogue branches, reward, world changes, accessibility alternatives, replay behavior, and completion event in content data. A small editor can eventually let the team add chapters without changing the game engine. Add new content to a permanent library; seasonal releases can remain playable afterward.

Expand the current twelve-item catalog with meaningful silhouettes before producing hundreds of recolors: litter stations, bowls, washable beds, safe play equipment, raised shelves, window perches, shelters, paths, plaques, plants, lighting, and avatar clothing. Art should share the new warm 3D character style. A thumbnail must depict what the player actually receives.

Later community features could include garden visits, cooperative sanctuary decorating, and design showcases. They need reporting/moderation and privacy work before public player-generated content. Do not fake votes, visitors, or community progress to make the game seem active.

## Paid tokens and real-cat support

The recommended release model is free basic care and story access, earned tokens for regular play, and optional paid currency for permanent decorative items and disclosed gift boxes. Set pack pricing only after testing how quickly players earn and spend rewards. The current twelve-item collection is too small to justify a substantial paid storefront.

**Important implementation boundary:** the existing client-saved token balance, maximum-value cloud merge, and browser donation thank-you flow are not an authoritative money ledger. A player can modify local state. Do not sell new token packs against this storage or describe it as purchase-secure. Offline earned progress may stay local; paid entitlements must be reconciled by the server.

Before accepting paid currency:

1. Create a server-owned wallet and immutable transaction records with separate earned and purchased entries. A client's reported balance is never accepted as a purchase receipt.
2. Verify provider transactions on the server, bind them to the signed-in account, and use unique provider transaction IDs to prevent duplicate credits. Process delayed payment, cancellation, refunds, and chargebacks explicitly.
3. Spend currency, select box contents, and record item ownership in one atomic database transaction. Save the odds/catalog version and the result before showing the reveal. Retrying a request must return the same result without another charge or reroll.
4. Keep free care supplies independent of the paid balance. Reconcile old thank-you tokens under a documented migration rather than silently converting them to bought currency.
5. Implement and test cross-device restore, account deletion, device loss, offline recovery, wallet conflicts, concurrent spends, and receipt replay. Purchased balances must never be merged by taking the larger client value.
6. Use the existing web payment service only after a specific digital-goods purchase flow is configured. Keep ordinary donations distinguishable from purchases with digital consideration. Do not promise tax deductibility for an item purchase.

For the iPhone release, plan for Apple's in-app purchasing rules for digital currency, disclose random-item odds before purchase, and keep purchased currency non-expiring. Rules have storefront-specific exceptions, so confirm the launch territories when configuring payments. Approved nonprofit fundraising has a distinct path and is not a universal bypass for selling digital items. The user does not yet have an Apple Developer account. [Apple App Review Guidelines, 3.1 and 3.2](https://developer.apple.com/app-store/review/guidelines/)

The honest support message is **“Purchases support real cat care”**, with a published allocation policy. Do not say “every euro goes straight to cats” unless that exact claim is supported after applicable taxes, store/payment fees, refunds, and game operating costs. Decide whether development is funded separately or from proceeds, then show that plainly.

The impact page should distinguish purchase gross, deductions, amount allocated to sanctuary care, amount actually disbursed/spent, and verified evidence. A virtual litter tray is not evidence that a real tray was purchased. Aggregate contributions into real care projects and link confirmed outcomes to the public care record. Do not fabricate per-purchase medical or feeding outcomes.

## How to tell whether it works

Before adding more monetization, watch consenting players complete their first session. Measure first successful care action, control confusion, first decoration, voluntary second activity, chapter completion, and whether they can find their real cat's story. Ask what they wanted to do next and whether the price/reward was clear. Then examine voluntary return visits, purchase satisfaction, refunds, support requests, and confirmed net care funding.

Long sessions are one possible outcome, not the only success criterion. A joyful ten-minute visit that reliably supports a real sanctuary is more valuable than a two-hour session spent confused or waiting.

## Engineering verification

Automated coverage includes box costs and uniform selection, collection completion, duplicate/insufficient-funds rejection, once-only chapter claims, save normalization, cloud free-box merging, memory completion, 300 solvable trail boards, and profile sanitization. Existing graphics, care, payment-isolation, and offline tests remain included. Browser verification and release status are recorded with the change; a successful web build is not an App Store release or a physical iPhone performance test.

Verified in the local preview: a 60-token box, three new saved items, all four equipment categories represented in the scene, direct item choice, a 10-token memory win, a 20-token trail win, persistence after reload, three sequential chapter claims, a complimentary box with no balance deduction, and a 390 × 844 collection layout without horizontal overflow. All 31 automated tests, the production build, and native asset sync pass. The first full release remains future work; this expansion is not published to catgardens.org.

An older offline worker was also found treating a development image import as a cached image, which could leave the local app blank. The worker now bypasses asset requests with query strings; offline tests cover this distinction while retaining normal public-asset caching.
