import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Terminal,
  GitBranch,
  Shield,
  Activity,
  FileCode,
  Users,
  AlertTriangle,
  Layers,
  CheckCircle,
  Command,
} from 'lucide-react';

interface PaletteItem {
  id: string;
  label: string;
  section: string;
  icon: React.ElementType;
  shortcut?: string;
}

const ITEMS: PaletteItem[] = [
  { id: 'hero', label: 'Home', section: 'hero', icon: Command, shortcut: 'H' },
  { id: 'pipeline', label: 'Pipeline Visualizer', section: 'pipeline', icon: Activity, shortcut: '1' },
  { id: 'terminal', label: 'Terminal Simulator', section: 'terminal', icon: Terminal, shortcut: '2' },
  { id: 'dag', label: 'DAG Visualizer', section: 'dag', icon: GitBranch, shortcut: '3' },
  { id: 'missions', label: 'Mission Control', section: 'missions', icon: Layers, shortcut: '4' },
  { id: 'yaml', label: 'Mission YAML', section: 'yaml', icon: FileCode, shortcut: '5' },
  { id: 'gaps', label: 'Gap Analysis', section: 'gaps', icon: AlertTriangle, shortcut: '6' },
  { id: 'requirements', label: 'Requirement Matrix', section: 'requirements', icon: CheckCircle, shortcut: '7' },
  { id: 'verification', label: 'Verification Gates', section: 'verification', icon: Shield, shortcut: '8' },
  { id: 'drift', label: 'Drift Detection', section: 'drift', icon: AlertTriangle, shortcut: '9' },
  { id: 'agents', label: 'Agent Configuration', section: 'agents', icon: Users, shortcut: '0' },
];

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = ITEMS.filter(
    (item) =>
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.section.toLowerCase().includes(query.toLowerCase()),
  );

  // Open on Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setQuery('');
        setSelectedIdx(0);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const navigateTo = useCallback(
    (sectionId: string) => {
      setIsOpen(false);
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [],
  );

  // Keyboard navigation
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIdx]) {
        navigateTo(filtered[selectedIdx].section);
      }
    }
  };

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[100] bg-void/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setIsOpen(false)}
          />

          {/* Palette */}
          <motion.div
            className="fixed top-[20%] left-1/2 z-[101] w-full max-w-xl"
            initial={{ opacity: 0, y: -20, x: '-50%', scale: 0.96 }}
            animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
            exit={{ opacity: 0, y: -20, x: '-50%', scale: 0.96 }}
            transition={{ duration: 0.15 }}
          >
            <div
              className="rounded-xl border border-border-glow overflow-hidden"
              style={{
                background: 'var(--color-abyss)',
                boxShadow:
                  '0 0 60px rgba(0,229,255,0.1), 0 25px 80px rgba(0,0,0,0.6)',
              }}
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <Search size={16} className="text-text-dim flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Navigate to section..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  className="flex-1 bg-transparent border-none outline-none text-text font-body text-sm placeholder:text-text-dim"
                />
                <kbd className="px-1.5 py-0.5 rounded border border-border bg-surface text-[10px] font-mono text-text-dim">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-[320px] overflow-y-auto py-2">
                {filtered.length === 0 && (
                  <div className="px-4 py-6 text-center text-text-dim text-sm font-mono">
                    No matching sections
                  </div>
                )}
                {filtered.map((item, index) => {
                  const Icon = item.icon;
                  const isSelected = index === selectedIdx;
                  return (
                    <button
                      key={item.id}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100 ${
                        isSelected
                          ? 'bg-cyan/[0.08] text-cyan'
                          : 'text-text-secondary hover:bg-white/[0.03] hover:text-text'
                      }`}
                      onClick={() => navigateTo(item.section)}
                      onMouseEnter={() => setSelectedIdx(index)}
                    >
                      <Icon
                        size={16}
                        className={isSelected ? 'text-cyan' : 'text-text-dim'}
                      />
                      <span className="flex-1 font-body text-sm">{item.label}</span>
                      {item.shortcut && (
                        <kbd
                          className={`px-1.5 py-0.5 rounded border text-[10px] font-mono ${
                            isSelected
                              ? 'border-cyan/30 text-cyan bg-cyan/10'
                              : 'border-border text-text-dim bg-surface'
                          }`}
                        >
                          {item.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Footer hint */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-border/60 text-[10px] font-mono text-text-dim">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded border border-border bg-surface">↑</kbd>
                    <kbd className="px-1 py-0.5 rounded border border-border bg-surface">↓</kbd>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded border border-border bg-surface">↵</kbd>
                    Select
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded border border-border bg-surface">⌘</kbd>
                  <kbd className="px-1 py-0.5 rounded border border-border bg-surface">K</kbd>
                  Toggle
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
