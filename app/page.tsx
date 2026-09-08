"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Briefcase, Check, Code, GithubLogo, LinkedinLogo, List, Moon, PaperPlaneTilt, Sparkle, Sun, X } from "@phosphor-icons/react";

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

function requestClickSound() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("portfolio:click-sound"));
}

function applyTheme(next: Theme) {
  const root = document.documentElement;
  const commit = () => {
    root.dataset.theme = next;
    root.dataset.themeDirection = next;
    localStorage.setItem("portfolio-theme", next);
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
    const saved = localStorage.getItem("portfolio-theme");
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
  return <motion.div className={className} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: 0.65, delay, ease: [0.32, 0.72, 0, 1] }}>{children}</motion.div>;
}

function ThemeToggle({ theme, change }: { theme: Theme; change: (theme: Theme) => void }) {
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button className="icon-button theme-button" data-sound type="button" aria-label={`Switch to ${next} mode`} aria-pressed={theme === "light"} title={`Switch to ${next} mode`} onClick={() => change(next)}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={theme} className="theme-icon" initial={{ opacity: 0, rotate: -90, scale: 0.65 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{ opacity: 0, rotate: 90, scale: 0.65 }} transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}>
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
      .catch(() => {})
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
          <p className="eyebrow">GitHub activity</p>
          <h3>{loading ? "Loading activity…" : `${total} contributions`}</h3>
          <p>Public contribution activity from the last 12 months.</p>
        </div>
        <a className="button button-secondary" data-sound href="https://github.com/SohailKhan0525" target="_blank" rel="noreferrer"><GithubLogo size={17} /> GitHub <ArrowUpRight size={15} /></a>
      </div>
      <div className="activity-stats">
        <div><strong>{total}</strong><span>Contributions</span></div>
        <div><strong>{active}</strong><span>Active days</span></div>
        <div><strong>{streak}</strong><span>Current streak</span></div>
      </div>
      <div className="contribution-grid" aria-label="GitHub contribution activity">
        {days.slice(-182).map(day => <span key={day.date} className={`level-${day.level}`} title={`${day.count} contributions · ${day.date}`} />)}
      </div>
      <div className="activity-legend"><span>Less</span>{[0, 1, 2, 3, 4].map(level => <i key={level} className={`level-${level}`} />)}<span>More</span></div>
    </div>
  );
}

function Terminal() {
  const commands = ["help", "about", "projects", "skills", "contact", "clear"];
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
    ? ["help      show commands", "about     current focus", "projects  selected work", "skills    current toolkit", "contact   jump to contact", "clear     clear terminal"]
    : cmd === "about" || cmd === "whoami"
      ? ["Mohd Zaheer Uddin", "CSIT undergraduate · ML & Data Science", "building practical Python + ML projects."]
      : cmd === "projects" || cmd === "ls"
        ? projects.map(p => `${p[0]}  ${p[1]}`)
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
    if (cmd === "contact") setTimeout(() => document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" }), 80);
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
      <div className="terminal-top">
        <div className="terminal-top-left">
          <span className="terminal-dots" aria-hidden="true"><i /><i /><i /></span>
          <span className="terminal-tab">portfolio.py</span>
          <span className="terminal-title">zsh — portfolio</span>
        </div>
        <span className="terminal-status"><i /> {ready ? "ready" : "booting"}</span>
      </div>

      <div className="terminal-screen">
        <div className="terminal-boot" aria-live="polite">
          <AnimatePresence initial={false}>
            {bootLines >= 1 && <motion.div key="boot-command" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}><b>portfolio@zaheer</b>:~$ ./start.sh</motion.div>}
            {bootLines >= 2 && <motion.div key="boot-status" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}><span>{ready ? "profile loaded · terminal ready." : "loading profile…"}</span></motion.div>}
          </AnimatePresence>
        </div>

        <div ref={historyRef} className="terminal-history" aria-live="polite" aria-label="Terminal output">
          <AnimatePresence initial={false} mode="popLayout">
            {history.slice(-14).map((line, i) => (
              <motion.div key={`${line}-${i}`} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.18 }} className={`terminal-line ${line.startsWith("$ ") ? "terminal-command" : "terminal-output-line"}`}>{line}</motion.div>
            ))}
          </AnimatePresence>
        </div>

        <form className="terminal-form" dir="ltr" onSubmit={submit}>
          <span className="terminal-prompt" aria-hidden="true">$</span>
          <input ref={inputRef} className="terminal-input" type="text" dir="ltr" value={input} onChange={e => setInput(e.target.value)} onKeyDown={key} disabled={!ready} placeholder={ready ? "type a command…" : "booting…"} aria-label="Terminal command" autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} />
          <span className={`terminal-caret ${ready ? "is-ready" : ""}`} aria-hidden="true" />
        </form>

        <div className="terminal-help">
          <span>↑↓ history · Tab autocomplete · Enter run</span>
          <div className="terminal-quick" aria-label="Quick terminal commands">
            {["help", "projects", "skills", "about"].map(cmd => <button key={cmd} type="button" className="terminal-chip" data-sound onClick={() => runQuick(cmd)}>{cmd}</button>)}
          </div>
        </div>
      </div>

      <div className="terminal-bottom"><span>PORTFOLIO SHELL v1.1</span><span>interactive · responsive</span></div>
    </div>
  );
}

