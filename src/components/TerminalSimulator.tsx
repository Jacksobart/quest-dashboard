import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  Copy,
  Terminal,
  Check,
} from 'lucide-react';
import { terminalHistory } from '../lib/mock-data';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface TerminalEntry {
  cmd: string;
  output: string;
  timing: number | undefined;
}

type PlaybackState = 'idle' | 'typing-cmd' | 'revealing-output' | 'pausing' | 'finished';
type SpeedMultiplier = 1 | 2 | 4;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const BASE_TYPE_SPEED = 40; // ms per character
const BASE_LINE_REVEAL = 20; // ms per line
const BASE_PAUSE = 800; // ms between commands
const PROMPT = '~/project $';

// ---------------------------------------------------------------------------
// Line coloring logic
// ---------------------------------------------------------------------------
function classifyLine(line: string): string {
  const trimmed = line.trimStart();

  if (trimmed.startsWith('\u2713') && trimmed.includes('PASSED')) {
    return 'text-emerald font-bold';
  }
  if (trimmed.startsWith('\u2713')) {
    return 'text-emerald';
  }
  if (trimmed.includes('PASSED')) {
    return 'text-emerald font-bold';
  }
  if (trimmed.startsWith('\u25b8')) {
    return 'text-cyan';
  }
  if (
    trimmed.includes('\u2588\u2588') ||
    trimmed.includes('\u2592') ||
    trimmed.includes('\u2591') ||
    trimmed.includes('%')
  ) {
    // Progress bar lines
    if (trimmed.includes('DONE')) {
      return 'text-emerald';
    }
    return 'text-amber';
  }
  if (
    trimmed.startsWith('\u251c\u2500') ||
    trimmed.startsWith('\u2514\u2500') ||
    trimmed.startsWith('\u2502')
  ) {
    return 'text-text-dim';
  }
  // Indented tree lines (with leading spaces before tree characters)
  if (
    trimmed.startsWith('\u251c\u2500') ||
    trimmed.startsWith('\u2514\u2500')
  ) {
    return 'text-text-dim';
  }

  return 'text-text-secondary';
}

// ---------------------------------------------------------------------------
// Cursor component
// ---------------------------------------------------------------------------
function BlinkingCursor() {
  return (
    <motion.span
      className="inline-block w-[8px] h-[16px] bg-cyan align-middle ml-[1px]"
      animate={{ opacity: [1, 1, 0, 0] }}
      transition={{ duration: 1, repeat: Infinity, times: [0, 0.5, 0.5, 1] }}
      style={{ boxShadow: '0 0 6px var(--color-cyan-glow)' }}
    />
  );
}

