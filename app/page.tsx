"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, ArrowUpRight, Briefcase, CaretDown, Check, Code, GithubLogo, LinkedinLogo, List, Moon, PaperPlaneTilt, Sparkle, Sun, X } from "@phosphor-icons/react";

const projects = [
  { number: "01", title: "House Price Prediction", type: "Regression", description: "A machine learning project focused on predicting house prices with Python and scikit learn.", stack: ["Python", "pandas", "NumPy", "scikit learn"], href: "https://housepriceprediction-rqo8ykwgldxbpemwl6kvok.streamlit.app/", repo: "https://github.com/SohailKhan0525/HousePricePrediction" },
  { number: "02", title: "Global Earthquake Prediction", type: "Classification", description: "An applied classification project exploring earthquake related prediction with a machine learning workflow.", stack: ["Python", "pandas", "NumPy", "scikit learn"], href: "https://github.com/SohailKhan0525/Global-Earthquake-Prediction", repo: "https://github.com/SohailKhan0525/Global-Earthquake-Prediction" },
  { number: "03", title: "Heart Disease Prediction", type: "Logistic regression", description: "A Streamlit machine learning app that turns a classification model into an interactive prediction experience.", stack: ["Python", "scikit learn", "Streamlit"], href: "https://heartdiseaseml-4zrcurmudxpfxbwygcuyytm.streamlit.app/", repo: "https://github.com/SohailKhan0525/HeartDiseaseML" },
  { number: "04", title: "Student Management", type: "Python app", description: "A student management application built as a practical Python project with a hosted Streamlit interface.", stack: ["Python", "Streamlit"], href: "https://studentmanagementproject-ulj54ytmcyj55upzakbzhn.streamlit.app/", repo: "https://github.com/SohailKhan0525/StudentManagementProject" },
  { number: "05", title: "Student Pass / Fail Predictor", type: "Classification", description: "A classification project that packages a student outcome model into a small interactive application.", stack: ["Python", "scikit learn", "Streamlit"], href: "https://studentfailpasspredictor-hjymwbpsp4bksec9ycb2xz.streamlit.app/", repo: "https://github.com/SohailKhan0525/StudentFailPassPredictor" },
  { number: "06", title: "Bank Management", type: "Python app", description: "A practical bank management project focused on core application logic and Python fundamentals.", stack: ["Python", "Streamlit"], href: "https://bankmanagementproject-brt9pt282uavy8ddzzy7ql.streamlit.app/", repo: "https://github.com/SohailKhan0525/BankManagementProject" },
  { number: "07", title: "File Handling", type: "Python CLI", description: "A focused Python project for working with files and building confidence with everyday application code.", stack: ["Python", "OOP", "pathlib", "JSON"], href: "https://github.com/SohailKhan0525/File_Handling_Project", repo: "https://github.com/SohailKhan0525/File_Handling_Project" },
];

const skills = [
  ["Python", "Primary language"], ["scikit learn", "ML workflows"], ["pandas", "Data analysis"], ["NumPy", "Numerical computing"],
  ["Streamlit", "Interactive apps"], ["Git / GitHub", "Version control"], ["HTML / CSS / JS", "Web foundations"], ["Next.js", "Portfolio stack"],
];

type Theme = "system" | "light" | "dark";

function playTone(kind: "tap" | "success" | "hover") {
  if (typeof window === "undefined") return;
  try {
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    const ctx = new AudioContextCtor();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    const frequencies = kind === "success" ? [392, 523.25, 659.25] : kind === "hover" ? [520] : [280, 360];
    oscillator.frequency.setValueAtTime(frequencies[0], now);
    frequencies.slice(1).forEach((frequency, index) => oscillator.frequency.setValueAtTime(frequency, now + (index + 1) * 0.045));
    oscillator.type = "sine";
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(kind === "hover" ? 0.012 : 0.035, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === "success" ? 0.24 : 0.12));
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + (kind === "success" ? 0.25 : 0.13));
    oscillator.addEventListener("ended", () => void ctx.close());
  } catch {}
}

function useSoundEnabled() {
  const [enabled, setEnabled] = useState(true);
  useEffect(() => setEnabled(localStorage.getItem("portfolio-sound") !== "off"), []);
  const toggle = () => setEnabled((current) => { const next = !current; localStorage.setItem("portfolio-sound", next ? "on" : "off"); if (next) playTone("success"); return next; });
  return { enabled, toggle };
}

