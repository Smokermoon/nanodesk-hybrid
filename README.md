# NanoDesk — Hybrid AI Text Studio

A web app for everyday writing tasks — summarizing, polishing, re-toning,
translating, expanding, and image description — built with **Firebase AI Logic
hybrid inference**. Quick requests run **on-device** with Gemini Nano in Chrome
(private, instant, free, offline-capable); anything the device can't handle
**falls back seamlessly to a cloud Gemini model**, so the feature never breaks.

Built for **#BuildHybridAI 2026**. Platform: **Web (Chrome)**.

## Why hybrid?

| | On-device (Gemini Nano) | In-cloud (Gemini) |
|---|---|---|
| Privacy | Text never leaves the machine | Sent to Google's cloud |
| Latency | Near-instant, no network | Network round-trip |
| Cost | Free | Free tier via Gemini Developer API |
| Availability | Needs Chrome Desktop 139+ + model download | Any modern browser |
| Capability | Great for short everyday tasks | Handles anything |

NanoDesk doesn't make the user choose. It exposes all four Firebase AI Logic
inference modes — `PREFER_ON_DEVICE`, `ONLY_ON_DEVICE`, `PREFER_IN_CLOUD`,
`ONLY_IN_CLOUD` — and, after every request, shows a **route badge** read from
the SDK's `response.inferenceSource`, so you can see where each request
actually ran, plus its latency.

## How it uses Firebase AI Logic

- `getAI(app, { backend: new GoogleAIBackend() })` — Gemini Developer API backend.
- `getGenerativeModel(ai, { mode: InferenceMode.… })` — one model instance per mode.
- `model.initializeDeviceModel(progressCallback)` — called on a user gesture,
  before the first prompt, to download/warm up Gemini Nano (with a progress bar).
- `generateContentStream(...)` for streaming output, text and text+image input
  (JPEG/PNG, the formats on-device inference supports).
- **App Check** is enforced (per the AI Logic console workflow). For local
  development and judging, the App Check **debug provider** is used — debug
  tokens are explicitly accepted for this hackathon.

## Setup (one-time, ~5 minutes)

1. Go to the [Firebase console](https://console.firebase.google.com) and create
   a project (Google Analytics not required).
2. In the console: **AI Services → AI Logic → Get started**, and choose the
   **Gemini Developer API** provider (free, no billing).
3. Register a **Web app** in the project and copy its config object into
   [`app/firebase-config.js`](app/firebase-config.js).
4. Serve the `app/` folder locally (see below), open the page, and copy the
   **App Check debug token** printed in the browser console.
5. In the console: **App Check → Apps → your web app → Manage debug tokens**,
   and register that token.

## Run locally

Any static server works, e.g. from this repo root:

```bash
npx serve app
# or
python3 -m http.server 8080 --directory app
```

Open the printed `localhost` URL in **Chrome Desktop 139+**.

For on-device inference:

- Enable `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input` and restart Chrome.
- Press **“Prepare on-device model”** once to download Gemini Nano
  (or it downloads automatically on the first on-device request).

If on-device inference is unavailable, Hybrid mode simply answers from the
cloud — try the **On-device only** mode to see the difference, and watch the
route badge flip between ⚡ ON-DEVICE and ☁ IN CLOUD.

## Project layout

```
app/
  index.html          UI (single page, no build step)
  main.js             Firebase AI Logic wiring, tasks, streaming, route badges
  firebase-config.js  Your Firebase web config (public identifiers, not secrets)
docs/
  CONCEPT.md          Pitch, judging-criteria mapping, demo script
```

## License

MIT — see [LICENSE](LICENSE).
