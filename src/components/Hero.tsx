import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import {
  Crosshair,
  Bot,
  CheckCircle2,
  ShieldCheck,
  ChevronDown,
  Command,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Typewriter phrases
// ---------------------------------------------------------------------------
const PHRASES = [
  'Spec \u2192 Verified Mission Plans',
  'Zero file ownership overlaps',
  'Machine-verifiable acceptance criteria',
  'The harness is more important than the orchestrator',
  'Verification is the moat',
];

// ---------------------------------------------------------------------------
// Stats data
// ---------------------------------------------------------------------------
const STATS: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  glow: string;
}[] = [
  {
    label: 'Missions',
    value: 12,
    icon: Crosshair,
    color: 'text-cyan',
    glow: 'box-glow-cyan',
  },
  {
    label: 'Agents',
    value: 4,
    icon: Bot,
    color: 'text-purple',
    glow: 'box-glow-purple',
  },
  {
    label: 'Acceptance Criteria',
    value: 22,
    icon: CheckCircle2,
    color: 'text-emerald',
    glow: 'box-glow-emerald',
  },
  {
    label: 'Validation Gates',
    value: 5,
    icon: ShieldCheck,
    color: 'text-amber',
    glow: 'box-glow-amber',
  },
];

// ---------------------------------------------------------------------------
// Animated counter hook
// ---------------------------------------------------------------------------
function AnimatedCounter({
  target,
  duration = 2,
  delay = 0,
}: {
  target: number;
  duration?: number;
  delay?: number;
}) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(count, target, {
      duration,
      delay,
      ease: 'easeOut',
    });
    const unsubscribe = rounded.on('change', (v) => setDisplay(v));
    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [count, rounded, target, duration, delay]);

  return <span>{display}</span>;
}

// ---------------------------------------------------------------------------
// Particle field (canvas-based, lightweight)
// ---------------------------------------------------------------------------
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const PARTICLE_COUNT = 120;
    const MOUSE_RADIUS = 200;

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      opacity: number;
      baseOpacity: number;
      hue: number;
    }

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => {
      const baseOpacity = Math.random() * 0.5 + 0.1;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 1.5 + 0.5,
        opacity: baseOpacity,
        baseOpacity,
        hue: Math.random() > 0.7 ? 270 : 239, // Mix of indigo and purple
      };
    });

    function draw() {
      ctx!.clearRect(0, 0, width, height);
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (const p of particles) {
        // Mouse repulsion
        const dmx = p.x - mx;
        const dmy = p.y - my;
        const distMouse = Math.sqrt(dmx * dmx + dmy * dmy);

        if (distMouse < MOUSE_RADIUS && distMouse > 0) {
          const force = (MOUSE_RADIUS - distMouse) / MOUSE_RADIUS;
          const angle = Math.atan2(dmy, dmx);
          p.vx += Math.cos(angle) * force * 0.15;
          p.vy += Math.sin(angle) * force * 0.15;
          p.opacity = Math.min(p.baseOpacity + force * 0.6, 1);
        } else {
          p.opacity += (p.baseOpacity - p.opacity) * 0.05;
        }

        // Damping
        p.vx *= 0.99;
        p.vy *= 0.99;

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        const hue = p.hue;
        const sat = hue === 239 ? 90 : 70;
        ctx!.fillStyle = `hsla(${hue}, ${sat}%, 60%, ${p.opacity})`;
        ctx!.fill();
      }

      // Connection lines with color based on proximity to mouse
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            const midX = (particles[i].x + particles[j].x) / 2;
            const midY = (particles[i].y + particles[j].y) / 2;
            const distFromMouse = Math.sqrt((midX - mx) ** 2 + (midY - my) ** 2);
            const mouseInfluence = distFromMouse < MOUSE_RADIUS ? (1 - distFromMouse / MOUSE_RADIUS) : 0;
            const alpha = 0.06 * (1 - dist / 140) + mouseInfluence * 0.12;

            ctx!.beginPath();
            ctx!.moveTo(particles[i].x, particles[i].y);
            ctx!.lineTo(particles[j].x, particles[j].y);

            if (mouseInfluence > 0.3) {
              ctx!.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
            } else {
              ctx!.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
            }
            ctx!.lineWidth = 0.5 + mouseInfluence * 1;
            ctx!.stroke();
          }
        }
      }

      animationRef.current = requestAnimationFrame(draw);
    }

    draw();

    function handleResize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = width;
      canvas!.height = height;
    }

    function handleMouse(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    }

    function handleMouseLeave() {
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouse);
    window.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouse);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0"
      style={{ zIndex: 0 }}
    />
  );
}

