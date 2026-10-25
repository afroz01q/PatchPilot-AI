# PatchPilot AI

PatchPilot AI is a local debugging lab built with React, TypeScript, and Vite. It demonstrates controlled bug injection, deterministic test assertions, rule-based diagnosis, patch review, and verification without a backend or API.

## Run locally

```sh
npm install
npm run dev
```

Use the scenario picker to select one of the three faults, then inject it, investigate the failing assertion, approve the scenario-specific patch, and verify the fix. The local test engine and demo cart behavior are implemented in `src/engine.ts`.

## Video Production & Walkthrough Systems

PatchPilot AI includes two complementary video systems:

### 1. In-Browser Claude Video Walkthrough
- Click **"Watch Claude Demo Video"** in the topbar.
- Features a Claude-style motion-designed presentation player.
- Natural voice narration using Web Speech synthesis.
- Interactive chapter scrubber (Overview, Fault, Testing, Diagnostics, Patch, Verification).
- Live code diff animations, speed toggles (1x, 1.25x, 1.5x), and captions.

### 2. Automated Video Studio (Real MP4 & SRT Export)
- Click **"Video Studio"** in the topbar or sidebar.
- Automatically launches headless Chrome/Edge via Playwright to explore the real site.
- Injects faults, runs tests, inspects diagnostics, applies patches, and verifies fixes live.
- Generates natural English narration per scene.
- Assembles high-definition MP4 video (`H.264 + AAC`) using FFmpeg with synchronized SRT subtitles.
- Downloadable MP4 and SRT files directly from the browser.

#### Quick Start (Frontend + Video Studio Backend):
Double-click `start-studio.bat` or run:

```sh
# Terminal 1: Frontend
npm run dev

# Terminal 2: Video Studio Backend
cd studio-server
node server.js
```

## Validate

```sh
npm run build
```
