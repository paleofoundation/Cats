# Character art preview

The replacement is integrated in the local game. Run `npm run dev -- --host 127.0.0.1 --port 4183` and open `/art-preview` for the character turntable, or `/` to play. The turntable is development-only and does not change saved progress. This iteration is staged for visual review; the production domains still serve release 49e5ac5.

## Assets and license

Human bodies, face geometry and sculpted hairstyles: **Quaternius, Universal Base Characters (Standard)**, released under CC0 1.0. Source: https://quaternius.com/packs/universalbasecharacters.html and https://quaternius.itch.io/universal-base-characters. The original license is retained at `public/models/characters/LICENSE.txt`. No paid assets or purchase were required.

The bundled GLBs retain complete skeletons and skin weights. Unused source textures were removed; eye textures are embedded at a mobile-friendly resolution. Six files total approximately 2.4 MB. Reproduce them on macOS with `python3 scripts/prepare-character-assets.py '/path/to/Universal Base Characters[Standard].zip'` after downloading the official archive.

The rounded cats, wardrobe meshes, palette shaders, care props and pose controller are original project code. Cat identity data still controls coat, tabby markings, size, eye count and blindness. Karen retains her brown tank top, white skirt, flip-flops and long golden-brown hair. Chanda retains her 150 cm height, dark hair and existing outfit reference. Custom colors, height, build, frame, hair, clothing and footwear remain compatible with existing saves.

## Changes and scope

- One skinned body replaces detached primitive limbs. Head rotation occurs at the neck; transitions blend across poses. Hair and clothing follow the rig.
- Cat heads, paws, ears and muzzles are rounded; pupils, catchlights, blinking and tail movement give them more expression. Adult cats are approximately knee-height including ears, with Winona retaining her smaller relative scale.
- Feeding shares a single nose-to-bowl distance between game state and movement. The actual food bowl is also used in the art preview.
- Quiet-time staging avoids fixed furniture, and the close-up camera checks furniture bounds before choosing a side.
- Shorter meadow tufts and smoother flower meshes help the environment fit the characters.

This is stylized real-time game art, not custom animated-feature-quality production. Hair and skirts do not have cloth physics, and the shared face models are not individual likeness scans. Further art direction can build on the rigged assets without replacing the care logic.

## Verification

23 automated tests cover existing save/account/care/payment/offline behavior plus both shipping skeletons, normalized skin weights, neck pivots and quiet-time furniture clearance. Production web build and Capacitor iOS sync pass. Browser checks cover all four preview people, the three playable cats, walking, watering, feeding, bonding, the avatar editor and a 390 × 844 viewport. Fresh preview load and preset changes report no browser errors. A local garden sample measured a 16.7 ms median frame interval and 17.6 ms 95th percentile; this is desktop evidence, not a physical iPhone benchmark.

The Apple Developer account, full Xcode installation, device tests and App Store release remain outstanding as described in `IPHONE-RELEASE.md`.
