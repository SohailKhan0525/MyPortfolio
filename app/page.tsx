"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Briefcase, Code, GithubLogo, LinkedinLogo, List, Moon, PaperPlaneTilt, Sparkle, Sun, X } from "@phosphor-icons/react";

type Theme = "light" | "dark";
type Contribution = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 };

const projects = [
  { number: "01", title: "House Price Prediction", type: "Regression", description: "Predicting house prices with Python and a practical machine-learning workflow.", stack: ["Python", "pandas", "NumPy", "scikit learn"], href: "https://housepriceprediction-rqo8ykwgldxbpemwl6kvok.streamlit.app/", repo: "https://github.com/SohailKhan0525/HousePricePrediction" },
  { number: "02", title: "Global Earthquake Prediction", type: "Classification", description: "An applied classification project exploring earthquake-related prediction.", stack: ["Python", "pandas", "NumPy", "scikit learn"], href: "https://github.com/SohailKhan0525/Global-Earthquake-Prediction", repo: "https://github.com/SohailKhan0525/Global-Earthquake-Prediction" },
  { number: "03", title: "Heart Disease Prediction", type: "Logistic regression", description: "A Streamlit app that turns a classification model into an interactive experience.", stack: ["Python", "scikit learn", "Streamlit"], href: "https://heartdiseaseml-4zrcurmudxpfxbwygcuyytm.streamlit.app/", repo: "https://github.com/SohailKhan0525/HeartDiseaseML" },
  { number: "04", title: "Student Management", type: "Python app", description: "A practical student management application with a hosted interface.", stack: ["Python", "Streamlit"], href: "https://studentmanagementproject-ulj54ytmcyj55upzakbzhn.streamlit.app/", repo: "https://github.com/SohailKhan0525/StudentManagementProject" },
  { number: "05", title: "Student Pass / Fail Predictor", type: "Classification", description: "A small interactive application for predicting student outcomes.", stack: ["Python", "scikit learn", "Streamlit"], href: "https://studentfailpasspredictor-hjymwbpsp4bksec9ycb2xz.streamlit.app/", repo: "https://github.com/SohailKhan0525/StudentFailPassPredictor" },
  { number: "06", title: "Bank Management", type: "Python app", description: "A practical project focused on application logic and Python fundamentals.", stack: ["Python", "Streamlit"], href: "https://bankmanagementproject-brt9pt282uavy8ddzzy7ql.streamlit.app/", repo: "https://github.com/SohailKhan0525/BankManagementProject" },
  { number: "07", title: "File Handling", type: "Python CLI", description: "A focused project for everyday file operations and application code.", stack: ["Python", "OOP", "pathlib", "JSON"], href: "https://github.com/SohailKhan0525/File_Handling_Project", repo: "https://github.com/SohailKhan0525/File_Handling_Project" },
];

const skills = [["Python", "Primary language"], ["scikit learn", "ML workflows"], ["pandas", "Data analysis"], ["NumPy", "Numerical computing"], ["Streamlit", "Interactive apps"], ["Git / GitHub", "Version control"], ["HTML / CSS / JS", "Web foundations"]];

function playTone(kind: "tap" | "success") {
  if (typeof window === "undefined" || localStorage.getItem("portfolio-sound") === "off") return;
  try {
    const Ctor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor({ latencyHint: "interactive" });
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(kind === "success" ? 440 : 320, now);
    oscillator.frequency.exponentialRampToValueAtTime(kind === "success" ? 660 : 240, now + 0.06);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(kind === "success" ? 0.028 : 0.016, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.08);
    oscillator.addEventListener("ended", () => void ctx.close());
  } catch {}
}

function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");
  useEffect(() => {
    const stored = localStorage.getItem("portfolio-theme");
    const next: Theme = stored === "light" || stored === "dark" ? stored : window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
  }, []);
  const change = (next: Theme) => {
    localStorage.setItem("portfolio-theme", next);
    setTheme(next);
    document.documentElement.dataset.theme = next;
    playTone("success");
  };
  return { theme, change };
}

function useSound() {
  const [enabled, setEnabled] = useState(true);
  useEffect(() => setEnabled(localStorage.getItem("portfolio-sound") !== "off"), []);
  const toggle = () => {
    const next = !enabled;
    localStorage.setItem("portfolio-sound", next ? "on" : "off");
    setEnabled(next);
    if (next) playTone("success");
  };
  return { enabled, toggle };
}