// ---------------------------------------------------------------------------
// Typewriter effect
// ---------------------------------------------------------------------------
function Typewriter({ phrases }: { phrases: string[] }) {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const currentPhrase = phrases[phraseIdx];

  const tick = useCallback(() => {
    if (!deleting) {
      if (charIdx < currentPhrase.length) {
        setCharIdx((c) => c + 1);
      } else {
        // pause at end of phrase then start deleting
        setTimeout(() => setDeleting(true), 2200);
        return;
      }
    } else {
      if (charIdx > 0) {
        setCharIdx((c) => c - 1);
      } else {
        setDeleting(false);
        setPhraseIdx((p) => (p + 1) % phrases.length);
        return;
      }
    }
  }, [charIdx, deleting, currentPhrase, phrases]);

  useEffect(() => {
    const speed = deleting ? 30 : 55;
    const timer = setTimeout(tick, speed);
    return () => clearTimeout(timer);
  }, [tick, deleting]);

  return (
    <span className="font-mono text-cyan text-base sm:text-lg tracking-wide">
      {currentPhrase.slice(0, charIdx)}
      <span className="inline-block w-[2px] h-[1.1em] bg-cyan align-middle ml-0.5 animate-pulse" />
    </span>
  );
}

// ---------------------------------------------------------------------------
// Floating gradient orbs
// ---------------------------------------------------------------------------
const ORB_CONFIGS = [
  {
    color: 'bg-cyan/[0.08]',
    size: 'w-[500px] h-[500px]',
    blur: 'blur-[130px]',
    initialX: -120,
    initialY: -80,
    animateX: [120, -60, 120],
    animateY: [60, -120, 60],
    duration: 22,
  },
  {
    color: 'bg-purple/[0.10]',
    size: 'w-[420px] h-[420px]',
    blur: 'blur-[110px]',
    initialX: 200,
    initialY: 100,
    animateX: [-100, 180, -100],
    animateY: [-80, 140, -80],
    duration: 28,
  },
  {
    color: 'bg-amber/[0.06]',
    size: 'w-[350px] h-[350px]',
    blur: 'blur-[100px]',
    initialX: 0,
    initialY: 200,
    animateX: [80, -140, 80],
    animateY: [-100, 60, -100],
    duration: 25,
  },
];

// ---------------------------------------------------------------------------
// Stagger variants
// ---------------------------------------------------------------------------
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