// ---------------------------------------------------------------------------
// Copy button
// ---------------------------------------------------------------------------
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: do nothing
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="absolute right-3 top-0 bottom-0 my-auto h-6 px-2 rounded border border-border/60 bg-surface/80 backdrop-blur-sm text-text-dim hover:text-cyan hover:border-cyan/40 transition-all duration-200 opacity-0 group-hover/cmd:opacity-100 flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider"
      aria-label="Copy command"
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.span
            key="check"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="flex items-center gap-1 text-emerald"
          >
            <Check size={10} />
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="flex items-center gap-1"
          >
            <Copy size={10} />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function TerminalSimulator() {
  // Playback state
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<SpeedMultiplier>(1);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');

  // Current position in the terminal history
  const [currentEntryIdx, setCurrentEntryIdx] = useState(0);
  const [typedChars, setTypedChars] = useState(0);
  const [revealedLines, setRevealedLines] = useState(0);

  // Completed entries (fully rendered)
  const [completedEntries, setCompletedEntries] = useState<number[]>([]);

  // Refs for auto-scroll
  const terminalBodyRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Timer ref
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------
  const currentEntry: TerminalEntry | undefined = terminalHistory[currentEntryIdx];
  const currentOutputLines = useMemo(
    () => (currentEntry ? currentEntry.output.split('\n') : []),
    [currentEntry],
  );

  // Count total visible lines for line numbering
  const totalLineCount = useMemo(() => {
    let count = 0;
    for (const idx of completedEntries) {
      const entry = terminalHistory[idx];
      count += 1; // prompt line
      count += entry.output.split('\n').length; // output lines
    }
    // Current entry if still in progress
    if (playbackState !== 'idle' && playbackState !== 'finished') {
      count += 1; // current prompt
      if (playbackState === 'revealing-output' || playbackState === 'pausing') {
        count += revealedLines;
      }
    }
    // Finished state: all entries completed
    if (playbackState === 'finished') {
      count += 1; // final prompt line
    }
    return count;
  }, [completedEntries, playbackState, revealedLines]);

  // ---------------------------------------------------------------------------
  // Auto-scroll to bottom
  // ---------------------------------------------------------------------------
  const scrollToBottom = useCallback(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [typedChars, revealedLines, completedEntries, playbackState, scrollToBottom]);

  // ---------------------------------------------------------------------------
  // Clear timer on unmount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Playback engine
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isPlaying) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    const typeSpeed = BASE_TYPE_SPEED / speed;
    const lineReveal = BASE_LINE_REVEAL / speed;
    const pauseTime = BASE_PAUSE / speed;

    switch (playbackState) {
      case 'idle': {
        // Start typing the current command
        if (currentEntryIdx < terminalHistory.length) {
          setTypedChars(0);
          setRevealedLines(0);
          setPlaybackState('typing-cmd');
        }
        break;
      }

      case 'typing-cmd': {
        if (!currentEntry) break;
        if (typedChars < currentEntry.cmd.length) {
          timerRef.current = setTimeout(() => {
            setTypedChars((c) => c + 1);
          }, typeSpeed);
        } else {
          // Command fully typed, reveal output
          timerRef.current = setTimeout(() => {
            setRevealedLines(0);
            setPlaybackState('revealing-output');
          }, pauseTime * 0.4);
        }
        break;
      }

      case 'revealing-output': {
        if (revealedLines < currentOutputLines.length) {
          // Adaptive speed: tree lines appear faster
          const nextLine = currentOutputLines[revealedLines];
          const trimmedNext = nextLine?.trimStart() ?? '';
          const isTreeLine =
            trimmedNext.startsWith('\u251c') ||
            trimmedNext.startsWith('\u2514') ||
            trimmedNext.startsWith('\u2502');
          const revealSpeed = isTreeLine ? lineReveal * 0.6 : lineReveal;

          // For progress bar lines, reveal more slowly to build anticipation
          const isProgressBar = trimmedNext.includes('\u2588\u2588') || trimmedNext.includes('%');
          const adjustedSpeed = isProgressBar ? revealSpeed * 4 : revealSpeed;

          timerRef.current = setTimeout(() => {
            setRevealedLines((l) => l + 1);
          }, Math.max(adjustedSpeed, 10) + Math.random() * lineReveal * 2);
        } else {
          // All output revealed, pause then move to next
          setPlaybackState('pausing');
        }
        break;
      }

      case 'pausing': {
        timerRef.current = setTimeout(() => {
          setCompletedEntries((prev) => [...prev, currentEntryIdx]);
          const nextIdx = currentEntryIdx + 1;
          if (nextIdx < terminalHistory.length) {
            setCurrentEntryIdx(nextIdx);
            setTypedChars(0);
            setRevealedLines(0);
            setPlaybackState('typing-cmd');
          } else {
            setPlaybackState('finished');
          }
        }, pauseTime);
        break;
      }

      case 'finished': {
        // Nothing to do
        break;
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    isPlaying,
    playbackState,
    typedChars,
    revealedLines,
    currentEntryIdx,
    currentEntry,
    currentOutputLines,
    speed,
  ]);

  // ---------------------------------------------------------------------------
  // Controls
  // ---------------------------------------------------------------------------
  const handlePlayPause = useCallback(() => {
    setIsPlaying((p) => !p);
  }, []);

  const handleRestart = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCompletedEntries([]);
    setCurrentEntryIdx(0);
    setTypedChars(0);
    setRevealedLines(0);
    setPlaybackState('idle');
    setIsPlaying(true);
  }, []);

  const handleSpeed = useCallback(() => {
    setSpeed((s) => {
      if (s === 1) return 2;
      if (s === 2) return 4;
      return 1;
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Build rendered lines
  // ---------------------------------------------------------------------------
  let lineNumber = 0;

  const renderCompletedEntry = (entryIdx: number) => {
    const entry = terminalHistory[entryIdx];
    const outputLines = entry.output.split('\n');
    const promptLineNum = ++lineNumber;

    return (
      <div key={`completed-${entryIdx}`}>
        {/* Prompt + command */}
        <div className="group/cmd relative flex">
          <span className="inline-block w-10 text-right mr-4 text-text-dim/40 select-none text-[11px] leading-[20px] shrink-0">
            {promptLineNum}
          </span>
          <div className="flex-1 min-w-0">
            <span className="text-emerald">{PROMPT}</span>
            <span className="text-cyan ml-2">{entry.cmd}</span>
            {entry.timing !== undefined && (
              <span className="text-text-dim ml-3 text-[11px]">
                ({entry.timing}s)
              </span>
            )}
          </div>
          <CopyButton text={entry.cmd} />
        </div>

        {/* Output lines */}
        {outputLines.map((line, i) => {
          const ln = ++lineNumber;
          return (
            <div key={`${entryIdx}-out-${i}`} className="flex">
              <span className="inline-block w-10 text-right mr-4 text-text-dim/40 select-none text-[11px] leading-[20px] shrink-0">
                {ln}
              </span>
              <span className={`flex-1 ${classifyLine(line)}`}>
                {line || '\u00A0'}
              </span>
            </div>
          );
        })}

        {/* Blank line between entries */}
        <div className="h-1" />
      </div>
    );
  };

  const renderCurrentEntry = () => {
    if (!currentEntry) return null;
    if (playbackState === 'idle' || playbackState === 'finished') return null;

    const promptLineNum = ++lineNumber;
    const isTyping = playbackState === 'typing-cmd';
    const showingOutput =
      playbackState === 'revealing-output' || playbackState === 'pausing';

    return (
      <div key="current">
        {/* Prompt + typing command */}
        <div className="group/cmd relative flex">
          <span className="inline-block w-10 text-right mr-4 text-text-dim/40 select-none text-[11px] leading-[20px] shrink-0">
            {promptLineNum}
          </span>
          <div className="flex-1 min-w-0">
            <span className="text-emerald">{PROMPT}</span>
            <span className="text-cyan ml-2">
              {currentEntry.cmd.slice(0, typedChars)}
            </span>
            {isTyping && <BlinkingCursor />}
          </div>
          {!isTyping && <CopyButton text={currentEntry.cmd} />}
        </div>

        {/* Output lines being revealed */}
        {showingOutput &&
          currentOutputLines.slice(0, revealedLines).map((line, i) => {
            const ln = ++lineNumber;
            return (
              <motion.div
                key={`current-out-${i}`}
                className="flex"
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                <span className="inline-block w-10 text-right mr-4 text-text-dim/40 select-none text-[11px] leading-[20px] shrink-0">
                  {ln}
                </span>
                <span className={`flex-1 ${classifyLine(line)}`}>
                  {line || '\u00A0'}
                </span>
              </motion.div>
            );
          })}

        {/* Cursor at end of output reveal */}
        {showingOutput && revealedLines === currentOutputLines.length && (
          <div className="flex">
            <span className="inline-block w-10 mr-4 shrink-0" />
            <BlinkingCursor />
          </div>
        )}
      </div>
    );
  };

  const renderFinishedPrompt = () => {
    if (playbackState !== 'finished') return null;
    const ln = ++lineNumber;
    return (
      <motion.div
        className="flex mt-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <span className="inline-block w-10 text-right mr-4 text-text-dim/40 select-none text-[11px] leading-[20px] shrink-0">
          {ln}
        </span>
        <span className="text-emerald">quest&gt;</span>
        <span className="ml-1">
          <BlinkingCursor />
        </span>
      </motion.div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="section-container">
      {/* Section header */}
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <span className="badge bg-cyan/[0.08] text-cyan border border-cyan/20 mb-4 inline-flex">
          <Terminal size={12} />
          LIVE DEMO
        </span>
        <h2 className="font-display font-bold text-4xl sm:text-5xl text-text mt-4">
          QUEST CLI IN ACTION
        </h2>
        <p className="text-text-secondary mt-3 max-w-2xl mx-auto text-lg">
          Watch the Quest pipeline execute in real time -- from spec validation through
          parallel mission execution with live progress tracking.
        </p>
      </motion.div>

      {/* Terminal window */}
      <motion.div
        className="max-w-5xl mx-auto"
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div
          className="rounded-xl overflow-hidden border border-border/80 relative"
          style={{
            boxShadow:
              '0 0 40px rgba(0, 229, 255, 0.06), 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.03) inset',
          }}
        >
          {/* macOS title bar */}
          <div
            className="flex items-center justify-between px-4 py-2.5 border-b border-border/60"
            style={{ background: '#111122' }}
          >
            {/* Traffic lights */}
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-110 transition-all cursor-pointer" />
              <span className="w-3 h-3 rounded-full bg-[#febc2e] hover:brightness-110 transition-all cursor-pointer" />
              <span className="w-3 h-3 rounded-full bg-[#28c840] hover:brightness-110 transition-all cursor-pointer" />
            </div>

            {/* Title */}
            <div className="flex items-center gap-2 text-text-dim text-[11px] font-mono tracking-wide">
              <Terminal size={12} className="text-text-dim/60" />
              <span>quest &mdash; tmux &mdash; 120x40</span>
            </div>

            {/* Playback controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleRestart}
                className="p-1.5 rounded-md text-text-dim hover:text-amber hover:bg-amber/10 transition-all duration-200"
                aria-label="Restart"
                title="Restart"
              >
                <RotateCcw size={13} />
              </button>
              <button
                onClick={handlePlayPause}
                className="p-1.5 rounded-md text-text-dim hover:text-cyan hover:bg-cyan/10 transition-all duration-200"
                aria-label={isPlaying ? 'Pause' : 'Play'}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={13} /> : <Play size={13} />}
              </button>
              <button
                onClick={handleSpeed}
                className="px-2 py-1 rounded-md text-text-dim hover:text-purple hover:bg-purple/10 transition-all duration-200 font-mono text-[10px] font-semibold tracking-wider min-w-[36px] text-center"
                aria-label="Change speed"
                title={`Speed: ${speed}x`}
              >
                {speed}x
              </button>
            </div>
          </div>

          {/* Terminal body */}
          <div
            ref={terminalBodyRef}
            className="relative overflow-y-auto font-mono text-[13px] leading-[20px] p-4 sm:p-5"
            style={{
              background: '#0a0a12',
              height: '480px',
              scrollbarWidth: 'thin',
            }}
          >
            {/* Scanline overlay */}
            <div
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                background:
                  'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.04) 2px, rgba(0, 0, 0, 0.04) 4px)',
              }}
            />

            {/* Subtle CRT glow at top */}
            <div
              className="absolute top-0 left-0 right-0 h-24 pointer-events-none z-10"
              style={{
                background:
                  'linear-gradient(180deg, rgba(0, 229, 255, 0.015) 0%, transparent 100%)',
              }}
            />

            {/* Terminal content */}
            <div className="relative z-0">
              {/* Initial greeting line */}
              <div className="flex mb-2 text-text-dim/50 text-[11px]">
                <span className="inline-block w-10 mr-4 shrink-0" />
                <span>
                  Quest v1.0.0 &middot; The Planning Engine &middot; claude-opus-4-6
                </span>
              </div>
              <div className="flex mb-3 text-text-dim/30 text-[11px]">
                <span className="inline-block w-10 mr-4 shrink-0" />
                <span>
                  {'─'.repeat(60)}
                </span>
              </div>

              {/* Completed entries */}
              {completedEntries.map(renderCompletedEntry)}

              {/* Current entry being animated */}
              {renderCurrentEntry()}

              {/* Finished state prompt */}
              {renderFinishedPrompt()}

              {/* Scroll anchor */}
              <div ref={bottomRef} className="h-4" />
            </div>
          </div>

          {/* Bottom status bar */}
          <div
            className="flex items-center justify-between px-4 py-1.5 border-t border-border/40 text-[10px] font-mono text-text-dim/60"
            style={{ background: '#0d0d18' }}
          >
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    playbackState === 'finished'
                      ? 'bg-emerald'
                      : isPlaying
                      ? 'bg-cyan animate-pulse'
                      : 'bg-amber'
                  }`}
                />
                {playbackState === 'finished'
                  ? 'COMPLETE'
                  : isPlaying
                  ? 'RUNNING'
                  : 'PAUSED'}
              </span>
              <span className="text-text-dim/30">|</span>
              <span>
                {Math.min(currentEntryIdx + (completedEntries.includes(currentEntryIdx) ? 1 : 0), terminalHistory.length)}
                /{terminalHistory.length} commands
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span>SPEED: {speed}x</span>
              <span className="text-text-dim/30">|</span>
              <span>{totalLineCount} lines</span>
              <span className="text-text-dim/30">|</span>
              <span className="tracking-wider">UTF-8</span>
            </div>
          </div>
        </div>

        {/* Reflection / glow beneath terminal */}
        <div
          className="h-16 mx-8 -mt-1 rounded-b-2xl opacity-40 blur-xl pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center top, rgba(0, 229, 255, 0.12), transparent 70%)',
          }}
        />
      </motion.div>
    </div>
  );
}
