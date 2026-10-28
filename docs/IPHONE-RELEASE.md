# Cat Gardens on iPhone

The installable web app is available at https://catgardens.org/app. In Safari use Share → Add to Home Screen → Open as Web App. The game’s built assets and fonts are cached after an online visit. Game progress stays local; current care records, account syncing, videos and donations require a connection. The worker never caches API responses, authentication, staff pages, or checkout. Updates activate after existing app windows close, so they do not interrupt play.

## Native project prepared

The Xcode project is `ios/App/App.xcodeproj`, bundle ID `org.catgardens.app`, targeting iOS 15 and later with Capacitor 8.5.3 and Swift Package Manager. The game is bundled inside the app; there is no remote `server.url`. The project includes a branded launch screen and 1024px icon, portrait/landscape support, native sharing, light interaction haptics, and a Preferences backup of the existing game save. Public pages use the same story components as the website. Donation pages open in the system browser. Existing API authentication is retained.

Build preparation:

```sh
npm ci
npm run ios:sync
npm run ios:open
```

`ios:sync` builds the website and copies it into the native project. It does not compile, sign, or publish an iPhone binary.

## Remaining release requirements

The owner confirmed there is no Apple Developer account yet. This Mac currently has Command Line Tools only; `simctl` and full Xcode are unavailable. Therefore there is no signed IPA, simulator run, device validation, TestFlight upload, or App Store submission from this work.

1. Enroll the appropriate organization in the Apple Developer Program and install Xcode 26 or later. Select the organization’s signing team in Xcode and register the bundle ID.
2. Build and test on physical iPhones and a simulator: first launch, choosing a cat, avatar customization, walking and care actions, suspension/resume, offline relaunch, rotating the screen, video playback, VoiceOver, sharing, and restoring local saves.
3. Verify Clerk’s production sign-in and account-save round trip from the native origin, including any required authorized origins or redirects. Browser and installed-app storage can differ. Native authentication has not been device-tested here.
4. Review the real-donation flow before distribution. The website currently grants virtual tokens after a verified gift. Apple’s rules distinguish nonprofit donations from digital purchases; that combination needs a deliberate App Store-compatible design and review. Donations remain unchanged on the website, and the native project opens the existing website in the system browser. This alone does not establish App Store compliance.
   The Adventures expansion also lets players spend existing game tokens on surprise furnishing boxes. It includes exact pre-opening odds and duplicate protection, but the current client balance is not a secure paid wallet. New token packs remain unavailable. Follow [the game expansion plan](GAME-EXPANSION.md#paid-tokens-and-real-cat-support) for the authoritative wallet, receipt verification, refund handling, and App Store purchase design before selling currency.
5. Confirm Apple nonprofit/Apple Pay approval if fundraising inside the app, privacy disclosures, account deletion, app age rating, support and privacy URLs, and any media permissions. The included privacy manifest describes app functionality and Preferences access; final App Store privacy answers need validation against the shipped app and third-party SDKs.
6. Archive, upload to TestFlight, complete device testing, then submit to App Review. No acceptance, membership payment, or submission has been performed.

## Verification completed

Production web build, regression tests, mobile browser layout, shared story/game navigation, preserved media, and offline reopening/play with saved progress were checked. `cap sync ios` succeeds. Native plist files parse successfully. These checks do not replace an iOS compile or device run.

## Sources

- [Install a website as an iPhone app](https://support.apple.com/guide/iphone/turn-a-website-into-an-app-iphea86e5236/ios)
- [Capacitor iOS requirements](https://capacitorjs.com/docs/ios)
- [Capacitor privacy manifests](https://capacitorjs.com/docs/ios/privacy-manifest)
- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Apple Pay for nonprofits](https://developer.apple.com/apple-pay/nonprofits/)
