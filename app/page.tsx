"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import Link from "next/link";
import LiveStats from "./LiveStats";
import { ArrowDown, ArrowUpRight, Brain, Briefcase, CaretDown, Check, Code, Cpu, GithubLogo, LinkedinLogo, List, Moon, PaperPlaneTilt, Sparkle, Sun, X } from "@phosphor-icons/react";

type Theme = "light" | "dark";
type Contribution = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 };

const projects = [
  ["01", "House Price Prediction", "Regression", "Predicting house prices with Python and a practical ML workflow.", ["Python", "pandas", "NumPy", "scikit learn"], "https://housepriceprediction-rqo8ykwgldxbpemwl6kvok.streamlit.app/", "https://github.com/SohailKhan0525/HousePricePrediction"],
  ["02", "Global Earthquake Prediction", "Classification", "An applied classification project exploring earthquake prediction.", ["Python", "pandas", "NumPy", "scikit learn"], "https://github.com/SohailKhan0525/Global-Earthquake-Prediction", "https://github.com/SohailKhan0525/Global-Earthquake-Prediction"],
  ["03", "Heart Disease Prediction", "Logistic regression", "A Streamlit app turning a classification model into an interactive experience.", ["Python", "scikit learn", "Streamlit"], "https://heartdiseaseml-4zrcurmudxpfxbwygcuyytm.streamlit.app/", "https://github.com/SohailKhan0525/HeartDiseaseML"],
  ["04", "Student Management", "Python app", "A practical student management application with a hosted interface.", ["Python", "Streamlit"], "https://studentmanagementproject-ulj54ytmcyj55upzakbzhn.streamlit.app/", "https://github.com/SohailKhan0525/StudentManagementProject"],
  ["05", "Student Pass / Fail Predictor", "Classification", "A small interactive application for predicting student outcomes.", ["Python", "scikit learn", "Streamlit"], "https://studentfailpasspredictor-hjymwbpsp4bksec9ycb2xz.streamlit.app/", "https://github.com/SohailKhan0525/StudentFailPassPredictor"],
  ["06", "Bank Management", "Python app", "A practical project focused on application logic and Python fundamentals.", ["Python", "Streamlit"], "https://bankmanagementproject-brt9pt282uavy8ddzzy7ql.streamlit.app/", "https://github.com/SohailKhan0525/BankManagementProject"],
  ["07", "File Handling", "Python CLI", "A focused project for everyday file operations and application code.", ["Python", "OOP", "pathlib", "JSON"], "https://github.com/SohailKhan0525/File_Handling_Project", "https://github.com/SohailKhan0525/File_Handling_Project"],
] as const;

const skills = [["Python", "Primary language"], ["scikit learn", "ML workflows"], ["pandas", "Data analysis"], ["NumPy", "Numerical computing"], ["Streamlit", "Interactive apps"], ["Git / GitHub", "Version control"], ["HTML / CSS / JS", "Web foundations"]];

const aiEra = [
  {
    id: "loopproof",
    name: "LoopProof",
    tag: "SaaS product",
    status: "Building",
    blurb: "A testimonial tool for solo founders and indie hackers. Collect feedback through a link, approve and embed it, then use AI to draft LinkedIn and X posts from approved testimonials.",
    why: "I wrote the product spec and am building it with an AI coding agent: domain, services, then pages. I make the product and data decisions.",
    stack: ["Next.js", "Appwrite", "Cloudflare Pages", "Gemini API", "Clerk"],
  },
  {
    id: "qofeno",
    name: "Qofeno Labs",
    tag: "Web tools platform",
    status: "~85% complete",
    blurb: "A platform aiming for 1,000+ free and paid web tools. Lightweight jobs run on serverless functions; PDF, image, and media processing use cloud containers that scale to zero.",
    why: "AI helps me scaffold a system I’m still learning to build. I use the project to study how its architecture and services work together.",
    stack: ["React", "Vite", "Appwrite", "Azure Container Apps", "Cloudflare"],
  },
  {
    id: "agentx",
    name: "AI AgentX CLI",
    tag: "Open-source CLI",
    status: "Live · 26,000+ downloads",
    blurb: "An open-source command-line tool published on npm and used by other developers.",
    why: "The code is public. I read and test AI-assisted changes before publishing them for other developers to run.",
    stack: ["Node.js", "npm", "CLI tooling"],
  },
] as const;

function requestClickSound() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("portfolio:click-sound"));
}

