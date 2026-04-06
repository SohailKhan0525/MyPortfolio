import { useEffect } from 'react';

const usePreloader = (prefersReducedMotion) => {
  useEffect(() => {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;

    const loaderText = preloader.querySelector('.loader-text');
    const stages = ["LOADING CORE...", "CONNECTING NEURAL NETWORK", "SYSTEM READY"];
    let step = 0;

    const startHeroTyping = () => {
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
            if (window._startRoleTyping) window._startRoleTyping();
          }, 300);
        }
      }
      typeNameChar();
    };

    const interval = setInterval(() => {
      if (step < stages.length) {
        if (loaderText) loaderText.textContent = stages[step];
        step++;
      } else {
        clearInterval(interval);
        preloader.style.opacity = '0';
        setTimeout(() => {
          preloader.style.display = 'none';
          document.querySelectorAll('.letterbox-bar').forEach(bar => {
            requestAnimationFrame(() => bar.classList.add('open'));
          });
          startHeroTyping();
        }, 500);
      }
    }, 600);

    return () => clearInterval(interval);
  }, [prefersReducedMotion]);
};

export default usePreloader;
