import { useEffect, useRef } from 'react';
import BorderGlow from './BorderGlow/BorderGlow';

const HERO_PARALLAX_SPEED = 0.25;
const HERO_FADE_MULTIPLIER = 1.4;
const HERO_SCALE_FACTOR = 0.06;

const Hero = ({ prefersReducedMotion }) => {
  const heroTextRef = useRef(null);
  const typewriterRef = useRef(null);

  // Typewriter effect (started after name typing finishes)
  useEffect(() => {
    const typeTarget = typewriterRef.current;
    if (!typeTarget) return;

    const roles = ["ML ENGINEER IN BEGINNER"];
    let roleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let timer = null;

    function type() {
      const currentRole = roles[roleIndex];
      if (isDeleting) {
        typeTarget.textContent = currentRole.substring(0, charIndex - 1);
        charIndex--;
      } else {
        typeTarget.textContent = currentRole.substring(0, charIndex + 1);
        charIndex++;
      }
      if (!isDeleting && charIndex === currentRole.length) {
        if (roles.length === 1) return;
        timer = setTimeout(() => { isDeleting = true; type(); }, 2000);
        return;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
      }
      const speed = isDeleting ? 50 : 100;
      timer = setTimeout(type, speed);
    }

    // Start after preloader clears (via window.startHeroTyping)
    window._startRoleTyping = () => type();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  // Hero parallax on scroll
  useEffect(() => {
    const heroText = heroTextRef.current;
    if (!heroText || prefersReducedMotion) return;

    const updateHeroParallax = (scrollY) => {
      const heroH = window.innerHeight;
      const progress = Math.min(scrollY / heroH, 1);
      const translateY = scrollY * HERO_PARALLAX_SPEED;
      const opacity = 1 - progress * HERO_FADE_MULTIPLIER;
      const scale = 1 + progress * HERO_SCALE_FACTOR;
      heroText.style.transform = `translateY(${translateY}px) scale(${scale})`;
      heroText.style.opacity = Math.max(0, opacity);
    };

    const onScroll = () => {
      updateHeroParallax(window.scrollY);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [prefersReducedMotion]);

  return (
    <section id="home">
      <div className="hero-container">
        <BorderGlow
          glowColor="#00f3ff"
          background="transparent"
          borderRadius="18px"
          borderWidth="1.5px"
          style={{ display: 'inline-block', maxWidth: '640px', width: '100%' }}
        >
          <div className="hero-text reveal" ref={heroTextRef} style={{ background: 'transparent' }}>
            <h2 className="pre-title"><i className="fa-solid fa-user"></i> SYSTEM ONLINE <i className="fa-solid fa-user"></i></h2>
            <h1 className="glitch-header" data-text="MOHD ZAHEER UDDIN">MOHD ZAHEER UDDIN</h1>
            <div className="role-container">
              <span className="role-prefix">{"> I'm an: "}</span>
              <span className="typewriter" id="typewriter" ref={typewriterRef}></span>
              <span className="cursor-blink">|</span>
            </div>
            <p className="hero-bio">
              Learning to design and train intelligent models at the intersection of <strong>AI</strong>, <strong>machine learning</strong>, and <strong>data science</strong>.
            </p>
            <div className="cta-group">
              <a href="#projects" className="btn-3d primary">
                <span>VIEW PROJECTS</span>
              </a>
              <a href="#contact" className="btn-3d secondary">
                <span>CONTACT ME</span>
              </a>
            </div>
          </div>
        </BorderGlow>
      </div>

      <div className="scroll-indicator">
        <span>SCROLL TO EXPLORE</span>
        <div className="mouse-icon">
          <div className="wheel"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
