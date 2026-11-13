# Telegram-Style Glassmorphism Specification (`glassy.md`)

This specification documents the **Liquid Glass / Frosted Glassmorphism** design system for NEXCHAT, modeled directly after Telegram iOS/Android and macOS translucent settings surfaces.

---

## 1. Visual Architecture & Design Principles

Telegram's settings UI uses layered frosted glass rather than flat, opaque panels. The effect consists of four optical layers:

```
┌────────────────────────────────────────────────────────┐
│  1. Specular Border Inset (1px rgba(255, 255, 255, 0.1)│ ── Top highlight reflection
│  2. Translucent Base (rgba(18, 25, 38, 0.72))         │ ── Deep dark crystal tint
│  3. Backdrop Blur (blur(20px) saturate(180%))          │ ── Ambient color diffusion
│  4. Diffuse Ambient Drop Shadow (rgba(0, 0, 0, 0.35))   │ ── Depth elevation
└────────────────────────────────────────────────────────┘
```

### Core Characteristics
1. **Background Diffusion**: Blurs underlying chat wallpapers and gradients without visual banding.
2. **Color Vibrancy (`saturate(180%)`)**: Prevents frosted glass from looking muddy or washed-out.
3. **Specular Border Sheen**: A 1px subtle top highlight simulates light catching physical cut glass.
4. **Grouped Card Blocks**: Settings options are grouped into rounded capsule islands rather than wall-to-wall flat lists.

---

## 2. CSS Design Tokens (`:root`)

```css
:root {
  /* Liquid Glass Base */
  --glass-surface: rgba(18, 25, 38, 0.72);
  --glass-surface-hover: rgba(28, 38, 58, 0.82);
  --glass-surface-active: rgba(36, 48, 74, 0.90);

  /* Glass Optics */
  --glass-blur: blur(20px) saturate(180%);
  --glass-blur-heavy: blur(32px) saturate(200%);
  --glass-webkit-blur: blur(20px) saturate(180%);

  /* Specular Borders & Highlights */
  --glass-border: 1px solid rgba(255, 255, 255, 0.08);
  --glass-border-light: 1px solid rgba(255, 255, 255, 0.14);
  --glass-inset-highlight: inset 0 1px 0 rgba(255, 255, 255, 0.12);

  /* Elevation Shadows */
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.38);
  --glass-card-shadow: 0 4px 20px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
```

---

## 3. Component Implementation

### A. Settings Modal Backdrop & Dialog Container
```css
.settings-modal {
  background: rgba(8, 12, 19, 0.78) !important;
  backdrop-filter: var(--glass-blur-heavy) !important;
  -webkit-backdrop-filter: var(--glass-blur-heavy) !important;
}

.settings-modal .settings-content,
.settings-modal-dialog {
  background: var(--glass-surface) !important;
  backdrop-filter: var(--glass-blur) !important;
  -webkit-backdrop-filter: var(--glass-webkit-blur) !important;
  border: var(--glass-border) !important;
  border-radius: 20px !important;
  box-shadow: var(--glass-shadow), var(--glass-inset-highlight) !important;
  transform: translateZ(0); /* Hardware accelerated */
}
```

### B. Grouped Settings Islands (Telegram Card Blocks)
```css
.settings-group,
.settings-card,
.settings-section {
  background: rgba(24, 33, 49, 0.65) !important;
  backdrop-filter: blur(16px) saturate(160%) !important;
  -webkit-backdrop-filter: blur(16px) saturate(160%) !important;
  border: 1px solid rgba(255, 255, 255, 0.07) !important;
  border-radius: 16px !important;
  box-shadow: var(--glass-card-shadow) !important;
  margin-bottom: 14px !important;
  overflow: hidden !important;
}
```

### C. Interactive Items & Glass Separators
```css
.settings-item,
.settings-row {
  background: transparent !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
  padding: 12px 16px !important;
  transition: background 0.18s ease, transform 0.15s ease !important;
}

.settings-item:last-child,
.settings-row:last-child {
  border-bottom: none !important;
}

.settings-item:hover,
.settings-row:hover {
  background: var(--glass-surface-hover) !important;
}

.settings-item:active,
.settings-row:active {
  background: var(--glass-surface-active) !important;
}
```

### D. Glass Icon Badges (Telegram Rounded Squircle Badges)
```css
.settings-item-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.04));
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
```

---

## 4. Hardware Acceleration & Mobile Battery Optimization

- **Composite Layer Isolation**: `transform: translateZ(0)` and `will-change: transform` ensure blurring occurs on GPU textures rather than triggering CPU repaints.
- **Low-Power Fallback**: On ultra-low-power devices or Android WebView battery saver, fallback to solid `rgba(18, 25, 38, 0.94)` via `@media (prefers-reduced-transparency: reduce)`.

---

## 5. Status

- **Status**: PAUSED by user request.
- **Specification Documented**: [`glassy.md`](file:///c:/Users/USER/Desktop/NEXCHAT-main/glassy.md)
- **Ready for Application**: Run unpause / proceed instruction to apply these rules to `chat.css` and `settings.css`.
