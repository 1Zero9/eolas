# Digital clock (triangle numerals)

Renders digits as faceted SVG triangles (two triangles per 7-segment bar) for a
Predator-style triangular numeral look, in both a live clock and a countdown timer.

## Usage

```tsx
import { TriangleClock, TriangleCountdown } from '@/src/app/components/triangle-clock';

// Live HH:MM:SS clock
<TriangleClock />

// Countdown timer, e.g. a 25-minute focus timer
<TriangleCountdown initialSeconds={25 * 60} onComplete={() => console.log('done')} />
```

`TriangleDigit` (in `triangle-digit.tsx`) is the reusable single-digit primitive —
reuse it directly if you want a custom layout (e.g. a project-milestone dial
instead of a plain clock).

## Ideas this came from

Captured idea: "Digital clock made a triangles the numbers are made of triangles
desktop version maybe an iPhone PWA version but more for a project management —
set timers and set goals... linked up to projects." This accelerator covers the
core triangular-numeral rendering + countdown mechanics; project/milestone
linking is left to the consuming app.
