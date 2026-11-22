// NanoDesk — Hybrid AI Text Studio
// All AI inference goes through Firebase AI Logic:
//   on-device  → Chrome Prompt API (Gemini Nano)
//   in-cloud   → Gemini Developer API
// Docs: https://firebase.google.com/docs/ai-logic/hybrid/web/get-started

import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode } from "firebase/ai";
import { firebaseConfig, appCheckSiteKey, appCheckDebug } from "./firebase-config.js";

// ── Firebase + App Check ────────────────────────────────────────────────────
const app = initializeApp(firebaseConfig);

// App Check is enforced for AI Logic by the console get-started workflow.
// Locally (and for hackathon judging) the debug provider is accepted.
// Token resolution order:
//   1. ?appcheck_token=<uuid> in the URL (stored to localStorage for reuse)
//   2. the stored token from a previous visit
//   3. `true` — the SDK generates a token and prints it in the console;
//      register that printed token once under
//      App Check → Apps → Manage debug tokens.
// The token itself is a secret: it is never committed to this repository.
const storedDebugToken =
  new URLSearchParams(location.search).get("appcheck_token") ||
  localStorage.getItem("nanodesk.appCheckDebugToken");
if (storedDebugToken) {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = storedDebugToken;
  localStorage.setItem("nanodesk.appCheckDebugToken", storedDebugToken);
} else if (appCheckDebug) {
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}
if (appCheckSiteKey) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
} else if (appCheckDebug) {
  // Debug provider still needs initializeAppCheck to run; a placeholder
  // provider is fine because the debug token short-circuits attestation.
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider("debug-placeholder"),
    isTokenAutoRefreshEnabled: true,
  });
}

const ai = getAI(app, { backend: new GoogleAIBackend() });

// ── Models (one instance per inference mode, created lazily) ────────────────
const modelCache = new Map();
function getModel(modeName) {
  if (!modelCache.has(modeName)) {
    const model = getGenerativeModel(ai, { mode: InferenceMode[modeName] });
    modelCache.set(modeName, { model, deviceReady: false });
  }
  return modelCache.get(modeName);
}

const ON_DEVICE_MODES = new Set(["PREFER_ON_DEVICE", "ONLY_ON_DEVICE", "PREFER_IN_CLOUD"]);

// initializeDeviceModel() must be called after/on a user interaction and
// before the first prompt request. Safe to call again; it also reports
// on-device model download progress.
async function ensureDeviceModel(modeName, onProgress) {
  const entry = getModel(modeName);
  if (!ON_DEVICE_MODES.has(modeName) || entry.deviceReady) return;
  try {
    await entry.model.initializeDeviceModel((val) => {
      if (onProgress) onProgress(val);
    });
    entry.deviceReady = true;
  } catch (e) {
    // On-device unavailable (browser/flags/storage). Hybrid modes will fall
    // back to the cloud; ONLY_ON_DEVICE will surface the error on generate.
    console.warn("initializeDeviceModel:", e);
  }
}

// ── On-device availability (Chrome Prompt API) ──────────────────────────────
const statusPill = document.getElementById("deviceStatus");
const statusText = document.getElementById("deviceStatusText");
async function refreshDeviceStatus() {
  try {
    if (typeof LanguageModel === "undefined") throw new Error("no Prompt API");
    const avail = await LanguageModel.availability();
    if (avail === "available") {
      statusPill.className = "pill ready";
      statusText.textContent = "Gemini Nano on this device: ready";
    } else if (avail === "downloadable" || avail === "downloading") {
      statusPill.className = "pill busy";
      statusText.textContent = "Gemini Nano: model download pending — press “Prepare on-device model”";
    } else {
      statusPill.className = "pill none";
      statusText.textContent = "Gemini Nano: not available here — cloud fallback active";
    }
  } catch {
    statusPill.className = "pill none";
    statusText.textContent = "On-device model: needs Chrome Desktop 139+ — cloud fallback active";
  }
}
refreshDeviceStatus();

// ── Tasks ────────────────────────────────────────────────────────────────────
const TASKS = {
  summarize:   (t) => `Summarize the following text in at most 3 short sentences. Keep the key facts, drop the fluff.\n\nTEXT:\n${t}`,
  polish:      (t) => `Fix the grammar, spelling, and punctuation of the following text and make it read smoothly. Preserve its meaning and tone. Return only the corrected text.\n\nTEXT:\n${t}`,
  formal:      (t) => `Rewrite the following text in a formal, professional tone suitable for a business email. Return only the rewritten text.\n\nTEXT:\n${t}`,
  friendly:    (t) => `Rewrite the following text in a warm, friendly, casual tone. Return only the rewritten text.\n\nTEXT:\n${t}`,
  translateId: (t) => `Translate the following text into natural, idiomatic Indonesian (Bahasa Indonesia). Return only the translation.\n\nTEXT:\n${t}`,
  translateEn: (t) => `Translate the following text into natural, idiomatic English. Return only the translation.\n\nTEXT:\n${t}`,
  expand:      (t) => `Expand the following short note into one clear, well-structured paragraph. Do not invent facts that are not implied by the note.\n\nNOTE:\n${t}`,
  image:       ()  => `Describe this image in detail: what is in it, what is happening, and anything notable. Then add one sentence suggesting a good social-media caption for it.`,
};