function applyTheme(next: Theme) {
  const root = document.documentElement;
  const commit = () => {
    root.dataset.theme = next;
    root.dataset.themeDirection = next;
    try { localStorage.setItem("portfolio-theme", next); } catch {}
  };
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduced && "startViewTransition" in document) {
    try {
      (document as Document & { startViewTransition?: (callback: () => void) => { ready: Promise<void> } }).startViewTransition?.(commit);
      return;
    } catch {}
  }
  commit();
}

function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");
  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem("portfolio-theme"); } catch {}
    const next: Theme = saved === "light" || saved === "dark" ? saved : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    document.documentElement.dataset.themeDirection = next;
  }, []);
  const change = (next: Theme) => {
    setTheme(next);
    applyTheme(next);
  };
  return { theme, change };
}

function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  return <div className={className}>{children}</div>;
}

function AiEraCard({ item, index }: { item: (typeof aiEra)[number]; index: number }) {
  const [open, setOpen] = useState(index === 0);
  const reduced = useReducedMotion();
  return (
    <motion.article className="ai-card surface" transition={{ layout: { duration: 0.45, ease: [0.32, 0.72, 0, 1] } }}>
      <button type="button" className="ai-card-head" data-sound onClick={() => setOpen(v => !v)} aria-expanded={open} aria-controls={`ai-body-${item.id}`}>
        <span className="ai-card-index">0{index + 1}</span>
        <span className="ai-card-title"><strong>{item.name}</strong><small>{item.tag}</small></span>
        <span className={`ai-status status-${item.id}`}>{item.status}</span>
        <motion.span className="ai-caret" animate={{ rotate: open ? 180 : 0 }} transition={{ duration: reduced ? 0 : 0.15 }}><CaretDown size={16} /></motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="body" id={`ai-body-${item.id}`} className="ai-card-body" initial={false} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.15 }}>
            <div className="ai-card-body-inner">
              <p>{item.blurb}</p>
              <div className="ai-why"><Brain size={16} weight="bold" /><p>{item.why}</p></div>
              <div className="stack-row">{item.stack.map(s => <span key={s}>{s}</span>)}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

function ThemeToggle({ theme, change }: { theme: Theme; change: (theme: Theme) => void }) {
  const next = theme === "dark" ? "light" : "dark";
  const reduced = useReducedMotion();
  return (
    <button className="icon-button theme-button" data-sound type="button" aria-label={`Switch to ${next} mode`} aria-pressed={theme === "light"} title={`Switch to ${next} mode`} onClick={() => change(next)}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={theme} className="theme-icon" initial={false} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.15, ease: [0.22, 1, 0.36, 1] }}>
          {theme === "dark" ? <Sun size={18} weight="bold" aria-hidden="true" /> : <Moon size={18} weight="bold" aria-hidden="true" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

function Contributions() {
  const [days, setDays] = useState<Contribution[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch("https://github-contributions-api.jogruber.de/v4/SohailKhan0525?y=last", { cache: "no-store" })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        if (!alive) return;
        const items = Array.isArray(data.contributions) ? data.contributions as Contribution[] : [];
        setDays(items);
        setTotal(Number(data.total?.lastYear ?? items.reduce((s, d) => s + d.count, 0)));
      })
      .catch(() => { if (alive) setFailed(true); })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);
  const active = days.filter(d => d.count > 0).length;
  const streak = useMemo(() => {
    let n = 0;
    for (const d of [...days].sort((a, b) => b.date.localeCompare(a.date))) {
      if (d.count) n++;
      else if (n) break;
    }
    return n;
  }, [days]);
  return (
    <div className="surface activity-card">
      <div className="activity-head">
        <div>

          <h3>{loading ? "Loading activity…" : failed ? "GitHub activity unavailable" : `${total} contributions`}</h3>
          <p>Public contribution activity from the last 12 months.</p>
        </div>
        <a className="button button-secondary" data-sound href="https://github.com/SohailKhan0525" target="_blank" rel="noreferrer"><GithubLogo size={17} /> GitHub <ArrowUpRight size={15} /></a>
      </div>
      <div className="activity-stats">
        <div><strong>{loading || failed ? "–" : total}</strong><span>Contributions</span></div>
        <div><strong>{loading || failed ? "–" : active}</strong><span>Active days</span></div>
        <div><strong>{loading || failed ? "–" : streak}</strong><span>Current streak</span></div>
      </div>
      {!failed && <><div className="contribution-grid" aria-label="GitHub contribution activity">
        {days.slice(-182).map(day => <span key={day.date} className={`level-${day.level}`} title={`${day.count} contributions · ${day.date}`} />)}
      </div>
      <div className="activity-legend"><span>Less</span>{[0, 1, 2, 3, 4].map(level => <i key={level} className={`level-${level}`} />)}<span>More</span></div></>}
    </div>
  );
}

