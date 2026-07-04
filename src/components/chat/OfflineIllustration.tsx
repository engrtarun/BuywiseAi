"use client";

import React from "react";

/**
 * OfflineIllustration — Premium 3D Floating Orb (Option A)
 *
 * Layered CSS technique for the faux-3D sphere:
 * 1. Base circle — radial-gradient from warm amber (top-left light source) to
 *    deep burnt orange (bottom-right shadow), giving hemisphere shading.
 * 2. Glossy highlight — a smaller, semi-transparent white-to-transparent
 *    radial-gradient positioned near the top-left, faking a specular reflection.
 * 3. Rim glow — a faint outer box-shadow in amber for "ambient light bleed".
 * 4. Ground shadow — a separate element beneath the orb using a radial-gradient
 *    ellipse, animated inversely to the float (shrinks when orb rises,
 *    expands when orb dips) to sell physical depth.
 *
 * All animations use only `transform` and `opacity` for GPU acceleration.
 * Durations are calm (3–8s) for a passive, ambient feel.
 *
 * The component is structured so Option B (signal-wave search) could be
 * swapped in by replacing the JSX inside the outer wrapper div.
 */

/* ── Keyframes (injected via <style>) ─────────────────── */
const keyframes = `
  @keyframes offlineOrbFloat {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(-10px); }
  }

  @keyframes offlineOrbWobble {
    0%, 100% { transform: rotate(0deg); }
    25%      { transform: rotate(1.5deg); }
    75%      { transform: rotate(-1.5deg); }
  }

  @keyframes offlineOrbShadow {
    0%, 100% { transform: scaleX(1)   scaleY(1);   opacity: 0.5; }
    50%      { transform: scaleX(0.75) scaleY(0.7); opacity: 0.25; }
  }

  @keyframes offlineIconPulse {
    0%, 100% { opacity: 1; }
    50%      { opacity: 0.45; }
  }
`;

export function OfflineIllustration({ className }: { className?: string }) {
  return (
    <>
      {/* Inject keyframes once — lightweight, no FOUC */}
      <style dangerouslySetInnerHTML={{ __html: keyframes }} />

      <div
        className={className}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          /* Allow parent to control overall sizing via className */
          width: "fit-content",
          position: "relative",
        }}
        aria-hidden="true"
      >
        {/* ── Floating orb wrapper (translateY animation) ─── */}
        <div
          style={{
            animation: "offlineOrbFloat 3.2s ease-in-out infinite",
            willChange: "transform",
          }}
        >
          {/* ── Wobble wrapper (subtle rotation) ─────────── */}
          <div
            style={{
              animation: "offlineOrbWobble 7s ease-in-out infinite",
              willChange: "transform",
            }}
          >
            {/* ── The orb itself ─────────────────────────── */}
            <div
              style={{
                /* Size — scales down on mobile via parent's CSS */
                width: 56,
                height: 56,
                borderRadius: "50%",

                /* Layer 1 — hemisphere shading (light top-left → dark bottom-right) */
                background:
                  "radial-gradient(ellipse 65% 55% at 35% 30%, #f0be5e 0%, #E8A33D 40%, #b06e14 85%, #7a4c0c 100%)",

                /* Layer 2 — glossy specular highlight overlay */
                backgroundClip: "padding-box",
                position: "relative",
                overflow: "hidden",

                /* Rim glow / ambient light bleed */
                boxShadow:
                  "0 0 18px 4px rgba(232, 163, 61, 0.25), inset 0 -6px 14px rgba(0,0,0,0.25)",

                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Glossy highlight pseudo (white ellipse near top-left) */}
              <div
                style={{
                  position: "absolute",
                  top: 4,
                  left: 6,
                  width: 28,
                  height: 18,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.12) 55%, transparent 100%)",
                  pointerEvents: "none",
                }}
              />

              {/* Broken wifi icon (inline SVG) */}
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0C2823"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  position: "relative",
                  zIndex: 1,
                  filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.18))",
                }}
              >
                {/* Wifi arcs */}
                <path d="M1.42 9a16 16 0 0 1 4.7-2.88" opacity="0.5" />
                <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" opacity="0.65" />
                <path
                  d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"
                  opacity="0.65"
                />
                <path d="M10.71 5.05A16 16 0 0 1 22.56 9" opacity="0.5" />
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0" opacity="0.8" />

                {/* Center dot */}
                <circle cx="12" cy="20" r="1" fill="#0C2823" stroke="none" />

                {/* Diagonal "disconnect" slash — micro-animated */}
                <line
                  x1="1"
                  y1="1"
                  x2="23"
                  y2="23"
                  strokeWidth="2.2"
                  stroke="#0C2823"
                  style={{
                    animation: "offlineIconPulse 2.4s ease-in-out infinite",
                  }}
                />
              </svg>
            </div>
          </div>
        </div>

        {/* ── Ground shadow (animated inversely to float) ─ */}
        <div
          style={{
            width: 46,
            height: 10,
            marginTop: 6,
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at center, rgba(232,163,61,0.30) 0%, transparent 70%)",
            animation: "offlineOrbShadow 3.2s ease-in-out infinite",
            willChange: "transform, opacity",
          }}
        />
      </div>
    </>
  );
}