const childVariants = {
  hidden: { opacity: 0, y: 30, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
};

// ---------------------------------------------------------------------------
// Hero component
// ---------------------------------------------------------------------------
export default function Hero() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* ---- Background layers ---- */}

      {/* Grid pattern */}
      <div className="absolute inset-0 grid-bg" />

      {/* Particle canvas */}
      <ParticleField />

      {/* Floating gradient orbs */}
      {ORB_CONFIGS.map((orb, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full ${orb.color} ${orb.size} ${orb.blur} pointer-events-none`}
          initial={{ x: orb.initialX, y: orb.initialY }}
          animate={{ x: orb.animateX, y: orb.animateY }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{ top: '50%', left: '50%', translate: '-50% -50%' }}
        />
      ))}

      {/* Noise texture */}
      <div className="absolute inset-0 noise pointer-events-none" />

      {/* Scanline overlay */}
      <div className="absolute inset-0 scanlines pointer-events-none" />

      {/* Radial vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, var(--color-void) 100%)',
        }}
      />

      {/* ---- Content ---- */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-5xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Badge */}
        <motion.div variants={childVariants}>
          <span className="badge bg-cyan/[0.08] text-cyan border border-cyan/20 mb-8 inline-flex">
            <span className="w-2 h-2 rounded-full bg-cyan animate-pulse-ring inline-block" />
            SYSTEM ONLINE
          </span>
        </motion.div>

        {/* Main title with glitch */}
        <motion.h1
          variants={childVariants}
          className="font-display font-extrabold text-[6rem] sm:text-[8rem] md:text-[10rem] leading-[0.85] tracking-tight select-none"
        >
          <span
            className="gradient-text-cyan glow-cyan glitch-wrapper inline-block"
            data-text="QUEST"
          >
            QUEST
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={childVariants}
          className="font-body text-text-secondary text-xl sm:text-2xl md:text-3xl tracking-[0.25em] uppercase mt-4 mb-10"
        >
          The Planning Engine
        </motion.p>

        {/* Decorative divider */}
        <motion.div
          variants={childVariants}
          className="flex items-center gap-3 mb-8"
        >
          <span className="block w-12 h-px bg-gradient-to-r from-transparent to-cyan/60" />
          <span className="block w-2 h-2 rotate-45 border border-cyan/60" />
          <span className="block w-24 h-px bg-gradient-to-r from-cyan/60 via-purple/40 to-transparent" />
          <span className="block w-2 h-2 rotate-45 border border-purple/60" />
          <span className="block w-12 h-px bg-gradient-to-l from-transparent to-purple/60" />
        </motion.div>

        {/* Typewriter */}
        <motion.div
          variants={childVariants}
          className="h-8 flex items-center justify-center mb-14"
        >
          <span className="text-text-dim font-mono text-sm mr-2 select-none">
            &gt;
          </span>
          <Typewriter phrases={PHRASES} />
        </motion.div>

        {/* Stat cards */}
        <motion.div
          variants={childVariants}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl"
        >
          {STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                className={`card p-5 flex flex-col items-center gap-2 group hover:${stat.glow} transition-shadow duration-500`}
                whileHover={{ y: -4, scale: 1.03 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <Icon
                  className={`${stat.color} w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity`}
                />
                <span className={`font-display text-3xl font-bold ${stat.color}`}>
                  <AnimatedCounter
                    target={stat.value}
                    duration={2}
                    delay={1.2 + i * 0.15}
                  />
                </span>
                <span className="font-mono text-text-dim text-[11px] tracking-wider uppercase">
                  {stat.label}
                </span>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>

      {/* ---- Cmd+K hint ---- */}
      <motion.div
        className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.5, duration: 1 }}
      >
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface/50 backdrop-blur-sm border border-border/40">
          <Command className="w-3 h-3 text-text-dim" />
          <span className="font-mono text-[10px] text-text-dim tracking-wider">
            Press
          </span>
          <kbd className="px-1.5 py-0.5 rounded border border-border bg-deep text-[10px] font-mono text-cyan">
            ⌘K
          </kbd>
          <span className="font-mono text-[10px] text-text-dim tracking-wider">
            to navigate
          </span>
        </div>
      </motion.div>

      {/* ---- Scroll indicator ---- */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3, duration: 1 }}
      >
        <span className="font-mono text-text-dim text-[10px] tracking-[0.3em] uppercase mb-1">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown className="w-5 h-5 text-cyan/50" />
        </motion.div>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.2,
          }}
        >
          <ChevronDown className="w-5 h-5 text-cyan/25 -mt-3" />
        </motion.div>
      </motion.div>

      {/* ---- Bottom edge fade ---- */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-void to-transparent pointer-events-none z-10" />
    </div>
  );
}
