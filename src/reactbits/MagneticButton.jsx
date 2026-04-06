import { useRef, useCallback } from 'react';
import { gsap } from 'gsap';

const MagneticButton = ({ children, className = '', strength = 40, style = {} }) => {
  const ref = useRef(null);

  const onMouseMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / rect.width;
    const dy = (e.clientY - cy) / rect.height;
    gsap.to(el, {
      x: dx * strength,
      y: dy * strength,
      duration: 0.4,
      ease: 'power2.out',
    });
  }, [strength]);

  const onMouseLeave = useCallback(() => {
    gsap.to(ref.current, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
  }, []);

  return (
    <span
      ref={ref}
      className={className}
      style={{ display: 'inline-block', ...style }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </span>
  );
};

export default MagneticButton;
