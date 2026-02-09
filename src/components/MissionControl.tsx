import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  CheckCircle,
  Play,
  Pause,
  AlertTriangle,
  FileCode,
  RotateCcw,
  Timer,
  Target,
  Zap,
  ShieldCheck,
  Activity,
  FileText,
  Eye,
} from 'lucide-react';
import { missions, telemetryStats } from '../lib/mock-data';
import type { Mission } from '../lib/mock-data';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AGENT_COLORS: Record<string, string> = {
  backend: '#ff0080',
  frontend: '#8b5cf6',
  database: '#fbbf24',
  testing: '#34d399',
};

const PRIORITY_CONFIG: Record<number, { label: string; color: string; bg: string; border: string }> = {
  1: { label: 'P1', color: 'var(--color-red)', bg: 'var(--color-red-glow)', border: 'var(--color-red-dim)' },
  2: { label: 'P2', color: 'var(--color-amber)', bg: 'var(--color-amber-glow)', border: 'var(--color-amber-dim)' },
  3: { label: 'P3', color: 'var(--color-purple)', bg: 'var(--color-purple-glow)', border: 'var(--color-purple-dim)' },
  4: { label: 'P4', color: 'var(--color-text-dim)', bg: 'rgba(85,85,119,0.15)', border: 'var(--color-text-dim)' },
};

const STATUS_CONFIG: Record<
  Mission['status'],
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  completed: {
    label: 'COMPLETED',
    color: 'var(--color-emerald)',
    bg: 'rgba(52,211,153,0.1)',
    icon: <CheckCircle size={12} />,
  },
  running: {
    label: 'RUNNING',
    color: 'var(--color-cyan)',
    bg: 'rgba(255,0,128,0.1)',
    icon: <Play size={12} />,
  },
  pending: {
    label: 'PENDING',
    color: 'var(--color-text-dim)',
    bg: 'rgba(85,85,119,0.1)',
    icon: <Pause size={12} />,
  },
  retrying: {
    label: 'RETRYING',
    color: 'var(--color-amber)',
    bg: 'rgba(251,191,36,0.1)',
    icon: <RotateCcw size={12} />,
  },
  failed: {
    label: 'FAILED',
    color: 'var(--color-red)',
    bg: 'rgba(244,63,94,0.1)',
    icon: <AlertTriangle size={12} />,
  },
};

type FilterKey = 'all' | 'completed' | 'running' | 'pending';

const FILTERS: { key: FilterKey; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'All', icon: <Target size={13} /> },
  { key: 'completed', label: 'Completed', icon: <CheckCircle size={13} /> },
  { key: 'running', label: 'Running', icon: <Activity size={13} /> },
  { key: 'pending', label: 'Pending', icon: <Pause size={13} /> },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Animated Counter
// ---------------------------------------------------------------------------

