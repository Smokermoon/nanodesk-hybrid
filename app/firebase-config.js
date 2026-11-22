// ─────────────────────────────────────────────────────────────────────────────
// NanoDesk — Firebase project configuration
//
// TODO (project owner): replace the placeholder values below with the web app
// config from YOUR Firebase project:
//   Firebase console → Project settings → General → "Your apps" → Web app
//   → SDK setup and configuration → Config.
//
// A Firebase web config is a public project identifier (it is shipped to every
// browser that loads the app) — it is NOT a secret and is safe to commit.
// The Gemini API behind it is protected by Firebase App Check enforcement.
//
// NEVER put a service-account key, an App Check debug token, or a .env secret
// in this file or anywhere in this repository.
// ─────────────────────────────────────────────────────────────────────────────

export const firebaseConfig = {
  apiKey: "AIzaSyA1iyHcazBcmiEIRb79RO3uMLoXOXLBkyk",
  authDomain: "nanodesk-hybrid.firebaseapp.com",
  projectId: "nanodesk-hybrid",
  storageBucket: "nanodesk-hybrid.firebasestorage.app",
  messagingSenderId: "41504251981",
  appId: "1:41504251981:web:03210c1c0a6936f13a7c04",
};

// reCAPTCHA v3 site key for Firebase App Check (console → App Check → Apps →
// register the web app with reCAPTCHA v3). Leave empty while developing locally
// with the debug provider (see appCheckDebug below).
export const appCheckSiteKey = "";

// Local development / hackathon judging: when true, the app asks the App Check
// SDK for a debug token (printed in the browser console). Register that token
// once in the console: App Check → Apps → your web app → Manage debug tokens.
// Debug tokens are explicitly accepted for #BuildHybridAI submissions.
// Keep this FALSE for a public production deployment that uses reCAPTCHA.
export const appCheckDebug = true;