function useTheme() {
  const [theme, setTheme] = useState<Theme>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("dark");
  useEffect(() => {
    const stored = (localStorage.getItem("portfolio-theme") as Theme | null) ?? "system";
    setTheme(stored);
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const apply = (nextTheme: Theme) => {
      const nextResolved = nextTheme === "system" ? (media.matches ? "light" : "dark") : nextTheme;
      setResolved(nextResolved);
      document.documentElement.dataset.theme = nextResolved;
    };
    apply(stored);
    const listener = () => apply(stored);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);
  const change = (nextTheme: Theme) => {
    const apply = () => {
      localStorage.setItem("portfolio-theme", nextTheme);
      setTheme(nextTheme);
      const nextResolved = nextTheme === "system" ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark") : nextTheme;
      setResolved(nextResolved);
      document.documentElement.dataset.theme = nextResolved;
    };
    const transition = (document as Document & { startViewTransition?: (cb: () => void) => void }).startViewTransition;
    if (transition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) transition(apply); else apply();
  };
  return { theme, resolved, change };
}

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return <motion.div className={className} initial={{ opacity: 0, y: 64, filter: "blur(10px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }} viewport={{ once: true, amount: 0.16 }} transition={{ duration: 0.9, delay, ease: [0.32, 0.72, 0, 1] }}>{children}</motion.div>;
}

function ThemeMenu({ theme, resolved, change }: { theme: Theme; resolved: "light" | "dark"; change: (theme: Theme) => void }) {
  const [open, setOpen] = useState(false);
  const icon = resolved === "dark" ? <Moon size={16} weight="bold" /> : <Sun size={16} weight="bold" />;
  return <div className="theme-control">
    <button className="icon-button theme-button" aria-expanded={open} aria-haspopup="menu" aria-label={`Theme: ${theme}`} onClick={() => { setOpen((value) => !value); playTone("tap"); }}>
      {icon}<span>{theme}</span><CaretDown size={13} weight="bold" className={open ? "rotate" : ""} />
    </button>
    <AnimatePresence>{open && <motion.div className="theme-menu" initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.97 }}>
      {(["system", "light", "dark"] as Theme[]).map((item) => <button key={item} className={`theme-option ${theme === item ? "selected" : ""}`} onClick={() => { change(item); setOpen(false); playTone("success"); }}><span>{item}</span>{theme === item && <Check size={14} weight="bold" />}</button>)}
    </motion.div>}</AnimatePresence>
  </div>;
}

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeProject, setActiveProject] = useState(0);
  const [copied, setCopied] = useState(false);
  const { theme, resolved, change } = useTheme();
  const sound = useSoundEnabled();
  const projectRef = useRef<HTMLDivElement>(null);
  const navItems = useMemo(() => [["Work", "#work"], ["About", "#about"], ["Journey", "#journey"], ["Skills", "#skills"], ["Resume", "/resume"], ["Contact", "#contact"]], []);
  const email = "sohailkhannnn.0525@gmail.com";
  const copyEmail = async () => {
    try { await navigator.clipboard.writeText(email); setCopied(true); if (sound.enabled) playTone("success"); window.setTimeout(() => setCopied(false), 1600); }
    catch { window.location.href = `mailto:${email}?subject=Portfolio%20Contact`; }
  };

  return <div className="site-shell">
    <div className="noise" aria-hidden="true" /><div className="grid-lines" aria-hidden="true" />
    <header className="site-header">
      <Link href="#top" className="brand" onClick={() => sound.enabled && playTone("tap")} aria-label="Mohd Zaheer Uddin home"><span className="brand-mark">Q</span><span>Mohd Zaheer Uddin</span></Link>
      <nav className={`desktop-nav ${mobileOpen ? "mobile-visible" : ""}`} aria-label="Primary navigation">
        {navItems.map(([label, href], index) => <Link key={label} href={href} className="nav-link" onClick={() => { setMobileOpen(false); if (sound.enabled) playTone(index === 0 ? "success" : "tap"); }}>{label}</Link>)}
      </nav>
      <div className="header-actions">
        <ThemeMenu theme={theme} resolved={resolved} change={change} />
        <button className="icon-button sound-button" onClick={() => { sound.toggle(); if (sound.enabled) playTone("tap"); }} aria-label={sound.enabled ? "Mute interface sounds" : "Enable interface sounds"} aria-pressed={sound.enabled}><span className={`sound-bars ${sound.enabled ? "on" : ""}`}><i /><i /><i /></span></button>
        <button className="mobile-menu-button" onClick={() => setMobileOpen((value) => !value)} aria-expanded={mobileOpen} aria-label={mobileOpen ? "Close navigation" : "Open navigation"}><AnimatePresence mode="wait" initial={false}>{mobileOpen ? <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}><X size={20} /></motion.span> : <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}><List size={20} /></motion.span>}</AnimatePresence></button>
      </div>
    </header>

    <main id="top">
      <section className="hero section-pad">
        <div className="hero-copy">
          <Reveal><p className="eyebrow"><span className="status-dot" /> CSIT undergraduate · ML &amp; Data Science</p></Reveal>
          <Reveal delay={0.08}><h1>I build practical machine learning projects and data driven tools.</h1></Reveal>
          <Reveal delay={0.16}><p className="hero-description">I am Mohd Zaheer Uddin. I work mainly with Python, scikit learn, pandas, NumPy, and Streamlit while building a stronger foundation in machine learning.</p></Reveal>
          <Reveal delay={0.24}><div className="hero-actions"><a className="button button-primary" href="#work" onClick={() => sound.enabled && playTone("success")}>See the work <ArrowDown size={17} weight="bold" /></a><button className="text-button" onClick={copyEmail}>{copied ? "Email copied" : "Copy email"} <PaperPlaneTilt size={16} weight="bold" /></button></div></Reveal>
          <Reveal delay={0.32}><div className="proof-row"><span>7 projects</span><span>22 tools learning</span><span>Open to internships</span></div></Reveal>
        </div>
        <Reveal className="hero-art" delay={0.18}><div className="hero-terminal surface"><div className="window-bar"><span className="window-title">portfolio.py</span><span className="window-meta">main · clean</span></div><div className="terminal-body">
          <div className="code-line"><span className="line-number">01</span><span><b>profile</b> = &#123;</span></div><div className="code-line"><span className="line-number">02</span><span>&nbsp;&nbsp;<em>"focus"</em>: <strong>"ML / Data Science"</strong>,</span></div><div className="code-line"><span className="line-number">03</span><span>&nbsp;&nbsp;<em>"stack"</em>: [<strong>"Python"</strong>, <strong>"scikit learn"</strong>],</span></div><div className="code-line"><span className="line-number">04</span><span>&nbsp;&nbsp;<em>"projects"</em>: <strong>7</strong>,</span></div><div className="code-line"><span className="line-number">05</span><span>&nbsp;&nbsp;<em>"status"</em>: <strong>"learning + building"</strong>,</span></div><div className="code-line"><span className="line-number">06</span><span>&#125;</span></div><div className="terminal-output"><span className="prompt">›</span> ready to explore</div>
        </div></div><div className="hero-note">Built with Next.js · animated with intent · responsive by default</div></Reveal>
      </section>

      <Reveal className="tagline-wrap section-pad"><div className="tagline"><span className="eyebrow">The point of this portfolio</span><p>Show the work, the reasoning behind it, and what I am learning next.</p></div></Reveal>

      <section id="work" className="section-pad section-block">
        <Reveal className="section-heading"><div><p className="eyebrow">Selected work</p><h2>Projects with a purpose.</h2></div><p>Each project is small enough to explain and real enough to show how I work.</p></Reveal>
        <div className="work-layout" ref={projectRef}>
          <div className="project-list">{projects.map((project, index) => <motion.button key={project.number} className={`project-row ${activeProject === index ? "active" : ""}`} onMouseEnter={() => { setActiveProject(index); if (sound.enabled && window.matchMedia("(pointer:fine)").matches) playTone("hover"); }} onFocus={() => setActiveProject(index)} onClick={() => { setActiveProject(index); if (sound.enabled) playTone("tap"); }} whileTap={{ scale: 0.985 }}><span className="project-number">{project.number}</span><span className="project-name"><strong>{project.title}</strong><small>{project.type}</small></span><ArrowUpRight className="project-arrow" size={20} weight="bold" /></motion.button>)}</div>
          <div className="project-detail surface"><AnimatePresence mode="wait"><motion.article key={projects[activeProject].number} initial={{ opacity: 0, y: 18, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -12, filter: "blur(6px)" }} transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}><div className="detail-top"><span className="eyebrow">{projects[activeProject].number} / {projects[activeProject].type}</span><Code size={20} /></div><h3>{projects[activeProject].title}</h3><p>{projects[activeProject].description}</p><div className="stack-row">{projects[activeProject].stack.map((item) => <span key={item}>{item}</span>)}</div><div className="detail-actions"><a className="button button-primary" href={projects[activeProject].href} target="_blank" rel="noreferrer" onClick={() => sound.enabled && playTone("success")}>Open project <ArrowUpRight size={17} weight="bold" /></a><a className="button button-secondary" href={projects[activeProject].repo} target="_blank" rel="noreferrer"><GithubLogo size={17} weight="bold" /> Source</a></div></motion.article></AnimatePresence><div className="detail-index">{String(activeProject + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}</div></div>
        </div>
      </section>

      <section id="about" className="section-pad section-block"><Reveal className="about-grid"><div><p className="eyebrow">About me</p><h2>Still learning. Already building.</h2></div><div className="about-copy"><p>I am a Computer Science (CSIT) undergraduate specialising in Machine Learning and Data Science. My current work centres on regression, classification, data analysis, and turning models into simple applications.</p><p>I am looking for an internship where I can learn from real engineering teams, contribute useful work, and keep strengthening my ML fundamentals.</p><div className="about-facts"><span><Briefcase size={17} /> Internship focused</span><span><Sparkle size={17} /> Building in public</span></div></div></Reveal></section>

      <section id="journey" className="section-pad section-block"><Reveal className="section-heading"><div><p className="eyebrow">Learning journey</p><h2>A visible trail of progress.</h2></div><p>The next goal is not to look finished. It is to keep getting better.</p></Reveal><div className="journey-grid">{[["01", "Python foundations", "OOP, file handling, JSON, pathlib"], ["02", "Data stack", "pandas and NumPy for data work"], ["03", "Machine learning", "Regression, classification, scikit learn"], ["04", "Applied projects", "Seven projects across ML and Python apps"]].map(([n, title, copy], index) => <Reveal key={n} delay={index * 0.06} className="journey-item"><span>{n}</span><div><h3>{title}</h3><p>{copy}</p></div></Reveal>)}</div></section>

      <section id="skills" className="section-pad section-block"><Reveal className="section-heading"><div><p className="eyebrow">Tools I use</p><h2>Skills shown in context.</h2></div><p>No percentage bars. The projects above are the evidence.</p></Reveal><div className="skills-grid">{skills.map(([label, note], index) => <Reveal key={label} delay={index * 0.035} className="skill-card surface"><span className="skill-index">0{index + 1}</span><strong>{label}</strong><span>{note}</span></Reveal>)}</div></section>

      <section className="section-pad section-block"><Reveal className="github-card surface"><div className="github-copy"><p className="eyebrow">GitHub activity</p><h2>Proof of the habit.</h2><p>My contribution history is part of the portfolio because consistency matters as much as the finished project.</p><a className="text-button" href="https://github.com/SohailKhan0525" target="_blank" rel="noreferrer">Open GitHub <ArrowUpRight size={16} weight="bold" /></a></div><div className="contribution-wrap"><img src="https://ghchart.rshah.org/9B9B9B/SohailKhan0525" alt="GitHub contribution calendar for SohailKhan0525" loading="lazy" /><div className="contribution-caption"><span>Less</span><i/><i/><i/><i/><span>More</span></div></div></Reveal></section>

      <section id="contact" className="section-pad contact-section"><Reveal className="contact-panel"><div><p className="eyebrow">Get in touch</p><h2>Have a project, internship, or useful problem to discuss?</h2><p>Send me a message and I will get back to you.</p></div><div className="contact-actions"><button className="button button-primary" onClick={copyEmail}>{copied ? "Email copied" : "Copy email"} <PaperPlaneTilt size={17} weight="bold" /></button><a className="button button-secondary" href="/resume">View resume <ArrowUpRight size={17} weight="bold" /></a></div><div className="social-row"><a href="https://github.com/SohailKhan0525" target="_blank" rel="noreferrer"><GithubLogo size={18} /> GitHub</a><a href="https://www.linkedin.com/in/mohd-zaheer-uddin-166b3b356/" target="_blank" rel="noreferrer"><LinkedinLogo size={18} /> LinkedIn</a></div></Reveal></section>
    </main>

    <footer className="footer section-pad"><div><span className="brand-mark small">Q</span><span>Mohd Zaheer Uddin</span></div><div className="footer-links"><Link href="/resume">Resume</Link><a href="/privacy.html">Privacy</a><a href="/terms.html">Terms</a></div><span>Built with Next.js</span></footer>
  </div>;
}
