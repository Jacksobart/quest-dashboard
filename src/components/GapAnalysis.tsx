import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  FileCode,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ShieldAlert,
  Code2,
  Terminal,
  Braces,
  X,
  AlertTriangle,
  CircleDot,
  Filter,
  Hash,
} from 'lucide-react';
import { gaps } from '../lib/mock-data';
import type { GapAnalysis as GapType } from '../lib/mock-data';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type Status = GapType['status'];
type Confidence = GapType['confidence'];
type FilterValue = Status | 'all';

const STATUS_CONFIG: Record<Status, { label: string; color: string; dim: string; glow: string; icon: typeof AlertCircle }> = {
  missing:     { label: 'MISSING',     color: 'var(--color-red)',     dim: 'var(--color-red-dim)',     glow: 'var(--color-red-glow)',     icon: AlertCircle },
  misaligned:  { label: 'MISALIGNED',  color: 'var(--color-amber)',   dim: 'var(--color-amber-dim)',   glow: 'var(--color-amber-glow)',   icon: AlertTriangle },
  partial:     { label: 'PARTIAL',     color: 'var(--color-purple)',  dim: 'var(--color-purple-dim)',  glow: 'var(--color-purple-glow)',  icon: CircleDot },
  implemented: { label: 'IMPLEMENTED', color: 'var(--color-emerald)', dim: 'var(--color-emerald-dim)', glow: 'var(--color-emerald-glow)', icon: CheckCircle },
};

const STATUS_TW: Record<Status, { text: string; bg: string; border: string; borderLeft: string }> = {
  missing:     { text: 'text-red',     bg: 'bg-red/10',     border: 'border-red/30',     borderLeft: 'border-l-red' },
  misaligned:  { text: 'text-amber',   bg: 'bg-amber/10',   border: 'border-amber/30',   borderLeft: 'border-l-amber' },
  partial:     { text: 'text-purple',  bg: 'bg-purple/10',  border: 'border-purple/30',  borderLeft: 'border-l-purple' },
  implemented: { text: 'text-emerald', bg: 'bg-emerald/10', border: 'border-emerald/30', borderLeft: 'border-l-emerald' },
};

const CONFIDENCE_TW: Record<Confidence, { text: string; bg: string; border: string }> = {
  high:   { text: 'text-emerald', bg: 'bg-emerald/10', border: 'border-emerald/25' },
  medium: { text: 'text-amber',   bg: 'bg-amber/10',   border: 'border-amber/25' },
  low:    { text: 'text-red',     bg: 'bg-red/10',     border: 'border-red/25' },
};

const FILTER_OPTIONS: { value: FilterValue; label: string }[] = [
  { value: 'all',         label: 'All' },
  { value: 'missing',     label: 'Missing' },
  { value: 'misaligned',  label: 'Misaligned' },
  { value: 'partial',     label: 'Partial' },
  { value: 'implemented', label: 'Implemented' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function syntaxHighlight(json: string): string {
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let cls = 'color: var(--color-amber)'; // number
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'color: var(--color-cyan)'; // key
          } else {
            cls = 'color: var(--color-emerald)'; // string
          }
        } else if (/true|false/.test(match)) {
          cls = 'color: var(--color-purple)'; // boolean
        } else if (/null/.test(match)) {
          cls = 'color: var(--color-red)'; // null
        }
        return `<span style="${cls}">${match}</span>`;
      },
    );
}

