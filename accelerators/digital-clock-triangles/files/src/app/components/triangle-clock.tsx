'use client';

import { useEffect, useRef, useState } from 'react';
import TriangleDigit from './triangle-digit';

function Colon({ color = '#00FF9D' }: { color?: string }) {
  return (
    <svg viewBox="0 0 20 100" width={12} height={20} aria-hidden="true" style={{ alignSelf: 'center' }}>
      <polygon points="4,30 16,30 10,42" fill={color} />
      <polygon points="4,70 16,70 10,58" fill={color} />
    </svg>
  );
}

function DigitPair({ value, colorA, colorB }: { value: number; colorA?: string; colorB?: string }) {
  const tens = Math.floor(value / 10) % 10;
  const ones = value % 10;
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <TriangleDigit digit={tens} colorA={colorA} colorB={colorB} />
      <TriangleDigit digit={ones} colorA={colorA} colorB={colorB} />
    </div>
  );
}

function pad(value: number) {
  return value < 10 ? `0${value}` : `${value}`;
}

export function TriangleClock({ colorA, colorB }: { colorA?: string; colorB?: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} aria-label={now.toLocaleTimeString()}>
      <DigitPair value={now.getHours()} colorA={colorA} colorB={colorB} />
      <Colon color={colorA} />
      <DigitPair value={now.getMinutes()} colorA={colorA} colorB={colorB} />
      <Colon color={colorA} />
      <DigitPair value={now.getSeconds()} colorA={colorA} colorB={colorB} />
    </div>
  );
}

export function TriangleCountdown({
  initialSeconds,
  onComplete,
  colorA = '#FF8A00',
  colorB = '#FF2CF0',
}: {
  initialSeconds: number;
  onComplete?: () => void;
  colorA?: string;
  colorB?: string;
}) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [running, setRunning] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!running) return;
    if (remaining <= 0) {
      setRunning(false);
      onCompleteRef.current?.();
      return;
    }
    const timer = setInterval(() => {
      setRemaining((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [running, remaining]);

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} aria-label={`${pad(hours)}:${pad(minutes)}:${pad(seconds)} remaining`}>
        <DigitPair value={hours} colorA={colorA} colorB={colorB} />
        <Colon color={colorA} />
        <DigitPair value={minutes} colorA={colorA} colorB={colorB} />
        <Colon color={colorA} />
        <DigitPair value={seconds} colorA={colorA} colorB={colorB} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button type="button" onClick={() => setRunning((current) => !current)} disabled={remaining <= 0}>
          {running ? 'Pause' : 'Start'}
        </button>
        <button
          type="button"
          onClick={() => {
            setRunning(false);
            setRemaining(initialSeconds);
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
