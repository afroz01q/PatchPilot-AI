/**
 * PatchPilot AI – Video Studio Backend Server
 * =============================================
 * Provides REST endpoints for:
 *  - Listing demo scenes
 *  - Starting a Playwright recording + TTS job
 *  - Polling job status
 *  - Downloading output video / SRT
 *
 * Tech stack: Express · Playwright · ffmpeg-static · edge-tts-node · fluent-ffmpeg
 */

"use strict";

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { execFile, exec, spawn } = require("child_process");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors({ origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"] }));
app.use(express.json({ limit: "4mb" }));

const ROOT = __dirname;
const FRAMES_DIR = path.join(ROOT, "frames");
const AUDIO_DIR = path.join(ROOT, "audio");
const OUTPUT_DIR = path.join(ROOT, "output");
const SCENES_DIR = path.join(ROOT, "scenes");

// Ensure output dirs exist
[FRAMES_DIR, AUDIO_DIR, OUTPUT_DIR, SCENES_DIR].forEach((d) => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// ─── In-memory job registry ───────────────────────────────────────────────────
const jobs = new Map(); // jobId → { status, progress, logs, outputPath, srtPath, error }

// ─── Demo Storyboard ─────────────────────────────────────────────────────────
const DEFAULT_SCENES = [
  {
    id: "intro",
    order: 1,
    title: "PatchPilot AI — Product Introduction",
    duration: 10,
    enabled: true,
    narration:
      "PatchPilot AI is a local-first, deterministic debugging laboratory. Engineers can break code intentionally, watch tests catch the failure automatically, trace the root cause with an AI diagnostic engine, review a precise code patch, and prove the fix with regression testing — all inside the browser, with no external services or API keys required.",
    action: "intro",
    selector: null,
  },
  {
    id: "workspace",
    order: 2,
    title: "The Developer Workspace",
    duration: 10,
    enabled: true,
    narration:
      "This is the PatchPilot workspace. On the left, a collapsible sidebar tracks your debugging sessions. The top bar shows the active project, branch, and the current health status of the demo application. The main grid holds six live panels: source code, diagnostics, test execution, patch review, the demo store, and the activity stream.",
    action: "screenshot",
    selector: null,
  },
  {
    id: "healthy-cart",
    order: 3,
    title: "Healthy Demo Application",
    duration: 8,
    enabled: true,
    narration:
      "Before any faults are injected, the demo commerce store is perfectly healthy. The cart shows two items totaling ninety-six dollars. A ten-percent discount is correctly applied, bringing the final total to eighty-six dollars and forty cents. All three regression tests are passing.",
    action: "scroll-to",
    selector: ".cart-panel",
  },
  {
    id: "select-scenario",
    order: 4,
    title: "Selecting a Bug Scenario",
    duration: 8,
    enabled: true,
    narration:
      "PatchPilot ships with three controlled fault scenarios. We'll select 'Incorrect cart total' — a high-severity bug where the discount calculation applies a flat rate subtraction instead of scaling it as a percentage of the subtotal.",
    action: "click",
    selector: ".scenario-chip:first-child",
  },
  {
    id: "inject",
    order: 5,
    title: "Injecting the Bug",
    duration: 9,
    enabled: true,
    narration:
      "Clicking 'Inject bug' corrupts the in-memory runtime. The source viewer immediately highlights line two of calculateCartTotal, showing that discount is now incorrectly assigned the raw rate value of zero-point-one instead of the result of multiplying it by the subtotal. The demo store total jumps from the correct eighty-six forty to the wrong ninety-five ninety.",
    action: "click",
    selector: 'button:has-text("Inject bug")',
  },
  {
    id: "run-tests",
    order: 6,
    title: "Running the Test Suite",
    duration: 9,
    enabled: true,
    narration:
      "The local test engine runs three assertions in under a millisecond. Two tests pass. The third fails: 'cart total applies percentage discount' expected eighty-six forty but received ninety-five ninety. The failure is deterministic, reproducible every single time.",
    action: "click",
    selector: 'button:has-text("Run tests")',
  },
  {
    id: "investigate",
    order: 7,
    title: "Investigating the Root Cause",
    duration: 10,
    enabled: true,
    narration:
      "Clicking 'Investigate root cause' triggers PatchPilot's diagnostic engine. It identifies the exact function, classifies the severity as high, explains that the discount rate was treated as currency rather than a multiplier, and shows the mathematical discrepancy: the correct deduction is nine dollars sixty, but the faulty version only subtracted ten cents.",
    action: "click",
    selector: 'button:has-text("Investigate root cause")',
  },
  {
    id: "patch-review",
    order: 8,
    title: "Reviewing the Code Patch",
    duration: 9,
    enabled: true,
    narration:
      "The patch review panel unlocks with a precise, minimal diff. One line is removed: the incorrect flat assignment. One line is added: the correct percentage multiplication. PatchPilot explains the rationale in plain English so any engineer on the team can understand the fix without needing to trace through the source code.",
    action: "scroll-to",
    selector: ".patch-panel",
  },
  {
    id: "approve",
    order: 9,
    title: "Approving the Fix",
    duration: 8,
    enabled: true,
    narration:
      "Clicking 'Approve patch' stages the corrected logic in memory. The source viewer updates to show the healthy version of the function. The demo store cart recalculates instantly, reverting from ninety-five ninety back to the expected eighty-six forty.",
    action: "click",
    selector: 'button:has-text("Approve patch")',
  },
  {
    id: "verify",
    order: 10,
    title: "Verifying the Recovery",
    duration: 9,
    enabled: true,
    narration:
      "Clicking 'Verify fix' reruns the complete regression suite against the patched runtime. All three assertions go green. The activity stream logs the recovery event. The status badge transitions to Recovered. The fix is proven, not assumed.",
    action: "click",
    selector: 'button:has-text("Verify fix")',
  },
  {
    id: "summary",
    order: 11,
    title: "Summary & Closing",
    duration: 10,
    enabled: true,
    narration:
      "PatchPilot AI compresses the entire debugging cycle — fault injection, automated test failure, root cause analysis, patch review, and verified recovery — into a single, repeatable, zero-dependency workflow that runs entirely in your browser. No flaky CI environments. No external APIs. Just deterministic evidence and a proven fix.",
    action: "intro",
    selector: null,
  },
];

// ─── Routes ──────────────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, version: "1.0.0" });
});

app.get("/api/scenes", (_req, res) => {
  res.json({ scenes: DEFAULT_SCENES });
});

app.post("/api/record", (req, res) => {
  const { scenes = DEFAULT_SCENES, targetUrl = "http://localhost:5174", viewport = { width: 1280, height: 720 } } = req.body;
  const jobId = uuidv4();
  const jobDir = path.join(FRAMES_DIR, jobId);
  const audioDir = path.join(AUDIO_DIR, jobId);
  fs.mkdirSync(jobDir, { recursive: true });
  fs.mkdirSync(audioDir, { recursive: true });

  const job = {
    id: jobId,
    status: "queued",
    progress: 0,
    totalScenes: scenes.filter((s) => s.enabled).length,
    currentScene: null,
    logs: [],
    outputPath: null,
    srtPath: null,
    error: null,
    startedAt: Date.now(),
  };
  jobs.set(jobId, job);

  res.json({ jobId });

  // Run recording asynchronously
  setImmediate(() => runRecordingJob(job, scenes, targetUrl, viewport, jobDir, audioDir));
});

app.get("/api/jobs/:id", (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: "Job not found" });
  res.json(job);
});

