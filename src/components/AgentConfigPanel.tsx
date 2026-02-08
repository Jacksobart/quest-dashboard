import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Cpu,
  Clock,
  Activity,
  Database,
  Code,
  Settings,
  Zap,
  FileCode,
  Eye,
  GitBranch,
  CheckCircle,
  BarChart3,
  Layers,
  AlertTriangle,
  ShieldCheck,
  Terminal,
  Timer,
  Target,
  Server,
} from 'lucide-react';
import { agents, telemetryStats, missions } from '../lib/mock-data';
import type { AgentConfig } from '../lib/mock-data';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AGENT_COLOR_MAP: Record<string, { tw: string; glow: string; bg: string; border: string }> = {
  '#00e5ff': { tw: 'cyan', glow: 'box-glow-cyan', bg: 'rgba(0,229,255,0.06)', border: 'rgba(0,229,255,0.2)' },
  '#8b5cf6': { tw: 'purple', glow: 'box-glow-purple', bg: 'rgba(139,92,246,0.06)', border: 'rgba(139,92,246,0.2)' },
  '#fbbf24': { tw: 'amber', glow: 'box-glow-amber', bg: 'rgba(251,191,36,0.06)', border: 'rgba(251,191,36,0.2)' },
  '#34d399': { tw: 'emerald', glow: 'box-glow-emerald', bg: 'rgba(52,211,153,0.06)', border: 'rgba(52,211,153,0.2)' },
};

const AGENT_LUCIDE_ICONS: Record<string, React.ReactNode> = {
  backend: <Zap size={18} />,
  frontend: <Code size={18} />,
  database: <Database size={18} />,
  testing: <ShieldCheck size={18} />,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatTimeEstimate(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `~${m}m ${s}s`;
}

// ---------------------------------------------------------------------------
// Animated Counter
// ---------------------------------------------------------------------------

function AnimatedCounter({ value, duration = 1.2 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value, duration]);

  return <span>{display}</span>;
}

// ---------------------------------------------------------------------------
// Mini Progress Ring
// ---------------------------------------------------------------------------

