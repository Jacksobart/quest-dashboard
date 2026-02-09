import { useState, useRef, useMemo } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Shield,
  CheckCircle2,
  Loader2,
  Circle,
  XCircle,
  Clock,
  ChevronDown,
  Quote,
  ShieldCheck,
  Minus,
} from 'lucide-react';
import { verificationGates } from '../lib/mock-data';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CheckStatus = 'pass' | 'fail' | 'running' | 'pending';

interface Check {
  name: string;
  status: CheckStatus;
  duration?: number;
  details?: string;
}

interface Gate {
  name: string;
  phase: string;
  checks: Check[];
  status: CheckStatus;
}

// ---------------------------------------------------------------------------
// Status configuration
// ---------------------------------------------------------------------------

const statusConfig: Record<
  CheckStatus,
  {
    border: string;
    bg: string;
    glow: string;
    text: string;
    label: string;
    badgeBg: string;
    badgeBorder: string;
    iconColor: string;
    lineClass: string;
  }
> = {
  pass: {
    border: 'border-emerald/40',
    bg: 'bg-emerald/[0.03]',
    glow: 'box-glow-emerald',
    text: 'text-emerald',
    label: 'PASS',
    badgeBg: 'bg-emerald/10',
    badgeBorder: 'border-emerald/30',
    iconColor: 'text-emerald',
    lineClass: 'bg-emerald/40',
  },
  running: {
    border: 'border-blue/50',
    bg: 'bg-blue/[0.03]',
    glow: 'box-glow-blue',
    text: 'text-blue',
    label: 'RUNNING',
    badgeBg: 'bg-blue/10',
    badgeBorder: 'border-blue/30',
    iconColor: 'text-blue',
    lineClass: 'bg-blue/40',
  },
  pending: {
    border: 'border-border',
    bg: 'bg-surface/50',
    glow: '',
    text: 'text-text-dim',
    label: 'PENDING',
    badgeBg: 'bg-deep',
    badgeBorder: 'border-border',
    iconColor: 'text-text-dim',
    lineClass: 'bg-text-dim/20',
  },
  fail: {
    border: 'border-red/40',
    bg: 'bg-red/[0.03]',
    glow: '',
    text: 'text-red',
    label: 'FAIL',
    badgeBg: 'bg-red/10',
    badgeBorder: 'border-red/30',
    iconColor: 'text-red',
    lineClass: 'bg-red/40',
  },
};

// ---------------------------------------------------------------------------
// Check status icon
// ---------------------------------------------------------------------------

function CheckStatusIcon({ status }: { status: CheckStatus }) {
  switch (status) {
    case 'pass':
      return <CheckCircle2 className="w-4 h-4 text-emerald flex-shrink-0" />;
    case 'fail':
      return <XCircle className="w-4 h-4 text-red flex-shrink-0" />;
    case 'running':
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="flex-shrink-0"
        >
          <Loader2 className="w-4 h-4 text-blue" />
        </motion.div>
      );
    case 'pending':
      return <Minus className="w-4 h-4 text-text-dim flex-shrink-0" />;
  }
}

// ---------------------------------------------------------------------------
// Gate status icon (larger, for the gate header)
// ---------------------------------------------------------------------------