export default function Home() {
  const { theme, change } = useTheme();
  const [mobile, setMobile] = useState(false);
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const email = "sohailkhannnn.0525@gmail.com";

  const copyEmail = async () => {
    requestClickSound();
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  };

  const nav = [["Work", "#work"], ["About", "#about"], ["Journey", "#journey"], ["Skills", "#skills"], ["Resume", "/resume"], ["Contact", "#contact"]];
  const project = projects[active];

  return (
    <div className="site-shell">
      <header className="site-header">
        <Link href="#top" className="brand" data-sound onClick={() => setMobile(false)}><span className="brand-mark">Q</span><span>Mohd Zaheer Uddin</span></Link>
        <nav className={`desktop-nav ${mobile ? "mobile-visible" : ""}`} aria-label="Primary navigation">
          {nav.map(([label, href]) => <Link key={label} href={href} className="nav-link" data-sound onClick={() => setMobile(false)}>{label}</Link>)}
        </nav>
        <div className="header-actions">
          <ThemeToggle theme={theme} change={change} />
          <button className="mobile-menu-button" data-sound type="button" onClick={() => setMobile(v => !v)} aria-expanded={mobile} aria-label="Toggle navigation">{mobile ? <X size={20} /> : <List size={20} />}</button>
        </div>
      </header>

      <main id="top">
        <section className="hero section-pad">
          <div className="hero-copy">
            <Reveal><p className="eyebrow"><span className="status-dot" /> CSIT undergraduate · ML &amp; Data Science</p></Reveal>
            <Reveal delay={0.08}><h1>I build practical machine learning projects and data-driven tools.</h1></Reveal>
            <Reveal delay={0.16}><p className="hero-description">Python-first, curious, and focused on turning concepts into useful things people can actually try.</p></Reveal>
            <Reveal delay={0.24}><div className="hero-actions"><a className="button button-primary" data-sound href="#work">See the work <ArrowDown size={17} /></a><button className="text-button" data-sound type="button" onClick={copyEmail}>{copied ? "Email copied" : "Copy email"} {copied ? <Check size={16} /> : <PaperPlaneTilt size={16} />}</button></div></Reveal>
            <Reveal delay={0.32}><div className="proof-row"><span>7 projects</span><span>Python + ML focus</span><span>Open to internships</span></div></Reveal>
          </div>
          <Reveal className="hero-art" delay={0.16}><Terminal /><p className="hero-note">Try <b>help</b>, <b>projects</b>, <b>skills</b>, or <b>about</b>.</p></Reveal>
        </section>

        <section id="work" className="section-pad section-block">
          <Reveal className="section-heading"><div><p className="eyebrow">Selected work</p><h2>Projects with a purpose.</h2></div><p>Small enough to explain. Real enough to show how I work.</p></Reveal>
          <div className="work-layout">
            <div className="project-list">
              {projects.map((p, i) => <motion.button key={p[0]} type="button" className={`project-row ${active === i ? "active" : ""}`} data-sound onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} onClick={() => setActive(i)} whileTap={{ scale: 0.985 }}><span className="project-number">{p[0]}</span><span className="project-name"><strong>{p[1]}</strong><small>{p[2]}</small></span><ArrowUpRight className="project-arrow" size={17} /></motion.button>)}
            </div>
            <AnimatePresence mode="wait">
              <motion.article key={project[0]} className="project-detail surface" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
                <div><div className="detail-top"><span className="eyebrow">{project[2]}</span><span>{project[0]}</span></div><h3>{project[1]}</h3><p>{project[3]}</p><div className="stack-row">{project[4].map(x => <span key={x}>{x}</span>)}</div></div>
                <div className="detail-actions"><a className="button button-primary" data-sound href={project[5]} target="_blank" rel="noreferrer">Open project <ArrowUpRight size={16} /></a><a className="button button-secondary" data-sound href={project[6]} target="_blank" rel="noreferrer"><GithubLogo size={17} /> Source</a></div>
              </motion.article>
            </AnimatePresence>
          </div>
        </section>

        <section id="about" className="section-pad section-block">
          <Reveal className="section-heading"><div><p className="eyebrow">About</p><h2>Curious, practical, still learning.</h2></div><p>Visible work, visible learning, steady improvement.</p></Reveal>
          <div className="about-grid"><div className="about-copy"><p>I am a CSIT undergraduate focused on Python, machine learning, data analysis, and practical web development.</p><div className="about-facts"><span><Briefcase size={17} /> Open to internships</span><span><Code size={17} /> Python + ML</span><span><Sparkle size={17} /> Learning by building</span></div></div><Contributions /></div>
        </section>

        <section id="journey" className="section-pad section-block">
          <Reveal className="section-heading"><div><p className="eyebrow">Journey</p><h2>From fundamentals to systems.</h2></div><p>Understand the basics, build projects, then make the projects better.</p></Reveal>
          <div className="journey-grid">{[["01", "Python foundations", "Core syntax, OOP, files, data structures"], ["02", "ML experiments", "Regression, classification, evaluation"], ["03", "Interactive apps", "Turning models into usable tools"], ["04", "Better engineering", "Responsive UI, deployment, accessibility"]].map(x => <Reveal key={x[0]}><article className="journey-item"><span>{x[0]}</span><h3>{x[1]}</h3><p>{x[2]}</p></article></Reveal>)}</div>
        </section>

        <section id="skills" className="section-pad section-block">
          <Reveal className="section-heading"><div><p className="eyebrow">Skills</p><h2>The current toolkit.</h2></div><p>Tools I use today and continue improving through projects.</p></Reveal>
          <div className="skills-grid">{skills.map(([name, desc], i) => <motion.article key={name} className="skill-card surface" whileHover={{ y: -4 }}><span className="skill-index">0{i + 1}</span><strong>{name}</strong><span>{desc}</span></motion.article>)}</div>
        </section>

        <section id="contact" className="section-pad section-block">
          <Reveal><div className="surface contact-card"><div><p className="eyebrow">Contact</p><h2>Let’s build something useful.</h2><p>Looking for an intern, collaborator, or someone who enjoys learning by building? I would love to hear from you.</p></div><div className="contact-actions"><button className="button button-primary" data-sound type="button" onClick={copyEmail}>{copied ? "Email copied" : "Copy email"} {copied ? <Check size={17} /> : <PaperPlaneTilt size={17} />}</button><a className="button button-secondary" data-sound href="https://www.linkedin.com" target="_blank" rel="noreferrer"><LinkedinLogo size={17} /> LinkedIn</a><a className="button button-secondary" data-sound href="https://github.com/SohailKhan0525" target="_blank" rel="noreferrer"><GithubLogo size={17} /> GitHub</a></div></div></Reveal>
        </section>
      </main>

      <footer className="site-footer section-pad"><span>© 2026 Mohd Zaheer Uddin</span><span>Python mindset · shipped on Vercel</span></footer>
    </div>
  );
}
