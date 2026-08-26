# NOVI — Brand Architecture & Identity (`BRAND.md`)

---

## 1. Brand Identity & Positioning

**NOVI** is a calm, intelligent personal life space designed to help people understand, organize, and navigate their everyday lives with clarity and intention.

### What NOVI Is
- A **calm personal space** for managing time, attention, and daily rhythms.
- A **truthful mirror** that gently connects what you planned with how your day actually unfolded.
- An **intelligent, ambient assistant** that quietly adapts when life changes.
- A **refined, human tool** that respects your attention, device, and cognitive peace.

### What NOVI Is NOT
- ❌ NOT a traditional, tedious diary.
- ❌ NOT a rigid, high-pressure task manager.
- ❌ NOT a corporate productivity SaaS.
- ❌ NOT a gamified app with arbitrary XP, streaks anxiety, levels, or badge walls.
- ❌ NOT a noisy social or sharing network.
- ❌ NOT an overwhelming 20-card analytics dashboard.

---

## 2. Brand Personality

| Core Attribute | Expression in NOVI | Anti-Pattern to Avoid |
| :--- | :--- | :--- |
| **Calm** | Soft tonal surfaces, generous whitespace, peaceful hierarchy | Flashing alerts, urgent red badges, noisy gradients |
| **Intelligent** | Passive background awareness, quiet auto-scheduling | Demanding manual time entries, robotic notifications |
| **Human & Approachable** | Warm, conversational language, empathetic nudges | Cold corporate jargon, rigid technical telemetry |
| **Minimal** | Content and function first; every element has a purpose | Decorative glassmorphism, floating blobs, gratuitous effects |
| **Trustworthy** | Transparent local-first data, clear native privacy controls | Opaque background tracking, misleading metrics |
| **Modern & Premium** | Google Pixel / Material 3 polish, tactile micro-feedback | Cheap templates, mismatched icons, cluttered cards |

---

## 3. Brand Voice & Tone

NOVI speaks like a calm, thoughtful friend and capable assistant. It never lectures, never pressures, and never relies on hype.

### Voice Rules
1. **Be Concise**: Say what matters in clear, straightforward language.
2. **Be Supportive**: Acknowledge progress without exaggerated celebration or points.
3. **Be Grounded**: Focus on real life (time, focus, rest, routines) rather than abstract "productivity hacks".

### Copy Guide
| Situation | ❌ Avoid (Old / Gamified / Corporate) | ✅ Use in NOVI |
| :--- | :--- | :--- |
| **Greeting** | "WELCOME BACK CHAMP! READY TO CRUSH IT?" | "Good morning, Alex" / "What's on your mind?" |
| **Empty Day** | "0/12 TASKS LOGGED! START HUSTLING!" | "Nothing planned yet" / "Your day is open" |
| **Schedule Shift**| "CONFLICT RESOLUTION PROTOCOL EXECUTED" | "Schedule adjusted · 3 items shifted smoothly" |
| **Focus Timer** | "POMODORO HARDCORE FOCUS MODE ACTIVATED" | "Deep focus · 25 min" |
| **Habit Done** | "🔥 +50 XP! 8 DAY FLAME STREAK UNLOCKED!" | "Completed for today · 8 days consistent" |
| **Insights** | "COGNITIVE FLOW STATE SCORE: 88.4%" | "A focused day with 4.5 hours of deep work" |
| **Caught Up** | "ALL OBJECTIVES COMPLETED FOR THE CYCLE" | "You're all caught up" |

---

## 4. Visual Identity & Google Pixel Reference

The visual direction of NOVI is deeply informed by **Google Material 3** and the calm, purposeful craft of **Google Pixel experiences** (Google Calendar, Keep, Tasks, Clock, Weather).

### Visual Principles
- **Content > Function > Decoration**: Content comes first, functionality makes it interactive, decoration is minimized to subtle tonal elevation and crisp typography.
- **Tonal Depth over Heavy Shadows**: Hierarchy is built using M3 tonal surface roles (`surfaceContainerLowest`, `surfaceContainerLow`, `surfaceContainer`, `surfaceContainerHigh`) rather than heavy drop shadows or blurred glass.
- **Harmonious Accents**: Botanical sage, deep slate indigo, soft warm amber, and calm terracotta.
- **Standardized Vector Geometry**: Consistent Material Symbols Rounded (`Icons.rounded`), uniform stroke weights, and purposeful icon semantics.

---

## 5. Logo & Brand Asset Architecture

NOVI's brand mark embodies **flow and focus** — the intersection of time's natural rhythm and human intention.

### Placeholder & Asset Hierarchy
```text
assets/
  brand/
    novi_logo.png        # Full brand logo (mark + wordmark)
    novi_mark.png        # Minimalist geometric focus arc glyph
    novi_wordmark.png    # Clean geometric typography ("novi")
```

### Geometric Logo Direction
- **The Novi Arc**: A minimalist, balanced geometric ring with an open focal aperture and a serene center pip, symbolizing clarity, focus, and continuous daily rhythm.
- **Colorway**: Adaptive — Deep Slate Indigo (`#1D4ED8`) on light surfaces, Soft Sky Slate (`#93C5FD`) on dark surfaces.
- **App Icon**: 1:1 squircle (Material 3 standard adaptive icon container) on a warm tinted tonal background.

---

*NOVI Brand Specification finalized.*
