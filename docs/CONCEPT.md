# NanoDesk — concept & submission notes

## One-liner

An everyday AI writing studio that runs where it makes sense: on your device
when it can (private, instant, free, offline), in the cloud when it must —
with a visible badge proving where every single answer was generated.

## Problem & value proposition

Most AI writing tools send every keystroke to the cloud — even a two-line
grammar fix. That costs latency, privacy, and money, and it breaks offline.
Chrome now ships Gemini Nano on-device, but device support is uneven. Hybrid
inference via Firebase AI Logic is the bridge: one SDK call, the right model
for the situation, and graceful fallback instead of failure.

## What the demo must show (video ≤ 3 min)

1. **Hook (0:00–0:20)** — the app, the status pill: "Gemini Nano on this
   device: ready". Pick *Summarize*, Hybrid mode, Run → ⚡ ON-DEVICE badge,
   ~sub-second latency. "That answer never left this laptop."
2. **Everyday tasks (0:20–1:10)** — polish a messy sentence, translate
   EN → ID, formal-tone rewrite. All on-device, all fast.
3. **Multimodal (1:10–1:40)** — *Describe an image* with a photo (JPEG/PNG),
   still on-device.
4. **The fallback story (1:40–2:30)** — switch to a scenario without Nano
   (or toggle modes): same task in *On-device only* fails gracefully;
   in *Hybrid* the identical request succeeds with a ☁ IN CLOUD badge.
   Show `PREFER_IN_CLOUD` flipping the preference. This is the hybrid thesis.
5. **Under the hood (2:30–2:50)** — quick code shot: `InferenceMode`,
   `initializeDeviceModel`, `response.inferenceSource`. All inference goes
   through Firebase AI Logic; App Check enforced, debug token for judging.
6. **Close (2:50–3:00)** — one SDK, two homes for intelligence. Tagline +
   repo URL.

## Judging-criteria mapping

- **Technical implementation of hybrid inference** — all four InferenceModes
  exposed; `initializeDeviceModel` with download progress; streaming;
  multimodal on-device input; `inferenceSource` surfaced in the UI (proof,
  not claims); App Check enforced.
- **UX design** — single page, zero build step, task chips, live status pill,
  route + latency badges on every answer, honest error guidance.
- **Real-world impact** — writing help is a daily, universal task; on-device
  routing keeps private text (emails, documents) off the network entirely
  and keeps working offline / on slow connections.

## Known limitations (state them honestly)

- On-device requires Chrome Desktop 139+ and a one-time model download;
  unsupported browsers fall back to cloud in Hybrid modes.
- On-device supports single-turn generation only (no chat) — NanoDesk's
  tasks are deliberately single-turn.
- On-device input images: JPEG/PNG only.

## Schedule to deadline (Dec 1, 2026 06:00 WITA — fixed, no extensions)

- Nov 22 — scaffold + docs (this repo state).
- Nov 23 — Firebase project wiring, App Check debug token, first real runs.
- Nov 24–25 — polish UI, test matrix (Nano ready / downloading / absent),
  edge cases, README screenshots.
- Nov 26–27 — record demo video (Chrome desktop), upload YouTube.
- Nov 28 — public GitHub repo + OSI license check, Devpost submission draft.
- Nov 29 — final submission. **Buffer: 2 days. Do not plan work past Nov 29.**
