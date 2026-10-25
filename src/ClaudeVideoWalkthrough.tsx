import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  FastForward,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Code2,
  ShoppingBag,
  GitBranch,
  Terminal,
  Maximize2,
  Layers3,
  FlaskConical,
  Zap,
} from "lucide-react";

interface Scene {
  id: number;
  time: string;
  duration: number; // in seconds
  title: string;
  subtitle: string;
  narration: string;
  badge: string;
  category: "OVERVIEW" | "FAULT" | "TESTING" | "DIAGNOSTICS" | "PATCH" | "VERIFICATION";
  highlightTarget?: string;
  previewType: "hero" | "workflow" | "fault-inject" | "test-fail" | "diagnose" | "diff" | "recovery";
}

const scenes: Scene[] = [
  {
    id: 1,
    time: "0:00",
    duration: 10,
    title: "Introducing PatchPilot AI",
    subtitle: "Deterministic local debugging lab for modern software teams",
    narration:
      "Welcome to PatchPilot AI. In production systems, software bugs can be unpredictable and costly. PatchPilot AI provides a zero-dependency, local-first sandbox to break code, inspect deterministic test failures, generate targeted patches, and prove recovery with mathematical certainty.",
    badge: "System Architecture",
    category: "OVERVIEW",
    previewType: "hero",
  },
  {
    id: 2,
    time: "0:10",
    duration: 11,
    title: "5-Stage Progressive Workflow",
    subtitle: "From fault injection to verified recovery in five structured steps",
    narration:
      "At the heart of the platform is the 5-stage workflow pipeline: Inject bug, Run tests, Investigate root cause, Review patch, and Verify fix. Each stage advances sequentially, providing clear visibility into application state and regression barriers.",
    badge: "Core Pipeline",
    category: "OVERVIEW",
    previewType: "workflow",
  },
  {
    id: 3,
    time: "0:21",
    duration: 12,
    title: "Controlled Fault Injection",
    subtitle: "Simulating a critical percentage math error in calculateCartTotal()",
    narration:
      "Let's simulate a bug. We select Scenario 1: 'Incorrect cart total'. In calculateCartTotal, the discount calculation was written as a flat subtraction rather than scaling with the subtotal. The cart total immediately becomes corrupted from $86.40 to $95.90.",
    badge: "Scenario 01",
    category: "FAULT",
    previewType: "fault-inject",
  },
  {
    id: 4,
    time: "0:33",
    duration: 12,
    title: "Deterministic Test Suite",
    subtitle: "Sub-millisecond test runner capturing the assertion failure",
    narration:
      "Triggering the local test runner executes three regression assertions in less than one millisecond. The test 'cart total applies percentage discount' fails immediately with an exact mismatch: expected $86.40, received $95.90. The failure is completely reproducible.",
    badge: "Assertion Runner",
    category: "TESTING",
    previewType: "test-fail",
  },
  {
    id: 5,
    time: "0:45",
    duration: 12,
    title: "AI Rule-Based Diagnostics",
    subtitle: "Deep root-cause inspection and automated evidence generation",
    narration:
      "Clicking 'Investigate root cause' triggers our deterministic diagnostic engine. It pinpoints calculateCartTotal, classifies the severity as High, and explains that the subtotal is being offset by a flat 0.10 rather than a 10 percent discount of $9.60.",
    badge: "Root Cause Engine",
    category: "DIAGNOSTICS",
    previewType: "diagnose",
  },
  {
    id: 6,
    time: "0:57",
    duration: 13,
    title: "Unified Patch Review & Git Diff",
    subtitle: "Visual side-by-side diff with single-click hot patch approval",
    narration:
      "The Patch Review panel unlocks with an exact diff: removing the erroneous assignment and replacing it with 'const discount = subtotal * discountRate;'. Developers can inspect the rationale, reject if unsatisfactory, or approve the patch to stage the fix in memory.",
    badge: "Hot Patching",
    category: "PATCH",
    previewType: "diff",
  },
  {
    id: 7,
    time: "1:10",
    duration: 12,
    title: "Verification & Full Recovery",
    subtitle: "100% regression pass rate and live commerce cart restoration",
    narration:
      "Finally, clicking 'Verify Fix' reruns the entire regression suite against the patched runtime. All three assertions turn green, the Demo Commerce app recalculates to the exact expected total of $86.40, and the activity stream logs verified recovery.",
    badge: "System Restored",
    category: "VERIFICATION",
    previewType: "recovery",
  },
];

