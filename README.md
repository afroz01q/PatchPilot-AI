# PatchPilot AI

PatchPilot AI is a local debugging lab built with React, TypeScript, and Vite. It demonstrates controlled bug injection, deterministic test assertions, rule-based diagnosis, patch review, and verification without a backend or API.

## Run locally

```sh
npm install
npm run dev
```

Use the scenario picker to select one of the three faults, then inject it, investigate the failing assertion, approve the scenario-specific patch, and verify the fix. The local test engine and demo cart behavior are implemented in `src/engine.ts`.

## Validate

```sh
npm run build
```
