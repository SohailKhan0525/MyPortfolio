import { useRef, useEffect } from 'react';
import './BorderGlow.css';

const BorderGlow = ({
  children,
  glowColor = '#00f3ff',
  background = 'rgba(0,0,0,0.6)',
  borderRadius = '12px',
  borderWidth = '1.5px',
  className = '',
  style = {},
  ...props
}) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty('--glow-x', `${x}%`);
      el.style.setProperty('--glow-y', `${y}%`);
    };

    el.addEventListener('mousemove', handleMouseMove);
    return () => el.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`border-glow-wrapper ${className}`}
      style={{
        '--glow-color': glowColor,
        '--bg-color': background,
        '--border-radius': borderRadius,
        '--border-width': borderWidth,
        ...style,
      }}
      {...props}
    >
      <div className="border-glow-inner">
        {children}
      </div>
    </div>
  );
};

export default BorderGlow;
