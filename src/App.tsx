import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import PipelineVisualizer from './components/PipelineVisualizer';
import DagVisualizer from './components/DagVisualizer';
import MissionControl from './components/MissionControl';
import GapAnalysis from './components/GapAnalysis';
import RequirementMatrix from './components/RequirementMatrix';
import TerminalSimulator from './components/TerminalSimulator';
import MissionYaml from './components/MissionYaml';
import VerificationGates from './components/VerificationGates';
import DriftDetection from './components/DriftDetection';
import AgentConfigPanel from './components/AgentConfigPanel';
import SectionDivider from './components/SectionDivider';
import CustomCursor from './components/CustomCursor';
import ScrollProgress from './components/ScrollProgress';
import CommandPalette from './components/CommandPalette';
import {
  Cpu,
  ShieldCheck,
  GitBranch,
  Zap,
  Terminal,
  Globe,
} from 'lucide-react';

function App() {
  const [activeSection, setActiveSection] = useState('hero');
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: [0.3], rootMargin: '-10% 0px -10% 0px' }
    );

    const sections = document.querySelectorAll('section[id]');
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <CustomCursor />
      <ScrollProgress />
      <CommandPalette />

      <div
        ref={mainRef}
        className="relative bg-void min-h-screen"
      >
        {/* Ambient background effects */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-blue/[0.03] rounded-full blur-[150px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple/[0.04] rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-amber/[0.02] rounded-full blur-[100px]" />
        </div>

        <Navigation activeSection={activeSection} />

        <main className="relative z-10">
          <section id="hero">
            <Hero />
          </section>

          <SectionDivider variant="glow" />

          <section id="pipeline" className="py-24">
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5 }}
              >
                <PipelineVisualizer />
              </motion.div>
            </AnimatePresence>
          </section>

          <SectionDivider variant="circuit" />

          <section id="terminal" className="py-24">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
            >
              <TerminalSimulator />
            </motion.div>
          </section>

          <SectionDivider variant="glow" />

          <section id="dag" className="py-24">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
            >
              <DagVisualizer />
            </motion.div>
          </section>

          <SectionDivider variant="circuit" />

          <section id="missions" className="py-24">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
            >
              <MissionControl />
            </motion.div>
          </section>

          <SectionDivider variant="glow" />

          <section id="yaml" className="py-24">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
            >
              <MissionYaml />
            </motion.div>
          </section>

          <SectionDivider variant="circuit" />

          <section id="gaps" className="py-24">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
            >
              <GapAnalysis />
            </motion.div>
          </section>

          <SectionDivider variant="glow" />

          <section id="requirements" className="py-24">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
            >
              <RequirementMatrix />
            </motion.div>
          </section>

          <SectionDivider variant="circuit" />

          <section id="verification" className="py-24">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
            >
              <VerificationGates />
            </motion.div>
          </section>

          <SectionDivider variant="glow" />

          <section id="drift" className="py-24">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
            >
              <DriftDetection />
            </motion.div>
          </section>

          <SectionDivider variant="circuit" />

          <section id="agents" className="py-24">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
            >
              <AgentConfigPanel />
            </motion.div>
          </section>

          {/* Enhanced Footer */}
          <footer className="relative py-24 border-t border-border overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-blue/[0.03] rounded-full blur-[150px]" />
              <div className="absolute bottom-20 right-1/4 w-[300px] h-[300px] bg-purple/[0.04] rounded-full blur-[100px]" />
            </div>

            <div className="section-container relative z-10">
              {/* Decorative top line */}
              <div className="flex items-center gap-4 mb-12 justify-center">
                <div className="h-px flex-1 max-w-[200px] bg-gradient-to-r from-transparent to-blue/40" />
                <motion.div
                  className="w-3 h-3 rotate-45 border border-blue/40"
                  animate={{ rotate: [45, 225, 45] }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                />
                <div className="h-px flex-1 max-w-[200px] bg-gradient-to-l from-transparent to-blue/40" />
              </div>

              {/* Stats grid */}
              <motion.div
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-16"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, staggerChildren: 0.1 }}
              >
                {[
                  { label: 'Phases', value: '5', icon: Zap, color: 'text-blue' },
                  { label: 'Missions', value: '12', icon: GitBranch, color: 'text-purple' },
                  { label: 'Agents', value: '4', icon: Cpu, color: 'text-amber' },
                  { label: 'Gates', value: '6', icon: ShieldCheck, color: 'text-emerald' },
                  { label: 'Criteria', value: '22', icon: Terminal, color: 'text-blue' },
                  { label: 'Conflicts', value: '0', icon: Globe, color: 'text-emerald' },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={stat.label}
                      className="card p-4 text-center group hover:border-blue/30 transition-all duration-300"
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05, duration: 0.4 }}
                      whileHover={{ y: -2, scale: 1.02 }}
                    >
                      <Icon className={`w-4 h-4 ${stat.color} mx-auto mb-2 opacity-60 group-hover:opacity-100 transition-opacity`} />
                      <div className={`font-display text-2xl font-bold ${stat.color}`}>
                        {stat.value}
                      </div>
                      <div className="font-mono text-[10px] text-text-dim uppercase tracking-wider mt-1">
                        {stat.label}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Core principles */}
              <motion.div
                className="text-center mb-12"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <p className="font-mono text-sm text-text-dim mb-6 tracking-wider uppercase">
                  Core Principles
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {[
                    'Spec → Verified Mission Plans',
                    'The harness is more important than the orchestrator',
                    'Verification is the moat',
                    'Zero file ownership overlaps',
                    'External acceptance verification',
                  ].map((principle, i) => (
                    <motion.span
                      key={principle}
                      className="badge bg-surface text-text-secondary border border-border text-xs px-3 py-1.5"
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.08, duration: 0.3 }}
                      whileHover={{
                        borderColor: 'rgba(0, 170, 255, 0.3)',
                        color: 'var(--color-blue)',
                      }}
                    >
                      {principle}
                    </motion.span>
                  ))}
                </div>
              </motion.div>

              {/* Bottom */}
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="block w-12 h-px bg-gradient-to-r from-transparent to-border-glow" />
                  <span
                    className="font-display text-xl font-bold gradient-text-blue glitch-wrapper"
                    data-text="QUEST"
                  >
                    QUEST
                  </span>
                  <span className="block w-12 h-px bg-gradient-to-l from-transparent to-border-glow" />
                </div>
                <p className="font-mono text-text-dim text-xs tracking-[0.15em] uppercase">
                  v1.0.0 &middot; The Planning Engine
                </p>
                <p className="text-text-dim/40 text-[10px] font-mono tracking-wider">
                  Built with conviction. Powered by claude-opus-4-6.
                </p>

                {/* Keyboard shortcut hint */}
                <div className="flex items-center gap-4 mt-4 text-[10px] font-mono text-text-dim/50">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded border border-border/40 bg-surface/30">⌘K</kbd>
                    Navigate
                  </span>
                  <span className="text-border/40">|</span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded border border-border/40 bg-surface/30">↑↓</kbd>
                    Scroll
                  </span>
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </>
  );
}

export default App;
