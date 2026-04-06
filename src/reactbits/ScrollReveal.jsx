import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

const ScrollReveal = ({
  children,
  className = '',
  animationFrom = { opacity: 0, y: 50 },
  animationTo = { opacity: 1, y: 0 },
  threshold = 0.15,
  delay = 0,
  duration = 0.8,
  ease = 'power3.out',
  style = {},
}) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    gsap.set(container, animationFrom);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          gsap.to(container, { ...animationTo, duration, ease, delay });
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [animationFrom, animationTo, threshold, delay, duration, ease]);

  return (
    <div ref={containerRef} className={className} style={style}>
      {children}
    </div>
  );
};

export default ScrollReveal;