let currentTask = "summarize";
const chips = document.querySelectorAll("#taskChips .chip");
const textBlock = document.getElementById("textBlock");
const imageBlock = document.getElementById("imageBlock");
chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    chips.forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    currentTask = chip.dataset.task;
    const isImage = currentTask === "image";
    textBlock.classList.toggle("hidden", isImage);
    imageBlock.classList.toggle("hidden", !isImage);
  });
});

// Converts a File to a generative Part (pattern from the Firebase docs).
async function fileToGenerativePart(file) {
  const base64 = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.readAsDataURL(file);
  });
  return { type: "inlineData", inlineData: { data: base64, mimeType: file.type } };
}

// ── Run ──────────────────────────────────────────────────────────────────────
const runBtn = document.getElementById("runBtn");
const prepBtn = document.getElementById("prepBtn");
const modeSelect = document.getElementById("modeSelect");
const outputEl = document.getElementById("output");
const errorBox = document.getElementById("errorBox");
const routeBadge = document.getElementById("routeBadge");
const timeBadge = document.getElementById("timeBadge");
const modeBadge = document.getElementById("modeBadge");
const dlProgress = document.getElementById("dlProgress");
const dlBar = dlProgress.querySelector("div");

modeSelect.addEventListener("change", () => {
  modeBadge.textContent = `Mode: ${modeSelect.value}`;
});

function showProgress(val) {
  dlProgress.style.display = "block";
  dlBar.style.width = `${Math.round(val * 100)}%`;
  if (val >= 1) setTimeout(() => { dlProgress.style.display = "none"; }, 600);
}

prepBtn.addEventListener("click", async () => {
  errorBox.textContent = "";
  prepBtn.disabled = true;
  try {
    await ensureDeviceModel(modeSelect.value, showProgress);
    await refreshDeviceStatus();
  } finally {
    prepBtn.disabled = false;
  }
});

runBtn.addEventListener("click", async () => {
  errorBox.textContent = "";
  const modeName = modeSelect.value;
  const { model } = getModel(modeName);

  // Build the request parts.
  let parts;
  try {
    if (currentTask === "image") {
      const file = document.getElementById("imageFile").files[0];
      if (!file) throw new Error("Please choose a JPEG or PNG image first.");
      parts = [TASKS.image(), await fileToGenerativePart(file)];
    } else {
      const text = document.getElementById("inputText").value.trim();
      if (!text) throw new Error("Please enter some text first.");
      parts = [TASKS[currentTask](text)];
    }
  } catch (e) {
    errorBox.textContent = e.message;
    return;
  }

  runBtn.disabled = true;
  outputEl.textContent = "";
  routeBadge.className = "badge neutral";
  routeBadge.textContent = "Running…";
  const t0 = performance.now();

  try {
    // User-gesture moment: warm up the on-device model before prompting.
    await ensureDeviceModel(modeName, showProgress);

    const result = await model.generateContentStream(parts);
    let acc = "";
    for await (const chunk of result.stream) {
      acc += chunk.text();
      outputEl.textContent = acc;
    }
    const response = await result.response;
    const ms = Math.round(performance.now() - t0);
    timeBadge.textContent = `${ms.toLocaleString()} ms`;

    // inferenceSource (SDK v12.5.0+) tells us where the request really ran.
    const src = response.inferenceSource;
    if (src === "ON_DEVICE") {
      routeBadge.className = "badge device";
      routeBadge.textContent = "⚡ Ran ON-DEVICE · Gemini Nano";
    } else if (src === "IN_CLOUD") {
      routeBadge.className = "badge cloud";
      routeBadge.textContent = "☁ Ran IN CLOUD · Gemini";
    } else {
      routeBadge.className = "badge neutral";
      routeBadge.textContent = "Route: not reported by SDK";
    }
    if (!acc) outputEl.textContent = response.text();
    refreshDeviceStatus();
  } catch (e) {
    console.error(e);
    routeBadge.className = "badge neutral";
    routeBadge.textContent = "Request failed";
    timeBadge.textContent = "— ms";
    errorBox.textContent =
      `Something went wrong: ${e.message}\n\n` +
      (modeName === "ONLY_ON_DEVICE"
        ? "On-device only mode needs Chrome Desktop 139+, the Prompt API flag enabled, and the Gemini Nano model downloaded. Try the Hybrid mode to fall back to the cloud."
        : "Check that firebase-config.js holds your real project config and that your App Check debug token is registered in the Firebase console.");
  } finally {
    runBtn.disabled = false;
  }
});
