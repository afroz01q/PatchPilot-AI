import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Beaker,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock3,
  Code2,
  Command,
  FlaskConical,
  GitBranch,
  History,
  Layers3,
  PanelLeftClose,
  Play,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Terminal,
  X,
  Zap,
  Film,
} from "lucide-react";
import { ClaudeVideoWalkthrough } from "./ClaudeVideoWalkthrough";
import { VideoStudioPanel } from "./VideoStudio";
import {
  diagnose,
  evaluateCart,
  products,
  runLocalTests,
  scenarios,
  type Scenario,
  type ScenarioId,
  type TestRun,
} from "./engine";

type ActivityEntry = { id: number; title: string; detail: string; time: string; tone: string };

const stageNames = ["Inject bug", "Run tests", "Investigate", "Review patch", "Verify fix"];

function formatMoney(amount: number) {
  return `$${amount.toFixed(2)}`;
}

function App() {
  const [scenarioId, setScenarioId] = useState<ScenarioId | null>(null);
  const [injected, setInjected] = useState(false);
  const [diagnosed, setDiagnosed] = useState(false);
  const [approved, setApproved] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [run, setRun] = useState<TestRun>(() => runLocalTests(null, true));
  const [verified, setVerified] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(true);
  const [activity, setActivity] = useState<ActivityEntry[]>([
    { id: 1, title: "Workspace ready", detail: "Demo Commerce App · local simulation", time: "now", tone: "neutral" },
  ]);
  const [notice, setNotice] = useState("");
  const [navItem, setNavItem] = useState("Workspace");
  const [isVideoTourOpen, setIsVideoTourOpen] = useState(false);
  const [isStudioOpen, setIsStudioOpen] = useState(false);

  const scenario = scenarioId ? scenarios.find((item) => item.id === scenarioId) ?? null : null;
  const patchApplied = approved;
  const fixed = approved && verified && run.success;
  const cart = evaluateCart(scenarioId, !injected || patchApplied);
  const activeStage = !injected ? 0 : !diagnosed ? 2 : !approved ? 3 : !verified ? 4 : 5;
  const testRun = run ?? runLocalTests(null, true);

  const events = useMemo(() => activity.slice(0, 6), [activity]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n") {
        event.preventDefault();
        newSession();
      } else if (event.key.toLowerCase() === "r" && !event.metaKey && !event.ctrlKey && !event.altKey) {
        const target = event.target as HTMLElement | null;
        if (target?.tagName !== "INPUT" && target?.tagName !== "TEXTAREA" && !target?.isContentEditable) runTests();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  function addEvent(title: string, detail: string, tone = "neutral") {
    setActivity((current) => [
      { id: Date.now() + Math.random(), title, detail, time: "just now", tone },
      ...current,
    ]);
  }

  function notify(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2400);
  }

  function executeTests(fault: ScenarioId | null, isFixed: boolean, reason: string) {
    const results = runLocalTests(fault, isFixed);
    setRun(results);
    setVerified(isFixed && results.success);
    setSelectedTest(results.results.find((test) => test.status === "failed")?.id ?? null);
    addEvent(
      results.success ? "Test suite passed" : "Assertion failed",
      `${reason} · ${results.passed} passed, ${results.failed} failed`,
      results.success ? "success" : "failure",
    );
    return results;
  }

  function selectScenario(id: ScenarioId) {
    setScenarioId(id);
    setInjected(false);
    setDiagnosed(false);
    setApproved(false);
    setRejected(false);
    setVerified(false);
    setDetailsOpen(false);
    setRun(runLocalTests(null, true));
    setSelectedTest(null);
  }

  function injectBug() {
    if (!scenarioId) {
      selectScenario("cart-total");
      setScenarioId("cart-total");
    }
    const chosen = scenarioId ?? "cart-total";
    setInjected(true);
    setDiagnosed(false);
    setApproved(false);
    setRejected(false);
    setVerified(false);
    const result = runLocalTests(chosen, false);
    setRun(result);
    setSelectedTest(result.results.find((test) => test.status === "failed")?.id ?? null);
    addEvent("Fault injected", `${diagnose(chosen).label} · deterministic local scenario`, "failure");
    addEvent("Assertion failed", `${result.passed} passed, ${result.failed} failed`, "failure");
  }

  function runTests() {
    if (!injected) {
      const result = executeTests(null, true, "Healthy baseline");
      notify(result.success ? "Baseline suite passed" : "Baseline verification failed");
      return;
    }
    const result = executeTests(scenarioId, approved, approved ? "Approved patch check" : "Fault reproduction");
    setVerified(false);
    notify(result.failed ? `${result.failed} failing assertion reproduced` : "No failures detected");
  }

  function investigate() {
    if (!injected || !scenarioId) return;
    const finding = diagnose(scenarioId);
    setDiagnosed(true);
    setDetailsOpen(true);
    setSelectedTest(testRun.results.find((test) => test.status === "failed")?.id ?? null);
    addEvent("Root cause identified", `${finding.functionName} · ${finding.severity} severity`, "diagnostic");
    notify("Deterministic diagnosis complete");
  }

  function approvePatch() {
    if (!diagnosed || !scenario) return;
    setApproved(true);
    setRejected(false);
    setVerified(false);
    addEvent("Patch approved", `${scenario.functionName} · ready for verification`, "diagnostic");
    notify("Patch approved — run verification to confirm recovery");
  }

  function rejectPatch() {
    if (!scenario) return;
    setApproved(false);
    setRejected(true);
    setVerified(false);
    addEvent("Patch rejected", "Fault remains active · no code changed", "failure");
    notify("Patch rejected — application remains in the failing state");
  }

  function verifyFix() {
    if (!approved || !scenarioId) return;
    const result = executeTests(scenarioId, true, "Approved patch verification");
    setVerified(result.success);
    if (result.success) {
      addEvent("Recovery verified", "All regression checks passed", "success");
      notify("Recovery verified — all regression checks passed");
    } else {
      addEvent("Verification failed", "Patch needs another review", "failure");
      notify("Verification failed — return to patch review");
    }
  }

  function resetScenario() {
    setInjected(false);
    setDiagnosed(false);
    setApproved(false);
    setRejected(false);
    setVerified(false);
    setDetailsOpen(false);
    setRun(runLocalTests(null, true));
    setSelectedTest(null);
    addEvent("Scenario reset", "Demo Commerce App restored to healthy baseline", "neutral");
    notify("Scenario reset to healthy");
  }

  function newSession() {
    setScenarioId(null);
    setInjected(false);
    setDiagnosed(false);
    setApproved(false);
    setRejected(false);
    setVerified(false);
    setRun(runLocalTests(null, true));
    setSelectedTest(null);
    setActivity([{ id: Date.now(), title: "New session started", detail: "Healthy baseline loaded", time: "now", tone: "neutral" }]);
    setNavItem("Workspace");
    notify("Fresh debugging session started");
  }

  const codeScenario: Scenario | null = scenario;
  const shownCode = codeScenario
    ? injected && !patchApplied
      ? codeScenario.faultyCode
      : codeScenario.healthyCode
    : [
        "function calculateCartTotal(subtotal, discountRate) {",
        "  const discount = subtotal * discountRate;",
        "  return subtotal - discount;",
        "}",
      ];
  const codeHighlight = injected && !patchApplied ? 1 : -1;
  const codeLines = shownCode;
  const severity = scenario?.severity ?? "—";

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Layers3 size={17} strokeWidth={2.4} /></div>
          <span>patchpilot<span className="brand-ai">.ai</span></span>
          <button className="icon-button sidebar-collapse" aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={() => setSidebarCollapsed(!sidebarCollapsed)}><PanelLeftClose size={16} /></button>
        </div>
        <button className="new-session" onClick={newSession}><Plus size={15} /> New session <span>⌘ N</span></button>
        <div className="side-section">
          <div className="side-label">WORKSPACE</div>
          <button className={`side-link ${navItem === "Workspace" ? "active" : ""}`} onClick={() => setNavItem("Workspace")}><Code2 size={16} /> Workspace</button>
          <button className={`side-link ${navItem === "Scenarios" ? "active" : ""}`} onClick={() => { setNavItem("Scenarios"); document.getElementById("scenario-picker")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}><Beaker size={16} /> Bug scenarios <span className="nav-count">3</span></button>
          <button className={`side-link ${navItem === "Test runs" ? "active" : ""}`} onClick={() => { setNavItem("Test runs"); document.getElementById("tests-panel")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}><FlaskConical size={16} /> Test runs</button>
          <button className="side-link claude-tour-side-btn" onClick={() => setIsVideoTourOpen(true)}><Film size={16} /> Claude Video Tour <span className="nav-count video-pill">NEW</span></button>
          <button className="side-link" style={{ marginTop: 4, color: '#4bd5a2' }} onClick={() => setIsStudioOpen(true)} id="open-video-studio">🎬 Video Studio <span className="nav-count" style={{ color: '#4bd5a2', borderColor: 'rgba(75,213,162,.4)', background: 'rgba(75,213,162,.08)' }}>PROD</span></button>
        </div>
        <div className="side-section history-section">
          <div className="side-label">RECENT SESSIONS <button aria-label={historyExpanded ? "Collapse recent sessions" : "Expand recent sessions"} onClick={() => setHistoryExpanded(!historyExpanded)}><ChevronDown size={13} /></button></div>
          {historyExpanded && <>
            <button className="history-item active" onClick={() => selectScenario("cart-total")}><span className="history-dot" />cart-total-regression <span className="history-time">now</span></button>
            <button className="history-item" onClick={() => selectScenario("double-discount")}><span className="history-dot muted" />promo-calculation <span className="history-time">2h</span></button>
            <button className="history-item" onClick={() => selectScenario("empty-checkout")}><span className="history-dot muted" />checkout-guard <span className="history-time">1d</span></button>
          </>}
        </div>
        <div className="sidebar-bottom">
          <div className="local-status"><span className="pulse-dot" /><div><b>Local simulation</b><small>No API connection</small></div><span className="local-indicator">ON</span></div>
          <button className="side-link" onClick={() => notify("Settings are local to this demo")}><div className="avatar">IR</div> Settings <ArrowUpRight size={13} className="settings-arrow" /></button>
        </div>
      </aside>

      <main className="main-shell">
        <header className="topbar">
          <div className="project-crumb"><div className="project-icon"><ShoppingBag size={15} /></div><strong>Demo Commerce App</strong><ChevronRight size={14} className="crumb-chevron" /><span className="branch"><GitBranch size={13} /> demo/fault-injection</span></div>
          <div className="top-actions">
            <button className="watch-demo-button" onClick={() => setIsVideoTourOpen(true)}>
              <Play size={12} fill="currentColor" /> Watch Claude Demo Video
            </button>
            <button className="vs-open-btn" onClick={() => setIsStudioOpen(true)} id="video-studio-btn">
              <Film size={13} /> Video Studio
            </button>
            <span className={`session-status ${fixed ? "status-healthy" : injected && !patchApplied ? "status-failing" : "status-ready"}`}><span />{fixed ? "Recovered" : patchApplied ? "Patch pending" : injected ? "Failing" : "Healthy"}</span>
            <span className="env-badge"><span /> TEST ENV</span>
            <button className="command-hint" onClick={() => notify("Keyboard shortcuts: ⌘N new session · R run tests")}><Command size={13} /><span>K</span></button>
            <button className="avatar top-avatar" aria-label="Profile" onClick={() => notify("Local demo profile")}>IR</button>
          </div>
        </header>

        <div className="workspace">
          <div className="workspace-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /> DEBUGGING LAB <span className="eyebrow-divider">/</span> SESSION 04</div>
              <h1>Find the fault. <span>Prove the fix.</span></h1>
              <p className="subtitle">Break it. Find it. Fix it. Prove it. · A deterministic debugging sandbox.</p>
            </div>
            <div className="heading-actions">
              <button className="button button-quiet" onClick={resetScenario} disabled={!injected}><RotateCcw size={14} /> Reset</button>
              <button className="button button-primary" onClick={injectBug} disabled={injected && !fixed}><Zap size={14} /> Inject bug</button>
            </div>
          </div>

          <section className="workflow" aria-label="Debugging workflow">
            <div className="workflow-title"><span className="workflow-kicker">WORKFLOW</span><span className="workflow-status">{fixed ? "COMPLETE" : injected ? `${activeStage} OF 5` : "READY"}</span></div>
            <div className="workflow-track">
              {stageNames.map((label, index) => {
                const done = fixed || index < activeStage;
                const current = !fixed && index === activeStage;
                return <div className={`workflow-step ${done ? "done" : ""} ${current ? "current" : ""}`} key={label}>
                  <div className="step-marker">{done ? <Check size={12} /> : <span>{String(index + 1).padStart(2, "0")}</span>}</div>
                  <span>{label}</span>
                  {index < stageNames.length - 1 && <div className={`step-connector ${done ? "complete" : ""}`} />}
                </div>;
              })}
            </div>
          </section>

          <section className="scenario-strip" id="scenario-picker">
            <div className="scenario-title"><span className="scenario-icon"><Beaker size={14} /></span><span><b>Choose a fault</b><small>Controlled, reproducible scenarios</small></span></div>
            <div className="scenario-options">
              {scenarios.map((item, index) => (
                <button key={item.id} onClick={() => selectScenario(item.id)} className={`scenario-chip ${scenarioId === item.id ? "selected" : ""}`}>
                  <span className="scenario-number">0{index + 1}</span>{item.label}
                  {scenarioId === item.id && <span className="chip-check"><Check size={10} /></span>}
                </button>
              ))}
            </div>
            {scenario && injected && <span className={patchApplied ? "fault-active patch-pending" : "fault-active"}><span /> {patchApplied ? fixed ? "VERIFIED" : "PATCH APPLIED" : "FAULT ACTIVE"}</span>}
          </section>

          <div className="workspace-grid">
            <section className="panel editor-panel">
              <div className="panel-header">
                <div className="panel-heading"><Code2 size={15} /><b>Source</b><span className="panel-tag">READ ONLY</span></div>
                <div className="panel-tools"><span className="file-path">src/cart/{scenario?.functionName ?? "cart"}.ts</span><button className="icon-button" aria-label="Code panel options" onClick={() => notify("Source viewer is read-only")}><ChevronDown size={14} /></button></div>
              </div>
              <div className="code-toolbar"><div className="file-tab"><span className="ts-icon">TS</span>{scenario?.functionName ?? "cart"}<span className="tab-dot" /></div><span className="code-branch"><GitBranch size={12} /> demo/fault-injection</span></div>
              <div className="code-view" role="region" aria-label="Source code">
                {codeLines.map((line, index) => (
                  <div key={`${index}-${line}`} className={`code-line ${index === codeHighlight ? "highlight-fault" : ""}`}>
                    <span className="line-number">{String(index + 1).padStart(2, "0")}</span>
                    <code>{highlightCode(line)}</code>
                    {index === codeHighlight && <span className="line-note"><AlertCircle size={12} /> fault</span>}
                  </div>
                ))}
              </div>
              <div className={`editor-footnote ${injected && !patchApplied ? "fault-footnote" : ""}`}>
                {injected && !patchApplied ? <><AlertTriangle size={13} /><span>Fault injected in <b>{scenario?.functionName}</b></span><span className="footnote-ml">line {codeHighlight + 1}</span></> : patchApplied && !fixed ? <><Clock3 size={13} /><span>Patch applied <b>awaiting verification</b></span><span className="footnote-ml">pending</span></> : <><CheckCircle2 size={13} /><span>Source baseline <b>healthy</b></span><span className="footnote-ml">4 lines</span></>}
              </div>
            </section>

            <section className="panel diagnostics-panel">
              <div className="panel-header">
                <div className="panel-heading"><Activity size={15} /><b>Diagnostics</b></div>
                {scenario && <span className={`severity severity-${severity.toLowerCase()}`}>{severity}</span>}
              </div>
              {!injected ? (
                <div className="diagnostic-empty">
                  <div className="empty-icon"><ShieldCheck size={20} /></div><b>Nothing to investigate</b>
                  <p>Inject a controlled fault to see test evidence and root-cause analysis here.</p>
                  <button className="text-action" onClick={injectBug}>Inject a scenario <ArrowRight size={13} /></button>
                </div>
              ) : (
                <div className="diagnostic-content">
                  <div className={`diagnostic-alert ${patchApplied ? fixed ? "alert-success" : "alert-patched" : ""}`}>
                    {fixed ? <CheckCircle2 size={15} /> : patchApplied ? <Clock3 size={15} /> : <AlertCircle size={15} />}
                    <div><b>{fixed ? "Fault resolved" : patchApplied ? "Patch applied — verify recovery" : scenario?.title}</b><span>{fixed ? "All expected behavior restored." : patchApplied ? "Corrected behavior is active; regression checks are pending." : `Detected in ${scenario?.functionName}()`}</span></div>
                  </div>
                  {diagnosed && scenario ? <>
                    <div className="diag-property"><span>ROOT CAUSE</span><p>{scenario.description}</p></div>
                    <div className="expect-grid"><div><span>EXPECTED</span><b className="expected-value">{scenario.expected}</b></div><div><span>{patchApplied ? "PATCHED" : "ACTUAL"}</span><b className={patchApplied ? "expected-value" : "actual-value"}>{patchApplied ? scenario.expected : scenario.faultyActual}</b></div></div>
                    <button className="details-toggle" onClick={() => setDetailsOpen(!detailsOpen)} aria-expanded={detailsOpen}>
                      <span>{detailsOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />} Evidence &amp; explanation</span><span>{detailsOpen ? "Hide" : "View"}</span>
                    </button>
                    {detailsOpen && <div className="evidence-box"><b>{scenario.failingTest}</b><p>{scenario.evidence}</p><span><Sparkles size={12} /> Rule-based local diagnosis</span></div>}
                  </> : <div className="investigate-callout"><p>Tests pinpointed the failure. Run the local diagnostic engine to inspect the evidence.</p><button className="button button-secondary button-full" onClick={investigate}><Sparkles size={14} /> Investigate root cause</button></div>}
                  {diagnosed && !approved && <button className="text-action investigate-link" onClick={investigate}><RotateCcw size={12} /> Rerun diagnosis</button>}
                </div>
              )}
            </section>

            <section className="panel tests-panel" id="tests-panel">
              <div className="panel-header">
                <div className="panel-heading"><FlaskConical size={15} /><b>Test execution</b><span className="count-tag">{testRun.results.length}</span></div>
                <button className="run-button" onClick={runTests}><Play size={12} fill="currentColor" /> Run tests <span>R</span></button>
              </div>
              <div className="test-meta"><span><Terminal size={12} /> local test engine</span><span><Clock3 size={12} /> {testRun.durationMs.toFixed(2)}ms</span></div>
              <div className="test-list">
                {testRun.results.map((test) => (
                  <button key={test.id} className={`test-row ${selectedTest === test.id ? "test-selected" : ""}`} onClick={() => setSelectedTest(selectedTest === test.id ? null : test.id)}>
                    {test.status === "passed" ? <CheckCircle2 size={14} className="test-pass" /> : <AlertCircle size={14} className="test-fail" />}
                    <span className="test-name">{test.name}</span>
                    <span className={`test-badge ${test.status}`}>{test.status}</span>
                    {selectedTest === test.id && <span className="test-assertion">Expected <b>{test.expected}</b> · received <b className={test.status === "failed" ? "actual-value" : ""}>{test.actual}</b></span>}
                  </button>
                ))}
              </div>
              <div className={`test-summary ${testRun.failed ? "summary-fail" : "summary-pass"}`}>
                <span>{testRun.failed ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}{testRun.failed ? `${testRun.failed} assertion failed` : "All checks passing"}</span>
                <span><b>{testRun.passed}</b> passed <i /> <b className={testRun.failed ? "actual-value" : ""}>{testRun.failed}</b> failed</span>
              </div>
            </section>

            <section className="panel patch-panel">
              <div className="panel-header">
                <div className="panel-heading"><GitBranch size={15} /><b>Patch review</b><span className="panel-tag">{approved ? "APPROVED" : diagnosed ? "READY" : "LOCKED"}</span></div>
                {diagnosed && <span className="patch-change-count">1 file changed</span>}
              </div>
              {!diagnosed || !scenario ? (
                <div className="patch-locked"><div className="lock-glyph"><Code2 size={17} /></div><b>Patch review is locked</b><p>Investigate the root cause to generate a scenario-specific patch.</p><span><Circle size={10} /> Waiting for diagnosis</span></div>
              ) : (
                <>
                  <div className="diff-file"><span className="ts-icon">TS</span><b>{scenario.functionName}.ts</b><span className="diff-stats"><i>+1</i> <em>−1</em></span><ChevronDown size={13} /></div>
                  <div className="diff-view">
                    {scenario.faultyCode.map((line, index) => {
                      const changed = line !== scenario.fixedCode[index];
                      return <div key={`old-${index}`} className={`diff-line ${changed ? "diff-removed" : ""}`}><span>{changed ? "−" : " "}</span><code>{line}</code></div>;
                    })}
                    {scenario.fixedCode.map((line, index) => {
                      const changed = line !== scenario.faultyCode[index];
                      return <div key={`new-${index}`} className={`diff-line ${changed ? "diff-added" : ""}`}><span>{changed ? "+" : " "}</span><code>{line}</code></div>;
                    })}
                  </div>
                  <div className="patch-explanation"><Sparkles size={12} /><p>{scenario.explanation}</p></div>
                  {rejected && <div className="rejected-note"><X size={12} /> Patch rejected — fault remains active.</div>}
                  {verified && <div className="verified-note"><CheckCircle2 size={13} /> Patch verified against all 3 regression tests.</div>}
                  <div className="patch-actions">
                    <button className="button button-quiet reject-button" onClick={rejectPatch} disabled={verified}><X size={13} /> Reject</button>
                    {!approved ? <button className="button button-primary approve-button" onClick={approvePatch}><Check size={14} /> Approve patch</button> :
                      <button className={`button ${verified ? "button-success" : "button-primary"} approve-button`} onClick={verifyFix} disabled={verified}><ShieldCheck size={14} /> {verified ? "Verified" : "Verify fix"}</button>}
                  </div>
                </>
              )}
            </section>

            <section className={`panel cart-panel ${fixed ? "cart-recovered" : injected && !patchApplied ? "cart-faulted" : ""}`}>
              <div className="panel-header">
                <div className="panel-heading"><ShoppingBag size={15} /><b>Demo app</b><span className={`app-state ${fixed ? "app-green" : injected && !patchApplied ? "app-red" : patchApplied ? "app-pending" : ""}`}><span />{fixed ? "RECOVERED" : injected && !patchApplied ? "DEGRADED" : patchApplied ? "VERIFYING" : "HEALTHY"}</span></div>
                <button className="icon-button" aria-label="Open demo app" onClick={() => notify("Demo app is running locally in this workspace")}><ArrowUpRight size={14} /></button>
              </div>
              <div className="cart-content">
                <div className="cart-title"><div><small>SHOPPING CART</small><h3>Order summary <span>2 items</span></h3></div><span className="cart-pill">DEMO STORE</span></div>
                <div className="cart-items">
                  {products.map((product) => <div className="cart-item" key={product.id}><div className={`product-thumb ${product.id}`}><ShoppingBag size={15} /></div><div className="product-info"><b>{product.name}</b><span>{product.detail}</span></div><span className="product-price">{formatMoney(product.price * product.quantity)}</span></div>)}
                </div>
                <div className="cart-totals">
                  <div><span>Subtotal</span><b>{formatMoney(cart.subtotal)}</b></div>
                  <div><span>Discount <em>{Math.round(cart.rate * 100)}% off</em></span><b className="discount-value">−{formatMoney(cart.subtotal - cart.total)}</b></div>
                  <div className="cart-total"><span>Total due</span><b className={injected && !patchApplied ? "actual-value" : ""}>{formatMoney(cart.total)}</b></div>
                </div>
                {scenarioId === "empty-checkout" && injected && !patchApplied && <div className="checkout-warning"><AlertTriangle size={12} /> Empty cart checkout guard is bypassed</div>}
                <button className={`checkout-button ${cart.checkoutAllowed ? "" : "checkout-disabled"}`} disabled={!cart.checkoutAllowed} onClick={() => notify("Demo checkout validated locally")}><span>{cart.checkoutAllowed ? "Continue to checkout" : "Checkout unavailable"}</span>{cart.checkoutAllowed ? <ArrowRight size={14} /> : <X size={14} />}</button>
              </div>
              <div className="cart-foot"><span><span className="mini-dot" /> local runtime</span><span>3 regression tests</span></div>
            </section>

            <section className="panel activity-panel">
              <div className="panel-header">
                <div className="panel-heading"><History size={15} /><b>Activity</b></div>
                <button className="activity-all" onClick={() => notify("Showing the latest six session events")}>LATEST <ArrowDown size={11} /></button>
              </div>
              <div className="activity-list">
                {events.map((event, index) => <button key={event.id} className="activity-row" onClick={() => {
                  if (event.title.includes("Fault")) document.getElementById("scenario-picker")?.scrollIntoView({ behavior: "smooth", block: "center" });
                  else if (event.title.includes("Assertion") || event.title.includes("Test")) document.getElementById("tests-panel")?.scrollIntoView({ behavior: "smooth", block: "center" });
                  else if (event.title.includes("Root cause")) setDetailsOpen(true);
                }}>
                  <span className={`activity-marker ${event.tone}`}>{event.tone === "success" ? <Check size={10} /> : event.tone === "failure" ? <X size={10} /> : event.tone === "diagnostic" ? <Sparkles size={10} /> : <Circle size={7} />}</span>
                  <span className="activity-copy"><b>{event.title}</b><small>{event.detail}</small></span><span className="activity-time">{event.time}</span>
                  {index < events.length - 1 && <span className="activity-stem" />}
                </button>)}
              </div>
            </section>
          </div>

          <footer className="app-footer"><span>PATCHPILOT AI <i /> DEBUGGING LAB v1.0</span><span><span className={`footer-led ${injected && !fixed ? patchApplied ? "pending" : "failure" : ""}`} />{fixed || !injected ? "All systems operational" : patchApplied ? "Verification pending" : "Fault detected"} <i /> Deterministic local runtime</span></footer>
        </div>
      </main>
      <ClaudeVideoWalkthrough
        isOpen={isVideoTourOpen}
        onClose={() => setIsVideoTourOpen(false)}
        onJumpToScenario={(chosenId) => {
          selectScenario(chosenId as ScenarioId);
          injectBug();
        }}
      />
      {isStudioOpen && <VideoStudioPanel onClose={() => setIsStudioOpen(false)} />}
      {notice && <div className="toast" role="status"><CheckCircle2 size={15} />{notice}</div>}
    </div>
  );
}

function highlightCode(line: string) {
  const parts = line.split(/(function|return|const|true|false|\/\/.*|calculateCartTotal|discountRate|subtotal|items|length|rate|discounted|canCheckout|applyDiscount)/g);
  return parts.map((part, index) => {
    let className = "";
    if (["function", "return", "const"].includes(part)) className = "token-keyword";
    else if (part.startsWith("//")) className = "token-comment";
    else if (["true", "false"].includes(part)) className = "token-literal";
    else if (/^(calculateCartTotal|canCheckout|applyDiscount)$/.test(part)) className = "token-function";
    else if (/^(discountRate|subtotal|items|length|rate|discounted)$/.test(part)) className = "token-variable";
    return <span className={className} key={index}>{part}</span>;
  });
}

export default App;
