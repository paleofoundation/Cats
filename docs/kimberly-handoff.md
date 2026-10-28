# CatGardens handoff for Kimberly

Verified 28 October 2026. Intended teammate: kimberly@paleofoundation.org.

## Source and hosting

| Component | Source | Runtime |
| --- | --- | --- |
| Public TINAG game | `paleofoundation/Cats`, `agent/cat-gardens-playable-v2`; open PR #2 | Vercel `cats`, React/Vite/Three.js, Clerk authentication, Neon database |
| Private sanctuary care | `paleofoundation/catgardens-care`, `main` | Sites project `appgprj_6ab635f8226c8191bed7e10a935f38dc`, Vinext/Workers, ChatGPT authentication, D1 `DB`, R2 `BUCKET` |

Care was recovered from Sites commit `e7b09d5d5a1002d9ffac5ed9adea49ee52174638`
with all five source revisions preserved in GitHub. This is a source transfer:
production D1 records, R2 documents, secrets, and hosting ownership were not copied.
The new private GitHub repository does not automatically deploy to Sites.

The live game source matches commit `185b49a`; the newer game-branch commit
`7f512cd` has not been verified as deployed. Review PR #2 and its deployment
implications before changing the default branch or merging it.

## Access required to work

1. Invite Kimberly's GitHub account to **both repositories**. GitHub access does
   not grant access to Vercel, Sites, Clerk, Neon, or production records.
2. If she will deploy the game, grant appropriate access to the existing Vercel
   `cats` project in `karen-pendergrass-projects`; coordinate Clerk/Neon access.
3. If she will edit or deploy Care, share the existing Site with editing access.
   If she will use Care, also allow her account through the private Site gate
   and set her verified sign-in email in **Team & points**.
4. The application currently seeds Kimberly as a **volunteer**. Code access is
   independent of this care role. Do not change the hard-coded sanctuary owner
   identity in `lib/team.ts` to grant GitHub access or to bypass team controls.

`paleofoundation` is a GitHub personal account. Such repositories have one owner;
collaborator access lets Kimberly push code. For shared ownership and granular
administration, use an organization and plan repository transfers separately.
See [GitHub's personal repository permission documentation](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/permission-levels-for-a-personal-account-repository).

## Run Care locally

Use Node 22.13 or newer and **pnpm 11.25.0**, pinned in `package.json`.

```sh
git clone https://github.com/paleofoundation/catgardens-care.git
cd catgardens-care
pnpm install --frozen-lockfile
pnpm run dev
pnpm run build
```

On macOS use the direct install command above: the inherited `install:ci` wrapper
requires Linux `flock` and GNU `timeout`. Direct installation and production build
were verified on macOS during this handoff. Local Workers bindings are configured
in `vite.config.ts`; local development does not copy production records.
Local mock authentication belongs only in development. Production relies on the
Sites access gate and its authenticated request headers.

## Operations and game integration

Care now includes **Operations** for food shortages, purchases, supply usage,
opening-stock adjustments, vet visits, transport, and sanctuary updates. Each
record has an actual event time, signed-in author, optional resident, person,
provider, internal notes, cost status/currency, and private receipt attachments.
Stock balances are calculated from all recorded changes; staff must enter opening
stock and usage. Paid expenses and planned costs are shown separately.

Staff can suggest a public update while saving an internal event. An owner or
caretaker reviews the separate public title, summary and explicit game-cat
mapping, then chooses **Approve and send to game**. Volunteers can log operations
and suggest drafts. Demo records cannot be published. Failed deliveries remain
queued with a retry action. Public revisions and withdrawals use monotonically
increasing versions, so retries do not duplicate updates or restore stale text.

`POST /api/care-ingest` on the game accepts only the approved public fields,
authenticated with a server-only `CARE_BRIDGE_SECRET`. The same generated secret
is configured in Sites and the Vercel production environment. It is not in Git,
local env files or frontend code. Care sends directly to this endpoint after
approval; the game exposes the result in its existing reality feed.

Internal notes, actual cost fields, people, providers, original receipts,
medication records and private file URLs are excluded from the transfer payload.
An approved public summary may describe an expense in words if staff choose to
publish it, but this integration does not automatically reconcile accounting or
donor allocations. Game currency and staff care points remain separate.

See `lib/operations.ts` and `app/api/operations/route.ts` in Care, and
`api/_care-bridge.js` / `api/care-ingest.js` in the game. The appended migration is
`drizzle/0004_worthless_true_believers.sql`; preserve all applied migrations.

## iPhone and staff entry

The game has a web manifest, a 512-pixel game icon, Apple Home Screen metadata,
standalone display and Home Screen instructions under **More**. On iPhone open
catgardens.org in Safari and use **Share → Add to Home Screen**. This installs a
web app, not an App Store binary. Internet access is required; the service worker
provides a clear connection message rather than caching private or payment data.

**More → Staff care · sign in** uses `/staff` to open the private Care interface.
Care retains its separate sign-in, membership checks and orange/green care icon.
Its existing Home Screen installation instructions remain available.

## Payments

Production has Stripe secret/public/webhook variable names configured. The game
now handles delayed-payment success as well as completed Checkout Sessions and
recurring invoices. Donation, allocation, event and notification writes are
transactional, and session/invoice IDs prevent duplicate fulfillment.

`GET /api/payment-readiness` is restricted to authorized staff or the service
bridge. It reports the configured merchant, key-mode consistency, account charge
capability and required webhook events, without exposing payment keys.

The separately connected Stripe account is Paleo Certified Inc. / Institute of
Contaminant Standards. It is not evidence of which account the game key uses.
Confirm the intended CatGardens recipient, the actual configured merchant and a
signed sandbox payment/webhook cycle before claiming payments fully ready. No
real donation was charged during this work.

## Domain follow-up

`care.catgardens.org` remains pending verification in Sites. The working address is
`https://catgardens-care.kmfp.chatgpt.site`. DNS requirements returned by Sites:

| Type | Host relative to catgardens.org | Value |
| --- | --- | --- |
| CNAME | `care` | `custom-domains.chatgpt.site` |
| TXT | `_openai-site-verification.care` | `openai-site-verification=yf0tBRAtl-LUBnpD_IJcSUS_oEWe46bqFR-QPkVC4Ws` |
| TXT | `_cf-custom-hostname.care` | `a235ad84-c152-4282-8b3d-4ff17b23f157` |

Apply these at the authoritative DNS provider, then refresh verification in Sites.
This source handoff did not change DNS or production deployments.
