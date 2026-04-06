import { useEffect } from 'react';

const usePreloader = (prefersReducedMotion) => {
  useEffect(() => {
    let active = true;

    const startHeroTyping = () => {
      if (!active) return;

      const nameEl = document.querySelector('.glitch-header');
      if (!nameEl) {
        if (window._startRoleTyping) window._startRoleTyping();
        return;
      }

      const fullName = nameEl.getAttribute('data-text') || 'MOHD ZAHEER UDDIN';

      if (prefersReducedMotion) {
        nameEl.textContent = fullName;
        nameEl.setAttribute('data-text', fullName);
        nameEl.classList.add('typing-done');
        if (window._startRoleTyping) window._startRoleTyping();
        return;
      }

      nameEl.textContent = '';
      let idx = 0;

      function typeNameChar() {
        if (!active) return;
        const current = fullName.slice(0, idx);
        nameEl.textContent = current;
        nameEl.setAttribute('data-text', current);
        if (idx < fullName.length) {
          idx++;
          setTimeout(typeNameChar, 75);
        } else {
          nameEl.setAttribute('data-text', fullName);
          nameEl.classList.add('typing-done');
          setTimeout(() => {
            if (active && window._startRoleTyping) window._startRoleTyping();
          }, 300);
        }
      }
      typeNameChar();
    };

    if (window._preloaderDone) {
      // Preloader already hidden by the inline script; start hero typing now
      startHeroTyping();
    } else {
      // Inline script will call this when the preloader finishes hiding
      window._onPreloaderDone = startHeroTyping;
    }

    return () => {
      active = false;
      if (window._onPreloaderDone === startHeroTyping) {
        delete window._onPreloaderDone;
      }
    };
  }, [prefersReducedMotion]);
};

export default usePreloader;
