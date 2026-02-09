import { motion } from 'framer-motion';

interface SectionDividerProps {
  variant?: 'default' | 'glow' | 'circuit';
}

export default function SectionDivider({ variant = 'default' }: SectionDividerProps) {
  if (variant === 'circuit') {
    return (
      <div className="relative py-8">
        <div className="section-container">
          <div className="flex items-center justify-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/60 to-border" />
            <div className="flex items-center gap-2">
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-blue/60"
                animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <div className="w-8 h-px bg-blue/30" />
              <div className="w-2 h-2 rotate-45 border border-blue/30" />
              <div className="w-8 h-px bg-blue/30" />
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-purple/60"
                animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              />
            </div>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent via-border/60 to-border" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'glow') {
    return (
      <div className="relative py-6">
        <div className="section-container">
          <div className="relative h-px w-full">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue/20 to-transparent" />
            <motion.div
              className="absolute h-px top-0"
              style={{
                width: '120px',
                background: 'linear-gradient(90deg, transparent, var(--color-blue), transparent)',
                filter: 'blur(1px)',
              }}
              animate={{ left: ['-120px', 'calc(100% + 120px)'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative py-4">
      <div className="section-container">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-border/40 to-transparent" />
      </div>
    </div>
  );
}