function GateStatusIcon({ status }: { status: CheckStatus }) {
  const config = statusConfig[status];

  switch (status) {
    case 'pass':
      return (
        <div className="relative">
          <ShieldCheck className={`w-6 h-6 ${config.iconColor}`} />
        </div>
      );
    case 'fail':
      return <XCircle className={`w-6 h-6 ${config.iconColor}`} />;
    case 'running':
      return (
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className={`w-6 h-6 ${config.iconColor}`} />
          </motion.div>
          <motion.div
            className="absolute -inset-1 rounded-full border border-blue/30"
            animate={{ opacity: [0.2, 0.6, 0.2], scale: [0.95, 1.08, 0.95] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      );
    case 'pending':
      return <Circle className={`w-6 h-6 ${config.iconColor}`} />;
  }
}

// ---------------------------------------------------------------------------
// Timeline connector line
// ---------------------------------------------------------------------------

function TimelineConnector({ fromStatus, toStatus }: { fromStatus: CheckStatus; toStatus: CheckStatus }) {
  const isPassed = fromStatus === 'pass' && toStatus === 'pass';
  const isActive = fromStatus === 'pass' && toStatus === 'running';
  const isPending = toStatus === 'pending' || fromStatus === 'pending';

  if (isPassed) {
    return (
      <div className="flex justify-center">
        <div className="w-0.5 h-10 bg-emerald/40 rounded-full relative">
          <div
            className="absolute inset-0 rounded-full bg-emerald/20"
            style={{ filter: 'blur(3px)' }}
          />
        </div>
      </div>
    );
  }

  if (isActive) {
    return (
      <div className="flex justify-center">
        <div className="w-0.5 h-10 relative overflow-hidden">
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(180deg, var(--color-emerald), var(--color-blue))',
            }}
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* flowing dot */}
          {[0, 1].map((i) => (
            <motion.div
              key={i}
              className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue"
              style={{ filter: 'blur(0.5px)' }}
              initial={{ top: '-6px', opacity: 0 }}
              animate={{
                top: ['-6px', 'calc(100% + 6px)'],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: 1.4,
                delay: i * 0.7,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="flex justify-center">
        <div
          className="w-0.5 h-10"
          style={{
            backgroundImage:
              'repeating-linear-gradient(180deg, var(--color-text-dim) 0px, var(--color-text-dim) 3px, transparent 3px, transparent 7px)',
            opacity: 0.25,
          }}
        />
      </div>
    );
  }

  // from running to pending (transition point)
  return (
    <div className="flex justify-center">
      <div className="w-0.5 h-10 relative">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'repeating-linear-gradient(180deg, var(--color-blue-dim) 0px, var(--color-blue-dim) 3px, transparent 3px, transparent 7px)',
            opacity: 0.3,
          }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timeline node dot
// ---------------------------------------------------------------------------

function TimelineNode({ status }: { status: CheckStatus }) {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer ring */}
      <div
        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
          ${status === 'pass' ? 'border-emerald bg-emerald/20' : ''}
          ${status === 'running' ? 'border-blue bg-blue/20' : ''}
          ${status === 'pending' ? 'border-text-dim/40 bg-deep' : ''}
          ${status === 'fail' ? 'border-red bg-red/20' : ''}
        `}
      >
        <div
          className={`w-1.5 h-1.5 rounded-full
            ${status === 'pass' ? 'bg-emerald' : ''}
            ${status === 'running' ? 'bg-blue' : ''}
            ${status === 'pending' ? 'bg-text-dim/40' : ''}
            ${status === 'fail' ? 'bg-red' : ''}
          `}
        />
      </div>

      {/* Pulse ring for running */}
      {status === 'running' && (
        <motion.div
          className="absolute inset-0 rounded-full border border-blue/40"
          animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
        />
      )}

      {/* Glow for pass */}
      {status === 'pass' && (
        <div
          className="absolute -inset-1 rounded-full bg-emerald/20"
          style={{ filter: 'blur(4px)' }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Individual check row
// ---------------------------------------------------------------------------

function CheckRow({ check, index }: { check: Check; index: number }) {
  return (
    <motion.div
      className={`flex items-start gap-3 py-2 px-3 rounded-lg transition-colors
        ${check.status === 'running' ? 'bg-blue/[0.04]' : ''}
        ${check.status === 'pass' ? 'bg-emerald/[0.02]' : ''}
        ${check.status === 'fail' ? 'bg-red/[0.04]' : ''}
      `}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3, ease: 'easeOut' }}
    >
      <div className="mt-0.5">
        <CheckStatusIcon status={check.status} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`font-mono text-sm ${
              check.status === 'pass'
                ? 'text-text'
                : check.status === 'running'
                  ? 'text-blue'
                  : check.status === 'fail'
                    ? 'text-red'
                    : 'text-text-dim'
            }`}
          >
            {check.name}
          </span>
          {check.duration != null && (
            <span className="flex items-center gap-1 text-text-dim text-[11px] font-mono">
              <Clock className="w-3 h-3" />
              {check.duration}s
            </span>
          )}
        </div>
        {check.details && (
          <p
            className={`text-xs mt-0.5 leading-relaxed ${
              check.status === 'running' ? 'text-blue/60' : 'text-text-secondary'
            }`}
          >
            {check.details}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Gate card
// ---------------------------------------------------------------------------

function GateCard({
  gate,
  index,
  isInView,
}: {
  gate: Gate;
  index: number;
  isInView: boolean;
}) {
  const [expanded, setExpanded] = useState(
    gate.status === 'pass' || gate.status === 'running'
  );
  const config = statusConfig[gate.status];

  const passedChecks = gate.checks.filter((c) => c.status === 'pass').length;

  return (
    <motion.div
      className={`
        relative rounded-xl border overflow-hidden
        ${config.border} ${config.bg}
        ${gate.status === 'pass' ? config.glow : ''}
        ${gate.status === 'pending' ? 'opacity-50' : ''}
        transition-all duration-300
      `}
      initial={{ opacity: 0, y: 24 }}
      animate={
        isInView
          ? { opacity: gate.status === 'pending' ? 0.5 : 1, y: 0 }
          : {}
      }
      transition={{
        delay: 0.2 + index * 0.12,
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {/* Pulsing border for running gate */}
      {gate.status === 'running' && (
        <motion.div
          className="absolute -inset-px rounded-xl border border-blue/40 pointer-events-none"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Top accent line */}
      <div
        className={`h-px w-full ${
          gate.status === 'pass'
            ? 'bg-gradient-to-r from-transparent via-emerald/40 to-transparent'
            : gate.status === 'running'
              ? 'bg-gradient-to-r from-transparent via-blue/50 to-transparent'
              : gate.status === 'fail'
                ? 'bg-gradient-to-r from-transparent via-red/40 to-transparent'
                : 'bg-gradient-to-r from-transparent via-border-glow to-transparent'
        }`}
      />

      {/* Header - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
      >
        {/* Status icon */}
        <GateStatusIcon status={gate.status} />

        {/* Gate info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-mono font-bold text-base text-text tracking-tight">
              {gate.name}
            </h3>
            <span
              className={`badge text-[10px] ${config.badgeBg} ${config.badgeBorder} ${config.text} border`}
            >
              {gate.phase}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className={`font-mono text-xs font-semibold tracking-wider uppercase ${config.text}`}>
              {config.label}
            </span>
            <span className="text-text-dim text-xs font-mono">
              {passedChecks}/{gate.checks.length} checks
            </span>
          </div>
        </div>

        {/* Pass/total mini bar */}
        <div className="hidden sm:flex flex-col items-end gap-1.5">
          <div className="w-24 h-1.5 rounded-full bg-deep overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                gate.status === 'pass'
                  ? 'bg-emerald'
                  : gate.status === 'running'
                    ? 'bg-blue'
                    : gate.status === 'fail'
                      ? 'bg-red'
                      : 'bg-text-dim/30'
              }`}
              initial={{ width: '0%' }}
              animate={
                isInView
                  ? {
                      width: `${
                        gate.checks.length > 0
                          ? (passedChecks / gate.checks.length) * 100
                          : 0
                      }%`,
                    }
                  : {}
              }
              transition={{ delay: 0.4 + index * 0.12, duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Expand/collapse */}
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-text-dim" />
        </motion.div>
      </button>

      {/* Expandable check list */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 border-t border-border/30">
              <div className="pt-3 space-y-0.5">
                {gate.checks.map((check, i) => (
                  <CheckRow key={check.name} check={check} index={i} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function VerificationGates() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-80px' });

  const gates: Gate[] = verificationGates;

  // Compute totals
  const { totalChecks, passedChecks, runningChecks } = useMemo(() => {
    let total = 0;
    let passed = 0;
    let running = 0;
    for (const gate of gates) {
      for (const check of gate.checks) {
        total++;
        if (check.status === 'pass') passed++;
        if (check.status === 'running') running++;
      }
    }
    return { totalChecks: total, passedChecks: passed, runningChecks: running };
  }, [gates]);

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
          <div className="h-px w-8 bg-gradient-to-r from-transparent to-emerald/60" />
          <span className="font-mono text-xs text-emerald tracking-[0.3em] uppercase">
            Quality Assurance
          </span>
          <div className="h-px w-8 bg-gradient-to-l from-transparent to-emerald/60" />
        </div>

        <h2 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          <span className="text-text">VERIFICATION</span>{' '}
          <span className="gradient-text-blue">ARCHITECTURE</span>
        </h2>

        <p className="text-text-secondary max-w-2xl mx-auto text-base leading-relaxed">
          The harness is more important than the orchestrator
        </p>
      </motion.div>

      {/* ---- Stats bar ---- */}
      <motion.div
        className="flex flex-wrap items-center justify-center gap-6 mb-12"
        initial={{ opacity: 0, y: 12 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {/* Total checks badge */}
        <div className="flex items-center gap-3 px-5 py-3 rounded-xl border border-border bg-surface">
          <Shield className="w-5 h-5 text-emerald" />
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-bold text-emerald">
                {passedChecks}
              </span>
              <span className="font-mono text-lg text-text-dim">/</span>
              <span className="font-mono text-2xl font-bold text-text">
                {totalChecks}
              </span>
            </div>
            <p className="text-text-secondary text-xs font-mono tracking-wider uppercase">
              checks passed
            </p>
          </div>
        </div>

        {/* Running indicator */}
        {runningChecks > 0 && (
          <div className="flex items-center gap-3 px-5 py-3 rounded-xl border border-blue/20 bg-blue/[0.03]">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className="w-5 h-5 text-blue" />
            </motion.div>
            <div>
              <span className="font-mono text-lg font-bold text-blue">
                {runningChecks}
              </span>
              <p className="text-blue/60 text-xs font-mono tracking-wider uppercase">
                running
              </p>
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div className="w-full max-w-xs">
          <div className="h-2 rounded-full bg-deep border border-border overflow-hidden">
            <motion.div
              className="h-full rounded-full relative"
              style={{
                background:
                  'linear-gradient(90deg, var(--color-emerald), var(--color-emerald-dim))',
              }}
              initial={{ width: '0%' }}
              animate={
                isInView
                  ? { width: `${(passedChecks / totalChecks) * 100}%` }
                  : {}
              }
              transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-text-dim text-[10px] font-mono">0</span>
            <span className="text-text-dim text-[10px] font-mono">{totalChecks}</span>
          </div>
        </div>
      </motion.div>

      {/* ---- Timeline / Waterfall ---- */}
      <div className="max-w-3xl mx-auto">
        {gates.map((gate, i) => (
          <div key={gate.name} className="relative">
            {/* Timeline node + connector */}
            <div className="absolute left-6 top-0 bottom-0 flex flex-col items-center z-10 pointer-events-none">
              {/* Top connector (not for first) */}
              {i === 0 && <div className="h-4" />}

              {/* Node */}
              <div className="relative z-10 bg-void rounded-full p-0.5">
                <TimelineNode status={gate.status} />
              </div>

              {/* Bottom connector (not for last) */}
              {i < gates.length - 1 && (
                <div className="flex-1 w-full flex justify-center">
                  <TimelineConnector
                    fromStatus={gate.status}
                    toStatus={gates[i + 1].status}
                  />
                </div>
              )}
            </div>

            {/* Gate card - offset to the right of the timeline */}
            <div className="pl-16 pb-2">
              <GateCard gate={gate} index={i} isInView={isInView} />
            </div>
          </div>
        ))}
      </div>

      {/* ---- Quote block ---- */}
      <motion.div
        className="max-w-3xl mx-auto mt-16"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 1.0, duration: 0.6 }}
      >
        <div className="relative rounded-xl border border-emerald/20 bg-emerald/[0.02] p-8 overflow-hidden">
          {/* Background glow */}
          <div
            className="absolute top-0 right-0 w-64 h-64 bg-emerald/[0.06] rounded-full"
            style={{ filter: 'blur(80px)', transform: 'translate(30%, -50%)' }}
          />

          {/* Quote icon */}
          <div className="flex items-start gap-4 relative z-10">
            <div className="flex-shrink-0 mt-1">
              <div className="w-10 h-10 rounded-lg border border-emerald/30 bg-emerald/10 flex items-center justify-center">
                <Quote className="w-5 h-5 text-emerald" />
              </div>
            </div>
            <div>
              <blockquote className="font-display text-xl md:text-2xl font-bold text-text leading-snug tracking-tight">
                The agent does not decide when it is done.{' '}
                <span className="text-emerald">The harness decides</span>, based
                on evidence.
              </blockquote>
              <div className="mt-4 flex items-center gap-2">
                <div className="h-px w-6 bg-emerald/40" />
                <span className="font-mono text-xs text-emerald/60 tracking-widest uppercase">
                  Quest System Design Principle
                </span>
              </div>
            </div>
          </div>

          {/* Scanline accent */}
          <div
            className="absolute bottom-0 left-0 right-0 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent, var(--color-emerald-glow), transparent)',
            }}
          />
        </div>
      </motion.div>

      {/* ---- Bottom legend ---- */}
      <motion.div
        className="flex flex-wrap items-center justify-center gap-6 mt-12 text-xs font-mono"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 1.2, duration: 0.6 }}
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald" />
          <span className="text-text-secondary">Pass</span>
        </div>
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="w-3.5 h-3.5 text-blue" />
          </motion.div>
          <span className="text-text-secondary">Running</span>
        </div>
        <div className="flex items-center gap-2">
          <Minus className="w-3.5 h-3.5 text-text-dim" />
          <span className="text-text-secondary">Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="w-3.5 h-3.5 text-red" />
          <span className="text-text-secondary">Fail</span>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-emerald" />
          <span className="text-text-secondary">Verification Gate</span>
        </div>
      </motion.div>
    </div>
  );
}