function Terminal() {
  const reduced = useReducedMotion();
  const commands = ["help", "about", "projects", "ai", "skills", "contact", "clear"];
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [index, setIndex] = useState(-1);
  const [ready, setReady] = useState(false);
  const [bootLines, setBootLines] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setBootLines(1), 180),
      window.setTimeout(() => setBootLines(2), 360),
      window.setTimeout(() => setReady(true), 520),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, []);

  useEffect(() => {
    const node = historyRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [history]);

  const output = (cmd: string) => cmd === "help"
    ? ["help      show commands", "about     current focus", "projects  selected work", "ai        what I'm building with AI", "skills    current toolkit", "contact   jump to contact", "clear     clear terminal"]
    : cmd === "about" || cmd === "whoami"
      ? ["Mohd Zaheer Uddin", "CSIT undergraduate, ML & Data Science", "building practical Python + ML projects."]
      : cmd === "projects" || cmd === "ls"
        ? projects.map(p => `${p[0]}  ${p[1]}`)
        : cmd === "ai"
          ? [...aiEra.map(a => `${a.name} — ${a.status}`), "scroll to \"The AI era\" section for the full story"]
          : cmd === "skills"
          ? ["Python · scikit learn · pandas · NumPy", "Streamlit · Git/GitHub · HTML/CSS/JS"]
          : cmd === "contact"
            ? ["Opening contact section…"]
            : [`command not found: ${cmd}`, `type "help" to see available commands`];

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const cmd = input.trim().toLowerCase();
    if (!cmd || !ready) return;
    requestClickSound();
    if (cmd === "clear") {
      setHistory([]);
      setInput("");
      setIndex(-1);
      return;
    }
    setHistory(h => [...h, `$ ${input}`, ...output(cmd)]);
    setInput("");
    setIndex(-1);
    if (cmd === "contact") setTimeout(() => document.querySelector("#contact")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" }), 80);
  };

  const key = (e: KeyboardEvent<HTMLInputElement>) => {
    const items = history.filter(x => x.startsWith("$ ")).map(x => x.slice(2));
    if (e.key === "Tab") {
      e.preventDefault();
      const match = commands.find(c => c.startsWith(input.toLowerCase()));
      if (match) setInput(match);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!items.length) return;
      const n = Math.min(index + 1, items.length - 1);
      setIndex(n);
      setInput(items[items.length - 1 - n] ?? "");
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (index <= 0) {
        setIndex(-1);
        setInput("");
      } else {
        const n = index - 1;
        setIndex(n);
        setInput(items[items.length - 1 - n] ?? "");
      }
    }
  };

  const runQuick = (cmd: string) => {
    setInput(cmd);
    inputRef.current?.focus();
  };

  return (
    <div className="hero-terminal-real" dir="ltr">
      <div className="terminal-top"><div className="terminal-top-left"><span className="terminal-tab">portfolio.py</span><span className="terminal-title">zsh: portfolio</span></div><span className="terminal-status"><i /> {ready ? "ready" : "booting"}</span></div>
      <div className="terminal-screen">
        <div className="terminal-boot" aria-live="polite"><AnimatePresence initial={false}>{bootLines >= 1 && <motion.div key="boot-command" initial={false} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}><b>portfolio@zaheer</b>:~$ ./start.sh</motion.div>}{bootLines >= 2 && <motion.div key="boot-status" initial={false} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}><span>{ready ? "profile loaded. terminal ready." : "loading profile…"}</span></motion.div>}</AnimatePresence></div>
        <div ref={historyRef} className="terminal-history" aria-live="polite" aria-label="Terminal output"><AnimatePresence initial={false} mode="popLayout">{history.slice(-14).map((line, i) => <motion.div key={`${line}-${i}`} initial={false} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: reduced ? 0 : 0.15 }} className={`terminal-line ${line.startsWith("$ ") ? "terminal-command" : "terminal-output-line"}`}>{line}</motion.div>)}</AnimatePresence></div>
        <form className="terminal-form" dir="ltr" onSubmit={submit}><span className="terminal-prompt" aria-hidden="true">$</span><input ref={inputRef} className="terminal-input" type="text" dir="ltr" value={input} onChange={e => setInput(e.target.value)} onKeyDown={key} disabled={!ready} placeholder={ready ? "type a command…" : "booting…"} aria-label="Terminal command" autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} /></form>
        <div className="terminal-help"><span>↑↓ history / Tab complete / Enter run</span><div className="terminal-quick" aria-label="Quick terminal commands">{["help", "projects", "ai", "skills", "about"].map(cmd => <button key={cmd} type="button" className="terminal-chip" data-sound onClick={() => runQuick(cmd)}>{cmd}</button>)}</div></div>
      </div>
      <div className="terminal-bottom"><span>Portfolio shell v1.1</span><span>Type help to start</span></div>
    </div>
  );
}

