import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

const TextReveal = ({ children, className = '', delay = 0, duration = 0.8, ease = 'power3.out' }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    gsap.set(container, { opacity: 0, y: 30 });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          gsap.to(container, { opacity: 1, y: 0, duration, ease, delay });
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [delay, duration, ease]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};

export default TextReveal;
