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
import { Aurora } from './reactbits';

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

      {/* Aurora animated gradient background */}
      <Aurora
        colorStops={['#00f3ff11', '#8b5cf611', '#06b6d411']}
        speed={0.5}
        blend="screen"
      />

      {/* Three.js Canvas Container */}
      <div id="canvas-container"></div>

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
