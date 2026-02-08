import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  Loader2,
  ShieldCheck,
  Terminal,
  Search,
  FileText,
  Play,
  Rocket,
  Clock,
  Lock,
} from 'lucide-react';
import { phases } from '../lib/mock-data';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const phaseIcons = [Terminal, Search, FileText, Play, Rocket];

const statusConfig = {
  completed: {
    border: 'border-emerald/60',
    bg: 'bg-emerald/5',
    glow: 'box-glow-emerald',
    text: 'text-emerald',
    ringColor: 'bg-emerald',
    dotColor: 'bg-emerald',
    label: 'COMPLETED',
  },
  active: {
    border: 'border-cyan/60',
    bg: 'bg-cyan/5',
    glow: 'box-glow-cyan',
    text: 'text-cyan',
    ringColor: 'bg-cyan',
    dotColor: 'bg-cyan',
    label: 'ACTIVE',
  },
  pending: {
    border: 'border-border',
    bg: 'bg-surface',
    glow: '',
    text: 'text-text-dim',
    ringColor: 'bg-text-dim',
    dotColor: 'bg-text-dim',
    label: 'PENDING',
  },
  failed: {
    border: 'border-red/60',
    bg: 'bg-red/5',
    glow: 'box-glow-amber',
    text: 'text-red',
    ringColor: 'bg-red',
    dotColor: 'bg-red',
    label: 'FAILED',
  },
} as const;

// ---------------------------------------------------------------------------
// Animated flowing dots along connection lines (horizontal)
// ---------------------------------------------------------------------------

