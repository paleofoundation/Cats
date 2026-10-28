# Cat Gardens / TINAG

The living sanctuary game at [catgardens.org](https://catgardens.org).

## Start on the game branch

As verified on 28 October 2026, the TINAG implementation lives on
`agent/cat-gardens-playable-v2`, with [PR #2](https://github.com/paleofoundation/Cats/pull/2)
open against `main`. **The default `main` branch contains the older sanctuary website.**
Do not deploy `main` expecting the game.

The live deployment identifies commit `185b49a00fa4d6f1911b090e167c3dd309b4185d`.
All 177 tracked files present in its Vercel source upload match that commit by
SHA-1 content hash; three Git/checkout metadata files were excluded from the upload.
The game branch also contains the later commit `7f512cd` (verified donation tokens),
which is not part of that deployed source snapshot.

```sh
git clone https://github.com/paleofoundation/Cats.git
cd Cats
git switch agent/cat-gardens-playable-v2
npm ci
npm run dev
npm run build
```

Vite serves the frontend. Authenticated API routes require the Vercel environment;
`npm run dev` alone does not run the `api/` serverless functions. Use the existing
Vercel `cats` project for full integration testing after obtaining project access.
Use `.env.example` for variable names; obtain values through the owner, never Git.

## Companion care app

- [Private source: paleofoundation/catgardens-care](https://github.com/paleofoundation/catgardens-care)
- [Hosted care app](https://catgardens-care.kmfp.chatgpt.site)
- [Kimberly handoff and integration details](docs/kimberly-handoff.md)

The game and Care retain separate sign-ins and databases. Care publishes reviewed
public summaries into the game’s reality feed; internal records remain private.
The game includes a Home Screen web app and a Staff care entry. See the handoff
guide for deployment, tests and remaining payment verification.