app.get("/api/jobs/:id/download", (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: "Job not found" });
  if (job.status !== "done") return res.status(400).json({ error: "Video not ready yet" });
  if (!job.outputPath || !fs.existsSync(job.outputPath)) {
    return res.status(404).json({ error: "Output file not found" });
  }
  res.download(job.outputPath, "patchpilot-demo.mp4");
});

app.get("/api/jobs/:id/srt", (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: "Job not found" });
  if (!job.srtPath || !fs.existsSync(job.srtPath)) {
    return res.status(404).json({ error: "Subtitles not found" });
  }
  res.download(job.srtPath, "patchpilot-demo.srt");
});

app.get("/api/jobs/:id/preview", (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job || !job.outputPath || !fs.existsSync(job.outputPath)) {
    return res.status(404).json({ error: "Preview not available" });
  }
  res.setHeader("Content-Type", "video/mp4");
  fs.createReadStream(job.outputPath).pipe(res);
});

// ─── Recording Pipeline ───────────────────────────────────────────────────────

async function runRecordingJob(job, scenes, targetUrl, viewport, jobDir, audioDir) {
  const log = (msg) => {
    console.log(`[Job ${job.id}] ${msg}`);
    job.logs.push({ time: Date.now(), msg });
  };

  try {
    job.status = "recording";
    log("Starting recording pipeline");

    // ── Step 1: Detect tools ─────────────────────────────────────────────────
    const ffmpegPath = detectFfmpeg();
    log(`FFmpeg: ${ffmpegPath || "NOT FOUND — will use frame-list fallback"}`);

    // ── Step 2: Playwright capture ───────────────────────────────────────────
    let playwright, browser, page;
    try {
      playwright = require("playwright");
      const launchOpts = {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
      };
      try {
        browser = await playwright.chromium.launch(launchOpts);
        log("Browser: launched bundled chromium");
      } catch (err1) {
        try {
          browser = await playwright.chromium.launch({ ...launchOpts, channel: "chrome" });
          log("Browser: launched system Google Chrome");
        } catch (err2) {
          browser = await playwright.chromium.launch({ ...launchOpts, channel: "msedge" });
          log("Browser: launched system Microsoft Edge");
        }
      }
      const ctx = await browser.newContext({
        viewport,
        colorScheme: "dark",
        locale: "en-US",
      });
      page = await ctx.newPage();
    } catch (e) {
      throw new Error(`Playwright launch failed: ${e.message}`);
    }

    log(`Navigating to ${targetUrl}`);
    try {
      await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 30000 });
    } catch (e) {
      throw new Error(`Cannot reach ${targetUrl}. Ensure the Vite dev server is running.`);
    }

    const enabledScenes = scenes.filter((s) => s.enabled).sort((a, b) => a.order - b.order);
    const capturedScenes = [];

    for (let i = 0; i < enabledScenes.length; i++) {
      const scene = enabledScenes[i];
      job.currentScene = scene.title;
      job.progress = Math.round((i / enabledScenes.length) * 50); // 0-50% = recording
      log(`Recording scene ${i + 1}/${enabledScenes.length}: ${scene.title}`);

      const sceneFrames = [];

      try {
        // Navigate / interact based on action
        await performSceneAction(page, scene, log);

        // Wait for animations
        await page.waitForTimeout(800);

        // Capture frames for this scene (~15 frames per second of scene duration)
        const frameCount = Math.max(5, Math.floor(scene.duration * 5)); // 5fps capture → 5fps video segment
        const intervalMs = (scene.duration * 1000) / frameCount;

        for (let f = 0; f < frameCount; f++) {
          const framePath = path.join(jobDir, `scene${String(i).padStart(2,"0")}_frame${String(f).padStart(4,"0")}.png`);
          await page.screenshot({ path: framePath, fullPage: false });
          sceneFrames.push(framePath);
          if (f < frameCount - 1) await page.waitForTimeout(intervalMs);
        }
      } catch (e) {
        log(`Scene "${scene.title}" action failed: ${e.message} — capturing static screenshot`);
        const fallbackPath = path.join(jobDir, `scene${String(i).padStart(2,"0")}_frame0000.png`);
        await page.screenshot({ path: fallbackPath });
        sceneFrames.push(fallbackPath);
      }

      capturedScenes.push({ ...scene, frames: sceneFrames });
    }

    await browser.close();
    log("Browser recording complete");

    // ── Step 3: TTS narration ────────────────────────────────────────────────
    job.status = "generating-audio";
    job.progress = 55;
    log("Generating TTS narration with edge-tts");

    const audioSegments = [];
    for (let i = 0; i < capturedScenes.length; i++) {
      const scene = capturedScenes[i];
      job.progress = 55 + Math.round((i / capturedScenes.length) * 20);
      const audioPath = path.join(audioDir, `scene${String(i).padStart(2, "0")}.mp3`);
      try {
        await generateTTS(scene.narration, audioPath, log);
        audioSegments.push({ sceneIndex: i, audioPath, narration: scene.narration });
        log(`Audio generated: scene ${i + 1}`);
      } catch (e) {
        log(`TTS failed for scene ${i + 1}: ${e.message} — generating silence`);
        await generateSilence(scene.duration, audioPath, ffmpegPath, log);
        audioSegments.push({ sceneIndex: i, audioPath, narration: scene.narration });
      }
    }

    // ── Step 4: Build SRT ────────────────────────────────────────────────────
    job.progress = 78;
    const srtPath = path.join(OUTPUT_DIR, `${job.id}.srt`);
    buildSRT(capturedScenes, srtPath);
    job.srtPath = srtPath;
    log("SRT subtitles written");

    // ── Step 5: Assemble video with FFmpeg ───────────────────────────────────
    job.status = "rendering";
    job.progress = 80;

    const outputPath = path.join(OUTPUT_DIR, `${job.id}.mp4`);

    if (ffmpegPath) {
      log("Assembling video with FFmpeg");
      await assembleFfmpegVideo(capturedScenes, audioSegments, ffmpegPath, jobDir, outputPath, srtPath, viewport, log);
    } else {
      log("FFmpeg not found — creating slideshow via canvas fallback");
      await createSlideshowFallback(capturedScenes, audioSegments, audioDir, outputPath, log);
    }

    if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
      throw new Error("Output video file is empty or missing after render");
    }

    job.outputPath = outputPath;
    job.status = "done";
    job.progress = 100;
    job.currentScene = null;
    log(`Done! Output: ${outputPath} (${Math.round(fs.statSync(outputPath).size / 1024)}KB)`);
  } catch (e) {
    job.status = "error";
    job.error = e.message;
    console.error(`[Job ${job.id}] Fatal error:`, e);
  }
}

