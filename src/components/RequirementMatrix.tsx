import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MinusCircle,
  Terminal,
  ChevronRight,
  FileCheck,
  Lock,
} from 'lucide-react';
import { requirements } from '../lib/mock-data';

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------
type ReqStatus = 'verified' | 'unverified' | 'failing' | 'partial' | null;

function statusConfig(status: ReqStatus) {
  switch (status) {
    case 'verified':
      return {
        label: 'Verified',
        color: 'text-emerald',
        bg: 'bg-emerald/10',
        border: 'border-emerald/20',
        glow: 'emerald',
        Icon: CheckCircle2,
      };
    case 'partial':
      return {
        label: 'Partial',
        color: 'text-amber',
        bg: 'bg-amber/10',
        border: 'border-amber/20',
        glow: 'amber',
        Icon: AlertCircle,
      };
    case 'failing':
      return {
        label: 'Failing',
        color: 'text-red',
        bg: 'bg-red/10',
        border: 'border-red/20',
        glow: 'red',
        Icon: XCircle,
      };
    case 'unverified':
    case null:
    default:
      return {
        label: 'Unverified',
        color: 'text-text-dim',
        bg: 'bg-text-dim/5',
        border: 'border-text-dim/10',
        glow: 'dim',
        Icon: MinusCircle,
      };
  }
}

