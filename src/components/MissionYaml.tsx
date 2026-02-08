import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileCode,
  Copy,
  Check,
  X,
  ArrowRight,
  ChevronRight,
  Terminal,
  Shield,
  GitBranch,
} from 'lucide-react';
import { missions } from '../lib/mock-data';

// ---------------------------------------------------------------------------
// Agent colour mapping
// ---------------------------------------------------------------------------
const agentColor: Record<string, { tw: string; glow: string; bg: string; border: string }> = {
  backend:  { tw: 'text-cyan',    glow: 'bg-cyan-glow',    bg: 'bg-cyan/10',    border: 'border-cyan/30' },
  frontend: { tw: 'text-purple',  glow: 'bg-purple-glow',  bg: 'bg-purple/10',  border: 'border-purple/30' },
  database: { tw: 'text-amber',   glow: 'bg-amber-glow',   bg: 'bg-amber/10',   border: 'border-amber/30' },
  testing:  { tw: 'text-emerald', glow: 'bg-emerald-glow', bg: 'bg-emerald/10', border: 'border-emerald/30' },
};

// ---------------------------------------------------------------------------
// YAML generation helpers
// ---------------------------------------------------------------------------
interface YamlLine {
  text: string;
  indent: number;
  kind: 'comment' | 'key-string' | 'key-number' | 'key-array' | 'array-item' | 'plain';
  /** Field name (for annotation targeting) */
  field?: string;
}

function missionToYaml(m: typeof missions[0]): YamlLine[] {
  const lines: YamlLine[] = [];
  const push = (text: string, indent: number, kind: YamlLine['kind'], field?: string) =>
    lines.push({ text, indent, kind, field });

  push(`# Mission ${m.id} — ${m.agent} agent`, 0, 'comment');
  push(`id: "${m.id}"`, 0, 'key-string');
  push(`agent: "${m.agent}"`, 0, 'key-string');
  push(`priority: ${m.priority}`, 0, 'key-number');
  push(`objective: "${m.objective}"`, 0, 'key-string');
  push(`timeout: ${m.timeout}`, 0, 'key-number');
  push(`max_retries: ${m.maxRetries}`, 0, 'key-number');
  push('', 0, 'plain');
  push(`# Write scope — files this agent may modify`, 0, 'comment');
  push('files:', 0, 'key-string');
  push('own:', 1, 'key-array', 'files.own');
  m.files.own.forEach((f) => push(`- "${f}"`, 2, 'array-item'));
  push('read:', 1, 'key-array');
  m.files.read.forEach((f) => push(`- "${f}"`, 2, 'array-item'));
  push('', 0, 'plain');
  push(`# DAG ordering — upstream dependencies`, 0, 'comment');
  push('depends:', 0, 'key-array', 'depends');
  if (m.depends.length === 0) {
    push('# (none — runs in first batch)', 1, 'comment');
  } else {
    m.depends.forEach((d) => push(`- "${d}"`, 1, 'array-item'));
  }
  push('', 0, 'plain');
  push(`# Machine-verifiable acceptance criteria`, 0, 'comment');
  push('acceptance:', 0, 'key-array', 'acceptance');
  m.acceptance.forEach((ac) => {
    push(`- id: "${ac.id}"`, 1, 'array-item');
    push(`  cmd: "${ac.cmd}"`, 1, 'key-string');
    push(`  expect: "${ac.expect}"`, 1, 'key-string');
  });
  push('', 0, 'plain');
  push(`context: |`, 0, 'key-string');
  push(m.context, 1, 'plain');

  return lines;
}

// ---------------------------------------------------------------------------
// Annotation definitions — line targets are computed dynamically
// ---------------------------------------------------------------------------
interface Annotation {
  field: string;
  label: string;
  color: string;
  icon: React.ReactNode;
}

const annotations: Annotation[] = [
  {
    field: 'files.own',
    label: 'Write scope \u2014 enforced by validate-plan',
    color: 'cyan',
    icon: <Shield size={12} />,
  },
  {
    field: 'acceptance',
    label: 'Machine-verifiable \u2014 shell commands, not prose',
    color: 'emerald',
    icon: <Terminal size={12} />,
  },
  {
    field: 'depends',
    label: 'DAG ordering \u2014 no circular dependencies',
    color: 'purple',
    icon: <GitBranch size={12} />,
  },
];

