import { useEffect, useRef, useState, useCallback } from 'react';

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [isHover, setIsHover] = useState(false);
  const [visible, setVisible] = useState(false);
  const mousePos = useRef({ x: 0, y: 0 });
  const ringPos = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  // Check for touch device
  const [isTouchDevice] = useState(() =>
    typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)
  );

  const animate = useCallback(() => {
    // Smooth follow for ring
    ringPos.current.x += (mousePos.current.x - ringPos.current.x) * 0.15;
    ringPos.current.y += (mousePos.current.y - ringPos.current.y) * 0.15;

    if (dotRef.current) {
      dotRef.current.style.left = `${mousePos.current.x}px`;
      dotRef.current.style.top = `${mousePos.current.y}px`;
    }
    if (ringRef.current) {
      ringRef.current.style.left = `${ringPos.current.x}px`;
      ringRef.current.style.top = `${ringPos.current.y}px`;
    }

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (isTouchDevice) return;

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current.x = e.clientX;
      mousePos.current.y = e.clientY;
      if (!visible) setVisible(true);
    };

    const handleMouseEnter = () => setVisible(true);
    const handleMouseLeave = () => setVisible(false);

    // Detect hover on interactive elements
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const interactive = target.closest('a, button, [role="button"], input, textarea, select, [data-interactive]');
      setIsHover(!!interactive);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseover', handleMouseOver);
    document.documentElement.classList.add('quest-cursor');

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseover', handleMouseOver);
      document.documentElement.classList.remove('quest-cursor');
      cancelAnimationFrame(rafRef.current);
    };
  }, [animate, visible, isTouchDevice]);

  if (isTouchDevice) return null;

  return (
    <>
      <div
        ref={dotRef}
        className={`quest-cursor-dot ${isHover ? 'hover' : ''}`}
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s, width 0.15s, height 0.15s, background 0.15s, box-shadow 0.15s',
        }}
      />
      <div
        ref={ringRef}
        className={`quest-cursor-ring ${isHover ? 'hover' : ''}`}
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s, width 0.2s, height 0.2s, border-color 0.2s',
        }}
      />
    </>
  );
}