function FlowingDots({ active, color }: { active: boolean; color: string }) {
  if (!active) return null;

  return (
    <div className="absolute inset-0 overflow-hidden">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${color}`}
          style={{ filter: 'blur(0.5px)' }}
          initial={{ left: '-8px', opacity: 0 }}
          animate={{
            left: ['- 8px', 'calc(100% + 8px)'],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 1.8,
            delay: i * 0.6,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Animated flowing dots along connection lines (vertical - mobile)
// ---------------------------------------------------------------------------

function FlowingDotsVertical({ active, color }: { active: boolean; color: string }) {
  if (!active) return null;

  return (
    <div className="absolute inset-0 overflow-hidden">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full ${color}`}
          style={{ filter: 'blur(0.5px)' }}
          initial={{ top: '-8px', opacity: 0 }}
          animate={{
            top: ['-8px', 'calc(100% + 8px)'],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 1.4,
            delay: i * 0.45,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gate badge between phases
// ---------------------------------------------------------------------------

function GateBadge({
  gate,
  passed,
  index,
  isInView,
}: {
  gate: string;
  passed: boolean;
  index: number;
  isInView: boolean;
}) {
  return (
    <motion.div
      className="flex flex-col items-center gap-1 z-10"
      initial={{ opacity: 0, scale: 0.6 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ delay: 0.4 + index * 0.15, duration: 0.4 }}
    >
      <div
        className={`
          flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono font-semibold uppercase tracking-widest
          ${
            passed
              ? 'border-emerald/40 bg-emerald/10 text-emerald'
              : 'border-border bg-deep text-text-dim'
          }
        `}
      >
        {passed ? (
          <ShieldCheck className="w-3 h-3" />
        ) : (
          <Lock className="w-3 h-3" />
        )}
        <span>GATE</span>
      </div>
      <span
        className={`text-[9px] font-mono tracking-wider ${
          passed ? 'text-emerald-dim' : 'text-text-dim'
        }`}
      >
        {gate}
      </span>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Connection line between phases (horizontal, desktop)
// ---------------------------------------------------------------------------

function ConnectionLine({
  fromStatus,
  toStatus,
  index,
  isInView,
}: {
  fromStatus: string;
  toStatus: string;
  index: number;
  isInView: boolean;
}) {
  const isFlowing =
    fromStatus === 'completed' &&
    (toStatus === 'completed' || toStatus === 'active');

  const lineColor =
    fromStatus === 'completed' && toStatus === 'completed'
      ? 'bg-emerald/30'
      : fromStatus === 'completed' && toStatus === 'active'
        ? 'bg-cyan/30'
        : 'bg-border';

  const dotColor =
    fromStatus === 'completed' && toStatus === 'completed'
      ? 'bg-emerald'
      : 'bg-cyan';

  return (
    <motion.div
      className="hidden lg:flex flex-col items-center justify-center flex-shrink-0"
      style={{ width: '60px' }}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ delay: 0.3 + index * 0.12, duration: 0.5 }}
    >
      <div className="relative w-full h-[2px]">
        {/* Base line */}
        <div className={`absolute inset-0 ${lineColor} rounded-full`} />
        {/* Glow overlay for active lines */}
        {isFlowing && (
          <div
            className={`absolute inset-0 rounded-full ${
              toStatus === 'active' ? 'bg-cyan/20' : 'bg-emerald/20'
            }`}
            style={{
              filter: 'blur(3px)',
            }}
          />
        )}
        {/* Flowing data particles */}
        <FlowingDots active={isFlowing} color={dotColor} />
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Connection line between phases (vertical, mobile)
// ---------------------------------------------------------------------------

function ConnectionLineVertical({
  fromStatus,
  toStatus,
  index,
  isInView,
}: {
  fromStatus: string;
  toStatus: string;
  index: number;
  isInView: boolean;
}) {
  const isFlowing =
    fromStatus === 'completed' &&
    (toStatus === 'completed' || toStatus === 'active');

  const lineColor =
    fromStatus === 'completed' && toStatus === 'completed'
      ? 'bg-emerald/30'
      : fromStatus === 'completed' && toStatus === 'active'
        ? 'bg-cyan/30'
        : 'bg-border';

  const dotColor =
    fromStatus === 'completed' && toStatus === 'completed'
      ? 'bg-emerald'
      : 'bg-cyan';

  return (
    <motion.div
      className="flex lg:hidden flex-col items-center justify-center"
      style={{ height: '48px' }}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ delay: 0.3 + index * 0.12, duration: 0.5 }}
    >
      <div className="relative h-full w-[2px]">
        <div className={`absolute inset-0 ${lineColor} rounded-full`} />
        {isFlowing && (
          <div
            className={`absolute inset-0 rounded-full ${
              toStatus === 'active' ? 'bg-cyan/20' : 'bg-emerald/20'
            }`}
            style={{ filter: 'blur(3px)' }}
          />
        )}
        <FlowingDotsVertical active={isFlowing} color={dotColor} />
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Phase card
// ---------------------------------------------------------------------------

function PhaseCard({
  phase,
  index,
  isInView,
}: {
  phase: (typeof phases)[0];
  index: number;
  isInView: boolean;
}) {
  const config = statusConfig[phase.status];
  const Icon = phaseIcons[index] || Circle;

  return (
    <motion.div
      className={`
        relative flex flex-col rounded-xl border p-5 min-w-0
        ${config.border} ${config.bg}
        ${phase.status === 'active' ? config.glow : ''}
        ${phase.status === 'pending' ? 'opacity-50' : ''}
        transition-all duration-500
        lg:w-[220px] lg:flex-shrink-0
        w-full
      `}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: phase.status === 'pending' ? 0.5 : 1, y: 0 } : {}}
      transition={{
        delay: 0.15 + index * 0.12,
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {/* Active pulsing border ring */}
      {phase.status === 'active' && (
        <motion.div
          className="absolute -inset-[1px] rounded-xl border border-cyan/40 pointer-events-none"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Top row: phase number + status */}
      <div className="flex items-center justify-between mb-3">
        {/* Phase number circle */}
        <div
          className={`
            flex items-center justify-center w-9 h-9 rounded-full border
            ${
              phase.status === 'completed'
                ? 'border-emerald/40 bg-emerald/10'
                : phase.status === 'active'
                  ? 'border-cyan/40 bg-cyan/10'
                  : 'border-border bg-deep'
            }
          `}
        >
          <span
            className={`font-mono text-sm font-bold ${
              phase.status === 'completed'
                ? 'text-emerald'
                : phase.status === 'active'
                  ? 'text-cyan'
                  : 'text-text-dim'
            }`}
          >
            {phase.id}
          </span>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-1.5">
          {phase.status === 'completed' && (
            <CheckCircle2 className="w-4 h-4 text-emerald" />
          )}
          {phase.status === 'active' && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className="w-4 h-4 text-cyan" />
            </motion.div>
          )}
          {phase.status === 'pending' && (
            <Circle className="w-4 h-4 text-text-dim" />
          )}
          {phase.status === 'failed' && (
            <Circle className="w-4 h-4 text-red" />
          )}
          <span className={`text-[10px] font-mono font-semibold uppercase tracking-wider ${config.text}`}>
            {config.label}
          </span>
        </div>
      </div>

      {/* Phase icon + name */}
      <div className="flex items-center gap-2 mb-2">
        <Icon
          className={`w-4 h-4 flex-shrink-0 ${
            phase.status === 'completed'
              ? 'text-emerald'
              : phase.status === 'active'
                ? 'text-cyan'
                : 'text-text-dim'
          }`}
        />
        <h3
          className={`font-display font-bold text-base tracking-wide ${
            phase.status === 'active' ? 'text-cyan glow-cyan' : 'text-text'
          }`}
        >
          {phase.name}
        </h3>
      </div>

      {/* CLI command */}
      <div
        className={`
          font-mono text-[11px] leading-relaxed px-2.5 py-1.5 rounded-md mb-3 break-all
          ${
            phase.status === 'active'
              ? 'bg-cyan/10 text-cyan/80 border border-cyan/20'
              : phase.status === 'completed'
                ? 'bg-emerald/5 text-emerald/60 border border-emerald/10'
                : 'bg-deep text-text-dim border border-border'
          }
        `}
      >
        <span className="text-text-dim select-none">$ </span>
        {phase.command}
      </div>

      {/* Description */}
      <p className="text-text-secondary text-xs leading-relaxed mb-3 flex-1">
        {phase.description}
      </p>

      {/* Footer: gate badge + duration */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
        <div
          className={`
            badge text-[10px]
            ${
              phase.status === 'completed'
                ? 'bg-emerald/10 text-emerald border border-emerald/20'
                : phase.status === 'active'
                  ? 'bg-cyan/10 text-cyan border border-cyan/20'
                  : 'bg-deep text-text-dim border border-border'
            }
          `}
        >
          <ShieldCheck className="w-3 h-3" />
          {phase.gate}
        </div>
        {phase.duration != null && (
          <div className="flex items-center gap-1 text-text-dim">
            <Clock className="w-3 h-3" />
            <span className="font-mono text-[11px]">{phase.duration}s</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function PipelineVisualizer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-80px' });

  return (
    <div ref={containerRef} className="section-container">
      {/* ---- Section header ---- */}
      <motion.div
        className="text-center mb-16"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="h-px w-8 bg-gradient-to-r from-transparent to-cyan/60" />
          <span className="font-mono text-xs text-cyan tracking-[0.3em] uppercase">
            System Architecture
          </span>
          <div className="h-px w-8 bg-gradient-to-l from-transparent to-cyan/60" />
        </div>

        <h2 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          <span className="gradient-text-cyan">THE 5-PHASE</span>{' '}
          <span className="text-text">PIPELINE</span>
        </h2>

        <p className="text-text-secondary max-w-2xl mx-auto text-base leading-relaxed">
          Every Quest execution flows through five deterministic phases, each separated
          by a hard validation gate. Data only advances when every check passes.
          No exceptions. No overrides.
        </p>
      </motion.div>

      {/* ---- Pipeline progress bar (desktop) ---- */}
      <motion.div
        className="hidden lg:flex items-center justify-center mb-8"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <div className="relative h-1 w-full max-w-4xl rounded-full bg-border/40 overflow-hidden">
          {/* Completed progress */}
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background:
                'linear-gradient(90deg, var(--color-emerald), var(--color-cyan))',
            }}
            initial={{ width: '0%' }}
            animate={isInView ? { width: '65%' } : {}}
            transition={{ delay: 0.6, duration: 1.2, ease: 'easeOut' }}
          />
          {/* Shimmer on leading edge */}
          <motion.div
            className="absolute inset-y-0 w-20"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(0,229,255,0.4), transparent)',
            }}
            initial={{ left: '0%' }}
            animate={isInView ? { left: ['0%', '65%'] } : {}}
            transition={{
              delay: 0.6,
              duration: 1.2,
              ease: 'easeOut',
            }}
          />
        </div>
      </motion.div>

      {/* ---- Pipeline phases (horizontal on desktop, vertical on mobile) ---- */}

      {/* Desktop layout */}
      <div className="hidden lg:flex items-stretch justify-center gap-0">
        {phases.map((phase, i) => (
          <div key={phase.id} className="flex items-center">
            <PhaseCard phase={phase} index={i} isInView={isInView} />
            {i < phases.length - 1 && (
              <div className="flex flex-col items-center gap-2 mx-1">
                <ConnectionLine
                  fromStatus={phase.status}
                  toStatus={phases[i + 1].status}
                  index={i}
                  isInView={isInView}
                />
                <GateBadge
                  gate={phase.gate}
                  passed={phase.status === 'completed'}
                  index={i}
                  isInView={isInView}
                />
                <ConnectionLine
                  fromStatus={phase.status}
                  toStatus={phases[i + 1].status}
                  index={i}
                  isInView={isInView}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile layout */}
      <div className="flex lg:hidden flex-col items-center gap-0">
        {phases.map((phase, i) => (
          <div key={phase.id} className="flex flex-col items-center w-full max-w-sm">
            <PhaseCard phase={phase} index={i} isInView={isInView} />
            {i < phases.length - 1 && (
              <div className="flex flex-col items-center gap-1 my-1">
                <ConnectionLineVertical
                  fromStatus={phase.status}
                  toStatus={phases[i + 1].status}
                  index={i}
                  isInView={isInView}
                />
                <GateBadge
                  gate={phase.gate}
                  passed={phase.status === 'completed'}
                  index={i}
                  isInView={isInView}
                />
                <ConnectionLineVertical
                  fromStatus={phase.status}
                  toStatus={phases[i + 1].status}
                  index={i}
                  isInView={isInView}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ---- Bottom legend ---- */}
      <motion.div
        className="flex flex-wrap items-center justify-center gap-6 mt-12 text-xs font-mono"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 1.0, duration: 0.6 }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald" />
          <span className="text-text-secondary">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <motion.div
            className="w-2 h-2 rounded-full bg-cyan"
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-text-secondary">Active</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-text-dim" />
          <span className="text-text-secondary">Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald" />
          <span className="text-text-secondary">Validation Gate</span>
        </div>
        <div className="flex items-center gap-2">
          <motion.div
            className="flex gap-0.5"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="w-1 h-1 rounded-full bg-cyan" />
            <div className="w-1 h-1 rounded-full bg-cyan" />
            <div className="w-1 h-1 rounded-full bg-cyan" />
          </motion.div>
          <span className="text-text-secondary">Data Flow</span>
        </div>
      </motion.div>
    </div>
  );
}