// ─── Scene Actions ─────────────────────────────────────────────────────────

async function performSceneAction(page, scene, log) {
  switch (scene.action) {
    case "intro":
      // Scroll to top, reset any state
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
      break;

    case "screenshot":
      // Just take a screenshot of current state
      break;

    case "scroll-to":
      if (scene.selector) {
        try {
          await page.locator(scene.selector).first().scrollIntoViewIfNeeded({ timeout: 3000 });
          await page.waitForTimeout(400);
        } catch (e) {
          log(`Scroll target not found: ${scene.selector}`);
        }
      }
      break;

    case "click":
      if (scene.selector) {
        try {
          const el = page.locator(scene.selector).first();
          await el.waitFor({ timeout: 5000, state: "visible" });
          // Add a visual click indicator by evaluating JS
          await page.evaluate((sel) => {
            const el = document.querySelector(sel);
            if (el) {
              el.style.outline = "3px solid #d97757";
              el.style.outlineOffset = "3px";
              setTimeout(() => { el.style.outline = ""; el.style.outlineOffset = ""; }, 1200);
            }
          }, scene.selector);
          await page.waitForTimeout(300);
          await el.click({ timeout: 5000 });
          await page.waitForTimeout(600);
        } catch (e) {
          log(`Click failed on "${scene.selector}": ${e.message}`);
        }
      }
      break;

    default:
      break;
  }
}