function AnimatedCounter({ value, duration = 1.2 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (value - start) * eased);
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value, duration]);

  return <span>{display}</span>;
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon,
  color,
  animate = false,
  suffix,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  animate?: boolean;
  suffix?: string;
}) {
  return (
    <motion.div
      className="card px-4 py-3 flex flex-col gap-1 min-w-0"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-2">
        <span style={{ color }} className="flex-shrink-0 opacity-80">
          {icon}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-dim truncate">
          {label}
        </span>
      </div>
      <div className="font-display font-bold text-xl" style={{ color }}>
        {animate ? <AnimatedCounter value={value} /> : value}
        {suffix && (
          <span className="text-xs font-mono text-text-dim ml-1">{suffix}</span>
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Mission Card
// ---------------------------------------------------------------------------

function MissionCard({ mission, index }: { mission: Mission; index: number }) {
  const agentColor = AGENT_COLORS[mission.agent] || '#888';
  const priority = PRIORITY_CONFIG[mission.priority] || PRIORITY_CONFIG[4];
  const status = STATUS_CONFIG[mission.status];
  const isRunning = mission.status === 'running';
  const isCompleted = mission.status === 'completed';
  const isPending = mission.status === 'pending';

  // Card-level styling based on status
  const cardBorderStyle = isRunning
    ? { borderColor: 'rgba(255,0,128,0.25)' }
    : isCompleted
      ? { borderColor: 'rgba(52,211,153,0.15)' }
      : {};

  const cardBgOverlay = isCompleted
    ? 'rgba(52,211,153,0.02)'
    : isRunning
      ? 'rgba(255,0,128,0.01)'
      : undefined;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: isPending ? 0.7 : 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.97 }}
      transition={{
        duration: 0.45,
        delay: index * 0.04,
        layout: { type: 'spring', stiffness: 300, damping: 30 },
      }}
      className="relative"
    >
      {/* Animated glow border for running missions */}
      {isRunning && (
        <motion.div
          className="absolute -inset-px rounded-xl pointer-events-none"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,0,128,0.2), rgba(139,92,246,0.1), rgba(255,0,128,0.2))',
            backgroundSize: '200% 200%',
          }}
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
      )}

      <div
        className="card relative p-4 flex flex-col gap-3 h-full"
        style={{
          ...cardBorderStyle,
          background: cardBgOverlay
            ? `linear-gradient(135deg, ${cardBgOverlay}, var(--color-surface))`
            : undefined,
        }}
      >
        {/* Header: ID + Priority + Status */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-xs font-semibold text-text tracking-wide">
              {mission.id.toUpperCase()}
            </span>
            <span
              className="badge text-[10px] py-0 px-2"
              style={{
                color: priority.color,
                background: priority.bg,
                border: `1px solid ${priority.border}`,
              }}
            >
              {priority.label}
            </span>
          </div>

          {/* Status badge */}
          <motion.span
            className="badge text-[10px] py-0.5 px-2 gap-1 flex-shrink-0"
            style={{
              color: status.color,
              background: status.bg,
              border: `1px solid ${status.color}25`,
            }}
            animate={
              isRunning
                ? { opacity: [1, 0.6, 1] }
                : {}
            }
            transition={
              isRunning
                ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                : {}
            }
          >
            {status.icon}
            {status.label}
          </motion.span>
        </div>

        {/* Agent */}
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              backgroundColor: agentColor,
              boxShadow: `0 0 6px ${agentColor}60`,
            }}
          />
          <span
            className="font-mono text-[11px] font-medium uppercase tracking-[0.08em]"
            style={{ color: agentColor }}
          >
            {mission.agent}
          </span>
        </div>

        {/* Objective */}
        <p className="text-sm text-text-secondary leading-relaxed line-clamp-2">
          {mission.objective}
        </p>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-text-dim uppercase tracking-wider">
              Progress
            </span>
            <span
              className="font-mono text-[11px] font-semibold"
              style={{ color: isCompleted ? 'var(--color-emerald)' : 'var(--color-text-secondary)' }}
            >
              {mission.progress}%
            </span>
          </div>
          <div className="relative h-1.5 rounded-full bg-elevated overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: isCompleted
                  ? 'linear-gradient(90deg, var(--color-emerald-dim), var(--color-emerald))'
                  : isRunning
                    ? 'linear-gradient(90deg, var(--color-cyan-dim), var(--color-cyan))'
                    : 'linear-gradient(90deg, var(--color-text-dim), var(--color-text-dim))',
                boxShadow: isRunning
                  ? '0 0 8px var(--color-cyan-glow)'
                  : isCompleted
                    ? '0 0 8px var(--color-emerald-glow)'
                    : 'none',
              }}
              initial={{ width: '0%' }}
              animate={{ width: `${mission.progress}%` }}
              transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1], delay: index * 0.05 }}
            />
            {/* Shimmer effect on running progress bars */}
            {isRunning && (
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  width: `${mission.progress}%`,
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
                  backgroundSize: '200% 100%',
                }}
                animate={{ backgroundPosition: ['-200% 0', '200% 0'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
            )}
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1.5 text-[11px] font-mono text-text-dim">
          {/* File counts */}
          <div className="flex items-center gap-1">
            <FileCode size={11} className="opacity-60" />
            <span>{mission.files.own.length} owned</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye size={11} className="opacity-60" />
            <span>{mission.files.read.length} read</span>
          </div>

          {/* Retry count */}
          {mission.retryCount > 0 && (
            <div className="flex items-center gap-1" style={{ color: 'var(--color-amber)' }}>
              <RotateCcw size={11} />
              <span>
                {mission.retryCount} retr{mission.retryCount === 1 ? 'y' : 'ies'}
              </span>
            </div>
          )}

          {/* Duration */}
          {mission.duration != null && (
            <div className="flex items-center gap-1" style={{ color: 'var(--color-emerald-dim)' }}>
              <Timer size={11} />
              <span>{formatDuration(mission.duration)}</span>
            </div>
          )}
        </div>

        {/* Acceptance criteria */}
        <div className="flex items-center gap-2 pt-1 border-t border-border/60">
          <ShieldCheck size={12} className="text-text-dim flex-shrink-0" />
          <span className="font-mono text-[10px] text-text-dim uppercase tracking-wider">
            Acceptance
          </span>
          <div className="flex items-center gap-1 ml-auto">
            {mission.acceptance.map((ac) => {
              // For completed missions, all criteria passed.
              // For running, we simulate partial pass.
              // For pending, all are pending.
              const passed = isCompleted;
              const inProgress = isRunning;
              return (
                <span
                  key={ac.id}
                  className="w-4 h-4 rounded-sm flex items-center justify-center text-[9px] font-mono font-bold"
                  style={{
                    background: passed
                      ? 'rgba(52,211,153,0.15)'
                      : inProgress
                        ? 'rgba(255,0,128,0.1)'
                        : 'rgba(85,85,119,0.1)',
                    color: passed
                      ? 'var(--color-emerald)'
                      : inProgress
                        ? 'var(--color-cyan)'
                        : 'var(--color-text-dim)',
                    border: `1px solid ${
                      passed
                        ? 'rgba(52,211,153,0.3)'
                        : inProgress
                          ? 'rgba(255,0,128,0.2)'
                          : 'rgba(85,85,119,0.2)'
                    }`,
                  }}
                  title={`${ac.id}: ${ac.cmd}`}
                >
                  {passed ? '\u2713' : inProgress ? '\u2022' : '\u2014'}
                </span>
              );
            })}
            <span className="font-mono text-[10px] text-text-dim ml-1">
              {mission.acceptance.length}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function MissionControl() {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [elapsed, setElapsed] = useState(telemetryStats.questElapsed);

  // Tick the elapsed timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter missions
  const filteredMissions = useMemo(() => {
    if (filter === 'all') return missions;
    if (filter === 'running')
      return missions.filter((m) => m.status === 'running' || m.status === 'retrying');
    return missions.filter((m) => m.status === filter);
  }, [filter]);

  // Stats
  const stats = telemetryStats;

  return (
    <div className="section-container">
      {/* Section header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: 'rgba(255,0,128,0.1)',
              border: '1px solid rgba(255,0,128,0.2)',
            }}
          >
            <Zap size={16} style={{ color: 'var(--color-cyan)' }} />
          </div>
          <h2 className="font-display font-bold text-2xl md:text-3xl tracking-tight text-text">
            MISSION{' '}
            <span className="gradient-text-cyan">CONTROL</span>
          </h2>
        </div>
        <p className="text-text-secondary text-sm md:text-base max-w-2xl leading-relaxed">
          Each mission executes in an independent Ralph loop &mdash; an autonomous edit-test-retry cycle
          that drives toward acceptance criteria. Missions run in parallel within DAG-ordered batches.
        </p>
      </div>

      {/* Elapsed timer bar */}
      <motion.div
        className="card px-4 py-3 mb-6 flex items-center justify-between flex-wrap gap-3"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <motion.div
              className="absolute w-6 h-6 rounded-full"
              style={{ background: 'var(--color-cyan-glow)' }}
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <Clock size={14} style={{ color: 'var(--color-cyan)' }} className="relative z-10" />
          </div>
          <span className="font-mono text-[11px] text-text-dim uppercase tracking-[0.1em]">
            Quest Elapsed
          </span>
          <span
            className="font-mono text-lg font-bold tracking-wider glow-cyan"
            style={{ color: 'var(--color-cyan)' }}
          >
            {formatElapsed(elapsed)}
          </span>
        </div>

        <div className="flex items-center gap-4 font-mono text-[11px] text-text-dim">
          <span>
            Batch{' '}
            <span className="text-text font-semibold">
              {stats.currentBatch}/{stats.dagBatches}
            </span>
          </span>
          <span className="text-border">|</span>
          <span>
            Model{' '}
            <span className="text-purple font-semibold">{stats.modelUsed}</span>
          </span>
          <span className="text-border">|</span>
          <span>
            Backend{' '}
            <span className="text-amber font-semibold">{stats.backend}</span>
          </span>
        </div>
      </motion.div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatCard
          label="Total Missions"
          value={stats.totalMissions}
          icon={<Target size={14} />}
          color="var(--color-text)"
        />
        <StatCard
          label="Completed"
          value={stats.completedMissions}
          icon={<CheckCircle size={14} />}
          color="var(--color-emerald)"
        />
        <StatCard
          label="Running"
          value={stats.runningMissions}
          icon={<Activity size={14} />}
          color="var(--color-cyan)"
          animate
        />
        <StatCard
          label="Pending"
          value={stats.pendingMissions}
          icon={<Pause size={14} />}
          color="var(--color-text-dim)"
        />
        <StatCard
          label="Total Retries"
          value={stats.totalRetries}
          icon={<RotateCcw size={14} />}
          color="var(--color-amber)"
        />
        <StatCard
          label="Avg Duration"
          value={Math.round(stats.avgMissionDuration)}
          icon={<Timer size={14} />}
          color="var(--color-purple)"
          suffix="s"
        />
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        <FileText size={13} className="text-text-dim flex-shrink-0" />
        <span className="font-mono text-[10px] text-text-dim uppercase tracking-[0.12em] flex-shrink-0 mr-1">
          Filter
        </span>
        {FILTERS.map((f) => {
          const isActive = filter === f.key;
          return (
            <motion.button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="relative font-mono text-[11px] uppercase tracking-[0.08em] px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors duration-200 flex-shrink-0"
              style={{
                color: isActive ? 'var(--color-cyan)' : 'var(--color-text-dim)',
                background: isActive ? 'rgba(255,0,128,0.08)' : 'transparent',
                border: isActive
                  ? '1px solid rgba(255,0,128,0.2)'
                  : '1px solid transparent',
              }}
              whileHover={{
                backgroundColor: isActive
                  ? 'rgba(255,0,128,0.12)'
                  : 'rgba(255,255,255,0.03)',
              }}
              whileTap={{ scale: 0.97 }}
            >
              {f.icon}
              {f.label}
              {f.key !== 'all' && (
                <span
                  className="ml-0.5 text-[10px]"
                  style={{
                    color: isActive ? 'var(--color-cyan)' : 'var(--color-text-dim)',
                    opacity: 0.6,
                  }}
                >
                  {f.key === 'completed'
                    ? stats.completedMissions
                    : f.key === 'running'
                      ? stats.runningMissions
                      : stats.pendingMissions}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Mission grid */}
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredMissions.map((mission, i) => (
            <MissionCard key={mission.id} mission={mission} index={i} />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty state */}
      <AnimatePresence>
        {filteredMissions.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="card px-6 py-12 text-center mt-4"
          >
            <Pause size={24} className="mx-auto mb-3 text-text-dim" />
            <p className="font-mono text-sm text-text-dim">
              No missions match the current filter.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
