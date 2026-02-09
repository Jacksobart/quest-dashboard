import { useState, useRef, useMemo } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  FolderTree,
  File,
  GitBranch,
  AlertTriangle,
  Check,
  RotateCcw,
  ChevronDown,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Folder,
  Lock,
  Activity,
} from 'lucide-react';
import { driftEvents, missions } from '../lib/mock-data';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FileStatus = 'completed' | 'running' | 'pending';
type AgentType = 'backend' | 'frontend' | 'database' | 'testing' | 'read-only';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  agent?: AgentType;
  missionId?: string;
  status?: FileStatus;
  note?: string;
  children?: FileNode[];
}

// ---------------------------------------------------------------------------
// Agent color mapping
// ---------------------------------------------------------------------------

const agentColors: Record<AgentType, { text: string; bg: string; border: string; dot: string; glow: string }> = {
  backend: {
    text: 'text-blue',
    bg: 'bg-blue/10',
    border: 'border-blue/30',
    dot: 'bg-blue',
    glow: 'box-glow-blue',
  },
  frontend: {
    text: 'text-purple',
    bg: 'bg-purple/10',
    border: 'border-purple/30',
    dot: 'bg-purple',
    glow: 'box-glow-purple',
  },
  database: {
    text: 'text-amber',
    bg: 'bg-amber/10',
    border: 'border-amber/30',
    dot: 'bg-amber',
    glow: 'box-glow-amber',
  },
  testing: {
    text: 'text-emerald',
    bg: 'bg-emerald/10',
    border: 'border-emerald/30',
    dot: 'bg-emerald',
    glow: 'box-glow-emerald',
  },
  'read-only': {
    text: 'text-text-dim',
    bg: 'bg-surface',
    border: 'border-border',
    dot: 'bg-text-dim',
    glow: '',
  },
};

const statusIcons: Record<FileStatus, { icon: string; color: string }> = {
  completed: { icon: '\u2713', color: 'text-emerald' },
  running: { icon: '\u25CF', color: 'text-blue' },
  pending: { icon: '\u25CB', color: 'text-text-dim' },
};

// ---------------------------------------------------------------------------
// File tree data
// ---------------------------------------------------------------------------

