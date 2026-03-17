"use client";

import { useRef, useEffect } from "react";

type OrbState = "idle" | "listening" | "responding";

interface ParticleOrbProps {
  size?: number;
  audioLevel?: number;
  state?: OrbState;
  className?: string;
}

interface Particle {
  baseX: number;
  baseY: number;
  baseZ: number;
  x: number;
  y: number;
  z: number;
  noisePhase: number;
  noiseSpeed: number;
}

function generateFibonacciSphere(count: number): Particle[] {
  const particles: Particle[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;

    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;

    particles.push({
      baseX: x,
      baseY: y,
      baseZ: z,
      x,
      y,
      z,
      noisePhase: Math.random() * Math.PI * 2,
      noiseSpeed: 0.6 + Math.random() * 0.8,
    });
  }
  return particles;
}

function noise3D(x: number, y: number, z: number): number {
  return (
    Math.sin(x * 1.27 + y * 3.43) * 0.35 +
    Math.sin(y * 2.17 + z * 1.31) * 0.25 +
    Math.sin(z * 3.71 + x * 0.97) * 0.2 +
    Math.sin(x * 0.53 + z * 2.89 + y * 1.73) * 0.2
  );
}

const PARTICLE_COUNT = 650;

export default function ParticleOrb({
  size = 200,
  audioLevel = 0,
  state = "idle",
  className,
}: ParticleOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);
  const smoothedAudioRef = useRef(0);
  const smoothedScaleRef = useRef(1);
  const stateRef = useRef(state);
  const audioLevelRef = useRef(audioLevel);

  stateRef.current = state;
  audioLevelRef.current = audioLevel;

  useEffect(() => {
    particlesRef.current = generateFibonacciSphere(PARTICLE_COUNT);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.36;

    const isDark = () => document.documentElement.classList.contains("dark");

    const animate = () => {
      timeRef.current += 1;
      const t = timeRef.current;
      const time = t * 0.012;

      const rawAudio = audioLevelRef.current;
      smoothedAudioRef.current +=
        (rawAudio - smoothedAudioRef.current) * 0.15;
      const audio = smoothedAudioRef.current;

      const currentState = stateRef.current;
      const targetScale = currentState === "responding" ? 0.55 : 1;
      smoothedScaleRef.current +=
        (targetScale - smoothedScaleRef.current) * 0.03;
      const scale = smoothedScaleRef.current;

      let noiseAmplitude: number;
      switch (currentState) {
        case "listening":
          noiseAmplitude = 0.04 + audio * 0.6;
          break;
        case "responding":
          noiseAmplitude = 0.015;
          break;
        default:
          noiseAmplitude = 0.02;
      }

      const baseAngle = Math.sin(t * 0.002) * 0.4;
      const breathe = Math.sin(t * 0.0035) * 0.15;
      const angle = baseAngle + breathe;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      const tiltAngle = 0.25;
      const cosT = Math.cos(tiltAngle);
      const sinT = Math.sin(tiltAngle);

      ctx.clearRect(0, 0, size, size);

      const particles = particlesRef.current;
      const projected: {
        px: number;
        py: number;
        depth: number;
      }[] = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        const freqBand = (i % 8) / 8;
        const audioModulation =
          currentState === "listening"
            ? audio * (0.5 + Math.sin(freqBand * Math.PI * 4 + time * 3) * 0.5)
            : 0;

        const noiseVal =
          noise3D(
            p.baseX * 2.5 + time * p.noiseSpeed,
            p.baseY * 2.5 + time * p.noiseSpeed * 0.7,
            p.baseZ * 2.5 + p.noisePhase
          ) * noiseAmplitude;

        const displacement = 1 + noiseVal + audioModulation * 0.25;
        p.x = p.baseX * displacement;
        p.y = p.baseY * displacement;
        p.z = p.baseZ * displacement;

        const rx = p.x * cosA - p.z * sinA;
        const rz = p.x * sinA + p.z * cosA;

        const ty = p.y * cosT - rz * sinT;
        const tz = p.y * sinT + rz * cosT;

        const r = radius * scale;
        const px = centerX + rx * r;
        const py = centerY + ty * r;

        projected.push({ px, py, depth: tz });
      }

      projected.sort((a, b) => a.depth - b.depth);

      const dark = isDark();
      const isResponding = currentState === "responding";

      for (let i = 0; i < projected.length; i++) {
        const { px, py, depth } = projected[i];
        const nd = (depth + 1) / 2;
        const alpha = 0.1 + nd * 0.72;
        const dotSize = 0.5 + nd * 1.1;

        ctx.beginPath();
        ctx.arc(px, py, dotSize, 0, Math.PI * 2);

        if (isResponding) {
          const r = Math.round(210 + nd * 30);
          const g = Math.round(185 + nd * 25);
          const b = Math.round(140 + nd * 20);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        } else if (dark) {
          const gray = Math.round(190 + nd * 40);
          ctx.fillStyle = `rgba(${gray}, ${gray - 5}, ${gray - 15}, ${alpha})`;
        } else {
          const v = Math.round(60 + nd * 80);
          ctx.fillStyle = `rgba(${v}, ${v - 3}, ${v - 8}, ${alpha})`;
        }

        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size }}
    />
  );
}
