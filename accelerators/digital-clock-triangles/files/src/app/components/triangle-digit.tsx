'use client';

type SegmentId = 'top' | 'topLeft' | 'topRight' | 'middle' | 'bottomLeft' | 'bottomRight' | 'bottom';

const DIGIT_SEGMENTS: Record<number, SegmentId[]> = {
  0: ['top', 'topLeft', 'topRight', 'bottomLeft', 'bottomRight', 'bottom'],
  1: ['topRight', 'bottomRight'],
  2: ['top', 'topRight', 'middle', 'bottomLeft', 'bottom'],
  3: ['top', 'topRight', 'middle', 'bottomRight', 'bottom'],
  4: ['topLeft', 'topRight', 'middle', 'bottomRight'],
  5: ['top', 'topLeft', 'middle', 'bottomRight', 'bottom'],
  6: ['top', 'topLeft', 'middle', 'bottomLeft', 'bottomRight', 'bottom'],
  7: ['top', 'topRight', 'bottomRight'],
  8: ['top', 'topLeft', 'topRight', 'middle', 'bottomLeft', 'bottomRight', 'bottom'],
  9: ['top', 'topLeft', 'topRight', 'middle', 'bottomRight', 'bottom'],
};

type Point = [number, number];

const SEGMENT_RECTS: Record<SegmentId, [Point, Point, Point, Point]> = {
  top: [
    [5, 0],
    [55, 0],
    [55, 10],
    [5, 10],
  ],
  topLeft: [
    [0, 5],
    [10, 5],
    [10, 50],
    [0, 50],
  ],
  topRight: [
    [50, 5],
    [60, 5],
    [60, 50],
    [50, 50],
  ],
  middle: [
    [5, 45],
    [55, 45],
    [55, 55],
    [5, 55],
  ],
  bottomLeft: [
    [0, 50],
    [10, 50],
    [10, 95],
    [0, 95],
  ],
  bottomRight: [
    [50, 50],
    [60, 50],
    [60, 95],
    [50, 95],
  ],
  bottom: [
    [5, 90],
    [55, 90],
    [55, 100],
    [5, 100],
  ],
};

function pointsToString(points: Point[]) {
  return points.map(([x, y]) => `${x},${y}`).join(' ');
}

function Segment({ id, colorA, colorB }: { id: SegmentId; colorA: string; colorB: string }) {
  const [p0, p1, p2, p3] = SEGMENT_RECTS[id];
  return (
    <g>
      <polygon points={pointsToString([p0, p1, p2])} fill={colorA} />
      <polygon points={pointsToString([p0, p2, p3])} fill={colorB} />
    </g>
  );
}

export default function TriangleDigit({
  digit,
  colorA = '#00FF9D',
  colorB = '#00B377',
  trackColor = 'rgba(255,255,255,0.06)',
  width = 36,
}: {
  digit: number;
  colorA?: string;
  colorB?: string;
  trackColor?: string;
  width?: number;
}) {
  const activeSegments = new Set(DIGIT_SEGMENTS[digit] ?? []);
  const allSegments = Object.keys(SEGMENT_RECTS) as SegmentId[];

  return (
    <svg viewBox="0 0 60 100" width={width} height={(width / 60) * 100} aria-hidden="true">
      {allSegments
        .filter((id) => !activeSegments.has(id))
        .map((id) => (
          <Segment key={id} id={id} colorA={trackColor} colorB={trackColor} />
        ))}
      {allSegments
        .filter((id) => activeSegments.has(id))
        .map((id) => (
          <Segment key={id} id={id} colorA={colorA} colorB={colorB} />
        ))}
    </svg>
  );
}
