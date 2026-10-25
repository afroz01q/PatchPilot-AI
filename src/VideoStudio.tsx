import { useState, useEffect, useRef } from "react";
import {
  Video,
  Play,
  Download,
  CheckCircle2,
  XCircle,
  Loader2,
  Settings,
  Film,
  Mic,
  List,
  ChevronUp,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Eye,
  FileText,
  AlertTriangle,
  Edit3,
  Clock,
  Activity,
  GripVertical,
  Check,
  X,
} from "lucide-react";

const STUDIO_API = "http://127.0.0.1:3717";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Scene {
  id: string;
  order: number;
  title: string;
  duration: number;
  enabled: boolean;
  narration: string;
  action: string;
  selector: string | null;
}

interface Job {
  id: string;
  status: "queued" | "recording" | "generating-audio" | "rendering" | "done" | "error";
  progress: number;
  totalScenes: number;
  currentScene: string | null;
  logs: Array<{ time: number; msg: string }>;
  outputPath: string | null;
  srtPath: string | null;
  error: string | null;
}

type StudioTab = "storyboard" | "narration" | "settings" | "export";

const STATUS_LABELS: Record<string, string> = {
  queued: "Queued",
  recording: "Recording browser",
  "generating-audio": "Generating voice-over",
  rendering: "Rendering video",
  done: "Complete",
  error: "Failed",
};

// ─── VideoStudioPanel ─────────────────────────────────────────────────────────

