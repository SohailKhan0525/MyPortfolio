import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const SplitText = ({
  text,
  className = '',
  delay = 0,
  duration = 0.6,
  ease = 'power3.out',
  splitBy = 'chars',
  animationFrom = { opacity: 0, y: 40 },
  animationTo = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '0px',
  onLetterAnimationComplete,
}) => {
  const containerRef = useRef(null);

  const items = splitBy === 'chars'
    ? text.split('').map((char, i) => (
        <span
          key={i}
          className="split-char"
          style={{ display: 'inline-block', whiteSpace: char === ' ' ? 'pre' : 'normal' }}
          aria-hidden="true"
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))
    : text.split(' ').map((word, i) => (
        <span
          key={i}
          className="split-word"
          style={{ display: 'inline-block', marginRight: '0.25em' }}
          aria-hidden="true"
        >
          {word}
        </span>
      ));

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chars = container.querySelectorAll('.split-char, .split-word');
    gsap.set(chars, animationFrom);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          gsap.to(chars, {
            ...animationTo,
            duration,
            ease,
            stagger: 0.04,
            delay,
            onComplete: onLetterAnimationComplete,
          });
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, [text, delay, duration, ease, animationFrom, animationTo, threshold, rootMargin, onLetterAnimationComplete]);

  return (
    <span
      ref={containerRef}
      className={className}
      aria-label={text}
      style={{ display: 'inline' }}
    >
      {items}
    </span>
  );
};

export default SplitText;