function ProgressRing({
  completed,
  total,
  size = 36,
  strokeWidth = 3,
  color,
}: {
  completed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  color: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? completed / total : 0;
  const offset = circumference * (1 - progress);

  return (
    <svg width={size} height={size} className="flex-shrink-0">
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-elevated)"
        strokeWidth={strokeWidth}
      />
      {/* Progress arc */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ filter: `drop-shadow(0 0 4px ${color}60)` }}
      />
      {/* Center text */}
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        fontSize={size * 0.28}
        fontFamily="var(--font-mono)"
        fontWeight={600}
      >
        {completed}/{total}
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Mini Bar Chart (mission statuses for an agent)
// ---------------------------------------------------------------------------

function MissionStatusBar({ agent }: { agent: AgentConfig }) {
  const agentMissions = useMemo(
    () => missions.filter((m) => m.agent === agent.name),
    [agent.name],
  );

  const counts = useMemo(() => {
    const c = { completed: 0, running: 0, pending: 0, failed: 0, retrying: 0 };
    agentMissions.forEach((m) => {
      c[m.status]++;
    });
    return c;
  }, [agentMissions]);

  const total = agentMissions.length;
  if (total === 0) return null;

  const segments = [
    { key: 'completed', count: counts.completed, color: 'var(--color-emerald)', label: 'Done' },
    { key: 'running', count: counts.running + counts.retrying, color: 'var(--color-cyan)', label: 'Running' },
    { key: 'pending', count: counts.pending, color: 'var(--color-text-dim)', label: 'Pending' },
    { key: 'failed', count: counts.failed, color: 'var(--color-red)', label: 'Failed' },
  ].filter((s) => s.count > 0);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <BarChart3 size={10} className="text-text-dim" />
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-dim">
          Mission Status
        </span>
      </div>
      {/* Stacked bar */}
      <div className="flex h-2 rounded-full overflow-hidden bg-elevated">
        {segments.map((seg, i) => (
          <motion.div
            key={seg.key}
            className="h-full"
            style={{ backgroundColor: seg.color }}
            initial={{ width: 0 }}
            animate={{ width: `${(seg.count / total) * 100}%` }}
            transition={{ duration: 0.8, delay: 0.3 + i * 0.1, ease: [0.4, 0, 0.2, 1] }}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-3">
        {segments.map((seg) => (
          <div key={seg.key} className="flex items-center gap-1">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: seg.color }}
            />
            <span className="font-mono text-[9px] text-text-dim">
              {seg.count} {seg.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Agent Card
// ---------------------------------------------------------------------------

function AgentCard({ agent, index }: { agent: AgentConfig; index: number }) {
  const colorCfg = AGENT_COLOR_MAP[agent.color] || AGENT_COLOR_MAP['#00e5ff'];
  const lucideIcon = AGENT_LUCIDE_ICONS[agent.name];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.4, 0, 0.2, 1],
      }}
      whileHover={{ y: -2 }}
      className="relative group"
    >
      {/* Subtle glow background */}
      <div
        className="absolute -inset-px rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, ${agent.color}15, transparent 70%)`,
        }}
      />

      <div
        className="card relative h-full flex flex-col gap-3 p-5"
        style={{
          borderLeft: `3px solid ${agent.color}`,
          background: `linear-gradient(135deg, ${colorCfg.bg}, var(--color-surface))`,
        }}
      >
        {/* Header: icon + name */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{
                background: `${agent.color}15`,
                border: `1px solid ${agent.color}30`,
                color: agent.color,
                boxShadow: `0 0 12px ${agent.color}20`,
              }}
            >
              {lucideIcon}
            </div>
            <div>
              <h3
                className="font-display font-bold text-base uppercase tracking-wide"
                style={{ color: agent.color }}
              >
                {agent.name}
              </h3>
              <p className="text-text-secondary text-xs leading-snug mt-0.5">
                {agent.description}
              </p>
            </div>
          </div>
          <ProgressRing
            completed={agent.missionsCompleted}
            total={agent.missionsAssigned}
            size={40}
            strokeWidth={3}
            color={agent.color}
          />
        </div>

        {/* File patterns */}
        <div className="space-y-2 pt-1">
          {/* Files owned */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <FileCode size={11} style={{ color: agent.color }} className="opacity-70" />
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-dim">
                Files Owned
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {agent.files_own.map((pattern) => (
                <span
                  key={pattern}
                  className="font-mono text-[11px] px-2 py-0.5 rounded-md"
                  style={{
                    color: agent.color,
                    background: `${agent.color}10`,
                    border: `1px solid ${agent.color}20`,
                  }}
                >
                  {pattern}
                </span>
              ))}
            </div>
          </div>

          {/* Files read */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Eye size={11} className="text-text-dim opacity-70" />
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-dim">
                Files Read
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {agent.files_read.map((pattern) => (
                <span
                  key={pattern}
                  className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-elevated/60 text-text-secondary border border-border/40"
                >
                  {pattern}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Missions line */}
        <div className="flex items-center gap-3 pt-1 border-t border-border/40 text-[11px] font-mono text-text-dim">
          <div className="flex items-center gap-1">
            <Target size={11} className="opacity-60" />
            <span>
              {agent.missionsAssigned} assigned
            </span>
          </div>
          <div className="flex items-center gap-1" style={{ color: 'var(--color-emerald)' }}>
            <CheckCircle size={11} />
            <span>{agent.missionsCompleted} completed</span>
          </div>
        </div>

        {/* Mini mission status bar */}
        <MissionStatusBar agent={agent} />
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// YAML Code Block
// ---------------------------------------------------------------------------

function YamlConfigBlock() {
  const yamlContent = `# quest.config.yaml
spec: ./SRD.md
agents:
  - name: backend
    description: "Backend API and services"
    files_own:
      - "src/api/**"
      - "src/services/**"
    files_read:
      - "src/shared/**"

  - name: frontend
    description: "React UI components and pages"
    files_own:
      - "src/app/**"
      - "src/components/**"
    files_read:
      - "src/shared/**"

  - name: database
    description: "Schema, migrations, queries"
    files_own:
      - "migrations/**"
      - "src/db/**"
    files_read:
      - "src/shared/**"

  - name: testing
    description: "Test files only"
    files_own:
      - "**/*.test.*"
      - "**/tests/**"
    files_read:
      - "src/**"`;

  // Syntax highlight the YAML
  const highlighted = yamlContent
    .split('\n')
    .map((line) => {
      // Comments
      if (line.trimStart().startsWith('#')) {
        return `<span style="color: var(--color-text-dim); font-style: italic;">${escapeHtml(line)}</span>`;
      }

      let result = escapeHtml(line);

      // Strings in quotes
      result = result.replace(
        /(&quot;[^&]*?&quot;|"[^"]*?")/g,
        '<span style="color: var(--color-emerald);">$1</span>',
      );

      // YAML keys (word followed by colon)
      result = result.replace(
        /^(\s*)([\w_-]+)(:)/,
        '$1<span style="color: var(--color-cyan);">$2</span><span style="color: var(--color-text-dim);">$3</span>',
      );

      // List dash
      result = result.replace(
        /^(\s*)(- )/,
        '$1<span style="color: var(--color-text-dim);">$2</span>',
      );

      // Values after colon that are not strings (e.g., ./SRD.md)
      result = result.replace(
        /(:)(\s+)([^<\s].*?)$/,
        '$1$2<span style="color: var(--color-amber);">$3</span>',
      );

      return result;
    })
    .map((line, i) => {
      const num = String(i + 1).padStart(2, ' ');
      return `<span style="color: var(--color-text-dim); user-select: none; opacity: 0.5;">${num}  </span>${line}`;
    })
    .join('\n');

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="relative"
    >
      <div className="relative rounded-xl overflow-hidden border border-border/60">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-void/80 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Settings size={13} className="text-cyan-dim" />
            <span className="font-mono text-[11px] text-cyan-dim tracking-wider uppercase">
              quest.config.yaml
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald/40" />
          </div>
        </div>
        <pre
          className="px-4 py-4 bg-void/60 font-mono text-[12px] leading-[1.7] overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </div>
    </motion.div>
  );
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// Telemetry Stat Mini Card
// ---------------------------------------------------------------------------

function TelemetryStatCard({
  label,
  value,
  icon,
  color,
  index,
  badge,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  index: number;
  badge?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: 0.05 * index }}
      className="card px-3 py-3 flex flex-col gap-1.5"
    >
      <div className="flex items-center gap-2">
        <span style={{ color }} className="flex-shrink-0 opacity-80">
          {icon}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-text-dim truncate">
          {label}
        </span>
      </div>
      {badge ? (
        <span
          className="badge text-[11px] py-0.5 px-2 self-start"
          style={{
            color,
            background: `${color}15`,
            border: `1px solid ${color}30`,
          }}
        >
          {value}
        </span>
      ) : (
        <div className="font-display font-bold text-lg leading-none" style={{ color }}>
          {typeof value === 'number' ? <AnimatedCounter value={value} /> : value}
        </div>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Donut Chart
// ---------------------------------------------------------------------------

function MissionDonut() {
  const stats = telemetryStats;
  const total = stats.totalMissions;
  const segments = [
    { label: 'Completed', count: stats.completedMissions, color: 'var(--color-emerald)' },
    { label: 'Running', count: stats.runningMissions, color: 'var(--color-cyan)' },
    { label: 'Pending', count: stats.pendingMissions, color: 'var(--color-text-dim)' },
  ];

  const size = 160;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="card p-5 flex flex-col items-center gap-4"
    >
      <div className="flex items-center gap-2 self-start">
        <Layers size={13} className="text-cyan-dim" />
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-dim">
          Mission Distribution
        </span>
      </div>

      <div className="relative">
        <svg width={size} height={size}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-elevated)"
            strokeWidth={strokeWidth}
          />
          {/* Segments */}
          {segments.map((seg, i) => {
            const segLength = (seg.count / total) * circumference;
            const dashoffset = -cumulativeOffset;
            cumulativeOffset += segLength;

            return (
              <motion.circle
                key={seg.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeLinecap="butt"
                strokeDasharray={`${segLength} ${circumference - segLength}`}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                style={{
                  strokeDashoffset: dashoffset,
                  filter: `drop-shadow(0 0 6px ${seg.color}40)`,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 + i * 0.15 }}
              />
            );
          })}
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display font-bold text-2xl text-text">{total}</span>
          <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-text-dim">
            Missions
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2 w-full">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: seg.color }}
              />
              <span className="font-mono text-[11px] text-text-secondary">{seg.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-semibold text-text">
                {seg.count}
              </span>
              <span className="font-mono text-[10px] text-text-dim">
                ({Math.round((seg.count / total) * 100)}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function AgentConfigPanel() {
  const [elapsed, setElapsed] = useState(telemetryStats.questElapsed);
  const stats = telemetryStats;

  // Tick elapsed timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const telemetryCards = [
    {
      label: 'Quest Elapsed',
      value: formatTime(elapsed),
      icon: <Clock size={14} />,
      color: 'var(--color-cyan)',
    },
    {
      label: 'Est. Remaining',
      value: formatTimeEstimate(stats.estimatedRemaining),
      icon: <Timer size={14} />,
      color: 'var(--color-amber)',
    },
    {
      label: 'Model',
      value: stats.modelUsed,
      icon: <Cpu size={14} />,
      color: 'var(--color-purple)',
      badge: true,
    },
    {
      label: 'Backend',
      value: stats.backend,
      icon: <Server size={14} />,
      color: 'var(--color-amber)',
      badge: true,
    },
    {
      label: 'Files Owned',
      value: stats.filesOwned,
      icon: <FileCode size={14} />,
      color: 'var(--color-cyan)',
    },
    {
      label: 'Files Read',
      value: stats.filesRead,
      icon: <Eye size={14} />,
      color: 'var(--color-text-secondary)',
    },
    {
      label: 'DAG Batches',
      value: `${stats.currentBatch}/${stats.dagBatches}`,
      icon: <GitBranch size={14} />,
      color: 'var(--color-purple)',
    },
    {
      label: 'Acceptance Criteria',
      value: `${stats.acceptanceCriteriaPassed}+${stats.acceptanceCriteriaRunning}/${stats.acceptanceCriteriaTotal}`,
      icon: <ShieldCheck size={14} />,
      color: 'var(--color-emerald)',
    },
    {
      label: 'Drift Events',
      value: `${stats.totalDriftEvents}`,
      icon: <AlertTriangle size={14} />,
      color: 'var(--color-amber)',
      sub: `${stats.driftReverts} revert, ${stats.driftFlags} flag`,
    },
  ];

  return (
    <div className="section-container space-y-10">
      {/* ============================================================ */}
      {/* Section Header                                                */}
      {/* ============================================================ */}
      <div className="space-y-3">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <div
            className="w-10 h-10 rounded-lg bg-purple/10 flex items-center justify-center"
            style={{ boxShadow: '0 0 20px var(--color-purple-glow)' }}
          >
            <Users size={18} className="text-purple" />
          </div>
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-text">
              AGENT CONFIGURATION &{' '}
              <span className="gradient-text-cyan">TELEMETRY</span>
            </h2>
            <p className="font-mono text-xs text-text-dim tracking-wide mt-0.5">
              Agent definitions from quest.config.yaml &mdash; file ownership, scopes, and live performance metrics
            </p>
          </div>
        </motion.div>
        <div className="h-px bg-gradient-to-r from-purple/40 via-border to-transparent" />
      </div>

      {/* ============================================================ */}
      {/* TOP ROW: Agent Cards                                          */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {agents.map((agent, i) => (
          <AgentCard key={agent.name} agent={agent} index={i} />
        ))}
      </div>

      {/* ============================================================ */}
      {/* MIDDLE: YAML Config Block                                     */}
      {/* ============================================================ */}
      <div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 mb-4"
        >
          <Terminal size={13} className="text-text-dim" />
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-dim">
            Configuration Source
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
        </motion.div>
        <YamlConfigBlock />
      </div>

      {/* ============================================================ */}
      {/* BOTTOM: Telemetry Stats + Donut                               */}
      {/* ============================================================ */}
      <div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 mb-4"
        >
          <Activity size={13} className="text-cyan-dim" />
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-dim">
            Quest Telemetry
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4">
          {/* Left: Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {telemetryCards.map((card, i) => (
              <TelemetryStatCard
                key={card.label}
                label={card.label}
                value={card.value}
                icon={card.icon}
                color={card.color}
                index={i}
                badge={'badge' in card ? card.badge : false}
              />
            ))}
          </div>

          {/* Right: Donut chart */}
          <MissionDonut />
        </div>
      </div>

      {/* ============================================================ */}
      {/* Competitive Positioning Callout                               */}
      {/* ============================================================ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative"
      >
        <div
          className="card px-6 py-5 border-l-[3px] border-l-cyan"
          style={{
            background: 'linear-gradient(135deg, rgba(0,229,255,0.04), var(--color-surface), rgba(139,92,246,0.03))',
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-10 h-10 rounded-lg bg-cyan/10 flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ boxShadow: '0 0 16px var(--color-cyan-glow)' }}
            >
              <Zap size={18} className="text-cyan" />
            </div>
            <div className="space-y-2">
              <h4 className="font-display font-bold text-sm text-text tracking-wide uppercase">
                Why Quest
              </h4>
              <p className="text-text-secondary text-sm leading-relaxed">
                The only open-source tool that produces validated, machine-verifiable mission plans
                with file ownership enforcement, DAG ordering, and convergence guarantees.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {['File Ownership', 'DAG Ordering', 'Convergence', 'Machine-Verifiable'].map((tag) => (
                  <span
                    key={tag}
                    className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-cyan/[0.06] text-cyan-dim border border-cyan/15"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bottom annotation */}
      <div className="flex items-center gap-2 pt-2">
        <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
        <span className="font-mono text-[10px] text-text-dim tracking-[0.15em] uppercase flex-shrink-0">
          {agents.length} agents &middot; {telemetryStats.totalMissions} missions &middot; quest.config.yaml
        </span>
        <div className="h-px flex-1 bg-gradient-to-l from-border to-transparent" />
      </div>
    </div>
  );
}
