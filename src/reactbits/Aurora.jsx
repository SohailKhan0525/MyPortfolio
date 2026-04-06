import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const Aurora = ({
  colorStops = ['#00f3ff22', '#8b5cf622', '#06b6d422'],
  speed = 1,
  blend = 'normal',
  style = {},
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    const blobs = colorStops.map((color) => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.min(w, h) * (0.4 + Math.random() * 0.3),
      color,
      vx: (Math.random() - 0.5) * 0.5 * speed,
      vy: (Math.random() - 0.5) * 0.5 * speed,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      blobs.forEach(b => {
        b.x += b.vx;
        b.y += b.vy;
        if (b.x < -b.r) b.x = w + b.r;
        if (b.x > w + b.r) b.x = -b.r;
        if (b.y < -b.r) b.y = h + b.r;
        if (b.y > h + b.r) b.y = -b.r;

        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        g.addColorStop(0, b.color);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      });
    };

    gsap.ticker.add(draw);

    return () => {
      window.removeEventListener('resize', onResize);
      gsap.ticker.remove(draw);
    };
  }, [colorStops, speed]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        mixBlendMode: blend,
        zIndex: 0,
        ...style,
      }}
      aria-hidden="true"
    />
  );
};

export default Aurora;