// ---------------------------------------------------------------------------
// Syntax-highlighted YAML line renderer
// ---------------------------------------------------------------------------
function renderYamlLine(line: YamlLine) {
  const { text, indent, kind } = line;
  const indentStr = '  '.repeat(indent);

  if (kind === 'comment') {
    return <span className="text-text-dim italic">{indentStr}{text}</span>;
  }

  if (kind === 'plain') {
    return <span className="text-text-secondary">{indentStr}{text}</span>;
  }

  if (kind === 'array-item') {
    // Split on first "- " to colour the dash
    const rest = text.slice(2);
    // Check if rest contains a key: value inside
    const kvMatch = rest.match(/^(\w+):\s*(.*)/);
    if (kvMatch) {
      const isNum = /^-?\d+(\.\d+)?$/.test(kvMatch[2]);
      return (
        <span>
          <span className="text-text-dim">{indentStr}</span>
          <span className="text-purple font-bold">- </span>
          <span className="text-cyan">{kvMatch[1]}</span>
          <span className="text-text-dim">: </span>
          <span className={isNum ? 'text-amber' : 'text-emerald'}>{kvMatch[2]}</span>
        </span>
      );
    }
    return (
      <span>
        <span className="text-text-dim">{indentStr}</span>
        <span className="text-purple font-bold">- </span>
        <span className="text-emerald">{rest}</span>
      </span>
    );
  }

  if (kind === 'key-string' || kind === 'key-number' || kind === 'key-array') {
    const colonIdx = text.indexOf(':');
    if (colonIdx === -1) {
      return <span className="text-cyan">{indentStr}{text}</span>;
    }
    const key = text.slice(0, colonIdx);
    const value = text.slice(colonIdx + 1).trim();

    return (
      <span>
        <span className="text-text-dim">{indentStr}</span>
        <span className="text-cyan">{key}</span>
        <span className="text-text-dim">:</span>
        {value ? (
          <>
            <span className="text-text-dim"> </span>
            <span className={kind === 'key-number' ? 'text-amber' : 'text-emerald'}>{value}</span>
          </>
        ) : null}
      </span>
    );
  }

  return <span className="text-text">{indentStr}{text}</span>;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
const badExamples = [
  '"All tests pass"',
  '"Matches SRD spec"',
  '"No TypeScript errors"',
];

const goodExamples = (m: typeof missions[0]) =>
  m.acceptance.slice(0, 3).map((ac) => ac.cmd);

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function MissionYaml() {
  const [selectedId, setSelectedId] = useState('m-01');
  const [copied, setCopied] = useState(false);

  const selectedMission = useMemo(
    () => missions.find((m) => m.id === selectedId) ?? missions[0],
    [selectedId],
  );

  const yamlLines = useMemo(() => missionToYaml(selectedMission), [selectedMission]);

  const rawYaml = useMemo(
    () => yamlLines.map((l) => '  '.repeat(l.indent) + l.text).join('\n'),
    [yamlLines],
  );

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(rawYaml).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [rawYaml]);

  // Find line indices for annotations
  const annotationTargets = useMemo(() => {
    const targets: Record<string, number> = {};
    yamlLines.forEach((l, i) => {
      if (l.field) targets[l.field] = i;
    });
    return targets;
  }, [yamlLines]);

  return (
    <section className="py-32 relative">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-glow/20 rounded-full blur-[150px]" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-purple-glow/15 rounded-full blur-[120px]" />
      </div>

      <div className="section-container relative z-10">
        {/* ---- Section header ---- */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="badge bg-cyan/10 text-cyan border border-cyan/20 mb-6 mx-auto w-fit">
            <FileCode size={14} />
            MISSION FORMAT
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-text mb-4 tracking-tight">
            STRUCTURED{' '}
            <span className="gradient-text-cyan">MISSION FORMAT</span>
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto text-lg leading-relaxed">
            YAML with machine-verifiable acceptance criteria replaces prose markdown.
            Every field is validated by{' '}
            <span className="text-cyan font-mono text-sm">validate-plan</span> before
            execution begins.
          </p>
        </motion.div>

        {/* ---- Main layout: selector + YAML ---- */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="card overflow-visible"
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-deep/60">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red/70" />
                <span className="w-3 h-3 rounded-full bg-amber/70" />
                <span className="w-3 h-3 rounded-full bg-emerald/70" />
              </div>
              <span className="font-mono text-xs text-text-dim ml-2">
                .quest/missions/{selectedMission.id}.yaml
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border
                         text-text-secondary text-xs font-mono hover:bg-elevated hover:text-text
                         transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check size={13} className="text-emerald" />
                  <span className="text-emerald">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  Copy
                </>
              )}
            </button>
          </div>

          <div className="flex flex-col lg:flex-row">
            {/* ---- Left: Mission selector ---- */}
            <div className="lg:w-48 shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-abyss/50 p-3 flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible">
              {missions.map((m) => {
                const colors = agentColor[m.agent] ?? agentColor.backend;
                const active = m.id === selectedId;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedId(m.id)}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono
                      whitespace-nowrap transition-all duration-200 cursor-pointer
                      ${active
                        ? `${colors.bg} ${colors.tw} border ${colors.border} shadow-lg`
                        : 'text-text-dim hover:text-text-secondary hover:bg-elevated/40 border border-transparent'
                      }
                    `}
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${active ? colors.tw.replace('text-', 'bg-') : 'bg-text-dim/50'}`}
                    />
                    {m.id}
                    {active && (
                      <ChevronRight size={12} className="ml-auto hidden lg:block" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* ---- Right: YAML display ---- */}
            <div className="flex-1 min-w-0 relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="relative"
                >
                  {/* Code area */}
                  <div className="overflow-x-auto">
                    <pre className="font-mono text-[13px] leading-6 p-5 pr-8 min-w-[600px]">
                      {yamlLines.map((line, i) => (
                        <motion.div
                          key={`${selectedId}-${i}`}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.25, delay: i * 0.018 }}
                          className="flex group"
                        >
                          {/* Line number */}
                          <span className="w-8 shrink-0 text-right pr-4 text-text-dim/40 select-none text-[11px] leading-6">
                            {i + 1}
                          </span>
                          {/* Line content */}
                          <span className="flex-1">
                            {renderYamlLine(line)}
                          </span>
                        </motion.div>
                      ))}
                    </pre>
                  </div>

                  {/* ---- Annotations (desktop only) ---- */}
                  <div className="hidden xl:block absolute top-0 -right-4 translate-x-full w-72 pt-5 space-y-3">
                    {annotations.map((ann) => {
                      const lineIdx = annotationTargets[ann.field];
                      if (lineIdx === undefined) return null;
                      // Position relative to line index; each line is 24px (leading-6)
                      const top = lineIdx * 24;
                      return (
                        <motion.div
                          key={`${selectedId}-ann-${ann.field}`}
                          initial={{ opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: 0.4 + lineIdx * 0.02 }}
                          className="absolute left-0"
                          style={{ top }}
                        >
                          {/* Connecting line */}
                          <div
                            className={`absolute left-0 top-3 w-6 h-px bg-${ann.color}/30`}
                          />
                          <div className="ml-7">
                            <div
                              className={`
                                inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px]
                                font-mono leading-tight border
                                bg-${ann.color}/5 text-${ann.color} border-${ann.color}/20
                              `}
                            >
                              <span className="shrink-0">{ann.icon}</span>
                              {ann.label}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Mobile annotations */}
                  <div className="xl:hidden border-t border-border p-4 space-y-2">
                    {annotations.map((ann) => (
                      <div
                        key={`mobile-${ann.field}`}
                        className={`
                          inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px]
                          font-mono leading-tight border mr-2 mb-1
                          bg-${ann.color}/5 text-${ann.color} border-${ann.color}/20
                        `}
                      >
                        <span className="shrink-0">{ann.icon}</span>
                        {ann.label}
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* ---- Acceptance criteria comparison ---- */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-10 grid md:grid-cols-2 gap-5"
        >
          {/* Bad examples */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-6 h-6 rounded-full bg-red/10 border border-red/20 flex items-center justify-center">
                <X size={13} className="text-red" />
              </div>
              <h3 className="font-display text-sm font-bold text-text tracking-wide uppercase">
                Not acceptance criteria
              </h3>
            </div>
            <div className="space-y-3">
              {badExamples.map((ex) => (
                <div
                  key={ex}
                  className="flex items-start gap-3 px-4 py-3 rounded-lg bg-red/5 border border-red/10"
                >
                  <X size={15} className="text-red shrink-0 mt-0.5" />
                  <span className="font-mono text-sm text-red/80">{ex}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-text-dim leading-relaxed">
              Prose assertions can't be verified by a shell command.
              They require human judgement, making automation impossible.
            </p>
          </div>

          {/* Good examples */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-6 h-6 rounded-full bg-emerald/10 border border-emerald/20 flex items-center justify-center">
                <Check size={13} className="text-emerald" />
              </div>
              <h3 className="font-display text-sm font-bold text-text tracking-wide uppercase">
                Machine-verifiable criteria
              </h3>
            </div>
            <div className="space-y-3">
              {goodExamples(selectedMission).map((cmd) => (
                <div
                  key={cmd}
                  className="flex items-start gap-3 px-4 py-3 rounded-lg bg-emerald/5 border border-emerald/10"
                >
                  <Check size={15} className="text-emerald shrink-0 mt-0.5" />
                  <div className="flex items-start gap-2 min-w-0">
                    <ArrowRight size={12} className="text-text-dim shrink-0 mt-1" />
                    <code className="font-mono text-xs text-emerald/90 break-all leading-relaxed">
                      {cmd}
                    </code>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-text-dim leading-relaxed">
              Every acceptance criterion is an executable shell command
              with a deterministic expected result.{' '}
              <span className="text-cyan">validate-plan</span> confirms
              syntactic validity before execution.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
