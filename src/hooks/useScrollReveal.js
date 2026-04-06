import { useEffect } from 'react';

const useScrollReveal = () => {
  useEffect(() => {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
          if (entry.target.classList.contains('hero-text')) {
            setTimeout(() => {
              entry.target.style.transition = 'none';
            }, 900);
          }
        } else if (entry.boundingClientRect.top > 0) {
          entry.target.classList.remove("active");
          if (entry.target.classList.contains('hero-text')) {
            entry.target.style.transition = '';
          }
        }
      });
    }, { threshold: 0.1 });

    const directionalRevealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        } else if (entry.boundingClientRect.top > 0) {
          entry.target.classList.remove('active');
        }
      });
    }, { threshold: 0.1 });

    // Observe after a tick to allow DOM to render
    const timer = setTimeout(() => {
      document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
      document.querySelectorAll('.reveal-left, .reveal-right').forEach(el => directionalRevealObserver.observe(el));
    }, 100);

    return () => {
      clearTimeout(timer);
      revealObserver.disconnect();
      directionalRevealObserver.disconnect();
    };
  }, []);
};

export default useScrollReveal;