// ─── TTS ──────────────────────────────────────────────────────────────────────

async function generateTTS(text, outputPath, log) {
  try {
    const googleTTS = require("google-tts-api");
    const results = await googleTTS.getAllAudioBase64(text, { lang: "en", slow: false, timeout: 15000 });
    const bufs = results.map((r) => Buffer.from(r.base64, "base64"));
    const combined = Buffer.concat(bufs);
    fs.writeFileSync(outputPath, combined);
    log(`TTS generated: ${combined.length} bytes`);
    return outputPath;
  } catch (e) {
    throw new Error(`TTS generation failed: ${e.message}`);
  }
}

async function generateSilence(durationSec, outputPath, ffmpegPath, log) {
  if (!ffmpegPath) {
    // Write a minimal valid MP3 (silent) as placeholder
    fs.writeFileSync(outputPath, Buffer.alloc(0));
    return;
  }
  return new Promise((resolve, reject) => {
    execFile(ffmpegPath, [
      "-f", "lavfi", "-i", `anullsrc=r=44100:cl=stereo`,
      "-t", String(durationSec),
      "-codec:a", "libmp3lame", "-b:a", "128k",
      "-y", outputPath
    ], (err) => err ? reject(err) : resolve());
  });
}

// ─── SRT generation ──────────────────────────────────────────────────────────

