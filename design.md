# LogMyLife — Unified Design System & Component Guidelines (`design.md`)

This document serves as the authoritative Design System specification for **LogMyLife**. All screens, components, modals, and layouts must strictly adhere to the tokens and component rules defined here.

---

## 1. Visual Aesthetics & Design Philosophy

- **Theme Style**: Soft-Fill Spatial Material 3 hybrid design.
- **Core Principles & Mandatory Styling Rules**:
  - **No Outlines or Harsh Dark Fills on Pills & Action Buttons**: All pill buttons (mode switchers, tab chips, category pills) and secondary icon action buttons (Reset, Next, Back, Close) MUST use pure soft background fills (`#F1F5F9`, `#EFF6FF`, `#ECFDF5`, `#FAF5FF`) with `borderWidth: 0`. Active pills must use soft blue fills (`#EFF6FF` with `#1A73E8` text) — NEVER use harsh dark slate (`#0F172A`) for chip or pill button backgrounds.
  - **Soft Background Fills**: Use soft, soothing background fills (`#F3F7FF`, `#EEF4FF`, `#F8FAFC`, `#F0F4FF`, `#EFF6FF`) to demarcate containers, pills, and cards.
  - **16–20dp Corner Radius**: Use generous `16px` to `20px` corner radii across all cards, containers, grid cells, and navigation bars.
  - **Subtle Elevation & Soft Shadows**: Use micro drop shadows for primary actions without harsh outlines.
  - **Crisp High-Contrast Typography**: Clear titles in `#0F172A` with functional color accents (Flame Amber `#F59E0B`, Royal Blue `#2563EB`, Violet `#7C3AED`, Emerald `#10B981`).

---

## 2. Color Palette & Design Tokens

### Surface & Background Tokens
| Token Name | Hex Code | Usage |
| :--- | :--- | :--- |
| `surfacePage` | `#FFFFFF` | Primary screen canvas background |
| `surfaceContainer` | `#F8FAFC` | Secondary card & inspector container fill |
| `surfaceMuted` | `#F1F5F9` | Input fields, pill buttons, secondary header fills |
| `borderHairline` | `#F1F5F9` | Subtle internal section dividers |
| `borderDefault` | `#E2E8F0` | Default card & container outlines (1px) |
| `borderStrong` | `#CBD5E1` | Active button & focused element outlines |

### Typography Tokens
| Token Name | Hex Code | Usage |
| :--- | :--- | :--- |
| `textPrimary` | `#0F172A` | Primary titles, active values, high-emphasis text |
| `textSecondary` | `#334155` / `#475569` | Subtitles, body copy, descriptions |
| `textMuted` | `#64748B` / `#94A3B8` | Column headers, timestamps, placeholders |
| `textDisabled` | `#CBD5E1` | Out-of-month or future calendar numbers |

### Functional Accent Tokens
| Accent Name | Primary Hex | Light Fill Hex | Border Hex | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Streak / Flame** | `#F59E0B` | `#FEF3C7` | `#FDE68A` | Active streaks, flame icons, done dates |
| **Royal Blue** | `#2563EB` | `#EFF6FF` | `#BFDBFE` | Primary actions, today highlights, links |
| **AI / Violet** | `#7C3AED` | `#FAF5FF` | `#E9D5FF` | AI insights, selection highlights, re-planner |
| **Emerald Success** | `#10B981` | `#ECFDF5` | `#A7F3D0` | Task completion, XP badges, positive stats |

---

## 3. Typography & Font Specifications

- **Display Headings**: `Gilroy-ExtraBold` or `PlusJakartaSans-Bold` (`fontSize: 17` - `24px`, `lineHeight: 1.25`)
- **Section Headers**: `PlusJakartaSans-Bold` (`fontSize: 14` - `16px`, `letterSpacing: 0.5px`)
- **Body & Controls**: `PlusJakartaSans-Medium` / `PlusJakartaSans-Regular` (`fontSize: 12` - `14px`, `lineHeight: 18` - `20px`)
- **Small Labels & Badges**: `PlusJakartaSans-Bold` (`fontSize: 10` - `11px`, `letterSpacing: 0.5px`)

---

## 4. Component Patterns