const TOTAL_DURATION = scenes.reduce((acc, s) => acc + s.duration, 0);

interface ClaudeVideoWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
  onJumpToScenario?: (scenarioId: string) => void;
}

export function ClaudeVideoWalkthrough({
  isOpen,
  onClose,
  onJumpToScenario,
}: ClaudeVideoWalkthroughProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0); // in seconds
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState<"video" | "script" | "code">("video");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  const currentScene = scenes[currentSceneIndex];

  // Helper to format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Timeline playback timer
  useEffect(() => {
    if (!isOpen || !isPlaying) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 0.1 * playbackSpeed;
        if (next >= TOTAL_DURATION) {
          setIsPlaying(false);
          return TOTAL_DURATION;
        }

        // Determine current scene based on cumulative time
        let accumulated = 0;
        for (let i = 0; i < scenes.length; i++) {
          accumulated += scenes[i].duration;
          if (next < accumulated) {
            if (currentSceneIndex !== i) {
              setCurrentSceneIndex(i);
            }
            break;
          }
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, isPlaying, playbackSpeed, currentSceneIndex]);

  // Voice narration using Web Speech API when enabled
  useEffect(() => {
    if (!isOpen) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    if (voiceEnabled && isPlaying && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentScene.narration);
      utterance.rate = 1.05 * playbackSpeed;
      utterance.pitch = 1.0;
      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } else if (!voiceEnabled && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, [currentSceneIndex, voiceEnabled, isPlaying, isOpen, playbackSpeed]);

  // Keyboard controls
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.code === "Space") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key === "ArrowRight") {
        skipScene(1);
      } else if (e.key === "ArrowLeft") {
        skipScene(-1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentSceneIndex]);

  if (!isOpen) return null;

  const seekToScene = (index: number) => {
    let targetTime = 0;
    for (let i = 0; i < index; i++) {
      targetTime += scenes[i].duration;
    }
    setCurrentTime(targetTime + 0.1);
    setCurrentSceneIndex(index);
    setIsPlaying(true);
  };

  const skipScene = (delta: number) => {
    const nextIdx = Math.max(0, Math.min(scenes.length - 1, currentSceneIndex + delta));
    seekToScene(nextIdx);
  };

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);

    let accumulated = 0;
    for (let i = 0; i < scenes.length; i++) {
      accumulated += scenes[i].duration;
      if (newTime <= accumulated) {
        setCurrentSceneIndex(i);
        break;
      }
    }
  };

  const toggleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIdx]);
  };

  return (
    <div className="claude-video-backdrop" onClick={onClose}>
      <div
        className={`claude-video-modal ${isFullscreen ? "is-fullscreen" : ""}`}
        onClick={(e) => e.stopPropagation()}
        ref={containerRef}
      >
        {/* Top Header Bar */}
        <div className="claude-video-header">
          <div className="claude-video-brand">
            <span className="claude-sparkle-icon">
              <Sparkles size={16} />
            </span>
            <span className="claude-title-text">
              <strong>PatchPilot AI</strong> · Claude Walkthrough Showcase
            </span>
            <span className="claude-tag-pill">4K HD Interactive Demo</span>
          </div>

          <div className="claude-header-actions">
            <div className="claude-tab-switcher">
              <button
                className={`claude-tab-btn ${activeTab === "video" ? "active" : ""}`}
                onClick={() => setActiveTab("video")}
              >
                <Play size={13} /> Interactive Video
              </button>
              <button
                className={`claude-tab-btn ${activeTab === "script" ? "active" : ""}`}
                onClick={() => setActiveTab("script")}
              >
                Narration Script
              </button>
              <button
                className={`claude-tab-btn ${activeTab === "code" ? "active" : ""}`}
                onClick={() => setActiveTab("code")}
              >
                <Code2 size={13} /> Remotion Code
              </button>
            </div>

            <button
              className="claude-icon-btn"
              title="Toggle Fullscreen"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              <Maximize2 size={16} />
            </button>

            <button className="claude-icon-btn close-btn" onClick={onClose} title="Close Showcase (Esc)">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {activeTab === "video" && (
          <div className="claude-video-viewport">
            {/* Live Visual Canvas Area */}
            <div className="claude-cinematic-stage">
              {/* Scene Badge & Chapter Overlay */}
              <div className="stage-overlay-top">
                <div className="chapter-pill">
                  <span className="pulse-indicator" />
                  SCENE {currentScene.id} OF {scenes.length} · {currentScene.badge}
                </div>
                <div className="stage-scene-title">
                  <h2>{currentScene.title}</h2>
                  <p>{currentScene.subtitle}</p>
                </div>
              </div>

              {/* Dynamic Animated Scene Viewport */}
              <div className="stage-dynamic-content">
                {currentScene.previewType === "hero" && (
                  <div className="scene-hero-view">
                    <div className="hero-glow-orb" />
                    <div className="hero-brand-card">
                      <div className="hero-icon-box">
                        <Layers3 size={44} className="hero-logo-svg" />
                      </div>
                      <h1 className="hero-headline">
                        Find the fault. <span>Prove the fix.</span>
                      </h1>
                      <p className="hero-desc">
                        A local, deterministic debugging laboratory built with React 18, TypeScript, and Vite.
                        Zero APIs, instant feedback, zero flaky tests.
                      </p>
                      <div className="hero-stats-row">
                        <div className="hero-stat">
                          <b>3</b>
                          <span>Fault Scenarios</span>
                        </div>
                        <div className="hero-stat-sep" />
                        <div className="hero-stat">
                          <b>&lt; 0.5 ms</b>
                          <span>Assertion Runner</span>
                        </div>
                        <div className="hero-stat-sep" />
                        <div className="hero-stat">
                          <b>100%</b>
                          <span>Deterministic</span>
                        </div>
                        <div className="hero-stat-sep" />
                        <div className="hero-stat">
                          <b>Local-First</b>
                          <span>Safe Sandbox</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentScene.previewType === "workflow" && (
                  <div className="scene-workflow-view">
                    <div className="workflow-diagram">
                      {[
                        { num: "01", name: "Inject bug", desc: "Corrupt deterministic runtime state", active: false },
                        { num: "02", name: "Run tests", desc: "Execute in-memory assertions in <1ms", active: false },
                        { num: "03", name: "Investigate", desc: "Automated AST & rule-based diagnosis", active: true },
                        { num: "04", name: "Review patch", desc: "Inspect side-by-side Git diff", active: false },
                        { num: "05", name: "Verify fix", desc: "Prove 100% regression test recovery", active: false },
                      ].map((step, idx) => (
                        <div
                          key={step.num}
                          className={`workflow-card-step ${step.active ? "highlight-step" : ""}`}
                        >
                          <div className="step-badge-num">{step.num}</div>
                          <h4>{step.name}</h4>
                          <p>{step.desc}</p>
                          {idx < 4 && <div className="step-arrow-flow">→</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentScene.previewType === "fault-inject" && (
                  <div className="scene-split-view">
                    <div className="stage-panel code-mock">
                      <div className="panel-tab-bar">
                        <Code2 size={14} /> calculateCartTotal.ts
                        <span className="fault-pill-badge">FAULT INJECTED</span>
                      </div>
                      <pre className="code-pre">
                        <code>
                          <span className="c-dim">1:</span> <span className="c-kw">function</span>{" "}
                          <span className="c-fn">calculateCartTotal</span>(subtotal, discountRate) &#123;{"\n"}
                          <span className="c-dim">2:</span>{" "}
                          <span className="c-line-err">
                            &nbsp;&nbsp;<span className="c-kw">const</span> discount = discountRate;{" "}
                            <span className="c-comment">// ⚠️ BUG: flat rate instead of percentage!</span>
                          </span>
                          {"\n"}
                          <span className="c-dim">3:</span> &nbsp;&nbsp;<span className="c-kw">return</span>{" "}
                          subtotal - discount;{"\n"}
                          <span className="c-dim">4:</span> &#125;
                        </code>
                      </pre>
                    </div>

                    <div className="stage-panel cart-mock">
                      <div className="panel-tab-bar">
                        <ShoppingBag size={14} /> Demo Commerce Cart
                        <span className="state-badge-corrupt">DEGRADED</span>
                      </div>
                      <div className="cart-calc-box">
                        <div className="calc-row">
                          <span>Subtotal (2 items)</span>
                          <b>$96.00</b>
                        </div>
                        <div className="calc-row discount-row">
                          <span>Discount (10% rate)</span>
                          <b className="err-strike">−$0.10 (Should be −$9.60)</b>
                        </div>
                        <div className="calc-divider" />
                        <div className="calc-row total-row">
                          <span>Total Due</span>
                          <b className="err-amount">$95.90</b>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentScene.previewType === "test-fail" && (
                  <div className="scene-terminal-view">
                    <div className="terminal-window">
                      <div className="terminal-header">
                        <Terminal size={14} />
                        <span>PatchPilot In-Memory Test Runner (Execution: 0.18ms)</span>
                        <span className="term-status-badge fail">1 FAILED / 2 PASSED</span>
                      </div>
                      <div className="terminal-body">
                        <div className="term-line success">
                          <CheckCircle2 size={14} /> PASS: promotion is applied exactly once (single discount guard)
                        </div>
                        <div className="term-line success">
                          <CheckCircle2 size={14} /> PASS: empty cart cannot proceed to checkout
                        </div>
                        <div className="term-line failure">
                          <AlertCircle size={14} /> FAIL: cart total applies percentage discount
                        </div>
                        <div className="term-diff-output">
                          <div className="diff-title">Assertion Mismatch in calculateCartTotal():</div>
                          <div className="diff-expected">Expected Total: <b>$86.40</b> (Subtotal $96.00 - $9.60)</div>
                          <div className="diff-actual">Received Total: <b>$95.90</b> (Subtotal $96.00 - $0.10)</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentScene.previewType === "diagnose" && (
                  <div className="scene-diagnostics-view">
                    <div className="diag-modal-card">
                      <div className="diag-top">
                        <div className="diag-icon-wrapper">
                          <Sparkles size={24} />
                        </div>
                        <div>
                          <h3>Root Cause Identified · High Severity</h3>
                          <p>Module: src/cart/calculateCartTotal.ts:line 2</p>
                        </div>
                      </div>
                      <div className="diag-body-text">
                        <p>
                          <strong>Diagnosis:</strong> The discount rate parameter (<code>0.10</code>) is being
                          directly subtracted as currency units instead of multiplying against the cart subtotal (
                          <code>$96.00 × 0.10 = $9.60</code>).
                        </p>
                      </div>
                      <div className="diag-comparison-table">
                        <div className="compare-col">
                          <span>EXPECTED CALCULATION</span>
                          <b>$86.40</b>
                          <small>96.00 - (96.00 * 0.10)</small>
                        </div>
                        <div className="compare-sep">vs</div>
                        <div className="compare-col error">
                          <span>ACTUAL RESULT</span>
                          <b>$95.90</b>
                          <small>96.00 - 0.10</small>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentScene.previewType === "diff" && (
                  <div className="scene-diff-view">
                    <div className="diff-container-box">
                      <div className="diff-header-bar">
                        <GitBranch size={15} />
                        <span>Patch Review: calculateCartTotal.ts</span>
                        <span className="diff-stat-tag">+1 line / −1 line</span>
                      </div>
                      <div className="diff-code-lines">
                        <div className="diff-line-item line-neutral">
                          <span className="ln">1</span> <span className="sign">&nbsp;</span>
                          <code>function calculateCartTotal(subtotal, discountRate) &#123;</code>
                        </div>
                        <div className="diff-line-item line-remove">
                          <span className="ln">2</span> <span className="sign">−</span>
                          <code>&nbsp;&nbsp;const discount = discountRate;</code>
                        </div>
                        <div className="diff-line-item line-add">
                          <span className="ln">2</span> <span className="sign">+</span>
                          <code>&nbsp;&nbsp;const discount = subtotal * discountRate;</code>
                        </div>
                        <div className="diff-line-item line-neutral">
                          <span className="ln">3</span> <span className="sign">&nbsp;</span>
                          <code>&nbsp;&nbsp;return subtotal - discount;</code>
                        </div>
                        <div className="diff-line-item line-neutral">
                          <span className="ln">4</span> <span className="sign">&nbsp;</span>
                          <code>&#125;</code>
                        </div>
                      </div>
                      <div className="diff-footer-action">
                        <span>Patch Ready for Staging</span>
                        <button className="approve-patch-btn">
                          <CheckCircle2 size={14} /> Approve &amp; Stage Patch
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {currentScene.previewType === "recovery" && (
                  <div className="scene-recovery-view">
                    <div className="recovery-success-badge">
                      <CheckCircle2 size={40} className="green-pulse-icon" />
                      <h2>System Fully Recovered</h2>
                      <p>All 3 regression assertions passed · Cart state verified healthy</p>
                    </div>
                    <div className="recovery-summary-cards">
                      <div className="rec-card">
                        <FlaskConical size={18} />
                        <div>
                          <b>3 of 3 Tests Passing</b>
                          <small>Regression barrier intact</small>
                        </div>
                      </div>
                      <div className="rec-card">
                        <ShoppingBag size={18} />
                        <div>
                          <b>Cart Total: $86.40</b>
                          <small>Accurate 10% discount applied</small>
                        </div>
                      </div>
                      <div className="rec-card">
                        <Zap size={18} />
                        <div>
                          <b>Zero Backend Needed</b>
                          <small>100% deterministic local runtime</small>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Subtitles / Narration Banner (Claude Style) */}
              <div className="stage-subtitles-bar">
                <div className="subtitles-avatar">AI</div>
                <div className="subtitles-text">
                  <p>{currentScene.narration}</p>
                </div>
              </div>
            </div>

            {/* Bottom Media Controller */}
            <div className="claude-video-controls">
              {/* Timeline Scrubber */}
              <div className="scrubber-wrapper">
                <input
                  type="range"
                  min={0}
                  max={TOTAL_DURATION}
                  step={0.1}
                  value={currentTime}
                  onChange={handleScrubberChange}
                  className="timeline-slider"
                />
                <div
                  className="timeline-progress-fill"
                  style={{ width: `${(currentTime / TOTAL_DURATION) * 100}%` }}
                />

                {/* Chapter Ticks */}
                <div className="timeline-chapter-markers">
                  {scenes.map((s, idx) => {
                    let acc = 0;
                    for (let i = 0; i < idx; i++) acc += scenes[i].duration;
                    const percent = (acc / TOTAL_DURATION) * 100;
                    return (
                      <div
                        key={s.id}
                        className={`chapter-tick ${idx === currentSceneIndex ? "active-tick" : ""}`}
                        style={{ left: `${percent}%` }}
                        onClick={() => seekToScene(idx)}
                        title={`Scene ${s.id}: ${s.title}`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Control Buttons */}
              <div className="controls-row">
                <div className="controls-left">
                  <button
                    className="ctrl-btn play-btn"
                    onClick={() => setIsPlaying(!isPlaying)}
                    title={isPlaying ? "Pause (Space)" : "Play (Space)"}
                  >
                    {isPlaying ? <Pause size={17} /> : <Play size={17} />}
                  </button>

                  <button
                    className="ctrl-btn"
                    onClick={() => skipScene(-1)}
                    title="Previous Scene (Left Arrow)"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <button
                    className="ctrl-btn"
                    onClick={() => skipScene(1)}
                    title="Next Scene (Right Arrow)"
                  >
                    <ChevronRight size={16} />
                  </button>

                  <button
                    className="ctrl-btn"
                    onClick={() => seekToScene(0)}
                    title="Restart from Beginning"
                  >
                    <RotateCcw size={14} />
                  </button>

                  <div className="time-display">
                    <span className="time-current">{formatTime(currentTime)}</span>
                    <span className="time-sep">/</span>
                    <span className="time-total">{formatTime(TOTAL_DURATION)}</span>
                  </div>
                </div>

                <div className="controls-center">
                  <div className="scene-chips-list">
                    {scenes.map((sc, i) => (
                      <button
                        key={sc.id}
                        className={`scene-chip-btn ${i === currentSceneIndex ? "chip-active" : ""}`}
                        onClick={() => seekToScene(i)}
                      >
                        {sc.id}. {sc.badge}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="controls-right">
                  <button
                    className={`ctrl-btn ${voiceEnabled ? "voice-active" : ""}`}
                    onClick={() => setVoiceEnabled(!voiceEnabled)}
                    title={voiceEnabled ? "Mute Voiceover" : "Enable AI Voice Narration"}
                  >
                    {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    <span className="voice-label">{voiceEnabled ? "Voice ON" : "Voice OFF"}</span>
                  </button>

                  <button className="ctrl-btn speed-btn" onClick={toggleSpeed} title="Playback Speed">
                    <FastForward size={14} />
                    <span>{playbackSpeed}x</span>
                  </button>

                  {onJumpToScenario && (
                    <button
                      className="try-live-btn"
                      onClick={() => {
                        onClose();
                        onJumpToScenario("cart-total");
                      }}
                      title="Jump straight into the interactive workspace"
                    >
                      Try Fault 01 Live →
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Script Tab */}
        {activeTab === "script" && (
          <div className="claude-tab-content script-view">
            <div className="tab-intro">
              <h3>Complete Video Narration &amp; Presentation Script</h3>
              <p>
                Use this word-for-word voiceover script for product demos, YouTube tutorials, and Claude-style
                developer walk-throughs.
              </p>
            </div>
            <div className="script-scenes-list">
              {scenes.map((sc) => (
                <div key={sc.id} className="script-scene-card">
                  <div className="script-scene-header">
                    <span className="scene-num-badge">SCENE {sc.id}</span>
                    <span className="scene-time-stamp">{sc.time}</span>
                    <h4>{sc.title}</h4>
                    <span className="scene-cat-badge">{sc.category}</span>
                  </div>
                  <div className="script-scene-body">
                    <p className="script-narration">"{sc.narration}"</p>
                    <div className="script-visual-cue">
                      <b>Visual Cue:</b> {sc.subtitle} — displays {sc.previewType} layout with animated UI markers.
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Remotion Code Tab */}
        {activeTab === "code" && (
          <div className="claude-tab-content code-view-tab">
            <div className="tab-intro">
              <h3>Remotion Video Component Code</h3>
              <p>
                This React code uses <strong>Remotion</strong> to programmatically render this exact 1080p 60fps MP4
                video with audio, keyframes, and animations.
              </p>
            </div>
            <div className="remotion-code-box">
              <pre className="code-pre">
                <code>{`// remotion/PatchPilotVideo.tsx
import { Composition, Sequence, interpolate, useCurrentFrame, spring } from 'remotion';

export const PatchPilotVideo = () => {
  return (
    <Composition
      id="PatchPilotWalkthrough"
      component={MainWalkthrough}
      durationInFrames={30 * 82} // 82 seconds @ 30fps
      fps={30}
      width={1920}
      height={1080}
    />
  );
};

const MainWalkthrough = () => {
  const frame = useCurrentFrame();

  return (
    <div style={{ flex: 1, backgroundColor: '#0a0b10', color: '#f1f2f8', fontFamily: 'Inter' }}>
      {/* Scene 1: Introduction (Frames 0 - 300) */}
      <Sequence from={0} durationInFrames={300}>
        <IntroScene frame={frame} />
      </Sequence>

      {/* Scene 2: 5-Stage Workflow Pipeline (Frames 300 - 630) */}
      <Sequence from={300} durationInFrames={330}>
        <WorkflowScene frame={frame - 300} />
      </Sequence>

      {/* Scene 3: Fault Injection (Frames 630 - 990) */}
      <Sequence from={630} durationInFrames={360}>
        <FaultInjectionScene frame={frame - 630} />
      </Sequence>

      {/* Scene 4: Test Assertion Failure (Frames 990 - 1350) */}
      <Sequence from={990} durationInFrames={360}>
        <TestExecutionScene frame={frame - 990} />
      </Sequence>

      {/* Scene 5: AI Rule Diagnosis (Frames 1350 - 1710) */}
      <Sequence from={1350} durationInFrames={360}>
        <DiagnosticsScene frame={frame - 1350} />
      </Sequence>

      {/* Scene 6: Git Diff Review (Frames 1710 - 2100) */}
      <Sequence from={1710} durationInFrames={390}>
        <PatchReviewScene frame={frame - 1710} />
      </Sequence>

      {/* Scene 7: Verification & Recovery (Frames 2100 - 2460) */}
      <Sequence from={2100} durationInFrames={360}>
        <RecoveryScene frame={frame - 2100} />
      </Sequence>
    </div>
  );
};`}</code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
