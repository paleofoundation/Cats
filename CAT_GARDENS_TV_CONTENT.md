# Cat Gardens TV content slots

The Cat Gardens TV interface is complete even when no video is connected. An
empty slot displays a truthful branded holding screen rather than a fake live
indicator.

## Connect YouTube

Set any of these deployment values to either a full YouTube URL or its
11-character video/live ID:

- `VITE_YOUTUBE_GARDEN_CAM`
- `VITE_YOUTUBE_BREAKFAST_LIVE`
- `VITE_YOUTUBE_CARE_ALERTS`
- `VITE_YOUTUBE_BRUSH_HOUR`

Rebuild after updating a value. The interface uses YouTube's privacy-enhanced
`youtube-nocookie.com` player automatically.

## Publishing rules

- Use a delayed public stream with no audio.
- Keep doors, roads, license plates, security equipment, private rooms, and
  predictable staff movements out of frame.
- Clearly label replays and recorded episodes. Never label them live.
- A human reviews care alerts, medical context, captions, and clips before
  publication.
- Stop the public feed immediately if a person or animal safety concern enters
  frame.

## Funding records

The following Stripe campaign IDs are wired into the game:

- `tv-pilot`
- `tv-operations`
- `gabriel-trust`
- `fluff-care`

Verified donations are aggregated by `/api/funding-summary` and displayed
without donor identities. Fulfillment should move through:

`funded -> assigned -> purchased -> installed/delivered -> proof reviewed -> supporter notified`

Gardens of St. Gertrude remains the legal nonprofit recipient. Cat Gardens is
the public-facing project and game.