### A. Top Page Navigation Header
- **Layout**: Horizontal row with `justifyContent: 'space-between'`, `alignItems: 'center'`.
- **Back Button**:
  - Background: `#F1F5F9`, Border: `1px #E2E8F0`, `borderRadius: 12`.
  - Padding: `paddingHorizontal: 12`, `paddingVertical: 7`.
  - Icon: `<ArrowLeft size={16} color="#0F172A" />` + Text: `Overview` (`12px Bold`).
- **Title Box**: Centered with icon (`<Flame size={20} color="#F59E0B" />`) + Title text (`18px Display Bold #0F172A`).

### B. Summary Metric Cards
- **Container Row**: `flexDirection: 'row'`, `gap: 10`.
- **Individual Stat Card**:
  - Flex: `flex: 1`.
  - Background: `#FFFFFF`, Border: `1px #E2E8F0`, `borderRadius: 16`.
  - Padding: `padding: 14`.
  - Shadow: `shadowColor: '#0F172A'`, `shadowOffset: { width: 0, height: 4 }`, `shadowOpacity: 0.04`, `shadowRadius: 8`, `elevation: 2`.
  - Icon: `20px` functional accent icon.
  - Value: `15px Display Bold #0F172A`.
  - Label: `11px Medium #64748B`.

### C. Google Material Month Navigation Bar
- **Bar Container**: Background `#F8FAFC`, Border `1px #E2E8F0`, `borderRadius: 18`, `paddingHorizontal: 10`, `paddingVertical: 8`.
- **Navigation Buttons**:
  - Size: `38x38px` circular button (`borderRadius: 19`).
  - Background: `#FFFFFF`, Border: `1px #CBD5E1`.
  - Shadow: `shadowColor: '#0F172A'`, `shadowOffset: { width: 0, height: 2 }`, `shadowOpacity: 0.06`, `shadowRadius: 4`, `elevation: 2`.
  - Icons: `<ChevronLeft size={20} color="#0F172A" />` and `<ChevronRight size={20} color="#0F172A" />`.
- **Month Title**: `17px Display Bold #0F172A`.
- **Today Pill**: Background `#FFFFFF`, Border `1px #2563EB`, `borderRadius: 10`, `paddingHorizontal: 10`, `paddingVertical: 5`, Text: `11px Bold #2563EB`.

### D. Calendar Grid & Cells
- **Header Row**: Day labels (`Sun` through `Sat`), `12px Bold #64748B`, `textAlign: 'center'`.
- **Grid Container**: Background `#FFFFFF`, Border `1px #E2E8F0`, `borderRadius: 20`, `padding: 8`.
- **Grid Cell States**:
  - Size: `width: 14.28%`, `height: 52px`, `borderRadius: 12`, `marginVertical: 2`.
  - **State 1: Active Streak Date (`isDone`)**:
    - Background: `#FEF3C7` (Warm Gold).
    - Border: `1px #FDE68A`.
    - Text: `#92400E` (`13px Bold`).
    - Icon: `🔥` (`12px`).
  - **State 2: Today (`isToday`)**:
    - Background: `#EFF6FF` (Light Blue Tint).
    - Border: `1.5px #2563EB`.
    - Text: `#1D4ED8` (`13px Bold`).
    - Dot: `5x5px` circular indicator (`#2563EB`).
  - **State 3: Selected Cell**:
    - Border: `2px #7C3AED` (Violet highlight).
  - **State 4: Default Past / Future Cell**:
    - Text: `#334155` (Current month) / `#CBD5E1` (Future).

### E. Day Inspection Activity Card
- **Container**: Background `#F8FAFC`, Border `1px #E2E8F0`, `borderRadius: 16`, `padding: 16`.
- **Header**: Icon `<CheckCircle2 size={16} color="#10B981" />` + Date text (`14px Bold #0F172A`).
- **Body**: Activity checklist bullets (`✓ Completed X task(s)`, `📓 Saved daily reflection log`).

---

## 5. Implementation Rules for Developers

1. **Strict Token Usage**: Never hardcode random colors or radii. Use the exact values from this specification.
2. **Theme Consistency**: All interactive cards must feature proper borders (`1px #E2E8F0`), appropriate rounded corners (`borderRadius: 12-18px`), and subtle spatial depth.
3. **Responsive Spacing**: Ensure calendar grids use percentages (`width: '14.28%'`) so they fit any mobile viewport seamlessly.
