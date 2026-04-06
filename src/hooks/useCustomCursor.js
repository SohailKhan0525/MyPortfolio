import { useEffect } from 'react';

const useCustomCursor = () => {
  useEffect(() => {
    if (window.innerWidth <= 900) return;

    const cursorDot = document.querySelector('[data-cursor-dot]');
    const cursorOutline = document.querySelector('[data-cursor-outline]');
    if (!cursorDot || !cursorOutline) return;

    let cursorX = 0, cursorY = 0;
    let outlineX = 0, outlineY = 0;

    let rafId;
    function animateCursor() {
      outlineX += (cursorX - outlineX) * 0.2;
      outlineY += (cursorY - outlineY) * 0.2;
      cursorOutline.style.left = `${outlineX}px`;
      cursorOutline.style.top = `${outlineY}px`;
      rafId = requestAnimationFrame(animateCursor);
    }
    animateCursor();

    const onMouseMove = (e) => {
      cursorX = e.clientX;
      cursorY = e.clientY;
      cursorDot.style.left = `${cursorX}px`;
      cursorDot.style.top = `${cursorY}px`;
    };
    document.addEventListener('mousemove', onMouseMove);

    const selectiveSelectors = 'a, button, input, textarea, select, .link-btn, .btn-3d, .submit-btn, .nav-links a, .magnetic-link, .resume-btn, .hire-me-btn, .social-links a, .project-card, .skill-block, .card-links a';

    const onMouseEnter = (e) => {
      const target = e.target.closest(selectiveSelectors);
      if (target) document.body.classList.add('cursor-interactive');
    };
    const onMouseLeave = (e) => {
      const target = e.target.closest(selectiveSelectors);
      if (target) document.body.classList.remove('cursor-interactive');
    };

    document.addEventListener('mouseenter', onMouseEnter, true);
    document.addEventListener('mouseleave', onMouseLeave, true);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseenter', onMouseEnter, true);
      document.removeEventListener('mouseleave', onMouseLeave, true);
    };
  }, []);
};

export default useCustomCursor;