const fileTree: FileNode[] = [
  {
    name: 'src/',
    type: 'folder',
    children: [
      {
        name: 'api/',
        type: 'folder',
        children: [
          {
            name: 'routes/',
            type: 'folder',
            children: [
              { name: 'orders.py', type: 'file', agent: 'backend', missionId: 'm-01', status: 'completed' },
              { name: 'webhooks.py', type: 'file', agent: 'backend', missionId: 'm-04', status: 'running' },
              { name: 'inventory.py', type: 'file', agent: 'backend', missionId: 'm-06', status: 'running' },
            ],
          },
          {
            name: 'services/',
            type: 'folder',
            children: [
              { name: 'order_service.py', type: 'file', agent: 'backend', missionId: 'm-01', status: 'completed' },
              { name: 'payment_service.py', type: 'file', agent: 'backend', missionId: 'm-04', status: 'running' },
              { name: 'inventory_service.py', type: 'file', agent: 'backend', missionId: 'm-06', status: 'running' },
              { name: 'notification_service.py', type: 'file', agent: 'backend', missionId: 'm-09', status: 'pending' },
            ],
          },
          {
            name: 'middleware/',
            type: 'folder',
            children: [
              { name: 'webhook_auth.py', type: 'file', agent: 'backend', missionId: 'm-04', status: 'running' },
              { name: 'rate_limiter.py', type: 'file', agent: 'backend', missionId: 'm-11', status: 'pending' },
              { name: 'request_validator.py', type: 'file', agent: 'backend', missionId: 'm-11', status: 'pending' },
            ],
          },
          {
            name: 'templates/',
            type: 'folder',
            children: [
              { name: 'order_confirmation.html', type: 'file', agent: 'backend', missionId: 'm-09', status: 'pending' },
              { name: 'shipping_update.html', type: 'file', agent: 'backend', missionId: 'm-09', status: 'pending' },
            ],
          },
        ],
      },
      {
        name: 'app/',
        type: 'folder',
        children: [
          { name: 'orders/page.tsx', type: 'file', agent: 'frontend', missionId: 'm-02', status: 'completed' },
          { name: 'checkout/page.tsx', type: 'file', agent: 'frontend', missionId: 'm-05', status: 'running' },
          { name: 'admin/page.tsx', type: 'file', agent: 'frontend', missionId: 'm-08', status: 'pending' },
          { name: 'admin/orders/page.tsx', type: 'file', agent: 'frontend', missionId: 'm-08', status: 'pending' },
        ],
      },
      {
        name: 'components/',
        type: 'folder',
        children: [
          { name: 'OrderStatus.tsx', type: 'file', agent: 'frontend', missionId: 'm-02', status: 'completed' },
          { name: 'OrderTimeline.tsx', type: 'file', agent: 'frontend', missionId: 'm-02', status: 'completed' },
          { name: 'PaymentForm.tsx', type: 'file', agent: 'frontend', missionId: 'm-05', status: 'running' },
          { name: 'CheckoutSummary.tsx', type: 'file', agent: 'frontend', missionId: 'm-05', status: 'running' },
          { name: 'AdminChart.tsx', type: 'file', agent: 'frontend', missionId: 'm-08', status: 'pending' },
          { name: 'OrderTable.tsx', type: 'file', agent: 'frontend', missionId: 'm-08', status: 'pending' },
        ],
      },
      {
        name: 'db/',
        type: 'folder',
        children: [
          {
            name: 'queries/',
            type: 'folder',
            children: [
              { name: 'audit.ts', type: 'file', agent: 'database', missionId: 'm-03', status: 'completed' },
              { name: 'analytics.ts', type: 'file', agent: 'database', missionId: 'm-10', status: 'pending' },
            ],
          },
        ],
      },
      {
        name: 'shared/types/',
        type: 'folder',
        agent: 'read-only',
        note: 'multiple missions',
      },
    ],
  },
  {
    name: 'migrations/',
    type: 'folder',
    children: [
      { name: '0024_order_audit_log.sql', type: 'file', agent: 'database', missionId: 'm-03', status: 'completed' },
      { name: '0025_analytics_views.sql', type: 'file', agent: 'database', missionId: 'm-10', status: 'pending' },
    ],
  },
  {
    name: 'tests/',
    type: 'folder',
    children: [
      { name: 'integration/', type: 'folder', agent: 'testing', missionId: 'm-07', status: 'running' },
      { name: 'e2e/', type: 'folder', agent: 'testing', missionId: 'm-12', status: 'pending' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function getMissionAgent(missionId: string): string {
  const mission = missions.find((m) => m.id === missionId);
  return mission?.agent ?? 'unknown';
}

// ---------------------------------------------------------------------------
// FileTreeItem (recursive)
// ---------------------------------------------------------------------------

function FileTreeItem({
  node,
  depth,
  index,
  isInView,
}: {
  node: FileNode;
  depth: number;
  index: number;
  isInView: boolean;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const isFolder = node.type === 'folder';
  const hasChildren = isFolder && node.children && node.children.length > 0;
  const colors = node.agent ? agentColors[node.agent] : null;
  const status = node.status ? statusIcons[node.status] : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{
        delay: 0.1 + index * 0.02,
        duration: 0.35,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {/* Node row */}
      <div
        className={`
          group flex items-center gap-1.5 py-[3px] pl-${depth > 0 ? '0' : '0'} cursor-default
          hover:bg-elevated/50 rounded-sm transition-colors duration-150
          ${node.status === 'running' ? 'bg-blue/[0.03]' : ''}
        `}
        style={{ paddingLeft: `${depth * 16}px` }}
        onClick={() => hasChildren && setExpanded(!expanded)}
        role={hasChildren ? 'button' : undefined}
      >
        {/* Expand/collapse icon for folders */}
        {isFolder ? (
          hasChildren ? (
            <motion.div
              animate={{ rotate: expanded ? 0 : -90 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0"
            >
              <ChevronDown className="w-3 h-3 text-text-dim" />
            </motion.div>
          ) : (
            <span className="w-3 h-3 flex-shrink-0" />
          )
        ) : (
          <span className="w-3 h-3 flex-shrink-0" />
        )}

        {/* File/folder icon */}
        {isFolder ? (
          <Folder
            className={`w-3.5 h-3.5 flex-shrink-0 ${
              colors ? colors.text : 'text-text-dim'
            }`}
          />
        ) : (
          <File
            className={`w-3.5 h-3.5 flex-shrink-0 ${
              colors ? colors.text : 'text-text-dim'
            }`}
          />
        )}

        {/* File/folder name */}
        <span
          className={`font-mono text-[11px] leading-none ${
            colors ? colors.text : 'text-text-secondary'
          } ${node.status === 'pending' ? 'opacity-50' : ''}`}
        >
          {node.name}
        </span>

        {/* Agent + mission badge */}
        {node.agent && node.missionId && (
          <span
            className={`font-mono text-[9px] px-1.5 py-0.5 rounded-sm ${
              colors ? `${colors.bg} ${colors.text}` : 'bg-surface text-text-dim'
            } opacity-70 group-hover:opacity-100 transition-opacity ml-1`}
          >
            {node.agent} - {node.missionId}
          </span>
        )}

        {/* Read-only indicator */}
        {node.agent === 'read-only' && (
          <span className="flex items-center gap-1 font-mono text-[9px] text-text-dim ml-1">
            <Lock className="w-2.5 h-2.5" />
            read-only - {node.note}
          </span>
        )}

        {/* Folder-level agent badge (for folders with agents but no children to show) */}
        {isFolder && node.agent && node.agent !== 'read-only' && node.missionId && (
          <span
            className={`font-mono text-[9px] px-1.5 py-0.5 rounded-sm ${
              colors ? `${colors.bg} ${colors.text}` : 'bg-surface text-text-dim'
            } opacity-70 group-hover:opacity-100 transition-opacity ml-1`}
          >
            {node.agent} - {node.missionId}
          </span>
        )}

        {/* Status icon */}
        {status && (
          <span className={`text-xs ml-auto mr-1 ${status.color} flex-shrink-0`}>
            {node.status === 'running' ? (
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                {status.icon}
              </motion.span>
            ) : (
              status.icon
            )}
          </span>
        )}
      </div>

      {/* Children */}
      <AnimatePresence initial={false}>
        {expanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
          >
            {node.children!.map((child, i) => (
              <FileTreeItem
                key={child.name}
                node={child}
                depth={depth + 1}
                index={index + i + 1}
                isInView={isInView}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// DriftEventRow
// ---------------------------------------------------------------------------

function DriftEventRow({
  event,
  index,
  isInView,
}: {
  event: (typeof driftEvents)[0];
  index: number;
  isInView: boolean;
}) {
  const agent = getMissionAgent(event.missionId);

  const typeConfig = {
    unauthorized_write: {
      label: 'UNAUTHORIZED WRITE',
      bg: 'bg-red/10',
      border: 'border-red/30',
      text: 'text-red',
      icon: ShieldAlert,
      glow: true,
    },
    scope_violation: {
      label: 'SCOPE VIOLATION',
      bg: 'bg-amber/10',
      border: 'border-amber/30',
      text: 'text-amber',
      icon: AlertTriangle,
      glow: false,
    },
    clean: {
      label: 'CLEAN',
      bg: 'bg-emerald/10',
      border: 'border-emerald/30',
      text: 'text-emerald',
      icon: ShieldCheck,
      glow: false,
    },
  } as const;

  const actionConfig = {
    reverted: {
      label: 'REVERTED',
      bg: 'bg-red/10',
      text: 'text-red',
      icon: RotateCcw,
    },
    flagged: {
      label: 'FLAGGED',
      bg: 'bg-amber/10',
      text: 'text-amber',
      icon: Eye,
    },
    approved: {
      label: 'APPROVED',
      bg: 'bg-emerald/10',
      text: 'text-emerald',
      icon: Check,
    },
  } as const;

  const tc = typeConfig[event.type];
  const ac = actionConfig[event.action];
  const TypeIcon = tc.icon;
  const ActionIcon = ac.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{
        delay: 0.15 + index * 0.06,
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={`
        relative p-3 rounded-lg border transition-all duration-300
        ${event.type === 'unauthorized_write'
          ? 'border-red/40 bg-red/[0.04]'
          : event.type === 'scope_violation'
            ? 'border-amber/20 bg-amber/[0.02]'
            : 'border-border/60 bg-surface/50'
        }
      `}
    >
      {/* Red glow effect for unauthorized writes */}
      {event.type === 'unauthorized_write' && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          animate={{ opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            boxShadow: '0 0 20px var(--color-red-glow), inset 0 0 20px rgba(244, 63, 94, 0.03)',
          }}
        />
      )}

      <div className="relative z-10">
        {/* Top row: timestamp + mission */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-text-dim tracking-wider">
              {formatRelativeTime(event.timestamp)}
            </span>
            <span className="font-mono text-[10px] text-text-dim">/</span>
            <span
              className={`font-mono text-[10px] font-semibold ${
                agentColors[agent as AgentType]?.text ?? 'text-text-secondary'
              }`}
            >
              {event.missionId}
            </span>
            <span
              className={`font-mono text-[9px] px-1.5 py-0.5 rounded-sm ${
                agentColors[agent as AgentType]?.bg ?? 'bg-surface'
              } ${agentColors[agent as AgentType]?.text ?? 'text-text-dim'}`}
            >
              {agent}
            </span>
          </div>
        </div>

        {/* File path */}
        <div className="flex items-center gap-1.5 mb-2.5">
          <GitBranch className="w-3 h-3 text-text-dim flex-shrink-0" />
          <span
            className={`font-mono text-[11px] ${
              event.type === 'unauthorized_write'
                ? 'text-red'
                : event.type === 'scope_violation'
                  ? 'text-amber'
                  : 'text-text-secondary'
            }`}
          >
            {event.file}
          </span>
        </div>

        {/* Bottom row: type badge + action badge */}
        <div className="flex items-center gap-2">
          <span
            className={`
              inline-flex items-center gap-1 px-2 py-0.5 rounded-full
              text-[9px] font-mono font-semibold uppercase tracking-wider
              border ${tc.bg} ${tc.border} ${tc.text}
            `}
          >
            <TypeIcon className="w-2.5 h-2.5" />
            {tc.label}
          </span>

          <span className="text-text-dim text-[10px]">&rarr;</span>

          <span
            className={`
              inline-flex items-center gap-1 px-2 py-0.5 rounded-full
              text-[9px] font-mono font-semibold uppercase tracking-wider
              ${ac.bg} ${ac.text}
            `}
          >
            <ActionIcon className="w-2.5 h-2.5" />
            {ac.label}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// DriftStats
// ---------------------------------------------------------------------------

function DriftStats({ isInView }: { isInView: boolean }) {
  const stats = useMemo(() => {
    const total = driftEvents.length;
    const reverts = driftEvents.filter((e) => e.action === 'reverted').length;
    const flags = driftEvents.filter((e) => e.action === 'flagged').length;
    const clean = driftEvents.filter((e) => e.type === 'clean').length;
    return { total, reverts, flags, clean };
  }, []);

  const items = [
    { label: 'Total Events', value: stats.total, color: 'text-text', bgColor: 'bg-surface' },
    { label: 'Reverts', value: stats.reverts, color: 'text-red', bgColor: 'bg-red/10' },
    { label: 'Flagged', value: stats.flags, color: 'text-amber', bgColor: 'bg-amber/10' },
    { label: 'Clean', value: stats.clean, color: 'text-emerald', bgColor: 'bg-emerald/10' },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 mb-4">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border border-border/50 ${item.bgColor}`}
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
        >
          <span className={`font-display text-xl font-bold ${item.color}`}>
            {item.value}
          </span>
          <span className="font-mono text-[8px] text-text-dim tracking-wider uppercase text-center leading-tight">
            {item.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function DriftDetection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-80px' });

  // Sort drift events by timestamp, most recent first
  const sortedEvents = useMemo(
    () => [...driftEvents].sort((a, b) => b.timestamp - a.timestamp),
    [],
  );

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
          <div className="h-px w-8 bg-gradient-to-r from-transparent to-red/60" />
          <span className="font-mono text-xs text-red tracking-[0.3em] uppercase">
            File Integrity
          </span>
          <div className="h-px w-8 bg-gradient-to-l from-transparent to-red/60" />
        </div>

        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
          <span className="gradient-text-blue">DRIFT DETECTION</span>{' '}
          <span className="text-text">&amp; FILE OWNERSHIP</span>
        </h2>

        <p className="text-text-secondary max-w-2xl mx-auto text-base leading-relaxed">
          Post-mission drift checks catch unauthorized file modifications. Every file has
          exactly one owning agent. Writes outside owned scope are automatically reverted
          or flagged for review.
        </p>
      </motion.div>

      {/* ---- Two-panel layout ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ---- LEFT PANEL: File Ownership Tree ---- */}
        <motion.div
          className="card"
          initial={{ opacity: 0, x: -20 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {/* Panel header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border/50">
            <FolderTree className="w-4 h-4 text-blue" />
            <h3 className="font-display text-sm font-bold tracking-wide text-text uppercase">
              File Ownership Tree
            </h3>
            <div className="ml-auto flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-[9px] font-mono text-text-dim">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald" />
                done
              </span>
              <span className="flex items-center gap-1.5 text-[9px] font-mono text-text-dim">
                <motion.span
                  className="block w-1.5 h-1.5 rounded-full bg-blue"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                running
              </span>
              <span className="flex items-center gap-1.5 text-[9px] font-mono text-text-dim">
                <span className="w-1.5 h-1.5 rounded-full bg-text-dim" />
                pending
              </span>
            </div>
          </div>

          {/* Agent legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-2.5 border-b border-border/30 bg-deep/50">
            {(['backend', 'frontend', 'database', 'testing'] as AgentType[]).map((agent) => (
              <span key={agent} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-sm ${agentColors[agent].dot}`} />
                <span className={`font-mono text-[10px] ${agentColors[agent].text}`}>
                  {agent}
                </span>
              </span>
            ))}
          </div>

          {/* File tree */}
          <div className="p-4 max-h-[520px] overflow-y-auto">
            {fileTree.map((node, i) => (
              <FileTreeItem
                key={node.name}
                node={node}
                depth={0}
                index={i * 5}
                isInView={isInView}
              />
            ))}
          </div>
        </motion.div>

        {/* ---- RIGHT PANEL: Drift Event Log ---- */}
        <motion.div
          className="card"
          initial={{ opacity: 0, x: 20 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {/* Panel header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border/50">
            <Activity className="w-4 h-4 text-red" />
            <h3 className="font-display text-sm font-bold tracking-wide text-text uppercase">
              Drift Event Log
            </h3>
            <div className="ml-auto">
              <span
                className={`
                  inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                  text-[9px] font-mono font-semibold uppercase tracking-wider
                  border
                  ${driftEvents.some((e) => e.type === 'unauthorized_write')
                    ? 'border-red/30 bg-red/10 text-red'
                    : 'border-emerald/30 bg-emerald/10 text-emerald'
                  }
                `}
              >
                <Shield className="w-2.5 h-2.5" />
                {driftEvents.some((e) => e.type === 'unauthorized_write')
                  ? 'VIOLATIONS DETECTED'
                  : 'ALL CLEAN'
                }
              </span>
            </div>
          </div>

          {/* Drift stats */}
          <div className="px-5 pt-4">
            <DriftStats isInView={isInView} />
          </div>

          {/* Event list */}
          <div className="px-5 pb-5 space-y-2.5 max-h-[430px] overflow-y-auto">
            {sortedEvents.map((event, i) => (
              <DriftEventRow
                key={`${event.missionId}-${event.file}-${event.timestamp}`}
                event={event}
                index={i}
                isInView={isInView}
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* ---- Bottom explanatory note ---- */}
      <motion.div
        className="flex flex-wrap items-center justify-center gap-6 mt-12 text-xs font-mono"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 1.0, duration: 0.6 }}
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald" />
          <span className="text-text-secondary">Clean write (in scope)</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber" />
          <span className="text-text-secondary">Scope violation (flagged)</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-red" />
          <span className="text-text-secondary">Unauthorized write (reverted)</span>
        </div>
        <div className="flex items-center gap-2">
          <RotateCcw className="w-3.5 h-3.5 text-red" />
          <span className="text-text-secondary">Auto-reverted</span>
        </div>
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-text-dim" />
          <span className="text-text-secondary">Read-only shared files</span>
        </div>
      </motion.div>
    </div>
  );
}
