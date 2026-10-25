import React from "react";
/**
 * PatchPilot AI - Remotion Programmatic Video Composition
 * 
 * To render this video locally as an MP4:
 * 1. npm i remotion @remotion/cli @remotion/transitions
 * 2. npx remotion render src/remotion/PatchPilotVideo.tsx PatchPilotWalkthrough out/video.mp4
 */

// Colors matching the Claude / Anthropic cinematic dark aesthetic
const THEME = {
  bg: "#0a0b10",
  surface: "#11131c",
  card: "#181a26",
  border: "#252838",
  accent: "#d97757", // Claude terracotta
  accentLight: "#f4a261",
  green: "#4bd5a2",
  red: "#ff7185",
  text: "#f1f2f8",
  textDim: "#9196a7",
  fontMono: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
};

export interface SceneProps {
  frame: number;
  fps?: number;
}

// Scene 1: Cinematic Intro Title & Logo Reveal
export const Scene1Intro: React.FC<SceneProps> = ({ frame }) => {
  const opacity = Math.min(1, frame / 20);
  const scale = 0.95 + Math.min(0.05, frame / 100);

  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        backgroundColor: THEME.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity,
        transform: `scale(${scale})`,
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          width: 90,
          height: 90,
          borderRadius: 24,
          background: "linear-gradient(135deg, #d97757, #9b7aff)",
          display: "grid",
          placeItems: "center",
          boxShadow: "0 10px 40px rgba(217, 119, 87, 0.4)",
          marginBottom: 32,
        }}
      >
        <span style={{ fontSize: 44, color: "#fff", fontWeight: "bold" }}>P</span>
      </div>
      <h1
        style={{
          fontSize: 64,
          fontWeight: 800,
          color: THEME.text,
          margin: 0,
          letterSpacing: "-1.5px",
        }}
      >
        PatchPilot <span style={{ color: THEME.accent }}>AI</span>
      </h1>
      <p
        style={{
          fontSize: 28,
          color: THEME.textDim,
          marginTop: 16,
          letterSpacing: "-0.5px",
        }}
      >
        Find the fault. <strong style={{ color: THEME.text }}>Prove the fix.</strong>
      </p>
      <div
        style={{
          marginTop: 48,
          padding: "10px 24px",
          borderRadius: 999,
          background: "rgba(255, 255, 255, 0.05)",
          border: `1px solid ${THEME.border}`,
          color: THEME.accentLight,
          fontSize: 16,
          fontWeight: 600,
          letterSpacing: "1px",
          textTransform: "uppercase",
        }}
      >
        Deterministic Local Debugging Lab · Zero APIs · 100% Reproducible
      </div>
    </div>
  );
};

