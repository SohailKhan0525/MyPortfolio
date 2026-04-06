import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';

const GlitchText = ({
  text,
  className = '',
  speed = 1,
  enableShadows = true,
  enableOnHover = false,
  style = {},
}) => {
  const containerRef = useRef(null);
  const tlRef = useRef(null);
  const [active, setActive] = useState(!enableOnHover);

  useEffect(() => {
    if (!containerRef.current || !active) return;

    const container = containerRef.current;
    const front = container.querySelector('.glitch-front');
    const back1 = container.querySelector('.glitch-back1');
    const back2 = container.querySelector('.glitch-back2');
    if (!front || !back1 || !back2) return;

    const duration = 0.1 / speed;
    // pauseBetweenCycles: seconds of pause between each glitch sequence
    const pauseBetweenCycles = 3 / speed;

    tlRef.current = gsap.timeline({ repeat: -1, repeatDelay: pauseBetweenCycles })
      .to([back1, back2], { duration: 0, skewX: 0, x: 0, opacity: 0 })
      .to(back1, { duration, skewX: 10, x: -4, opacity: 0.8, color: '#ff00c1' })
      .to(back2, { duration, skewX: -10, x: 4, opacity: 0.8, color: '#00fff9', y: 2 }, '<')
      .to([back1, back2], { duration, skewX: 0, x: 0, opacity: 0 })
      .to(back1, { duration, x: 3, opacity: 0.7, color: '#ff00c1' })
      .to(back2, { duration, x: -3, opacity: 0.7, color: '#00fff9' }, '<')
      .to([back1, back2], { duration, x: 0, opacity: 0 });

    return () => { tlRef.current?.kill(); };
  }, [active, speed]);

  const baseStyle = {
    position: 'relative',
    display: 'inline-block',
    ...style,
  };

  const cloneStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0,
    userSelect: 'none',
    pointerEvents: 'none',
  };

  return (
    <span
      ref={containerRef}
      className={className}
      style={baseStyle}
      onMouseEnter={() => enableOnHover && setActive(true)}
      onMouseLeave={() => enableOnHover && setActive(false)}
    >
      <span className="glitch-front">{text}</span>
      {enableShadows && (
        <>
          <span className="glitch-back1" aria-hidden="true" style={cloneStyle}>{text}</span>
          <span className="glitch-back2" aria-hidden="true" style={cloneStyle}>{text}</span>
        </>
      )}
    </span>
  );
};

export default GlitchText;
