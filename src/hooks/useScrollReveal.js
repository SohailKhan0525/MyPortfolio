import { useEffect } from 'react';
import { gsap } from 'gsap';

const useScrollReveal = () => {
  useEffect(() => {
    const animateReveal = (el) => {
      gsap.to(el, { opacity: 1, y: 0, x: 0, duration: 0.8, ease: 'power3.out' });
    };

    const resetReveal = (el) => {
      const isLeft = el.classList.contains('reveal-left');
      const isRight = el.classList.contains('reveal-right');
      gsap.set(el, {
        opacity: 0,
        y: isLeft || isRight ? 0 : 30,
        x: isLeft ? -50 : isRight ? 50 : 0,
      });
    };

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateReveal(entry.target);
        } else if (entry.boundingClientRect.top > 0) {
          resetReveal(entry.target);
        }
      });
    }, { threshold: 0.1 });

    const timer = setTimeout(() => {
      document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach((el) => {
        resetReveal(el);
        revealObserver.observe(el);
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      revealObserver.disconnect();
    };
  }, []);
};

export default useScrollReveal;
