# Eolas Brand Palette & Design System
Version 0.1

---

# Brand Values

Eolas should feel:

- Calm
- Intelligent
- Premium
- Trustworthy
- Minimal
- Engineering focused
- Local-first
- Modern without looking like "AI"

Think:

- Apple
- Linear
- Raycast
- Notion

Not:

- Neon cyberpunk
- Glowing AI
- Circuit boards
- Brains
- Robots

---

# Primary Brand Colours

| Token | Hex | Purpose |
|-------|------|---------|
| Primary | #0F766E | Main brand colour |
| Primary Light | #14B8A6 | Hover / Highlights |
| Primary Dark | #115E59 | Active states |
| Accent | #D4A017 | Knowledge / Insight |
| Accent Light | #E6C34A | Hover |
| Accent Dark | #A87C0A | Active |

---

# Light Theme

```css
--background: #F8FAFC;
--surface: #FFFFFF;
--surface-alt: #F1F5F9;

--border: #E2E8F0;

--text-primary: #0F172A;
--text-secondary: #475569;
--text-muted: #94A3B8;

--hover: #ECFDF5;
```

---

# Dark Theme

```css
--background: #0F172A;
--surface: #1E293B;
--surface-alt: #334155;

--border: #475569;

--text-primary: #F8FAFC;
--text-secondary: #CBD5E1;
--text-muted: #94A3B8;
```

---

# Status Colours

```css
--success: #16A34A;
--warning: #F59E0B;
--danger: #DC2626;
--info: #2563EB;
```

---

# Knowledge Graph Colours

Ideas

```css
#0EA5E9
```

Projects

```css
#0F766E
```

Accelerators

```css
#D4A017
```

Technology

```css
#8B5CF6
```

Documentation

```css
#64748B
```

Security

```css
#DC2626
```

---

# Gradients

## Hero

```css
background: linear-gradient(
    135deg,
    #0F766E 0%,
    #14B8A6 100%
);
```

---

## Premium

```css
background: linear-gradient(
    135deg,
    #0F766E,
    #D4A017
);
```

---

## Dashboard

```css
background: linear-gradient(
    180deg,
    #FFFFFF,
    #F8FAFC
);
```

---

# Tailwind Theme

```ts
colors: {
  eolas: {

    primary: "#0F766E",
    primaryLight: "#14B8A6",
    primaryDark: "#115E59",

    accent: "#D4A017",
    accentLight: "#E6C34A",
    accentDark: "#A87C0A",

    background: "#F8FAFC",

    surface: "#FFFFFF",
    surfaceAlt: "#F1F5F9",

    border: "#E2E8F0",

    text: "#0F172A",
    secondary: "#475569",
    muted: "#94A3B8",

    success: "#16A34A",
    warning: "#F59E0B",
    danger: "#DC2626",
    info: "#2563EB"
  }
}
```

---

# Icon Colours

| Item | Colour |
|------|---------|
| Ideas | #0EA5E9 |
| Projects | #0F766E |
| Accelerators | #D4A017 |
| Knowledge | #8B5CF6 |
| Workers | #2563EB |
| Security | #DC2626 |
| GitHub | #24292F |

---

# Colour Usage

70% Neutral

- White
- Light Grey
- Slate

20% Primary

- Deep Teal

10% Accent

- Gold

The application should feel mostly white and light grey.

The teal should guide the eye.

Gold should only be used to highlight important actions, insights and achievements.

---

# UI Style

## Inspiration

- Apple
- Linear
- Raycast
- Arc Browser
- Notion

---

## Borders

```css
1px solid #E2E8F0
```

---

## Border Radius

Cards

```css
16px
```

Buttons

```css
12px
```

Inputs

```css
10px
```

---

## Shadows

Very subtle.

```css
0 1px 3px rgba(0,0,0,.08)
```

Large cards

```css
0 10px 30px rgba(15,23,42,.08)
```

---

## Typography

Preferred Fonts

- Geist
- Inter

Headings

600

Body

400

Buttons

500

Avoid oversized typography.

---

# Brand Keywords

- Knowledge
- Insight
- Discovery
- Connections
- Engineering
- Memory
- Simplicity
- Trust
- Local First
- Intelligence

---

# Icon Direction

The icon should represent:

- Knowledge
- Discovery
- Connections
- Mapping
- Growth
- Navigation

Avoid:

- Brains
- AI circuits
- Light bulbs
- Trees
- Generic "AI" symbols

The goal is for the icon to become recognisable on its own without relying on the word "Eolas".