function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return <div className={`reveal ${className}`} style={{ animationDelay: `${delay}s` }}>{children}</div>;
}

function ThemeToggle({ theme, change }: { theme: Theme; change: (next: Theme) => void }) {
  const next = theme === "dark" ? "light" : "dark";
  return <button type="button" className="icon-button theme-button" aria-label={`Switch to ${next} mode`} title={`Switch to ${next} mode`} onClick={() => change(next)}>{theme === "dark" ? <Sun size={18} weight="bold" /> : <Moon size={18} weight="bold" />}</button>;
}

function ContributionCard() {
  const [days, setDays] = useState<Contribution[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    fetch("https://github-contributions-api.jogruber.de/v4/SohailKhan0525?y=last", { cache: "no-store" })
      .then(response => response.ok ? response.json() : Promise.reject(new Error("contribution request failed")))
      .then(data => {
        if (!alive) return;
        const contributions = Array.isArray(data.contributions) ? data.contributions as Contribution[] : [];
        setDays(contributions);
        const apiTotal = Number(data.total?.lastYear ?? data.total?.[String(new Date().getFullYear())] ?? 0);
        setTotal(Number.isFinite(apiTotal) ? apiTotal : contributions.reduce((sum, day) => sum + day.count, 0));
      })
      .catch(() => { if (alive) { setDays([]); setTotal(0); } })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);
  const active = days.filter(day => day.count > 0).length;
  const currentStreak = useMemo(() => {
    const sorted = [...days].sort((a, b) => b.date.localeCompare(a.date));
    let streak = 0;
    for (const day of sorted) { if (day.count > 0) streak++; else if (streak) break; }
    return streak;
  }, [days]);
  const recent = days.slice(-182);
  return <div className="surface github-card activity-card">
    <div className="activity-head"><div><p className="eyebrow">GitHub activity</p><h3>{loading ? "Loading activity…" : `${total ?? 0} contributions`}</h3><p>Last 12 months of public contribution activity.</p></div><a className="button button-secondary" href="https://github.com/SohailKhan0525" target="_blank" rel="noreferrer"><GithubLogo size={17}/> Profile <ArrowUpRight size={15}/></a></div>
    <div className="activity-stats"><div><strong>{total ?? 0}</strong><span>Total</span></div><div><strong>{active}</strong><span>Active days</span></div><div><strong>{currentStreak}</strong><span>Current streak</span></div></div>
    <div className="contribution-grid" aria-label="GitHub contribution activity">{recent.map(day => <span key={day.date} className={`level-${day.level}`} title={`${day.count} contributions on ${day.date}`} />)}</div>
    <div className="activity-legend"><span>Less</span>{[0,1,2,3,4].map(level => <i key={level} className={`level-${level}`} />)}<span>More</span></div>
  </div>;
}

