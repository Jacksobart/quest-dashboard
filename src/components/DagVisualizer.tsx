import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { missions } from '../lib/mock-data';

// ============================================================
// DAG VISUALIZER - Conflict-free dependency graph
// ============================================================

const AGENT_COLORS: Record<string, string> = {
  backend: '#ff5252',
  frontend: '#8b5cf6',
  database: '#fbbf24',
  testing: '#34d399',
};

const AGENT_LABELS: Record<string, string> = {
  backend: 'BACKEND',
  frontend: 'FRONTEND',
  database: 'DATABASE',
  testing: 'TESTING',
};

// Pre-computed batch assignments based on dependency topo sort
const BATCHES: string[][] = [
  ['m-01', 'm-02', 'm-03'],
  ['m-04', 'm-05', 'm-06', 'm-07'],
  ['m-08', 'm-09', 'm-10'],
  ['m-11', 'm-12'],
];

// Layout constants
const NODE_W = 220;
const NODE_H = 120;
const SVG_PADDING_X = 80;
const SVG_PADDING_TOP = 80;
const BATCH_GAP = 280;
const NODE_GAP_Y = 28;

interface NodePosition {
  x: number;
  y: number;
  mission: typeof missions[number];
  batchIndex: number;
}

function computeLayout(): { nodes: Map<string, NodePosition>; svgWidth: number; svgHeight: number } {
  const nodes = new Map<string, NodePosition>();
  let maxRowHeight = 0;

  BATCHES.forEach((batch) => {
    const totalHeight = batch.length * NODE_H + (batch.length - 1) * NODE_GAP_Y;
    if (totalHeight > maxRowHeight) maxRowHeight = totalHeight;
  });

  const svgHeight = maxRowHeight + SVG_PADDING_TOP * 2 + 40;
  const svgWidth = BATCHES.length * BATCH_GAP + SVG_PADDING_X * 2;

  BATCHES.forEach((batch, bi) => {
    const totalHeight = batch.length * NODE_H + (batch.length - 1) * NODE_GAP_Y;
    const startY = (svgHeight - totalHeight) / 2;
    const x = SVG_PADDING_X + bi * BATCH_GAP;

    batch.forEach((missionId, mi) => {
      const mission = missions.find((m) => m.id === missionId)!;
      const y = startY + mi * (NODE_H + NODE_GAP_Y);
      nodes.set(missionId, { x, y, mission, batchIndex: bi });
    });
  });

  return { nodes, svgWidth, svgHeight };
}

// Compute all dependency edges
function computeEdges(nodes: Map<string, NodePosition>): { from: string; to: string }[] {
  const edges: { from: string; to: string }[] = [];
  missions.forEach((m) => {
    m.depends.forEach((depId) => {
      if (nodes.has(depId) && nodes.has(m.id)) {
        edges.push({ from: depId, to: m.id });
      }
    });
  });
  return edges;
}

// Curved path between two nodes
function edgePath(
  fromNode: NodePosition,
  toNode: NodePosition,
): string {
  const x1 = fromNode.x + NODE_W;
  const y1 = fromNode.y + NODE_H / 2;
  const x2 = toNode.x;
  const y2 = toNode.y + NODE_H / 2;
  const cpOffset = (x2 - x1) * 0.45;
  return `M ${x1} ${y1} C ${x1 + cpOffset} ${y1}, ${x2 - cpOffset} ${y2}, ${x2} ${y2}`;
}

// Get connection status from the two nodes
function edgeStatus(
  fromMission: typeof missions[number],
  toMission: typeof missions[number],
): 'completed' | 'active' | 'pending' {
  if (fromMission.status === 'completed' && toMission.status === 'completed') return 'completed';
  if (
    fromMission.status === 'completed' &&
    (toMission.status === 'running' || toMission.status === 'retrying')
  )
    return 'active';
  return 'pending';
}

// Truncate text to fit
function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + '\u2026' : text;
}