export default function Home() {
  const reduced = useReducedMotion();
  const menuRef = useRef<HTMLButtonElement>(null);
  const detailRef = useRef<HTMLElement>(null);
  const { theme, change } = useTheme();
  const [mobile, setMobile] = useState(false);
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const email = "sohailkhannnn.0525@gmail.com";
  const linkedin = "https://www.linkedin.com/in/mohd-zaheer-uddin-166b3b356/";

  const copyEmail = async () => {
    requestClickSound();
    try { await navigator.clipboard.writeText(email); setCopied(true); setTimeout(() => setCopied(false), 1500); }
    catch { window.location.href = `mailto:${email}`; }
  };

  const nav = [["Work", "#work"], ["AI Era", "#ai-era"], ["About", "#about"], ["Journey", "#journey"], ["Skills", "#skills"], ["Resume", "/resume"], ["Contact", "#contact"]];
  const heroRef = useRef<HTMLDivElement>(null);
  const handleHeroMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = heroRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${((e.clientX - rect.left) / rect.width) * 100}%`);
    el.style.setProperty("--my", `${((e.clientY - rect.top) / rect.height) * 100}%`);
  };
  const project = projects[active];

  return (
    <div className="site-shell">
      <header className="site-header" onKeyDown={e => { if (e.key === "Escape" && mobile) { setMobile(false); menuRef.current?.focus(); } }}><Link href="#top" className="brand" data-sound onClick={() => setMobile(false)}><span className="brand-mark">Q</span><span>Mohd Zaheer Uddin</span></Link><nav className={`desktop-nav ${mobile ? "mobile-visible" : ""}`} id="primary-navigation" aria-label="Primary navigation">{nav.map(([label, href]) => <Link key={label} href={href} className="nav-link" data-sound onClick={() => setMobile(false)}>{label}</Link>)}</nav><div className="header-actions"><ThemeToggle theme={theme} change={change} /><button ref={menuRef} className="mobile-menu-button" aria-controls="primary-navigation" data-sound type="button" onClick={() => setMobile(v => !v)} aria-expanded={mobile} aria-label="Toggle navigation">{mobile ? <X size={20} /> : <List size={20} />}</button></div></header>
      <a className="skip-link" href="#top">Skip to content</a><main id="top">
        <section className="hero section-pad" ref={heroRef} onPointerMove={handleHeroMove}><div className="hero-copy"><Reveal delay={0.08}><h1>I build Python apps and machine learning projects.</h1></Reveal><Reveal delay={0.16}><p className="hero-description">I’m a CSIT undergraduate learning through datasets, models, and working apps.</p></Reveal><Reveal delay={0.24}><div className="hero-actions"><a className="button button-primary" data-sound href="#work">See the work <ArrowDown size={17} /></a><button className="text-button" data-sound type="button" onClick={copyEmail}>{copied ? "Email copied" : "Copy email"} {copied ? <Check size={16} /> : <PaperPlaneTilt size={16} />}</button></div></Reveal><Reveal delay={0.32}><div className="proof-row"><span>7 projects</span><span>Python + ML focus</span><span>Open to internships</span></div></Reveal></div><Reveal className="hero-art" delay={0.16}><Terminal /><p className="hero-note">Try <b>help</b>, <b>projects</b>, <b>skills</b>, or <b>about</b>.</p></Reveal></section>
        <section id="work" className="section-pad section-block"><Reveal className="section-heading"><div><h2>Selected projects</h2></div><p>Select a project to see the app and its source code.</p></Reveal><Reveal className="work-layout" delay={0.1}><div className="project-list">{projects.map((p, i) => <motion.button key={p[0]} type="button" className={`project-row ${active === i ? "active" : ""}`} data-sound onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} aria-pressed={active === i} aria-controls="project-detail" onClick={() => { setActive(i); if (window.matchMedia("(max-width: 60rem)").matches) requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" })); }} whileTap={reduced ? undefined : { scale: 0.985 }}><span className="project-number">{p[0]}</span><span className="project-name"><strong>{p[1]}</strong><small>{p[2]}</small></span><ArrowUpRight className="project-arrow" size={17} /></motion.button>)}</div><AnimatePresence mode="wait"><motion.article key="project-detail" ref={detailRef} id="project-detail" aria-live="polite" className="project-detail surface" initial={false} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: reduced ? 0 : 0.15, ease: [0.22, 1, 0.36, 1] }}><div><div className="detail-top"><span className="eyebrow">{project[2]}</span><span>{project[0]}</span></div><h3>{project[1]}</h3><p>{project[3]}</p><div className="stack-row">{project[4].map(x => <span key={x}>{x}</span>)}</div></div><div className="detail-actions"><a className="button button-primary" data-sound href={project[5]} target="_blank" rel="noreferrer">Open project <ArrowUpRight size={16} /></a><a className="button button-secondary" data-sound href={project[6]} target="_blank" rel="noreferrer"><GithubLogo size={17} /> Source</a></div></motion.article></AnimatePresence></Reveal></section>
        <section id="ai-era" className="section-pad section-block ai-era"><Reveal className="section-heading"><div><h2>Building with AI</h2></div><p>I use AI coding agents while learning the fundamentals. I write the specs, choose the architecture, and review the code. These are the products I’m working on.</p></Reveal><div className="ai-era-grid">{aiEra.map((item, i) => <Reveal key={item.id} delay={i * 0.08}><AiEraCard item={item} index={i} /></Reveal>)}</div></section>
        <section id="about" className="section-pad section-block"><Reveal className="section-heading"><div><h2>About me</h2></div></Reveal><div className="about-grid"><div className="about-copy"><p>I am a CSIT undergraduate focused on Python, machine learning, data analysis, and practical web development.</p><div className="about-facts"><span><Briefcase size={17} /> Open to internships</span><span><Code size={17} /> Python + ML</span><span><Sparkle size={17} /> Learning by building</span></div></div><Contributions /></div></section>
        <section id="journey" className="section-pad section-block"><Reveal className="section-heading"><div><h2>What I’m learning</h2></div><p>From Python fundamentals to models, apps, and deployment.</p></Reveal><div className="journey-grid">{[["01", "Python foundations", "Core syntax, OOP, files, data structures"], ["02", "ML experiments", "Regression, classification, evaluation"], ["03", "Interactive apps", "Turning models into usable tools"], ["04", "Better engineering", "Responsive UI, deployment, accessibility"]].map(x => <Reveal key={x[0]}><article className="journey-item"><span>{x[0]}</span><h3>{x[1]}</h3><p>{x[2]}</p></article></Reveal>)}</div></section>
        <section id="skills" className="section-pad section-block"><Reveal className="section-heading"><div><h2>Tools I use</h2></div><p>The languages and libraries behind these projects.</p></Reveal><div className="skills-grid">{skills.map(([name, desc], i) => <Reveal key={name} delay={(i % 4) * 0.06}><motion.article className="skill-card surface" ><span className="skill-index">0{i + 1}</span><strong>{name}</strong><span>{desc}</span></motion.article></Reveal>)}</div></section>
        <section id="contact" className="section-pad section-block"><Reveal><div className="surface contact-card"><div><h2>Get in touch</h2><p>I’m open to internships and collaborations. Email me or connect on LinkedIn.</p></div><div className="contact-actions"><button className="button button-primary" data-sound type="button" onClick={copyEmail}>{copied ? "Email copied" : "Copy email"} {copied ? <Check size={17} /> : <PaperPlaneTilt size={17} />}</button><a className="button button-secondary" data-sound href={linkedin} target="_blank" rel="noreferrer"><LinkedinLogo size={17} /> LinkedIn</a><a className="button button-secondary" data-sound href="https://github.com/SohailKhan0525" target="_blank" rel="noreferrer"><GithubLogo size={17} /> GitHub</a></div></div></Reveal></section>
      </main>

      <LiveStats />

      <footer className="site-footer section-pad">
        <div className="footer-main">
          <div className="footer-brand"><span className="brand-mark">Q</span><div><strong>Mohd Zaheer Uddin</strong><span>ML &amp; Data Science with Python</span></div></div>
          <div className="footer-links"><Link href="#work">Work</Link><Link href="#about">About</Link><Link href="#skills">Skills</Link><Link href="#contact">Contact</Link><a href={linkedin} target="_blank" rel="noreferrer">LinkedIn</a><a href="https://github.com/SohailKhan0525" target="_blank" rel="noreferrer">GitHub</a></div>
        </div>
        <div className="footer-bottom"><span>© 2026 Mohd Zaheer Uddin. Built with Next.js &amp; deployed on Vercel.</span><span>Available for internships &amp; collaborations.</span></div>
      </footer>
    </div>
  );
}
