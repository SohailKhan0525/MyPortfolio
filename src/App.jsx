import { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Projects from './components/Projects';
import Skills from './components/Skills';
import Resume from './components/Resume';
import Certifications from './components/Certifications';
import Contact from './components/Contact';
import Footer from './components/Footer';
import useThreeBackground from './hooks/useThreeBackground';
import useScrollReveal from './hooks/useScrollReveal';
import usePreloader from './hooks/usePreloader';
import useCustomCursor from './hooks/useCustomCursor';

// Google Fonts & Font Awesome (external CSS)
const fontLinks = [
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&family=Space+Grotesk:wght@300;500;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css',
];

// Inject external link tags once
fontLinks.forEach(href => {
  if (!document.querySelector(`link[href="${href}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }
});

function App() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useThreeBackground('canvas-container', prefersReducedMotion);
  useScrollReveal();
  usePreloader(prefersReducedMotion);
  useCustomCursor();

  return (
    <>
      {/* Scroll Progress Bar */}
      <div id="scroll-progress" aria-hidden="true"></div>

      {/* Three.js Canvas Container */}
      <div id="canvas-container"></div>

      {/* Preloader */}
      <div id="preloader">
        <div className="cyber-loader"></div>
        <div className="loader-text" data-text="INITIALIZING SYSTEM...">INITIALIZING SYSTEM...</div>
      </div>

      {/* Letterbox Bars */}
      <div className="letterbox-bar letterbox-top" aria-hidden="true"></div>
      <div className="letterbox-bar letterbox-bottom" aria-hidden="true"></div>

      {/* Background Effects */}
      <div className="gradient-bg-overlay" aria-hidden="true"></div>
      <div className="noise-overlay"></div>
      <div className="cursor-dot" data-cursor-dot></div>
      <div className="cursor-outline" data-cursor-outline></div>

      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <main>
        <Hero prefersReducedMotion={prefersReducedMotion} />
        <About />
        <Projects />
        <Skills />
        <Resume />
        <Certifications />
        <Contact />
        <Footer />
      </main>
    </>
  );
}

export default App;