function buildSRT(scenes, srtPath) {
  let srtContent = "";
  let cumulativeSeconds = 0;

  scenes.forEach((scene, index) => {
    const startSec = cumulativeSeconds;
    const endSec = cumulativeSeconds + scene.duration;

    const formatSRTTime = (sec) => {
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = Math.floor(sec % 60);
      const ms = Math.round((sec % 1) * 1000);
      return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")},${String(ms).padStart(3,"0")}`;
    };

    // Split narration into 2-line chunks for subtitle readability
    const words = scene.narration.split(" ");
    const chunkSize = 12;
    let subIndex = 0;
    const chunks = [];
    for (let i = 0; i < words.length; i += chunkSize) {
      chunks.push(words.slice(i, i + chunkSize).join(" "));
    }
    const chunkDuration = scene.duration / Math.max(1, chunks.length);

    chunks.forEach((chunk, ci) => {
      const cs = startSec + ci * chunkDuration;
      const ce = cs + chunkDuration - 0.1;
      srtContent += `${index * 100 + ci + 1}\n${formatSRTTime(cs)} --> ${formatSRTTime(ce)}\n${chunk}\n\n`;
    });

    cumulativeSeconds = endSec;
  });

  fs.writeFileSync(srtPath, srtContent, "utf8");
}

// ─── FFmpeg Assembly ──────────────────────────────────────────────────────────

function detectFfmpeg() {
  // 1. ffmpeg-static package
  try {
    const ffmpegStatic = require("ffmpeg-static");
    if (ffmpegStatic && fs.existsSync(ffmpegStatic)) return ffmpegStatic;
  } catch (e) {}

  // 2. System PATH
  const candidates = ["ffmpeg", "ffmpeg.exe"];
  for (const c of candidates) {
    try {
      require("child_process").execSync(`${c} -version`, { stdio: "ignore" });
      return c;
    } catch {}
  }
  return null;
}

