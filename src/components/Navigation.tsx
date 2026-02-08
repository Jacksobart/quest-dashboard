import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'terminal', label: 'Terminal' },
  { id: 'dag', label: 'DAG' },
  { id: 'missions', label: 'Missions' },
  { id: 'yaml', label: 'YAML' },
  { id: 'gaps', label: 'Gaps' },
  { id: 'requirements', label: 'Requirements' },
  { id: 'verification', label: 'Verification' },
  { id: 'drift', label: 'Drift' },
  { id: 'agents', label: 'Agents' },
] as const;

export default function Navigation({ activeSection }: { activeSection: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 40);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const handleNavClick = (id: string) => {
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-void/90 backdrop-blur-xl'
            : 'bg-void/60 backdrop-blur-md'
        }`}
      >
        {/* Top highlight line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />

        {/* Bottom glow border */}
        <div
          className={`absolute bottom-0 left-0 right-0 h-px transition-opacity duration-500 ${
            scrolled ? 'opacity-100' : 'opacity-60'
          }`}
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, var(--color-cyan-glow) 20%, var(--color-border-glow) 50%, var(--color-purple-glow) 80%, transparent 100%)',
          }}
        />
        {/* Diffused glow beneath the border */}
        <div
          className={`absolute -bottom-px left-0 right-0 h-[3px] blur-sm transition-opacity duration-500 ${
            scrolled ? 'opacity-80' : 'opacity-40'
          }`}
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, var(--color-cyan-glow) 20%, transparent 50%, var(--color-purple-glow) 80%, transparent 100%)',
          }}
        />

        <div className="section-container">
          <div className="flex items-center justify-between h-14">
            {/* Left: Logo + LIVE badge */}
            <div className="flex items-center gap-3">
              <a
                href="#hero"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick('hero');
                }}
                className="flex items-center gap-2.5 group"
              >
                {/* Pulsing diamond indicator */}
                <span className="relative flex items-center justify-center w-4 h-4">
                  <motion.span
                    className="absolute inset-0 rounded-sm bg-cyan/20 rotate-45"
                    animate={{
                      scale: [1, 1.6, 1],
                      opacity: [0.4, 0, 0.4],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                  <motion.span
                    className="absolute inset-0.5 rounded-[2px] bg-cyan rotate-45"
                    animate={{
                      opacity: [0.8, 1, 0.8],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    style={{
                      boxShadow: '0 0 8px var(--color-cyan), 0 0 16px var(--color-cyan-glow)',
                    }}
                  />
                </span>

                <span className="font-display font-bold text-lg tracking-[0.2em] text-text group-hover:text-cyan transition-colors duration-300">
                  QUEST
                </span>
              </a>

              {/* LIVE badge */}
              <div className="badge bg-emerald/10 text-emerald border border-emerald/20 text-[10px] py-0.5 px-2 gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald" />
                </span>
                LIVE
              </div>
            </div>

            {/* Center/Right: Desktop nav links */}
            <div className="hidden lg:flex items-center gap-0.5">
              {NAV_ITEMS.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <motion.a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(item.id);
                    }}
                    className="relative px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] rounded-md transition-colors duration-200"
                    style={{
                      color: isActive
                        ? 'var(--color-cyan)'
                        : 'var(--color-text-secondary)',
                    }}
                    whileHover={{
                      color: 'var(--color-text)',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {item.label}

                    {/* Active indicator underline */}
                    {isActive && (
                      <motion.span
                        className="absolute bottom-0 left-2 right-2 h-px"
                        layoutId="nav-underline"
                        style={{
                          background:
                            'linear-gradient(90deg, transparent, var(--color-cyan), transparent)',
                          boxShadow: '0 1px 8px var(--color-cyan-glow)',
                        }}
                        transition={{
                          type: 'spring',
                          stiffness: 400,
                          damping: 30,
                        }}
                      />
                    )}

                    {/* Hover glow backdrop for active item */}
                    {isActive && (
                      <motion.span
                        className="absolute inset-0 rounded-md -z-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                          background:
                            'radial-gradient(ellipse at center bottom, var(--color-cyan-glow), transparent 70%)',
                        }}
                      />
                    )}
                  </motion.a>
                );
              })}
            </div>

            {/* Hamburger: Mobile */}
            <button
              className="lg:hidden relative p-2 rounded-md text-text-secondary hover:text-text hover:bg-white/5 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileOpen ? (
                  <motion.span
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <X size={20} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Menu size={20} />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40 bg-void/80 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
            />

            {/* Mobile menu panel */}
            <motion.div
              className="fixed top-14 left-0 right-0 z-40 lg:hidden overflow-hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="bg-abyss/95 backdrop-blur-xl border-b border-border">
                {/* Scanline texture on the panel */}
                <div className="absolute inset-0 pointer-events-none opacity-30">
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
                    }}
                  />
                </div>

                <div className="section-container py-4 relative">
                  <div className="grid grid-cols-2 gap-1">
                    {NAV_ITEMS.map((item, index) => {
                      const isActive = activeSection === item.id;
                      return (
                        <motion.a
                          key={item.id}
                          href={`#${item.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleNavClick(item.id);
                          }}
                          className={`relative flex items-center gap-2.5 px-4 py-3 rounded-lg font-mono text-xs uppercase tracking-[0.12em] transition-colors ${
                            isActive
                              ? 'text-cyan bg-cyan/[0.08]'
                              : 'text-text-secondary hover:text-text hover:bg-white/[0.03]'
                          }`}
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            delay: index * 0.03,
                            duration: 0.2,
                          }}
                        >
                          {/* Active dot */}
                          {isActive && (
                            <span className="w-1 h-1 rounded-full bg-cyan flex-shrink-0"
                              style={{ boxShadow: '0 0 6px var(--color-cyan)' }}
                            />
                          )}
                          {!isActive && (
                            <span className="w-1 h-1 rounded-full bg-text-dim/40 flex-shrink-0" />
                          )}
                          {item.label}

                          {/* Active side accent */}
                          {isActive && (
                            <motion.span
                              className="absolute left-0 top-2 bottom-2 w-px bg-cyan"
                              layoutId="mobile-active"
                              style={{
                                boxShadow: '0 0 8px var(--color-cyan-glow)',
                              }}
                            />
                          )}
                        </motion.a>
                      );
                    })}
                  </div>

                  {/* Mobile menu footer info */}
                  <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
                    <span className="font-mono text-[10px] text-text-dim tracking-wider uppercase">
                      Quest v1.0
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald" />
                      </span>
                      <span className="font-mono text-[10px] text-emerald tracking-wider uppercase">
                        All Systems Nominal
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