function HeroTerminal({ soundEnabled }: { soundEnabled: boolean }) {
  const commands = ["help", "about", "projects", "skills", "contact", "clear"];
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [booted, setBooted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { const timer = window.setTimeout(() => setBooted(true), 420); return () => window.clearTimeout(timer); }, []);
  const outputFor = (command: string) => {
    if (command === "help") return ["help      show commands", "about     current focus", "projects  selected work", "skills    current toolkit", "contact   jump to contact", "clear     clear terminal"];
    if (command === "about" || command === "whoami") return ["Mohd Zaheer Uddin", "CSIT undergraduate · ML & Data Science", "building practical Python + ML projects."];
    if (command === "projects" || command === "ls") return projects.map(project => `${project.number}  ${project.title}`);
    if (command === "skills") return ["Python · scikit learn · pandas · NumPy", "Streamlit · Git/GitHub · HTML/CSS/JS"];
    if (command === "contact") return ["Opening contact section…"];
    return [`command not found: ${command}`, `type "help" to see available commands`];
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const command = input.trim().toLowerCase();
    if (!command) return;
    if (command === "clear") { setHistory([]); setInput(""); setHistoryIndex(-1); if (soundEnabled) playTone("tap"); return; }
    setHistory(current => [...current, `$ ${input}`, ...outputFor(command)]);
    setInput(""); setHistoryIndex(-1);
    if (command === "contact") window.setTimeout(() => document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" }), 80);
    if (soundEnabled) playTone("success");
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const items = history.filter(line => line.startsWith("$ ")).map(line => line.slice(2));
    if (event.key === "Tab") { event.preventDefault(); const match = commands.find(command => command.startsWith(input.toLowerCase())); if (match) setInput(match); }
    if (event.key === "ArrowUp") { event.preventDefault(); if (!items.length) return; const next = Math.min(historyIndex + 1, items.length - 1); setHistoryIndex(next); setInput(items[items.length - 1 - next] ?? ""); }
    if (event.key === "ArrowDown") { event.preventDefault(); if (historyIndex <= 0) { setHistoryIndex(-1); setInput(""); return; } const next = historyIndex - 1; setHistoryIndex(next); setInput(items[items.length - 1 - next] ?? ""); }
  };
  return <div className="hero-terminal-real" onClick={() => inputRef.current?.focus()}>
    <div className="terminal-top"><div className="terminal-top-left"><span className="terminal-dots"><i/><i/><i/></span><span className="terminal-tab">portfolio.py</span><span className="terminal-title">zsh — portfolio</span></div><span className="terminal-status"><i/> ready</span></div>
    <div className="terminal-screen"><div className="terminal-boot"><b>portfolio@zaheer</b>:~$ ./start.sh<br/><span>{booted ? "profile loaded · terminal ready." : "initializing…"}</span></div><div className="terminal-history" aria-live="polite">{history.slice(-9).map((line, index) => <div key={`${line}-${index}`} className={line.startsWith("$ ") ? "terminal-line terminal-command" : "terminal-line terminal-output-line"}>{line}</div>)}</div><form className="terminal-form" onSubmit={submit}><span className="terminal-prompt">$</span><input ref={inputRef} className="terminal-input" value={input} onChange={event => setInput(event.target.value)} onKeyDown={onKeyDown} placeholder={booted ? "type a command…" : "initializing…"} disabled={!booted} aria-label="Terminal command" autoComplete="off" spellCheck={false}/></form><div className="terminal-help"><span>↑↓ history · Tab autocomplete · Enter run</span><div className="terminal-quick">{["help", "projects", "skills", "about"].map(command => <button key={command} type="button" className="terminal-chip" onClick={() => { setInput(command); inputRef.current?.focus(); }}>{command}</button>)}</div></div></div><div className="terminal-bottom"><span>PORTFOLIO SHELL v1.0</span><span>interactive · responsive</span></div>
  </div>;
}

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeProject, setActiveProject] = useState(0);
  const [copied, setCopied] = useState(false);
  const { theme, change } = useTheme();
  const sound = useSound();
  const email = "sohailkhannnn.0525@gmail.com";
  const navItems = useMemo(() => [["Work", "#work"], ["About", "#about"], ["Journey", "#journey"], ["Skills", "#skills"], ["Resume", "/resume"], ["Contact", "#contact"]], []);
  const project = projects[activeProject];
  const copyEmail = async () => { try { await navigator.clipboard.writeText(email); setCopied(true); if (sound.enabled) playTone("success"); window.setTimeout(() => setCopied(false), 1600); } catch { window.location.href = `mailto:${email}?subject=Portfolio%20Contact`; } };
  return <div className="site-shell"><div className="noise" aria-hidden="true"/><div className="grid-lines" aria-hidden="true"/>
    <style>{`.reveal{opacity:0;animation:reveal .75s cubic-bezier(.32,.72,0,1) forwards}@keyframes reveal{to{opacity:1;transform:none;filter:none}}.reveal{transform:translateY(22px);filter:blur(5px)}.hero-terminal-real{max-width:100%;min-width:0}.terminal-top,.terminal-screen,.terminal-bottom,.terminal-history,.terminal-form,.terminal-help,.terminal-top-left{min-width:0;max-width:100%}.terminal-screen,.terminal-history{overflow:hidden}.terminal-line,.terminal-output-line,.terminal-command,.terminal-boot,.terminal-bottom span,.hero-note,.project-name,.project-detail p,.github-copy,.journey-item,.skill-card,.contact-card{overflow-wrap:anywhere;word-break:break-word}.terminal-input{width:0;min-width:0;max-width:100%;flex:1;overflow:hidden}.terminal-history{max-height:220px;overflow-y:auto;scrollbar-width:thin}.terminal-cursor{display:none!important}.activity-card{display:grid;gap:20px}.activity-head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.activity-head h3{margin:.3rem 0 .45rem;font-size:clamp(1.6rem,3vw,2.4rem);letter-spacing:-.04em}.activity-head p:not(.eyebrow){color:var(--muted);max-width:52ch}.activity-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.activity-stats div{padding:16px;border:1px solid var(--line);border-radius:14px;background:var(--panel)}.activity-stats strong{display:block;font-size:1.35rem}.activity-stats span{display:block;margin-top:4px;color:var(--muted);font-size:.75rem}.contribution-grid{display:grid;grid-auto-flow:column;grid-template-rows:repeat(7,10px);grid-auto-columns:10px;gap:4px;overflow-x:auto;overflow-y:hidden;padding:3px 0 8px;max-width:100%}.contribution-grid span{display:block;border-radius:3px;background:var(--line)}.contribution-grid .level-1,.activity-legend .level-1{background:#777}.contribution-grid .level-2,.activity-legend .level-2{background:#999}.contribution-grid .level-3,.activity-legend .level-3{background:#bbb}.contribution-grid .level-4,.activity-legend .level-4{background:#eee}.activity-legend{display:flex;align-items:center;justify-content:flex-end;gap:5px;color:var(--muted);font-size:10px}.activity-legend i{width:10px;height:10px;border-radius:3px;background:var(--line)}.activity-legend .level-1{background:#777}.activity-legend .level-2{background:#999}.activity-legend .level-3{background:#bbb}.activity-legend .level-4{background:#eee}.focus-visible{outline:2px solid currentColor;outline-offset:3px}@media(max-width:620px){.activity-head{flex-direction:column}.activity-head .button{width:100%;justify-content:center}.activity-stats{grid-template-columns:1fr}.contribution-grid{grid-auto-columns:9px;grid-template-rows:repeat(7,9px);gap:3px}.terminal-title{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.terminal-status{flex:0 0 auto}.terminal-top{gap:8px}.terminal-top-left{overflow:hidden}.section-pad{width:min(calc(100% - 32px),1184px)}}@media(prefers-reduced-motion:reduce){.reveal{opacity:1;transform:none;filter:none;animation:none}}`}</style>
    <header className="site-header"><Link href="#top" className="brand" onClick={() => sound.enabled && playTone("tap")}><span className="brand-mark">Q</span><span>Mohd Zaheer Uddin</span></Link><nav className={`desktop-nav ${mobileOpen ? "mobile-visible" : ""}`} aria-label="Primary navigation">{navItems.map(([label, href]) => <Link key={label} href={href} className="nav-link" onClick={() => { setMobileOpen(false); if (sound.enabled) playTone("tap"); }}>{label}</Link>)}</nav><div className="header-actions"><ThemeToggle theme={theme} change={change}/><button className="icon-button sound-button" onClick={sound.toggle} aria-label={sound.enabled ? "Mute interface sounds" : "Enable interface sounds"} aria-pressed={sound.enabled}><span className={`sound-bars ${sound.enabled ? "on" : ""}`}><i/><i/><i/></span></button><button className="mobile-menu-button" onClick={() => setMobileOpen(value => !value)} aria-expanded={mobileOpen} aria-label="Toggle navigation">{mobileOpen ? <X size={20}/> : <List size={20}/>}</button></div></header>
    <main id="top"><section className="hero section-pad"><div className="hero-copy"><Reveal><p className="eyebrow"><span className="status-dot"/> CSIT undergraduate · ML &amp; Data Science</p></Reveal><Reveal delay={.08}><h1>I build practical machine learning projects and data-driven tools.</h1></Reveal><Reveal delay={.16}><p className="hero-description">I work mainly with Python, scikit learn, pandas, NumPy, and Streamlit while building a stronger foundation in machine learning.</p></Reveal><Reveal delay={.24}><div className="hero-actions"><a className="button button-primary" href="#work" onClick={() => sound.enabled && playTone("success")}>See the work <ArrowDown size={17}/></a><button className="text-button" onClick={copyEmail}>{copied ? "Email copied" : "Copy email"} <PaperPlaneTilt size={16}/></button></div></Reveal><Reveal delay={.32}><div className="proof-row"><span>7 projects</span><span>Python + ML focus</span><span>Open to internships</span></div></Reveal></div><Reveal className="hero-art" delay={.18}><HeroTerminal soundEnabled={sound.enabled}/><p className="hero-note">Try <b>help</b>, <b>projects</b>, <b>skills</b>, or <b>about</b> — the terminal is interactive.</p></Reveal></section>
      <Reveal className="tagline-wrap section-pad"><div className="tagline"><span className="eyebrow">The point of this portfolio</span><p>Show the work, the reasoning behind it, and what I am learning next.</p></div></Reveal>
      <section id="work" className="section-pad section-block"><Reveal className="section-heading"><div><p className="eyebrow">Selected work</p><h2>Projects with a purpose.</h2></div><p>Small enough to explain. Real enough to show how I work.</p></Reveal><div className="work-layout"><div className="project-list">{projects.map((item, index) => <motion.button key={item.number} className={`project-row ${activeProject === index ? "active" : ""}`} onMouseEnter={() => setActiveProject(index)} onFocus={() => setActiveProject(index)} onClick={() => { setActiveProject(index); if (sound.enabled) playTone("tap"); }} whileTap={{ scale: .985 }}><span className="project-number">{item.number}</span><span className="project-name"><strong>{item.title}</strong><small>{item.type}</small></span><ArrowUpRight className="project-arrow" size={17}/></motion.button>)}</div><article className="project-detail surface"><div><div className="detail-top"><span className="eyebrow">{project.type}</span><span>{project.number}</span></div><h3>{project.title}</h3><p>{project.description}</p><div className="stack-row">{project.stack.map(item => <span key={item}>{item}</span>)}</div></div><div className="detail-actions"><a className="button button-primary" href={project.href} target="_blank" rel="noreferrer">Open project <ArrowUpRight size={16}/></a><a className="button button-secondary" href={project.repo} target="_blank" rel="noreferrer"><GithubLogo size={17}/> Source</a></div></article></div></section>
      <section id="about" className="section-pad section-block"><Reveal className="section-heading"><div><p className="eyebrow">About</p><h2>Curious, practical, still learning.</h2></div><p>I like projects that turn concepts into something someone can click, test, or understand.</p></Reveal><div className="about-grid"><div className="about-copy"><p>I am a CSIT undergraduate focused on Python, machine learning, data analysis, and practical web development.</p><p>The portfolio is intentionally honest: visible work, visible learning, and steady improvement.</p><div className="about-facts"><span><Briefcase size={17}/> Open to internships</span><span><Code size={17}/> Python + ML</span><span><Sparkle size={17}/> Learning by building</span></div></div><ContributionCard/></div></section>
      <section id="journey" className="section-pad section-block"><Reveal className="section-heading"><div><p className="eyebrow">Journey</p><h2>From fundamentals to systems.</h2></div><p>Understand the basics, build projects, then make the projects better.</p></Reveal><div className="journey-grid">{[["01","Python foundations","Core syntax, OOP, files, data structures"],["02","ML experiments","Regression, classification, evaluation"],["03","Interactive apps","Turning models into usable Streamlit tools"],["04","Better engineering","Responsive UI, deployment, accessibility"]].map(([number,title,description]) => <Reveal key={number}><article className="journey-item"><span>{number}</span><h3>{title}</h3><p>{description}</p></article></Reveal>)}</div></section>
      <section id="skills" className="section-pad section-block"><Reveal className="section-heading"><div><p className="eyebrow">Skills</p><h2>The current toolkit.</h2></div><p>Tools I use today and continue improving through projects.</p></Reveal><div className="skills-grid">{skills.map(([title,description],index) => <motion.article key={title} className="skill-card surface" whileHover={{ y:-4 }}><span className="skill-index">0{index+1}</span><strong>{title}</strong><span>{description}</span></motion.article>)}</div></section>
      <section id="contact" className="section-pad section-block"><Reveal><div className="surface contact-card"><div><p className="eyebrow">Contact</p><h2>Let’s build something useful.</h2><p>If you are looking for an intern, collaborator, or someone who enjoys learning by building, I would love to hear from you.</p></div><div className="contact-actions"><button className="button button-primary" onClick={copyEmail}>{copied ? "Email copied" : "Copy email"} <PaperPlaneTilt size={17}/></button><a className="button button-secondary" href="https://www.linkedin.com" target="_blank" rel="noreferrer"><LinkedinLogo size={17}/> LinkedIn</a><a className="button button-secondary" href="https://github.com/SohailKhan0525" target="_blank" rel="noreferrer"><GithubLogo size={17}/> GitHub</a></div></div></Reveal></section>
    </main><footer className="site-footer section-pad"><span>© 2026 Mohd Zaheer Uddin</span><span>Python mindset · shipped on Vercel</span></footer>
  </div>;
}