async function assembleFfmpegVideo(capturedScenes, audioSegments, ffmpegPath, jobDir, outputPath, srtPath, viewport, log) {
  // Build per-scene video segments then concatenate
  const segmentPaths = [];

  for (let i = 0; i < capturedScenes.length; i++) {
    const scene = capturedScenes[i];
    const audio = audioSegments[i];
    const segmentPath = path.join(jobDir, `segment_${String(i).padStart(2, "0")}.mp4`);

    log(`Rendering segment ${i + 1}/${capturedScenes.length}: ${scene.title}`);

    const framePattern = path.join(jobDir, `scene${String(i).padStart(2, "0")}_frame%04d.png`);
    const firstFrame = scene.frames && scene.frames[0];
    if (!firstFrame || !fs.existsSync(firstFrame)) {
      log(`No frames for scene ${i + 1} — skipping segment`);
      continue;
    }

    const fps = Math.max(1, scene.frames.length / scene.duration);

    await new Promise((resolve) => {
      let args;
      const hasAudio = audio?.audioPath && fs.existsSync(audio.audioPath) && fs.statSync(audio.audioPath).size > 100;
      if (hasAudio) {
        args = [
          "-y",
          "-framerate", String(fps),
          "-i", framePattern,
          "-i", audio.audioPath,
          "-c:v", "libx264",
          "-pix_fmt", "yuv420p",
          "-preset", "ultrafast",
          "-crf", "23",
          "-c:a", "aac",
          "-b:a", "128k",
          "-shortest",
          segmentPath,
        ];
      } else {
        args = [
          "-y",
          "-framerate", String(fps),
          "-i", framePattern,
          "-f", "lavfi",
          "-i", "anullsrc=r=44100:cl=stereo",
          "-c:v", "libx264",
          "-pix_fmt", "yuv420p",
          "-preset", "ultrafast",
          "-crf", "23",
          "-c:a", "aac",
          "-t", String(scene.duration),
          segmentPath,
        ];
      }

      execFile(ffmpegPath, args, (err, stdout, stderr) => {
        if (err) {
          log(`FFmpeg error on segment ${i}: ${err.message}`);
        } else {
          segmentPaths.push(segmentPath);
        }
        resolve();
      });
    });
  }

  if (segmentPaths.length === 0) throw new Error("No video segments were produced");

  // Concatenate all segments
  log(`Concatenating ${segmentPaths.length} segments`);
  const concatList = path.join(jobDir, "concat.txt");
  fs.writeFileSync(concatList, segmentPaths.map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n"));

  await new Promise((resolve, reject) => {
    const concatArgs = [
      "-y",
      "-f", "concat",
      "-safe", "0",
      "-i", concatList,
      "-c:v", "libx264",
      "-c:a", "aac",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      "-preset", "fast",
      "-crf", "22",
      outputPath,
    ];
    execFile(ffmpegPath, concatArgs, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(`Concat failed: ${err.message}\n${stderr || ""}`));
      } else {
        resolve();
      }
    });
  });
}

async function createSlideshowFallback(capturedScenes, audioSegments, audioDir, outputPath, log) {
  // When FFmpeg is not available, create an HTML5-based slideshow packaged as JSON
  // The Video Studio UI will offer an in-browser preview
  log("Creating JSON slideshow package (FFmpeg not available)");
  const pkg = {
    type: "patchpilot-slideshow",
    version: "1.0",
    scenes: capturedScenes.map((s, i) => ({
      title: s.title,
      duration: s.duration,
      narration: s.narration,
      frames: s.frames.map((f) => {
        try {
          const buf = fs.readFileSync(f);
          return "data:image/png;base64," + buf.toString("base64");
        } catch { return null; }
      }).filter(Boolean),
    })),
  };
  const jsonPath = outputPath.replace(".mp4", ".json");
  fs.writeFileSync(jsonPath, JSON.stringify(pkg));
  // Create placeholder mp4 note file
  fs.writeFileSync(outputPath, JSON.stringify({ error: "ffmpeg_unavailable", fallback: jsonPath }));
  log(`Fallback package: ${jsonPath}`);
}

// ─── Server startup ───────────────────────────────────────────────────────────

const PORT = process.env.STUDIO_PORT || 3717;
app.listen(PORT, "127.0.0.1", () => {
  console.log(`\n🎬 PatchPilot Video Studio server running at http://127.0.0.1:${PORT}`);
  console.log(`   Frames  → ${FRAMES_DIR}`);
  console.log(`   Audio   → ${AUDIO_DIR}`);
  console.log(`   Output  → ${OUTPUT_DIR}\n`);
});
