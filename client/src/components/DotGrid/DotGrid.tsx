import { useRef, useEffect, useCallback, useMemo } from 'react';
import { gsap } from 'gsap';

interface Dot {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
}

function hexToRgb(hex: string) {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  };
}

interface DotGridProps {
  dotSize?: number;
  gap?: number;
  baseColor?: string;
  activeColor?: string;
  proximity?: number;
  shockRadius?: number;
  shockStrength?: number;
  resistance?: number;
  returnDuration?: number;
}

export default function DotGrid({
  dotSize = 8,
  gap = 46,
  baseColor = '#ba80f2',
  activeColor = '#e5c9ff',
  proximity = 140,
  shockRadius = 280,
  shockStrength = 4,
  resistance = 400,
  returnDuration = 1.8,
}: DotGridProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const pointerRef = useRef({ x: -9999, y: -9999 });
  const rafRef = useRef<number>(0);

  const baseRgb = useMemo(() => hexToRgb(baseColor), [baseColor]);
  const activeRgb = useMemo(() => hexToRgb(activeColor), [activeColor]);

  const buildGrid = useCallback(() => {
    const wrap = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const { width, height } = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);

    const cell = dotSize + gap;
    const cols = Math.floor((width + gap) / cell);
    const rows = Math.floor((height + gap) / cell);
    const gridW = cell * cols - gap;
    const gridH = cell * rows - gap;
    const offsetX = (width - gridW) / 2;
    const offsetY = (height - gridH) / 2;

    const dots: Dot[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const bx = offsetX + c * cell + dotSize / 2;
        const by = offsetY + r * cell + dotSize / 2;
        dots.push({ baseX: bx, baseY: by, x: bx, y: by, vx: 0, vy: 0, opacity: 0.6 });
      }
    }
    dotsRef.current = dots;
  }, [dotSize, gap]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, width, height);

    const px = pointerRef.current.x;
    const py = pointerRef.current.y;
    const radius = dotSize / 2;

    for (const dot of dotsRef.current) {
      const dx = px - dot.baseX;
      const dy = py - dot.baseY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < shockRadius && dist > 0) {
        const force = ((shockRadius - dist) / shockRadius) * shockStrength;
        const angle = Math.atan2(dy, dx);
        const targetX = dot.baseX - Math.cos(angle) * force * 10;
        const targetY = dot.baseY - Math.sin(angle) * force * 10;

        dot.x += (targetX - dot.x) * 0.15;
        dot.y += (targetY - dot.y) * 0.15;
      } else {
        dot.x += (dot.baseX - dot.x) * (1 / (returnDuration * 30));
        dot.y += (dot.baseY - dot.y) * (1 / (returnDuration * 30));
      }

      const t = dist < proximity ? 1 - dist / proximity : 0;
      const r = Math.round(baseRgb.r + (activeRgb.r - baseRgb.r) * t);
      const g = Math.round(baseRgb.g + (activeRgb.g - baseRgb.g) * t);
      const b = Math.round(baseRgb.b + (activeRgb.b - baseRgb.b) * t);
      const alpha = 0.5 + t * 0.5;

      ctx.beginPath();
      ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fill();
    }

    rafRef.current = requestAnimationFrame(draw);
  }, [dotSize, proximity, shockRadius, shockStrength, returnDuration, baseRgb, activeRgb]);

  useEffect(() => {
    buildGrid();
    rafRef.current = requestAnimationFrame(draw);

    const handleResize = () => {
      buildGrid();
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;
      pointerRef.current.x = e.clientX - rect.left;
      pointerRef.current.y = e.clientY - rect.top;
    };

    const handlePointerLeave = () => {
      pointerRef.current.x = -9999;
      pointerRef.current.y = -9999;
    };

    window.addEventListener('resize', handleResize);
    const el = wrapperRef.current;
    el?.addEventListener('pointermove', handlePointerMove);
    el?.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', handleResize);
      el?.removeEventListener('pointermove', handlePointerMove);
      el?.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [buildGrid, draw]);

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
}