// ---- Animated Edge Component ----
function DagEdge({
  from,
  to,
  nodes,
  highlighted,
  dimmed,
}: {
  from: string;
  to: string;
  nodes: Map<string, NodePosition>;
  highlighted: boolean;
  dimmed: boolean;
}) {
  const fromNode = nodes.get(from)!;
  const toNode = nodes.get(to)!;
  const d = edgePath(fromNode, toNode);
  const status = edgeStatus(fromNode.mission, toNode.mission);

  const color =
    status === 'completed'
      ? '#34d399'
      : status === 'active'
        ? '#ff5252'
        : '#555577';

  const glowColor =
    status === 'completed'
      ? '#34d39960'
      : status === 'active'
        ? '#ff525260'
        : 'transparent';

  const opacity = dimmed ? 0.12 : highlighted ? 1 : 0.7;

  return (
    <g style={{ opacity, transition: 'opacity 0.3s ease' }}>
      {/* Glow layer */}
      {(status === 'completed' || status === 'active') && !dimmed && (
        <path
          d={d}
          fill="none"
          stroke={glowColor}
          strokeWidth={highlighted ? 8 : 5}
          strokeLinecap="round"
          style={{ filter: 'blur(4px)' }}
        />
      )}

      {/* Main line */}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={highlighted ? 2.5 : 1.5}
        strokeLinecap="round"
        strokeDasharray={status === 'pending' ? '6 4' : 'none'}
      >
        {status === 'active' && (
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-20"
            dur="1s"
            repeatCount="indefinite"
          />
        )}
        {status === 'active' && (
          <animate
            attributeName="stroke-opacity"
            values="1;0.4;1"
            dur="2s"
            repeatCount="indefinite"
          />
        )}
      </path>

      {/* Active data flow particles */}
      {status === 'active' && !dimmed && (
        <>
          <circle r="3" fill={color}>
            <animateMotion dur="2s" repeatCount="indefinite" path={d} />
            <animate
              attributeName="opacity"
              values="0;1;1;0"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
          <circle r="3" fill={color}>
            <animateMotion dur="2s" repeatCount="indefinite" path={d} begin="0.7s" />
            <animate
              attributeName="opacity"
              values="0;1;1;0"
              dur="2s"
              repeatCount="indefinite"
              begin="0.7s"
            />
          </circle>
          <circle r="3" fill={color}>
            <animateMotion dur="2s" repeatCount="indefinite" path={d} begin="1.4s" />
            <animate
              attributeName="opacity"
              values="0;1;1;0"
              dur="2s"
              repeatCount="indefinite"
              begin="1.4s"
            />
          </circle>
        </>
      )}

      {/* Completed checkmark at midpoint */}
      {status === 'completed' && !dimmed && (
        <>
          <circle
            cx={(fromNode.x + NODE_W + toNode.x) / 2}
            cy={(fromNode.y + toNode.y + NODE_H) / 2}
            r="6"
            fill="#0c0c1e"
            stroke="#34d399"
            strokeWidth="1.5"
          />
          <path
            d={`M ${(fromNode.x + NODE_W + toNode.x) / 2 - 2.5} ${(fromNode.y + toNode.y + NODE_H) / 2} l 2 2 l 3.5 -3.5`}
            fill="none"
            stroke="#34d399"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}

      {/* Arrow head */}
      <polygon
        points={`${toNode.x},${toNode.y + NODE_H / 2} ${toNode.x - 8},${toNode.y + NODE_H / 2 - 5} ${toNode.x - 8},${toNode.y + NODE_H / 2 + 5}`}
        fill={color}
        opacity={dimmed ? 0.2 : 1}
      />
    </g>
  );
}

// ---- Mission Node Component ----
function DagNode({
  nodePos,
  isHovered,
  isHighlighted,
  isDimmed,
  onHoverStart,
  onHoverEnd,
  batchDelay,
}: {
  nodePos: NodePosition;
  isHovered: boolean;
  isHighlighted: boolean;
  isDimmed: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  batchDelay: number;
}) {
  const { x, y, mission } = nodePos;
  const agentColor = AGENT_COLORS[mission.agent] || '#555577';
  const isRunning = mission.status === 'running' || mission.status === 'retrying';
  const isCompleted = mission.status === 'completed';
  const isFailed = mission.status === 'failed';

  // Border color based on status
  const borderColor = isCompleted
    ? '#34d399'
    : isRunning
      ? '#ff5252'
      : isFailed
        ? '#f43f5e'
        : '#252550';

  const bgColor = isHovered
    ? '#1a1a38'
    : '#121228';

  const nodeOpacity = isDimmed ? 0.25 : 1;

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{
        opacity: nodeOpacity,
        scale: 1,
        transition: {
          delay: batchDelay,
          duration: 0.5,
          ease: [0.23, 1, 0.32, 1],
        },
      }}
      style={{ cursor: 'pointer' }}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
    >
      {/* Outer glow for active/hovered */}
      {(isRunning || isHovered) && !isDimmed && (
        <rect
          x={x - 4}
          y={y - 4}
          width={NODE_W + 8}
          height={NODE_H + 8}
          rx={14}
          fill="none"
          stroke={isRunning ? '#ff5252' : borderColor}
          strokeWidth={1}
          opacity={0.3}
          style={{ filter: `blur(6px)` }}
        >
          {isRunning && (
            <animate
              attributeName="opacity"
              values="0.3;0.1;0.3"
              dur="2s"
              repeatCount="indefinite"
            />
          )}
        </rect>
      )}

      {/* Node background */}
      <rect
        x={x}
        y={y}
        width={NODE_W}
        height={NODE_H}
        rx={10}
        fill={bgColor}
        stroke={borderColor}
        strokeWidth={isHovered || isHighlighted ? 2 : 1}
        style={{ transition: 'all 0.3s ease' }}
      />

      {/* Running pulse border overlay */}
      {isRunning && !isDimmed && (
        <rect
          x={x}
          y={y}
          width={NODE_W}
          height={NODE_H}
          rx={10}
          fill="none"
          stroke="#ff5252"
          strokeWidth={2}
        >
          <animate
            attributeName="stroke-opacity"
            values="1;0.3;1"
            dur="2s"
            repeatCount="indefinite"
          />
        </rect>
      )}

      {/* Status indicator dot */}
      <circle
        cx={x + 14}
        cy={y + 16}
        r={4}
        fill={
          isCompleted
            ? '#34d399'
            : isRunning
              ? '#ff5252'
              : isFailed
                ? '#f43f5e'
                : '#555577'
        }
      >
        {isRunning && (
          <animate
            attributeName="r"
            values="4;5;4"
            dur="1.5s"
            repeatCount="indefinite"
          />
        )}
      </circle>

      {/* Mission ID */}
      <text
        x={x + 24}
        y={y + 20}
        fill="#e8e8f4"
        fontSize="13"
        fontFamily="'JetBrains Mono', monospace"
        fontWeight="600"
      >
        {mission.id}
      </text>

      {/* Status label */}
      <text
        x={x + NODE_W - 12}
        y={y + 20}
        fill={
          isCompleted
            ? '#34d399'
            : isRunning
              ? '#ff5252'
              : isFailed
                ? '#f43f5e'
                : '#555577'
        }
        fontSize="9"
        fontFamily="'JetBrains Mono', monospace"
        fontWeight="600"
        textAnchor="end"
        letterSpacing="0.08em"
      >
        {mission.status.toUpperCase()}
      </text>

      {/* Agent badge */}
      <rect
        x={x + 10}
        y={y + 30}
        width={62}
        height={18}
        rx={9}
        fill={agentColor}
        opacity={0.15}
      />
      <text
        x={x + 41}
        y={y + 42}
        fill={agentColor}
        fontSize="9"
        fontFamily="'JetBrains Mono', monospace"
        fontWeight="600"
        textAnchor="middle"
        letterSpacing="0.08em"
      >
        {AGENT_LABELS[mission.agent]}
      </text>

      {/* Objective text */}
      <text
        x={x + 10}
        y={y + 64}
        fill="#8888aa"
        fontSize="10.5"
        fontFamily="'Outfit', sans-serif"
      >
        {truncate(mission.objective, 30)}
      </text>
      {mission.objective.length > 30 && (
        <text
          x={x + 10}
          y={y + 78}
          fill="#8888aa"
          fontSize="10.5"
          fontFamily="'Outfit', sans-serif"
        >
          {truncate(mission.objective.slice(29), 28)}
        </text>
      )}

      {/* Progress bar for running missions */}
      {isRunning && (
        <g>
          {/* Track */}
          <rect
            x={x + 10}
            y={y + NODE_H - 20}
            width={NODE_W - 20}
            height={5}
            rx={2.5}
            fill="#252550"
          />
          {/* Fill */}
          <rect
            x={x + 10}
            y={y + NODE_H - 20}
            width={(NODE_W - 20) * (mission.progress / 100)}
            height={5}
            rx={2.5}
            fill="#ff5252"
          >
            <animate
              attributeName="opacity"
              values="1;0.7;1"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </rect>
          {/* Percentage */}
          <text
            x={x + NODE_W - 12}
            y={y + NODE_H - 18}
            fill="#ff5252"
            fontSize="9"
            fontFamily="'JetBrains Mono', monospace"
            fontWeight="500"
            textAnchor="end"
            dominantBaseline="hanging"
          >
            {mission.progress}%
          </text>
        </g>
      )}

      {/* Completed checkmark bar */}
      {isCompleted && (
        <g>
          <rect
            x={x + 10}
            y={y + NODE_H - 20}
            width={NODE_W - 20}
            height={5}
            rx={2.5}
            fill="#34d399"
            opacity={0.4}
          />
          {mission.duration && (
            <text
              x={x + NODE_W - 12}
              y={y + NODE_H - 12}
              fill="#34d399"
              fontSize="9"
              fontFamily="'JetBrains Mono', monospace"
              fontWeight="500"
              textAnchor="end"
              opacity={0.7}
            >
              {mission.duration}s
            </text>
          )}
        </g>
      )}

      {/* Pending indicator */}
      {mission.status === 'pending' && (
        <text
          x={x + 10}
          y={y + NODE_H - 12}
          fill="#555577"
          fontSize="9"
          fontFamily="'JetBrains Mono', monospace"
          fontWeight="500"
        >
          QUEUED
        </text>
      )}
    </motion.g>
  );
}

