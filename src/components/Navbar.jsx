import { useEffect, useRef } from 'react';

const Navbar = () => {
  const navLinksRef = useRef(null);
  const toggleRef = useRef(null);
  const backdropRef = useRef(null);

  useEffect(() => {
    const navLinks = navLinksRef.current;
    const mobileToggle = toggleRef.current;
    const navBackdrop = backdropRef.current;

    const openMobileNav = () => {
      navLinks.classList.add('active');
      mobileToggle.classList.add('active');
      if (navBackdrop) navBackdrop.classList.add('active');
    };

    const closeMobileNav = () => {
      navLinks.classList.remove('active');
      mobileToggle.classList.remove('active');
      if (navBackdrop) navBackdrop.classList.remove('active');
    };

    if (mobileToggle) {
      mobileToggle.addEventListener('click', () => {
        if (navLinks.classList.contains('active')) {
          closeMobileNav();
        } else {
          openMobileNav();
        }
      });

      navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeMobileNav);
      });
    }

    if (navBackdrop) {
      navBackdrop.addEventListener('click', closeMobileNav);
    }
  }, []);

  return (
    <>
      <div id="nav-backdrop" ref={backdropRef}></div>
      <nav className="glass-nav">
        <div className="logo">MOHD ZAHEER<span className="highlight"> UDDIN</span></div>
        <div className="nav-links" ref={navLinksRef}>
          <a href="#home" className="magnetic-link">Home</a>
          <a href="#projects" className="magnetic-link">Projects</a>
          <a href="#about" className="magnetic-link">About Me</a>
          <a href="#skills" className="magnetic-link">Skills</a>
          <a href="#resume" className="magnetic-link">Resume</a>
          <a href="#certifications" className="magnetic-link">Certifications</a>
          <a href="#contact" className="magnetic-link">Contact</a>
        </div>
        <button id="mobile-toggle" ref={toggleRef} aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
      </nav>
    </>
  );
};

export default Navbar;