function addLineNumbers(code: string): { numbered: string; lineCount: number } {
  const lines = code.split('\n');
  const padWidth = String(lines.length).length;
  const numbered = lines
    .map((line, i) => {
      const num = String(i + 1).padStart(padWidth, ' ');
      return `<span style="color: var(--color-text-dim); user-select: none;">${num}  </span>${line}`;
    })
    .join('\n');
  return { numbered, lineCount: lines.length };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SummaryBar() {
  const counts = useMemo(() => {
    const c: Record<Status, number> = { missing: 0, misaligned: 0, partial: 0, implemented: 0 };
    gaps.forEach((g) => { c[g.status]++; });
    return c;
  }, []);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {(Object.keys(STATUS_CONFIG) as Status[]).map((status) => {
        const cfg = STATUS_CONFIG[status];
        const tw = STATUS_TW[status];
        const Icon = cfg.icon;
        return (
          <motion.div
            key={status}
            className={`card px-4 py-3 flex items-center gap-3 border-l-2 ${tw.borderLeft}`}
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center ${tw.bg}`}
              style={{ boxShadow: `inset 0 0 12px ${cfg.glow}` }}
            >
              <Icon size={16} style={{ color: cfg.color }} />
            </div>
            <div>
              <div className="font-display text-xl font-bold text-text leading-none">
                {counts[status]}
              </div>
              <div className={`font-mono text-[10px] tracking-[0.15em] uppercase ${tw.text} mt-0.5`}>
                {cfg.label}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------

function EvidenceBlock({ evidence }: { evidence: GapType['evidence'][number] }) {
  const highlighted = evidence.snippet
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // highlight keywords
    .replace(
      /\b(class|def|function|export|import|return|const|let|var|if|else|from|async|await|SELECT|FROM|LIMIT|CREATE|TABLE|INSERT|UPDATE|DELETE)\b/g,
      '<span style="color: var(--color-purple);">$1</span>',
    )
    // highlight strings
    .replace(
      /('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/g,
      '<span style="color: var(--color-emerald);">$1</span>',
    )
    // highlight comments
    .replace(
      /(#.*$|\/\/.*$)/gm,
      '<span style="color: var(--color-text-dim); font-style: italic;">$1</span>',
    );

  const { numbered } = addLineNumbers(highlighted);

  return (
    <div className="space-y-2">
      {/* File location */}
      <div className="flex items-center gap-2 text-text-secondary">
        <FileCode size={13} className="text-cyan-dim flex-shrink-0" />
        <span className="font-mono text-xs truncate">{evidence.location}</span>
        <span className="badge text-[9px] py-0 px-1.5 bg-surface border border-border text-text-dim">
          {evidence.type.replace('_', ' ')}
        </span>
      </div>

      {/* Code block */}
      <div className="relative rounded-lg overflow-hidden border border-border/60">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-void/80 border-b border-border/40">
          <Code2 size={11} className="text-text-dim" />
          <span className="font-mono text-[10px] text-text-dim tracking-wider uppercase">Evidence Snippet</span>
        </div>
        <pre
          className="px-4 py-3 bg-void/60 font-mono text-xs leading-relaxed overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: numbered }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function JsonPreview({ gap }: { gap: GapType }) {
  const raw = JSON.stringify(gap, null, 2);
  const highlighted = syntaxHighlight(raw);
  const { numbered } = addLineNumbers(highlighted);

  return (
    <div className="relative rounded-lg overflow-hidden border border-border/60">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-void/80 border-b border-border/40">
        <Braces size={11} className="text-cyan-dim" />
        <span className="font-mono text-[10px] text-cyan-dim tracking-wider uppercase">Structured JSON Output</span>
      </div>
      <pre
        className="px-4 py-3 bg-void/60 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-80"
        dangerouslySetInnerHTML={{ __html: numbered }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------

function GapCard({ gap, index }: { gap: GapType; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [showJson, setShowJson] = useState(false);

  const stCfg = STATUS_CONFIG[gap.status];
  const stTw = STATUS_TW[gap.status];
  const confTw = CONFIDENCE_TW[gap.confidence];
  const StatusIcon = stCfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      layout
      className={`card border-l-[3px] ${stTw.borderLeft} overflow-visible`}
    >
      {/* Header row - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 sm:px-5 py-4 flex items-start sm:items-center gap-3 sm:gap-4 cursor-pointer group hover:bg-white/[0.015] transition-colors"
      >
        {/* Status icon */}
        <div
          className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${stTw.bg}`}
          style={{ boxShadow: `0 0 12px ${stCfg.glow}` }}
        >
          <StatusIcon size={15} style={{ color: stCfg.color }} />
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
          {/* Requirement ID */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Hash size={12} className="text-text-dim" />
            <span className="font-mono text-sm font-semibold text-text tracking-wide">
              {gap.requirement_id}
            </span>
          </div>

          {/* SRD section */}
          <span className="font-mono text-[11px] text-text-dim flex-shrink-0">
            SRD {gap.srd_section}
          </span>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`badge text-[10px] py-0.5 px-2 ${stTw.bg} ${stTw.text} border ${stTw.border}`}>
              {stCfg.label}
            </span>
            <span className={`badge text-[10px] py-0.5 px-2 ${confTw.bg} ${confTw.text} border ${confTw.border}`}>
              {gap.confidence}
            </span>
          </div>

          {/* Notes - truncated */}
          <p className="text-text-secondary text-xs leading-relaxed truncate hidden md:block flex-1 min-w-0">
            {gap.notes}
          </p>
        </div>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 text-text-dim group-hover:text-text-secondary transition-colors"
        >
          <ChevronDown size={16} />
        </motion.div>
      </button>

      {/* Notes on small screens (always visible) */}
      <div className="px-5 pb-2 md:hidden">
        <p className="text-text-secondary text-xs leading-relaxed">{gap.notes}</p>
      </div>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 pb-5 space-y-4 border-t border-border/40 pt-4">
              {/* Evidence */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Search size={13} className="text-cyan-dim" />
                  <h4 className="font-mono text-[11px] tracking-[0.12em] uppercase text-text-secondary">
                    Evidence
                  </h4>
                  <span className="font-mono text-[10px] text-text-dim">
                    ({gap.evidence.length} source{gap.evidence.length !== 1 ? 's' : ''})
                  </span>
                </div>
                {gap.evidence.map((ev, i) => (
                  <EvidenceBlock key={i} evidence={ev} />
                ))}
              </div>

              {/* Testable assertion */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Terminal size={13} className="text-cyan-dim" />
                  <h4 className="font-mono text-[11px] tracking-[0.12em] uppercase text-text-secondary">
                    Testable Assertion
                  </h4>
                </div>
                <div className="relative rounded-lg overflow-hidden border border-border/60">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-void/80 border-b border-border/40">
                    <span className="font-mono text-[10px] text-emerald">$</span>
                    <span className="font-mono text-[10px] text-text-dim tracking-wider uppercase">Shell Command</span>
                  </div>
                  <div className="px-4 py-3 bg-void/60 font-mono text-xs text-emerald leading-relaxed overflow-x-auto">
                    <span className="text-text-dim select-none">$ </span>
                    {gap.testable_assertion}
                  </div>
                </div>
              </div>

              {/* Disposition */}
              {gap.disposition && (
                <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-cyan/[0.04] border border-cyan/10">
                  <ShieldAlert size={14} className="text-cyan-dim flex-shrink-0" />
                  <div>
                    <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-text-dim block">
                      Disposition
                    </span>
                    <span className="font-mono text-xs text-cyan">
                      {gap.disposition}
                    </span>
                  </div>
                </div>
              )}

              {/* JSON toggle */}
              <div className="pt-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowJson(!showJson);
                  }}
                  className="flex items-center gap-2 font-mono text-[11px] text-text-dim hover:text-cyan transition-colors cursor-pointer"
                >
                  <Braces size={13} />
                  {showJson ? 'Hide' : 'Show'} structured JSON
                  <motion.span
                    animate={{ rotate: showJson ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={12} />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {showJson && (
                    <motion.div
                      key="json"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden pt-3"
                    >
                      <JsonPreview gap={gap} />
                    </motion.div>
                  )}
                </AnimatePresence>
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

export default function GapAnalysis() {
  const [filter, setFilter] = useState<FilterValue>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let result = gaps;
    if (filter !== 'all') {
      result = result.filter((g) => g.status === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (g) =>
          g.requirement_id.toLowerCase().includes(q) ||
          g.notes.toLowerCase().includes(q) ||
          g.srd_section.includes(q) ||
          g.disposition?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [filter, search]);

  return (
    <div className="section-container space-y-8">
      {/* Section Header */}
      <div className="space-y-3">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <div
            className="w-10 h-10 rounded-lg bg-cyan/10 flex items-center justify-center"
            style={{ boxShadow: '0 0 20px var(--color-cyan-glow)' }}
          >
            <FileCode size={18} className="text-cyan" />
          </div>
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-text">
              STRUCTURED GAP ANALYSIS
            </h2>
            <p className="font-mono text-xs text-text-dim tracking-wide mt-0.5">
              JSON findings replace prose markdown &mdash; machine-readable, diffable, auditable
            </p>
          </div>
        </motion.div>

        {/* Decorative line */}
        <div className="h-px bg-gradient-to-r from-cyan/40 via-border to-transparent" />
      </div>

      {/* Summary Bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <SummaryBar />
      </motion.div>

      {/* Toolbar: Filter + Search */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="flex flex-col sm:flex-row items-start sm:items-center gap-3"
      >
        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-surface rounded-lg border border-border p-1">
          <Filter size={13} className="text-text-dim ml-2 mr-1 flex-shrink-0" />
          {FILTER_OPTIONS.map((opt) => {
            const isActive = filter === opt.value;
            const statusColor = opt.value !== 'all' ? STATUS_TW[opt.value as Status] : null;
            return (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`
                  font-mono text-[11px] tracking-[0.08em] uppercase px-3 py-1.5 rounded-md transition-all duration-200 cursor-pointer
                  ${
                    isActive
                      ? statusColor
                        ? `${statusColor.bg} ${statusColor.text}`
                        : 'bg-cyan/10 text-cyan'
                      : 'text-text-dim hover:text-text-secondary hover:bg-white/[0.03]'
                  }
                `}
              >
                {opt.label}
                {opt.value !== 'all' && (
                  <span className="ml-1.5 text-[9px] opacity-70">
                    {gaps.filter((g) => g.status === opt.value).length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative flex-1 w-full sm:w-auto sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search gaps..."
            className="w-full bg-surface border border-border rounded-lg pl-9 pr-8 py-2 font-mono text-xs text-text placeholder:text-text-dim focus:outline-none focus:border-cyan/40 focus:ring-1 focus:ring-cyan/20 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-dim hover:text-text transition-colors cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Result count */}
        <span className="font-mono text-[11px] text-text-dim tracking-wide flex-shrink-0">
          {filtered.length} / {gaps.length} findings
        </span>
      </motion.div>

      {/* Gap cards */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((gap, i) => (
            <GapCard key={gap.requirement_id} gap={gap} index={i} />
          ))}
        </AnimatePresence>

        {/* Empty state */}
        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card px-6 py-12 text-center"
          >
            <Search size={32} className="text-text-dim mx-auto mb-3" />
            <p className="font-mono text-sm text-text-secondary">No gaps match the current filter.</p>
            <button
              onClick={() => { setFilter('all'); setSearch(''); }}
              className="mt-3 font-mono text-xs text-cyan hover:underline cursor-pointer"
            >
              Reset filters
            </button>
          </motion.div>
        )}
      </div>

      {/* Bottom annotation */}
      <div className="flex items-center gap-2 pt-2">
        <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
        <span className="font-mono text-[10px] text-text-dim tracking-[0.15em] uppercase flex-shrink-0">
          {gaps.length} findings &middot; quest analyze --scope v2
        </span>
        <div className="h-px flex-1 bg-gradient-to-l from-border to-transparent" />
      </div>
    </div>
  );
}