// ============================================================
// Main Component
// ============================================================
export default function DagVisualizer() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const { nodes, svgWidth, svgHeight } = useMemo(() => computeLayout(), []);
  const edges = useMemo(() => computeEdges(nodes), [nodes]);

  // Compute highlighted nodes (all deps and dependents of hovered)
  const { highlightedNodes, highlightedEdges } = useMemo(() => {
    if (!hoveredNode)
      return { highlightedNodes: new Set<string>(), highlightedEdges: new Set<string>() };

    const hl = new Set<string>();
    const hlEdges = new Set<string>();
    hl.add(hoveredNode);

    // Walk upstream (dependencies)
    const walkUp = (id: string) => {
      const m = missions.find((mi) => mi.id === id);
      if (!m) return;
      m.depends.forEach((dep) => {
        hl.add(dep);
        hlEdges.add(`${dep}->${id}`);
        walkUp(dep);
      });
    };
    walkUp(hoveredNode);

    // Walk downstream (dependents)
    const walkDown = (id: string) => {
      missions.forEach((m) => {
        if (m.depends.includes(id)) {
          hl.add(m.id);
          hlEdges.add(`${id}->${m.id}`);
          walkDown(m.id);
        }
      });
    };
    walkDown(hoveredNode);

    return { highlightedNodes: hl, highlightedEdges: hlEdges };
  }, [hoveredNode]);

  const handleHoverStart = useCallback((id: string) => setHoveredNode(id), []);
  const handleHoverEnd = useCallback(() => setHoveredNode(null), []);

  // Auto-scroll container to center on the active batch
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollContainerRef.current) {
      // Scroll to show batch 2 (the active one) roughly centered
      const scrollTarget = BATCH_GAP * 0.8;
      scrollContainerRef.current.scrollLeft = scrollTarget;
    }
  }, []);

  return (
    <div className="section-container">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="mb-10"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border-glow to-transparent" />
          <span className="badge bg-blue/10 text-blue border border-blue/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue animate-pulse" />
            EXECUTION PLAN
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border-glow to-transparent" />
        </div>

        <h2 className="font-display text-3xl md:text-4xl font-bold text-center text-text">
          MISSION DEPENDENCY{' '}
          <span className="gradient-text-blue">GRAPH</span>
        </h2>
        <p className="text-text-secondary text-center mt-3 max-w-2xl mx-auto font-body text-sm leading-relaxed">
          Conflict-free DAG ordering ensures zero file ownership overlaps.
          Missions execute in topologically sorted batches -- each batch
          runs in parallel once all upstream dependencies resolve.
        </p>
      </motion.div>

      {/* DAG Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="card grid-bg relative"
      >
        {/* Top scanline effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
          <div
            className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-blue/30 to-transparent"
            style={{
              animation: 'scanMove 6s ease-in-out infinite',
            }}
          />
          <style>{`
            @keyframes scanMove {
              0%, 100% { top: 10%; }
              50% { top: 90%; }
            }
          `}</style>
        </div>

        {/* Batch labels header bar */}
        <div className="relative z-10 flex items-center justify-between px-6 pt-5 pb-2">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-blue">
              <path
                d="M2 8h3l2-4 2 8 2-4h3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="font-mono text-xs text-text-dim tracking-widest uppercase">
              DAG TOPOLOGY &middot; 4 BATCHES &middot; 12 MISSIONS
            </span>
          </div>
          <div className="flex items-center gap-4">
            {/* Legend */}
            {Object.entries(AGENT_COLORS).map(([agent, color]) => (
              <div key={agent} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}60` }}
                />
                <span className="font-mono text-[10px] text-text-dim uppercase tracking-wider">
                  {agent}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable SVG area */}
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto overflow-y-hidden relative z-10 pb-4"
        >
          <svg
            ref={svgRef}
            width={svgWidth}
            height={svgHeight}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="block mx-auto"
            style={{ minWidth: svgWidth }}
          >
            <defs>
              {/* Glow filters */}
              <filter id="dag-glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feFlood floodColor="#ff5252" floodOpacity="0.3" result="color" />
                <feComposite in="color" in2="blur" operator="in" result="glow" />
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="dag-glow-emerald" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feFlood floodColor="#34d399" floodOpacity="0.2" result="color" />
                <feComposite in="color" in2="blur" operator="in" result="glow" />
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Grid pattern */}
              <pattern id="dag-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path
                  d="M 60 0 L 0 0 0 60"
                  fill="none"
                  stroke="rgba(37, 37, 80, 0.15)"
                  strokeWidth="0.5"
                />
              </pattern>

              {/* Radial gradient for batch columns */}
              <linearGradient id="batch-col-active" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff5252" stopOpacity="0.04" />
                <stop offset="50%" stopColor="#ff5252" stopOpacity="0.02" />
                <stop offset="100%" stopColor="#ff5252" stopOpacity="0.04" />
              </linearGradient>
              <linearGradient id="batch-col-done" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.03" />
                <stop offset="50%" stopColor="#34d399" stopOpacity="0.01" />
                <stop offset="100%" stopColor="#34d399" stopOpacity="0.03" />
              </linearGradient>
              <linearGradient id="batch-col-pending" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#555577" stopOpacity="0.02" />
                <stop offset="50%" stopColor="#555577" stopOpacity="0.01" />
                <stop offset="100%" stopColor="#555577" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Background grid */}
            <rect width={svgWidth} height={svgHeight} fill="url(#dag-grid)" />

            {/* Batch column backgrounds */}
            {BATCHES.map((batch, bi) => {
              const bx = SVG_PADDING_X + bi * BATCH_GAP - 20;
              const allCompleted = batch.every(
                (id) => missions.find((m) => m.id === id)?.status === 'completed',
              );
              const anyRunning = batch.some((id) => {
                const s = missions.find((m) => m.id === id)?.status;
                return s === 'running' || s === 'retrying';
              });
              const fillId = allCompleted
                ? 'url(#batch-col-done)'
                : anyRunning
                  ? 'url(#batch-col-active)'
                  : 'url(#batch-col-pending)';

              return (
                <g key={`batch-bg-${bi}`}>
                  <rect
                    x={bx}
                    y={20}
                    width={NODE_W + 40}
                    height={svgHeight - 40}
                    rx={12}
                    fill={fillId}
                    stroke={
                      allCompleted
                        ? '#34d39915'
                        : anyRunning
                          ? '#ff525215'
                          : '#55557710'
                    }
                    strokeWidth={1}
                  />
                </g>
              );
            })}

            {/* Batch labels */}
            {BATCHES.map((batch, bi) => {
              const bx = SVG_PADDING_X + bi * BATCH_GAP + NODE_W / 2;
              const allCompleted = batch.every(
                (id) => missions.find((m) => m.id === id)?.status === 'completed',
              );
              const anyRunning = batch.some((id) => {
                const s = missions.find((m) => m.id === id)?.status;
                return s === 'running' || s === 'retrying';
              });
              const labelColor = allCompleted
                ? '#34d399'
                : anyRunning
                  ? '#ff5252'
                  : '#555577';

              return (
                <g key={`batch-label-${bi}`}>
                  <text
                    x={bx}
                    y={44}
                    textAnchor="middle"
                    fill={labelColor}
                    fontSize="11"
                    fontFamily="'JetBrains Mono', monospace"
                    fontWeight="600"
                    letterSpacing="0.15em"
                  >
                    BATCH {bi + 1}
                  </text>
                  <text
                    x={bx}
                    y={57}
                    textAnchor="middle"
                    fill={labelColor}
                    fontSize="9"
                    fontFamily="'JetBrains Mono', monospace"
                    fontWeight="400"
                    opacity={0.5}
                  >
                    {allCompleted ? 'COMPLETE' : anyRunning ? 'EXECUTING' : 'QUEUED'}
                  </text>
                  {/* Horizontal line under label */}
                  <line
                    x1={SVG_PADDING_X + bi * BATCH_GAP}
                    y1={64}
                    x2={SVG_PADDING_X + bi * BATCH_GAP + NODE_W}
                    y2={64}
                    stroke={labelColor}
                    strokeWidth={0.5}
                    opacity={0.3}
                  />
                </g>
              );
            })}

            {/* Edges */}
            <g>
              {edges.map(({ from, to }) => {
                const edgeKey = `${from}->${to}`;
                const isEdgeHighlighted =
                  hoveredNode !== null && highlightedEdges.has(edgeKey);
                const isEdgeDimmed =
                  hoveredNode !== null && !highlightedEdges.has(edgeKey);

                return (
                  <DagEdge
                    key={edgeKey}
                    from={from}
                    to={to}
                    nodes={nodes}
                    highlighted={isEdgeHighlighted}
                    dimmed={isEdgeDimmed}
                  />
                );
              })}
            </g>

            {/* Nodes */}
            <g>
              {BATCHES.map((batch, bi) =>
                batch.map((missionId, mi) => {
                  const nodePos = nodes.get(missionId)!;
                  const isHovered = hoveredNode === missionId;
                  const isHighlighted =
                    hoveredNode !== null && highlightedNodes.has(missionId);
                  const isDimmed =
                    hoveredNode !== null && !highlightedNodes.has(missionId);
                  const batchDelay = bi * 0.2 + mi * 0.08;

                  return (
                    <DagNode
                      key={missionId}
                      nodePos={nodePos}
                      isHovered={isHovered}
                      isHighlighted={isHighlighted}
                      isDimmed={isDimmed}
                      onHoverStart={() => handleHoverStart(missionId)}
                      onHoverEnd={handleHoverEnd}
                      batchDelay={batchDelay}
                    />
                  );
                }),
              )}
            </g>
          </svg>
        </div>

        {/* Bottom status bar */}
        <div className="relative z-10 flex items-center justify-between px-6 py-3 border-t border-border/50">
          <div className="flex items-center gap-5">
            {/* Status legend */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald" />
              <span className="font-mono text-[10px] text-text-dim tracking-wider">COMPLETED</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue animate-pulse" />
              <span className="font-mono text-[10px] text-text-dim tracking-wider">RUNNING</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-text-dim" />
              <span className="font-mono text-[10px] text-text-dim tracking-wider">PENDING</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red" />
              <span className="font-mono text-[10px] text-text-dim tracking-wider">FAILED</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] text-text-dim">
              <span className="text-emerald">3</span>/12 MISSIONS COMPLETE
            </span>
            <div className="h-3 w-px bg-border" />
            <span className="font-mono text-[10px] text-text-dim">
              BATCH <span className="text-blue">2</span>/4 ACTIVE
            </span>
            <div className="h-3 w-px bg-border" />
            <span className="font-mono text-[10px] text-text-dim">
              <span className="text-emerald">0</span> CONFLICTS
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