// ---------------------------------------------------------------------------
// Donut chart SVG
// ---------------------------------------------------------------------------
function CoverageDonut({
  verified,
  partial,
  unverified,
  total,
  overallCoverage,
}: {
  verified: number;
  partial: number;
  unverified: number;
  total: number;
  overallCoverage: number;
}) {
  const radius = 80;
  const strokeWidth = 14;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * normalizedRadius;

  const verifiedFrac = verified / total;
  const partialFrac = partial / total;
  const unverifiedFrac = unverified / total;

  const verifiedLen = verifiedFrac * circumference;
  const partialLen = partialFrac * circumference;
  const unverifiedLen = unverifiedFrac * circumference;

  const verifiedOffset = 0;
  const partialOffset = verifiedLen;
  const unverifiedOffset = verifiedLen + partialLen;

  // Track ring (background)
  const trackColor = 'var(--color-border)';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={radius * 2}
        height={radius * 2}
        viewBox={`0 0 ${radius * 2} ${radius * 2}`}
        className="transform -rotate-90"
      >
        {/* Background track */}
        <circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
          opacity={0.3}
        />

        {/* Unverified segment */}
        <motion.circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          fill="none"
          stroke="var(--color-text-dim)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${unverifiedLen} ${circumference - unverifiedLen}`}
          strokeDashoffset={-unverifiedOffset}
          initial={{ strokeDasharray: `0 ${circumference}` }}
          whileInView={{ strokeDasharray: `${unverifiedLen} ${circumference - unverifiedLen}` }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.8, ease: 'easeOut' }}
          opacity={0.4}
        />

        {/* Partial segment */}
        <motion.circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          fill="none"
          stroke="var(--color-amber)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${partialLen} ${circumference - partialLen}`}
          strokeDashoffset={-partialOffset}
          initial={{ strokeDasharray: `0 ${circumference}` }}
          whileInView={{ strokeDasharray: `${partialLen} ${circumference - partialLen}` }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
          style={{ filter: 'drop-shadow(0 0 6px var(--color-amber-glow))' }}
        />

        {/* Verified segment */}
        <motion.circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          fill="none"
          stroke="var(--color-emerald)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${verifiedLen} ${circumference - verifiedLen}`}
          strokeDashoffset={-verifiedOffset}
          initial={{ strokeDasharray: `0 ${circumference}` }}
          whileInView={{ strokeDasharray: `${verifiedLen} ${circumference - verifiedLen}` }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
          style={{ filter: 'drop-shadow(0 0 6px var(--color-emerald-glow))' }}
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="font-display text-3xl font-bold text-text"
          initial={{ opacity: 0, scale: 0.5 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          {Math.round(overallCoverage)}%
        </motion.span>
        <span className="font-mono text-[10px] text-text-dim tracking-wider uppercase">
          Coverage
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mini coverage bar
// ---------------------------------------------------------------------------
function CoverageBar({ coverage }: { coverage: number }) {
  const barColor =
    coverage >= 100
      ? 'bg-emerald'
      : coverage >= 50
        ? 'bg-amber'
        : coverage > 0
          ? 'bg-red'
          : 'bg-text-dim/20';

  const glowColor =
    coverage >= 100
      ? 'shadow-[0_0_8px_var(--color-emerald-glow)]'
      : coverage >= 50
        ? 'shadow-[0_0_8px_var(--color-amber-glow)]'
        : '';

  return (
    <div className="flex items-center gap-2.5 min-w-[120px]">
      <div className="flex-1 h-1.5 bg-border/40 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${barColor} ${glowColor}`}
          initial={{ width: 0 }}
          whileInView={{ width: `${coverage}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
        />
      </div>
      <span className="font-mono text-xs text-text-secondary w-[38px] text-right">
        {coverage}%
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail panel for assertion commands
// ---------------------------------------------------------------------------
function AssertionDetail({
  requirement,
}: {
  requirement: (typeof requirements)[number];
}) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="overflow-hidden"
    >
      <div className="px-6 pb-5 pt-1">
        <div className="bg-abyss border border-border rounded-lg p-4">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <Terminal className="w-3.5 h-3.5 text-blue" />
            <span className="font-mono text-[11px] text-blue tracking-wider uppercase">
              Verification Assertions
            </span>
          </div>

          {/* Assertion list */}
          <div className="space-y-2">
            {requirement.assertions.map((assertion, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-deep/60 rounded-md px-3 py-2.5 border border-border/50"
              >
                <span className="font-mono text-[10px] text-text-dim mt-0.5 shrink-0 w-5">
                  [{i + 1}]
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge bg-purple/10 text-purple border border-purple/20 text-[9px] py-0 px-1.5">
                      {assertion.type}
                    </span>
                    {assertion.expect_exit !== undefined && (
                      <span className="font-mono text-[10px] text-text-dim">
                        expect exit: {assertion.expect_exit}
                      </span>
                    )}
                  </div>
                  {assertion.cmd && (
                    <code className="font-mono text-[11px] text-text-secondary break-all leading-relaxed">
                      $ {assertion.cmd}
                    </code>
                  )}
                  {assertion.pattern && (
                    <div className="mt-1">
                      <span className="font-mono text-[10px] text-text-dim">pattern: </span>
                      <code className="font-mono text-[11px] text-amber">{assertion.pattern}</code>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Mission link */}
          {requirement.missionId && (
            <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2">
              <Lock className="w-3 h-3 text-text-dim" />
              <span className="font-mono text-[10px] text-text-dim tracking-wider">
                BOUND TO MISSION
              </span>
              <span className="font-mono text-[11px] text-blue">
                {requirement.missionId}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Row stagger animation variants
// ---------------------------------------------------------------------------
const tableContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.2,
    },
  },
};

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function RequirementMatrix() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Compute stats
  const stats = useMemo(() => {
    const total = requirements.length;
    const verified = requirements.filter((r) => r.status === 'verified').length;
    const partial = requirements.filter((r) => r.status === 'partial').length;
    const failing = requirements.filter((r) => r.status === 'failing').length;
    const unverified = requirements.filter(
      (r) => r.status === null || r.status === 'unverified'
    ).length;
    const overallCoverage =
      requirements.reduce((sum, r) => sum + r.coverage, 0) / total;

    return { total, verified, partial, failing, unverified, overallCoverage };
  }, []);

  return (
    <div className="section-container">
      {/* ---- Section Header ---- */}
      <div className="flex items-center gap-3 mb-3">
        <Shield className="w-5 h-5 text-blue" />
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-text tracking-tight">
          SRD REQUIREMENT MATRIX
        </h2>
      </div>
      <p className="text-text-secondary text-sm sm:text-base mb-10 max-w-3xl leading-relaxed">
        The Software Requirements Document is compiled into a machine-readable verification
        oracle. Each requirement maps to testable assertions that are automatically
        executed against the codebase. The matrix below tracks compliance status in
        real-time.
      </p>

      {/* ---- Overview Panel ---- */}
      <div className="card p-6 sm:p-8 mb-8">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* Donut chart */}
          <motion.div
            className="relative shrink-0"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            {/* Ambient glow behind donut */}
            <div
              className="absolute inset-0 rounded-full blur-[40px] opacity-30"
              style={{
                background: `conic-gradient(
                  var(--color-emerald-glow) 0deg,
                  var(--color-emerald-glow) ${(stats.verified / stats.total) * 360}deg,
                  var(--color-amber-glow) ${(stats.verified / stats.total) * 360}deg,
                  var(--color-amber-glow) ${((stats.verified + stats.partial) / stats.total) * 360}deg,
                  transparent ${((stats.verified + stats.partial) / stats.total) * 360}deg
                )`,
              }}
            />
            <CoverageDonut
              verified={stats.verified}
              partial={stats.partial}
              unverified={stats.unverified + stats.failing}
              total={stats.total}
              overallCoverage={stats.overallCoverage}
            />
          </motion.div>

          {/* Stats breakdown */}
          <div className="flex-1 min-w-0">
            {/* Summary line */}
            <motion.p
              className="font-body text-text text-base sm:text-lg mb-5"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <span className="font-mono text-emerald font-semibold">{stats.verified}</span>
              <span className="text-text-secondary">/{stats.total} requirements verified, </span>
              <span className="font-mono text-amber font-semibold">{stats.partial}</span>
              <span className="text-text-secondary"> partial, </span>
              <span className="font-mono text-text-dim font-semibold">{stats.unverified}</span>
              <span className="text-text-secondary"> unverified</span>
              {stats.failing > 0 && (
                <>
                  <span className="text-text-secondary">, </span>
                  <span className="font-mono text-red font-semibold">{stats.failing}</span>
                  <span className="text-text-secondary"> failing</span>
                </>
              )}
            </motion.p>

            {/* Legend cards */}
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-4 gap-3"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              {[
                { label: 'Verified', count: stats.verified, color: 'emerald', Icon: CheckCircle2 },
                { label: 'Partial', count: stats.partial, color: 'amber', Icon: AlertCircle },
                { label: 'Failing', count: stats.failing, color: 'red', Icon: XCircle },
                { label: 'Unverified', count: stats.unverified, color: 'dim', Icon: MinusCircle },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2.5 bg-deep/60 rounded-lg px-3 py-2.5 border border-border/50"
                >
                  <item.Icon
                    className={`w-4 h-4 ${item.color === 'dim' ? 'text-text-dim' : `text-${item.color}`}`}
                  />
                  <div>
                    <span
                      className={`font-display text-lg font-bold ${item.color === 'dim' ? 'text-text-dim' : `text-${item.color}`}`}
                    >
                      {item.count}
                    </span>
                    <span className="font-mono text-[10px] text-text-dim tracking-wider uppercase ml-1.5">
                      {item.label}
                    </span>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* ---- Requirement Table ---- */}
      <div className="card overflow-hidden">
        {/* Table header bar */}
        <div className="bg-deep/80 border-b border-border px-6 py-3 flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-blue" />
          <span className="font-mono text-[11px] text-blue tracking-wider uppercase">
            Requirement Traceability Matrix
          </span>
          <span className="font-mono text-[10px] text-text-dim ml-auto">
            {stats.total} entries
          </span>
        </div>

        {/* Column headers */}
        <div className="hidden md:grid md:grid-cols-[140px_60px_1fr_120px_140px_80px] gap-2 px-6 py-3 border-b border-border/60 bg-deep/40">
          <span className="font-mono text-[10px] text-text-dim tracking-wider uppercase">
            Req ID
          </span>
          <span className="font-mono text-[10px] text-text-dim tracking-wider uppercase">
            Section
          </span>
          <span className="font-mono text-[10px] text-text-dim tracking-wider uppercase">
            Description
          </span>
          <span className="font-mono text-[10px] text-text-dim tracking-wider uppercase">
            Status
          </span>
          <span className="font-mono text-[10px] text-text-dim tracking-wider uppercase">
            Coverage
          </span>
          <span className="font-mono text-[10px] text-text-dim tracking-wider uppercase">
            Mission
          </span>
        </div>

        {/* Table body */}
        <motion.div
          variants={tableContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {requirements.map((req) => {
            const config = statusConfig(req.status);
            const isSelected = selectedId === req.id;

            return (
              <motion.div key={req.id} variants={rowVariants}>
                {/* Row */}
                <div
                  className={`group cursor-pointer transition-colors duration-200 border-b border-border/30 ${
                    isSelected
                      ? 'bg-blue/[0.04]'
                      : 'hover:bg-elevated/40'
                  }`}
                  onClick={() => setSelectedId(isSelected ? null : req.id)}
                >
                  {/* Desktop row */}
                  <div className="hidden md:grid md:grid-cols-[140px_60px_1fr_120px_140px_80px] gap-2 items-center px-6 py-3.5">
                    {/* Req ID */}
                    <div className="flex items-center gap-2">
                      <ChevronRight
                        className={`w-3 h-3 text-text-dim transition-transform duration-200 ${
                          isSelected ? 'rotate-90 text-blue' : ''
                        }`}
                      />
                      <span className="font-mono text-xs text-text font-medium tracking-wide">
                        {req.id}
                      </span>
                    </div>

                    {/* Section */}
                    <span className="font-mono text-xs text-text-secondary">
                      {req.section}
                    </span>

                    {/* Description */}
                    <span className="text-sm text-text-secondary group-hover:text-text transition-colors duration-200 truncate">
                      {req.description}
                    </span>

                    {/* Status */}
                    <div className="flex items-center gap-1.5">
                      <config.Icon className={`w-3.5 h-3.5 ${config.color}`} />
                      <span className={`font-mono text-[11px] ${config.color} tracking-wide`}>
                        {config.label}
                      </span>
                    </div>

                    {/* Coverage */}
                    <CoverageBar coverage={req.coverage} />

                    {/* Mission */}
                    <span className="font-mono text-xs text-blue/70">
                      {req.missionId || '--'}
                    </span>
                  </div>

                  {/* Mobile row */}
                  <div className="md:hidden px-4 py-3.5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <ChevronRight
                          className={`w-3 h-3 text-text-dim transition-transform duration-200 shrink-0 ${
                            isSelected ? 'rotate-90 text-blue' : ''
                          }`}
                        />
                        <span className="font-mono text-xs text-text font-medium tracking-wide">
                          {req.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <config.Icon className={`w-3.5 h-3.5 ${config.color}`} />
                        <span className={`font-mono text-[11px] ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-text-secondary mb-2 pl-5">
                      {req.description}
                    </p>
                    <div className="flex items-center justify-between pl-5">
                      <span className="font-mono text-[10px] text-text-dim">
                        Section {req.section}
                      </span>
                      <CoverageBar coverage={req.coverage} />
                    </div>
                  </div>
                </div>

                {/* Detail panel */}
                <AnimatePresence>
                  {isSelected && <AssertionDetail requirement={req} />}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Table footer */}
        <div className="bg-deep/40 border-t border-border/60 px-6 py-3 flex items-center justify-between">
          <span className="font-mono text-[10px] text-text-dim tracking-wider uppercase">
            SRD Oracle v1.0
          </span>
          <span className="font-mono text-[10px] text-text-dim">
            Overall Coverage:{' '}
            <span className={stats.overallCoverage >= 80 ? 'text-emerald' : stats.overallCoverage >= 50 ? 'text-amber' : 'text-red'}>
              {Math.round(stats.overallCoverage)}%
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