export function VideoStudioPanel({ onClose }: { onClose: () => void }) {
  const [serverOk, setServerOk] = useState<boolean | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [activeTab, setActiveTab] = useState<StudioTab>("storyboard");
  const [targetUrl, setTargetUrl] = useState("http://localhost:5174");
  const [viewport, setViewport] = useState({ width: 1280, height: 720 });
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [editingScene, setEditingScene] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logsRef = useRef<HTMLDivElement>(null);

  // ── Server health check ───────────────────────────────────────────────────
  useEffect(() => {
    checkServer();
  }, []);

  async function checkServer() {
    try {
      const res = await fetch(`${STUDIO_API}/api/health`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        setServerOk(true);
        loadScenes();
      } else {
        setServerOk(false);
      }
    } catch {
      setServerOk(false);
    }
  }

  async function loadScenes() {
    try {
      const res = await fetch(`${STUDIO_API}/api/scenes`);
      const data = await res.json();
      setScenes(data.scenes ?? []);
    } catch (e) {
      console.error("Failed to load scenes", e);
    }
  }

  // ── Polling ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!jobId) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${STUDIO_API}/api/jobs/${jobId}`);
        const data: Job = await res.json();
        setJob(data);
        if (data.status === "done" || data.status === "error") {
          clearInterval(pollRef.current!);
        }
      } catch {}
    }, 1200);
    return () => clearInterval(pollRef.current!);
  }, [jobId]);

  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [job?.logs?.length]);

  // ── Actions ───────────────────────────────────────────────────────────────
  async function startRecording() {
    if (!serverOk) return;
    try {
      const res = await fetch(`${STUDIO_API}/api/record`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenes, targetUrl, viewport }),
      });
      const data = await res.json();
      setJobId(data.jobId);
      setJob(null);
      setActiveTab("export");
    } catch (e) {
      alert("Failed to start recording. Is the studio server running?");
    }
  }

  function downloadVideo() {
    window.open(`${STUDIO_API}/api/jobs/${jobId}/download`, "_blank");
  }

  function downloadSRT() {
    window.open(`${STUDIO_API}/api/jobs/${jobId}/srt`, "_blank");
  }

  // ── Scene editing ─────────────────────────────────────────────────────────
  function toggleScene(id: string) {
    setScenes((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  }

  function moveScene(id: string, dir: -1 | 1) {
    setScenes((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx < 0) return prev;
      const swapIdx = idx + dir;
      if (swapIdx < 0 || swapIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next.map((s, i) => ({ ...s, order: i + 1 }));
    });
  }

  function startEdit(scene: Scene) {
    setEditingScene(scene.id);
    setEditingText(scene.narration);
  }

  function commitEdit(id: string) {
    setScenes((prev) => prev.map((s) => (s.id === id ? { ...s, narration: editingText } : s)));
    setEditingScene(null);
  }

  function cancelEdit() {
    setEditingScene(null);
    setEditingText("");
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const enabledScenes = scenes.filter((s) => s.enabled);
  const totalDuration = enabledScenes.reduce((acc, s) => acc + s.duration, 0);
  const totalWords = enabledScenes.reduce((acc, s) => acc + s.narration.split(" ").length, 0);
  const isRunning = job && job.status !== "done" && job.status !== "error";
  const isDone = job?.status === "done";
  const isError = job?.status === "error";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="vs-backdrop" onClick={onClose}>
      <div className="vs-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="vs-header">
          <div className="vs-header-brand">
            <div className="vs-brand-icon"><Film size={16} /></div>
            <div>
              <div className="vs-brand-title">PatchPilot AI · Video Studio</div>
              <div className="vs-brand-sub">Product demo recording & export pipeline</div>
            </div>
          </div>
          <div className="vs-header-right">
            {serverOk === true && (
              <span className="vs-server-pill ok"><span />Server connected</span>
            )}
            {serverOk === false && (
              <span className="vs-server-pill error"><span />Server offline</span>
            )}
            {serverOk === null && (
              <span className="vs-server-pill checking">
                <Loader2 size={10} className="spin" /> Connecting…
              </span>
            )}
            <button className="vs-close-btn" onClick={onClose}><X size={17} /></button>
          </div>
        </div>

        {/* Server offline notice */}
        {serverOk === false && (
          <div className="vs-offline-banner">
            <AlertTriangle size={15} />
            <div>
              <strong>Studio server is not running.</strong> Start it with:
              <code> cd studio-server &amp;&amp; npm install &amp;&amp; npm start</code>
            </div>
            <button className="vs-retry-btn" onClick={checkServer}><RefreshCw size={13} /> Retry</button>
          </div>
        )}

        {/* Body */}
        <div className="vs-body">
          {/* Left: Tabs */}
          <nav className="vs-nav">
            {(["storyboard", "narration", "settings", "export"] as StudioTab[]).map((tab) => (
              <button
                key={tab}
                className={`vs-nav-btn ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "storyboard" && <List size={14} />}
                {tab === "narration" && <Mic size={14} />}
                {tab === "settings" && <Settings size={14} />}
                {tab === "export" && <Video size={14} />}
                <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                {tab === "export" && isRunning && <span className="vs-tab-dot running" />}
                {tab === "export" && isDone && <span className="vs-tab-dot done" />}
              </button>
            ))}

            {/* Stats */}
            <div className="vs-nav-stats">
              <div className="vs-stat"><Clock size={11} /><span>{Math.floor(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, "0")}</span><small>Est. length</small></div>
              <div className="vs-stat"><Film size={11} /><span>{enabledScenes.length}</span><small>Scenes</small></div>
              <div className="vs-stat"><Mic size={11} /><span>~{totalWords}</span><small>Words</small></div>
            </div>

            {/* Record button */}
            <button
              className={`vs-record-btn ${isRunning ? "vs-record-running" : ""}`}
              onClick={startRecording}
              disabled={!serverOk || !!isRunning || enabledScenes.length === 0}
            >
              {isRunning ? <><Loader2 size={15} className="spin" /> Recording…</> : <><Play size={15} fill="currentColor" /> Record & Export</>}
            </button>
          </nav>

          {/* Right: Tab content */}
          <div className="vs-content">
            {/* ── Storyboard Tab ──────────────────────────────────────────── */}
            {activeTab === "storyboard" && (
              <div className="vs-tab-pane">
                <div className="vs-pane-header">
                  <h3>Scene Storyboard</h3>
                  <p>Reorder, enable, or disable scenes. The enabled scenes will be recorded in order.</p>
                </div>
                <div className="vs-scene-list">
                  {scenes.map((scene, idx) => (
                    <div key={scene.id} className={`vs-scene-card ${!scene.enabled ? "disabled" : ""}`}>
                      <div className="vs-scene-grip"><GripVertical size={14} /></div>
                      <div className="vs-scene-num">{String(idx + 1).padStart(2, "0")}</div>
                      <div className="vs-scene-body">
                        <div className="vs-scene-title-row">
                          <span className="vs-scene-title">{scene.title}</span>
                          <span className="vs-scene-dur">{scene.duration}s</span>
                          <span className={`vs-scene-action-badge action-${scene.action}`}>{scene.action}</span>
                        </div>
                        <p className="vs-scene-narration-preview">{scene.narration.substring(0, 100)}…</p>
                      </div>
                      <div className="vs-scene-actions">
                        <button className="vs-sact-btn" title="Move up" onClick={() => moveScene(scene.id, -1)} disabled={idx === 0}><ChevronUp size={12} /></button>
                        <button className="vs-sact-btn" title="Move down" onClick={() => moveScene(scene.id, 1)} disabled={idx === scenes.length - 1}><ChevronDown size={12} /></button>
                        <button
                          className={`vs-sact-btn toggle-btn ${scene.enabled ? "enabled" : ""}`}
                          title={scene.enabled ? "Disable scene" : "Enable scene"}
                          onClick={() => toggleScene(scene.id)}
                        >
                          {scene.enabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Narration Tab ───────────────────────────────────────────── */}
            {activeTab === "narration" && (
              <div className="vs-tab-pane">
                <div className="vs-pane-header">
                  <h3>Narration Script</h3>
                  <p>Edit each scene's narration. Changes apply to the next recording run.</p>
                </div>
                <div className="vs-narration-list">
                  {scenes.filter((s) => s.enabled).map((scene, idx) => (
                    <div key={scene.id} className="vs-narration-card">
                      <div className="vs-narr-header">
                        <span className="vs-narr-num">Scene {idx + 1}</span>
                        <span className="vs-narr-title">{scene.title}</span>
                        <span className="vs-narr-wc">{scene.narration.split(" ").length} words</span>
                        <button className="vs-edit-btn" onClick={() => startEdit(scene)}>
                          <Edit3 size={12} /> Edit
                        </button>
                      </div>
                      {editingScene === scene.id ? (
                        <div className="vs-narr-edit">
                          <textarea
                            className="vs-narr-textarea"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            rows={5}
                            autoFocus
                          />
                          <div className="vs-narr-edit-btns">
                            <button className="vs-save-btn" onClick={() => commitEdit(scene.id)}><Check size={13} /> Save</button>
                            <button className="vs-cancel-btn" onClick={cancelEdit}><X size={13} /> Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <p className="vs-narr-text">{scene.narration}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Settings Tab ────────────────────────────────────────────── */}
            {activeTab === "settings" && (
              <div className="vs-tab-pane">
                <div className="vs-pane-header">
                  <h3>Recording Settings</h3>
                  <p>Configure the browser target, viewport, and voice settings.</p>
                </div>
                <div className="vs-settings-grid">
                  <div className="vs-setting-group">
                    <label className="vs-label">Target URL</label>
                    <input
                      className="vs-input"
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      placeholder="http://localhost:5174"
                    />
                    <p className="vs-hint">The Vite dev server URL for PatchPilot AI.</p>
                  </div>
                  <div className="vs-setting-group">
                    <label className="vs-label">Viewport Resolution</label>
                    <div className="vs-viewport-row">
                      <input
                        className="vs-input vs-input-sm"
                        type="number"
                        value={viewport.width}
                        onChange={(e) => setViewport((v) => ({ ...v, width: Number(e.target.value) }))}
                        min={640}
                        max={2560}
                      />
                      <span className="vs-x">×</span>
                      <input
                        className="vs-input vs-input-sm"
                        type="number"
                        value={viewport.height}
                        onChange={(e) => setViewport((v) => ({ ...v, height: Number(e.target.value) }))}
                        min={480}
                        max={1440}
                      />
                    </div>
                  </div>
                  <div className="vs-setting-group">
                    <label className="vs-label">TTS Voice Engine</label>
                    <div className="vs-voice-badge">
                      <Mic size={14} /> Microsoft Edge TTS · <strong>en-US-GuyNeural</strong>
                      <span className="vs-voice-status ok">Free · No API key required</span>
                    </div>
                    <p className="vs-hint">Natural, human-paced narration via the Edge TTS network service. No API key is needed.</p>
                  </div>
                  <div className="vs-setting-group">
                    <label className="vs-label">Video Codec</label>
                    <div className="vs-codec-info">
                      <span className="vs-codec-badge">H.264 / AAC · MP4</span>
                      <span className="vs-codec-badge">30fps</span>
                      <span className="vs-codec-badge">{viewport.width}×{viewport.height}</span>
                    </div>
                    <p className="vs-hint">Assembled by FFmpeg (via ffmpeg-static). Subtitles burned in and also exported as .srt.</p>
                  </div>
                  <div className="vs-setting-group full">
                    <label className="vs-label">Studio Server</label>
                    <div className="vs-server-info">
                      <code>cd studio-server &amp;&amp; npm install &amp;&amp; npm start</code>
                      <span className={`vs-server-status ${serverOk ? "ok" : "error"}`}>
                        {serverOk ? <><CheckCircle2 size={12} /> Connected</> : <><XCircle size={12} /> Offline</>}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Export Tab ──────────────────────────────────────────────── */}
            {activeTab === "export" && (
              <div className="vs-tab-pane">
                <div className="vs-pane-header">
                  <h3>Export & Download</h3>
                  <p>Monitor recording progress, preview, and download your finished video.</p>
                </div>

                {!job && !jobId && (
                  <div className="vs-export-idle">
                    <Film size={40} />
                    <h4>No recording in progress</h4>
                    <p>Click <strong>Record & Export</strong> to start the pipeline.</p>
                    <button className="vs-record-btn" onClick={startRecording} disabled={!serverOk || enabledScenes.length === 0}>
                      <Play size={15} fill="currentColor" /> Start Recording
                    </button>
                  </div>
                )}

                {(isRunning || isError || isDone) && job && (
                  <div className="vs-export-status">
                    {/* Progress bar */}
                    <div className="vs-progress-wrap">
                      <div className="vs-progress-header">
                        <span className={`vs-status-label status-${job.status}`}>
                          {isRunning && <Loader2 size={12} className="spin" />}
                          {isDone && <CheckCircle2 size={12} />}
                          {isError && <XCircle size={12} />}
                          {STATUS_LABELS[job.status] || job.status}
                        </span>
                        <span className="vs-progress-pct">{job.progress}%</span>
                      </div>
                      <div className="vs-progress-track">
                        <div
                          className={`vs-progress-fill ${isDone ? "fill-done" : isError ? "fill-error" : "fill-active"}`}
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                      {job.currentScene && (
                        <div className="vs-current-scene">
                          <Activity size={11} /> {job.currentScene}
                        </div>
                      )}
                    </div>

                    {/* Scene checklist */}
                    {job.totalScenes > 0 && (
                      <div className="vs-scene-checklist">
                        {enabledScenes.map((s, i) => {
                          const sceneProgress = (job.progress / 100) * job.totalScenes;
                          const done = i < Math.floor(sceneProgress);
                          const current = i === Math.floor(sceneProgress) && isRunning;
                          return (
                            <div key={s.id} className={`vs-check-row ${done ? "done" : current ? "current" : ""}`}>
                              {done ? <CheckCircle2 size={12} /> : current ? <Loader2 size={12} className="spin" /> : <div className="vs-check-empty" />}
                              <span>{s.title}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Error message */}
                    {isError && (
                      <div className="vs-error-box">
                        <XCircle size={16} />
                        <div>
                          <strong>Recording failed</strong>
                          <p>{job.error}</p>
                        </div>
                      </div>
                    )}

                    {/* Success downloads */}
                    {isDone && (
                      <div className="vs-download-box">
                        <CheckCircle2 size={28} className="vs-done-icon" />
                        <h4>Video ready!</h4>
                        <p>Your PatchPilot AI product demo has been rendered successfully.</p>
                        <div className="vs-download-btns">
                          <button className="vs-dl-btn primary" onClick={downloadVideo}>
                            <Download size={15} /> Download MP4
                          </button>
                          <button className="vs-dl-btn secondary" onClick={downloadSRT}>
                            <FileText size={15} /> Download .SRT
                          </button>
                          <button className="vs-dl-btn secondary" onClick={() => setPreviewOpen(true)}>
                            <Eye size={15} /> Preview
                          </button>
                        </div>
                        <button
                          className="vs-rerecord-btn"
                          onClick={() => { setJobId(null); setJob(null); }}
                        >
                          <RefreshCw size={13} /> Regenerate
                        </button>
                      </div>
                    )}

                    {/* Live logs */}
                    <div className="vs-logs-section">
                      <div className="vs-logs-header"><Activity size={12} /> Pipeline Log</div>
                      <div className="vs-logs" ref={logsRef}>
                        {(job.logs || []).map((entry, i) => (
                          <div key={i} className="vs-log-line">
                            <span className="vs-log-time">{new Date(entry.time).toLocaleTimeString()}</span>
                            {entry.msg}
                          </div>
                        ))}
                        {isRunning && <div className="vs-log-line blinking">▌ Running…</div>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video preview modal */}
      {previewOpen && isDone && job && (
        <div className="vs-preview-backdrop" onClick={() => setPreviewOpen(false)}>
          <div className="vs-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="vs-preview-header">
              <span>Preview · patchpilot-demo.mp4</span>
              <button onClick={() => setPreviewOpen(false)}><X size={16} /></button>
            </div>
            <video
              className="vs-preview-video"
              controls
              autoPlay
              src={`${STUDIO_API}/api/jobs/${jobId}/preview`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