// Scene 2: 5-Stage Workflow Overview
export const Scene2Workflow: React.FC<SceneProps> = ({ frame }) => {
  const steps = [
    { num: "01", title: "Inject bug", sub: "Trigger deterministic edge-case" },
    { num: "02", title: "Run tests", sub: "Sub-millisecond in-memory assertions" },
    { num: "03", title: "Investigate", sub: "AST & rule-based root cause analysis" },
    { num: "04", title: "Review patch", sub: "Visual side-by-side Git diff" },
    { num: "05", title: "Verify fix", sub: "100% regression suite pass" },
  ];

  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        backgroundColor: THEME.bg,
        padding: "100px 140px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div style={{ color: THEME.accent, fontSize: 18, fontWeight: 700, letterSpacing: "2px" }}>
        SYSTEM ARCHITECTURE
      </div>
      <h2 style={{ fontSize: 52, color: THEME.text, margin: "12px 0 60px" }}>
        The 5-Stage Progressive Workflow
      </h2>

      <div style={{ display: "flex", gap: 24, alignItems: "stretch" }}>
        {steps.map((st, i) => {
          const isRevealed = frame > i * 15;
          const cardOpacity = isRevealed ? 1 : 0.2;
          const translateY = isRevealed ? 0 : 20;

          return (
            <div
              key={st.num}
              style={{
                flex: 1,
                backgroundColor: THEME.card,
                border: `1px solid ${THEME.border}`,
                borderRadius: 16,
                padding: "32px 24px",
                opacity: cardOpacity,
                transform: `translateY(${translateY}px)`,
                transition: "all 0.4s ease",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: THEME.surface,
                  border: `1px solid ${THEME.border}`,
                  color: THEME.accent,
                  fontSize: 18,
                  fontWeight: 700,
                  display: "grid",
                  placeItems: "center",
                  marginBottom: 20,
                }}
              >
                {st.num}
              </div>
              <h3 style={{ fontSize: 22, color: THEME.text, margin: "0 0 10px" }}>{st.title}</h3>
              <p style={{ fontSize: 14, color: THEME.textDim, margin: 0, lineHeight: 1.5 }}>
                {st.sub}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Scene 3: Bug Injection & Code Split Screen
export const Scene3FaultInjection: React.FC<SceneProps> = () => {
  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        backgroundColor: THEME.bg,
        padding: "80px 120px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div style={{ color: THEME.red, fontSize: 16, fontWeight: 700, letterSpacing: "2px" }}>
        FAULT INJECTION · SCENARIO 01
      </div>
      <h2 style={{ fontSize: 44, color: THEME.text, margin: "10px 0 40px" }}>
        Mathematical Error in calculateCartTotal()
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 32 }}>
        {/* Source Code Box */}
        <div
          style={{
            backgroundColor: THEME.card,
            borderRadius: 16,
            border: `1px solid ${THEME.border}`,
            padding: 30,
          }}
        >
          <div
            style={{
              color: THEME.textDim,
              fontSize: 14,
              fontFamily: THEME.fontMono,
              marginBottom: 20,
            }}
          >
            src/cart/calculateCartTotal.ts
          </div>
          <pre
            style={{
              fontFamily: THEME.fontMono,
              fontSize: 18,
              lineHeight: 1.8,
              color: THEME.text,
              margin: 0,
            }}
          >
            <code>
              {`1: function calculateCartTotal(subtotal, discountRate) {
`}
              <span style={{ backgroundColor: "rgba(255, 113, 133, 0.2)", color: THEME.red }}>
                {`2:   const discount = discountRate; // ⚠️ BUG: flat rate instead of percentage!
`}
              </span>
              {`3:   return subtotal - discount;
4: }`}
            </code>
          </pre>
        </div>

        {/* Impact Card */}
        <div
          style={{
            backgroundColor: THEME.surface,
            borderRadius: 16,
            border: "1px solid rgba(255, 113, 133, 0.3)",
            padding: 30,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ color: THEME.red, fontWeight: 700, fontSize: 16 }}>
              DEMO STORE IMPACT
            </div>
            <h3 style={{ fontSize: 26, color: THEME.text, margin: "8px 0 20px" }}>
              Order Total Corrupted
            </h3>
            <p style={{ color: THEME.textDim, fontSize: 15, lineHeight: 1.6 }}>
              A 10% discount on $96.00 should reduce total by $9.60 down to $86.40. Instead, only
              $0.10 is deducted.
            </p>
          </div>
          <div
            style={{
              backgroundColor: "rgba(255, 113, 133, 0.1)",
              borderRadius: 12,
              padding: "16px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ color: THEME.textDim, fontSize: 16 }}>Customer Total Due:</span>
            <span style={{ color: THEME.red, fontSize: 28, fontWeight: 800 }}>$95.90</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Scene 4: Test Assertion Failure
export const Scene4TestFailure: React.FC<SceneProps> = () => {
  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        backgroundColor: THEME.bg,
        padding: "80px 140px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div style={{ color: THEME.accent, fontSize: 16, fontWeight: 700, letterSpacing: "2px" }}>
        TEST EXECUTION ENGINE · 0.18MS
      </div>
      <h2 style={{ fontSize: 44, color: THEME.text, margin: "10px 0 40px" }}>
        Deterministic Unit Assertion Failed
      </h2>

      <div
        style={{
          backgroundColor: THEME.surface,
          borderRadius: 16,
          border: `1px solid ${THEME.border}`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            backgroundColor: THEME.card,
            padding: "16px 24px",
            borderBottom: `1px solid ${THEME.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontFamily: THEME.fontMono, color: THEME.textDim, fontSize: 14 }}>
            Test Results: 1 failed, 2 passed
          </span>
          <span
            style={{
              backgroundColor: "rgba(255, 113, 133, 0.2)",
              color: THEME.red,
              padding: "4px 12px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            REGRESSION DETECTED
          </span>
        </div>

        <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              padding: "16px 20px",
              borderRadius: 10,
              backgroundColor: "rgba(75, 213, 162, 0.08)",
              border: "1px solid rgba(75, 213, 162, 0.2)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ color: THEME.green, fontWeight: 600 }}>
              ✓ promotion is applied exactly once
            </span>
            <span style={{ color: THEME.green, fontSize: 14, fontFamily: THEME.fontMono }}>
              Passed ($76.80)
            </span>
          </div>

          <div
            style={{
              padding: "20px",
              borderRadius: 10,
              backgroundColor: "rgba(255, 113, 133, 0.1)",
              border: `1px solid ${THEME.red}`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <span style={{ color: THEME.red, fontWeight: 700, fontSize: 18 }}>
                ✕ cart total applies percentage discount
              </span>
              <span
                style={{
                  backgroundColor: THEME.red,
                  color: "#fff",
                  fontSize: 12,
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontWeight: 700,
                }}
              >
                FAILED
              </span>
            </div>
            <div
              style={{
                fontFamily: THEME.fontMono,
                fontSize: 15,
                color: THEME.textDim,
                lineHeight: 1.6,
              }}
            >
              Assertion Error: Expected <b>$86.40</b> but received <b style={{ color: THEME.red }}>$95.90</b>.
            </div>
          </div>

          <div
            style={{
              padding: "16px 20px",
              borderRadius: 10,
              backgroundColor: "rgba(75, 213, 162, 0.08)",
              border: "1px solid rgba(75, 213, 162, 0.2)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ color: THEME.green, fontWeight: 600 }}>
              ✓ empty cart cannot proceed to checkout
            </span>
            <span style={{ color: THEME.green, fontSize: 14, fontFamily: THEME.fontMono }}>
              Passed (false)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Scene 5: Visual Git Diff Review
export const Scene5PatchReview: React.FC<SceneProps> = () => {
  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        backgroundColor: THEME.bg,
        padding: "80px 140px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div style={{ color: THEME.accentLight, fontSize: 16, fontWeight: 700, letterSpacing: "2px" }}>
        PATCH REVIEW · GIT DIFF
      </div>
      <h2 style={{ fontSize: 44, color: THEME.text, margin: "10px 0 40px" }}>
        Proposed Fix for calculateCartTotal.ts
      </h2>

      <div
        style={{
          backgroundColor: THEME.card,
          borderRadius: 16,
          border: `1px solid ${THEME.border}`,
          padding: 32,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 24,
            paddingBottom: 16,
            borderBottom: `1px solid ${THEME.border}`,
          }}
        >
          <span style={{ fontFamily: THEME.fontMono, fontSize: 16, color: THEME.text }}>
            calculateCartTotal.ts <span style={{ color: THEME.textDim }}>(+1, −1)</span>
          </span>
          <span style={{ color: THEME.accent, fontWeight: 600, fontSize: 14 }}>
            Rule-Based Diagnosis Verified
          </span>
        </div>

        <div style={{ fontFamily: THEME.fontMono, fontSize: 18, lineHeight: 2 }}>
          <div style={{ color: THEME.textDim }}>&nbsp; function calculateCartTotal(subtotal, discountRate) &#123;</div>
          <div style={{ backgroundColor: "rgba(255, 113, 133, 0.15)", color: THEME.red, padding: "2px 8px" }}>
            − &nbsp;&nbsp;const discount = discountRate;
          </div>
          <div style={{ backgroundColor: "rgba(75, 213, 162, 0.15)", color: THEME.green, padding: "2px 8px" }}>
            + &nbsp;&nbsp;const discount = subtotal * discountRate;
          </div>
          <div style={{ color: THEME.textDim }}>&nbsp; &nbsp;&nbsp;return subtotal - discount;</div>
          <div style={{ color: THEME.textDim }}>&nbsp; &#125;</div>
        </div>
      </div>
    </div>
  );
};

// Scene 6: Verified Recovery
export const Scene6Recovery: React.FC<SceneProps> = () => {
  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        backgroundColor: THEME.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          width: 90,
          height: 90,
          borderRadius: "50%",
          backgroundColor: "rgba(75, 213, 162, 0.15)",
          border: `2px solid ${THEME.green}`,
          display: "grid",
          placeItems: "center",
          marginBottom: 32,
        }}
      >
        <span style={{ fontSize: 44, color: THEME.green }}>✓</span>
      </div>
      <h2 style={{ fontSize: 56, fontWeight: 800, color: THEME.text, margin: 0 }}>
        Recovery Verified
      </h2>
      <p style={{ fontSize: 24, color: THEME.textDim, marginTop: 16 }}>
        All regression tests passing · Demo Commerce Cart restored to <strong>$86.40</strong>
      </p>

      <div style={{ display: "flex", gap: 32, marginTop: 48 }}>
        <div
          style={{
            backgroundColor: THEME.card,
            border: `1px solid ${THEME.border}`,
            borderRadius: 12,
            padding: "20px 32px",
            textAlign: "center",
          }}
        >
          <div style={{ color: THEME.green, fontSize: 32, fontWeight: 800 }}>3 / 3</div>
          <div style={{ color: THEME.textDim, fontSize: 14, marginTop: 4 }}>Assertions Passing</div>
        </div>
        <div
          style={{
            backgroundColor: THEME.card,
            border: `1px solid ${THEME.border}`,
            borderRadius: 12,
            padding: "20px 32px",
            textAlign: "center",
          }}
        >
          <div style={{ color: THEME.text, fontSize: 32, fontWeight: 800 }}>0.15ms</div>
          <div style={{ color: THEME.textDim, fontSize: 14, marginTop: 4 }}>Execution Time</div>
        </div>
        <div
          style={{
            backgroundColor: THEME.card,
            border: `1px solid ${THEME.border}`,
            borderRadius: 12,
            padding: "20px 32px",
            textAlign: "center",
          }}
        >
          <div style={{ color: THEME.accent, fontSize: 32, fontWeight: 800 }}>0 Backend</div>
          <div style={{ color: THEME.textDim, fontSize: 14, marginTop: 4 }}>100% Deterministic</div>
        </div>
      </div>
    </div>
  );
};
