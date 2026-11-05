"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import LiveStats from "./LiveStats";
import ProjectDisclosures from "./ProjectDisclosures";
import DataInstrument from "./DataInstrument";
import ProjectExplorer from "./ProjectExplorer";
import LearningJourney from "./LearningJourney";
import PortfolioHeader from "./PortfolioHeader";
import RobotCompanion from "./RobotCompanion";
import UnderpageFooter from "./UnderpageFooter";
import { scrollToPortfolioSection } from "./portfolio-scroll";
import { usePortfolioMotion } from "./MotionPreferences";
import { AnimatedHeading, AnimatedMetric, CopyLabel, MotionButton, MotionLink, MotionSection, Reveal, SectionHeading } from "./MotionElements";
import { ArrowDown, ArrowUpRight, Briefcase, Check, Code, GithubLogo, LinkedinLogo, PaperPlaneTilt, Sparkle } from "@phosphor-icons/react";

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
    <Reveal className="surface activity-card" sequence variant="panel">
      <div className="activity-head">
        <div>

          <h3>{loading ? "Loading activity…" : failed ? "GitHub activity unavailable" : `${total} contributions`}</h3>
          <p>Public contribution activity from the last 12 months.</p>
        </div>
        <MotionLink className="button button-secondary" data-sound href="https://github.com/SohailKhan0525" target="_blank" rel="noreferrer"><GithubLogo size={17} /> GitHub <ArrowUpRight size={15} /></MotionLink>
      </div>
      <div className="activity-stats">
        <div><strong>{loading || failed ? "–" : <AnimatedMetric value={total} />}</strong><span>Contributions</span></div>
        <div><strong>{loading || failed ? "–" : <AnimatedMetric value={active} />}</strong><span>Active days</span></div>
        <div><strong>{loading || failed ? "–" : <AnimatedMetric value={streak} />}</strong><span>Current streak</span></div>
      </div>
      {!failed && <><div className="contribution-grid" aria-label="GitHub contribution activity">
        {days.slice(-182).map(day => <span key={day.date} className={`level-${day.level}`} title={`${day.count} contributions · ${day.date}`} />)}
      </div>
      <div className="activity-legend"><span>Less</span>{[0, 1, 2, 3, 4].map(level => <i key={level} className={`level-${level}`} />)}<span>More</span></div></>}
    </Reveal>
  );
}

function Terminal() {
  const { reduced } = usePortfolioMotion();
  const commands = ["help", "about", "projects", "ai", "skills", "contact", "clear"];
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>(["$ whoami", "Mohd Zaheer Uddin", "CSIT undergraduate, ML & Data Science", "building practical Python + ML projects."]);
  const [index, setIndex] = useState(-1);
  const [ready, setReady] = useState(false);
  const [bootLines, setBootLines] = useState(0);
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
          ? [...aiEra.map(a => `${a.name} — ${a.status}`), "scroll to \"Building with AI\" section for the full story"]
          : cmd === "skills"
          ? ["Python · scikit learn · pandas · NumPy", "Streamlit · Git/GitHub · HTML/CSS/JS"]
          : cmd === "contact"
            ? ["Opening contact section…"]
            : [`command not found: ${cmd}`, `type "help" to see available commands`];

  const runCommand = (value: string) => {
    const cmd = value.trim().toLowerCase();
    if (!cmd || !ready) return;
    requestClickSound();
    if (cmd === "clear") {
      setHistory([]);
      setInput("");
      setIndex(-1);
      return;
    }
    setHistory(h => [...h, `$ ${value.trim()}`, ...output(cmd)].slice(-100));
    setInput("");
    setIndex(-1);
    if (cmd === "contact") scrollToPortfolioSection("contact");
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    runCommand(input);
  };

  const key = (e: KeyboardEvent<HTMLInputElement>) => {
    const items = history.filter(x => x.startsWith("$ ")).map(x => x.slice(2));
    if (e.key === "Tab" && !e.shiftKey && input.trim()) {
      const match = commands.find(c => c.startsWith(input.trim().toLowerCase()) && c !== input.trim().toLowerCase());
      if (match) { e.preventDefault(); setInput(match); }
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

  return (
    <div className="hero-terminal-real" dir="ltr">
      <div className="terminal-top"><div className="terminal-top-left"><span className="terminal-tab">portfolio.py</span><span className="terminal-title">zsh: portfolio</span></div><span className="terminal-status"><i /> {ready ? "ready" : "booting"}</span></div>
      <div className="terminal-screen">
        <div className="terminal-boot" aria-live="polite"><AnimatePresence initial={false}>{bootLines >= 1 && <motion.div key="boot-command" initial={reduced ? false : { opacity: 0.6, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}><b>portfolio@zaheer</b>:~$ ./start.sh</motion.div>}{bootLines >= 2 && <motion.div key="boot-status" initial={reduced ? false : { opacity: 0.6, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}><span>{ready ? "profile loaded. terminal ready." : "loading profile…"}</span></motion.div>}</AnimatePresence></div>
        <div ref={historyRef} className="terminal-history" aria-live="polite" aria-label="Terminal output"><AnimatePresence initial={false} mode="popLayout">{history.slice(-14).map((line, i) => <motion.div key={`${line}-${i}`} initial={reduced ? false : { opacity: 0.6, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: reduced ? 0 : 0.15 }} className={`terminal-line ${line.startsWith("$ ") ? "terminal-command" : "terminal-output-line"}`}>{line}</motion.div>)}</AnimatePresence></div>
        <form className="terminal-form" dir="ltr" onSubmit={submit}><span className="terminal-prompt" aria-hidden="true">$</span><input className="terminal-input" type="text" dir="ltr" value={input} onChange={e => setInput(e.target.value)} onKeyDown={key} disabled={!ready} placeholder={ready ? "type a command…" : "booting…"} aria-label="Terminal command" autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} /><MotionButton type="submit" className="terminal-submit" aria-label="Run command" disabled={!ready || !input.trim()}><ArrowUpRight size={18} aria-hidden="true" /></MotionButton></form>
        <div className="terminal-help"><span>↑↓ history / Tab complete / Enter run</span><div className="terminal-quick" aria-label="Quick terminal commands">{["help", "projects", "ai", "skills", "about"].map(cmd => <MotionButton key={cmd} type="button" className="terminal-chip" disabled={!ready} aria-label={`Run ${cmd} command`} onClick={() => runCommand(cmd)}>{cmd}</MotionButton>)}</div></div>
      </div>
      <div className="terminal-bottom"><span>Portfolio shell v1.1</span><span>Type or tap a command</span></div>
    </div>
  );
}

export default function Home() {
  const [copied, setCopied] = useState(false);
  const email = "sohailkhannnn.0525@gmail.com";
  const linkedin = "https://www.linkedin.com/in/mohd-zaheer-uddin-166b3b356/";

  const copyEmail = async () => {
    requestClickSound();
    try { await navigator.clipboard.writeText(email); setCopied(true); setTimeout(() => setCopied(false), 1500); }
    catch { window.location.href = `mailto:${email}`; }
  };

  return (
    <div className="site-shell">
      <RobotCompanion />
      <div className="portfolio-foreground">
      <PortfolioHeader />
      <a className="skip-link" href="#top">Skip to content</a><main id="top" tabIndex={-1}>
        <MotionSection id="intro" className="hero hero-with-companion section-pad"><div className="hero-copy"><AnimatedHeading>I build Python apps and machine learning projects.</AnimatedHeading><Reveal delay={0.16}><p className="hero-description">I’m a CSIT undergraduate learning through datasets, models, and working apps.</p></Reveal><Reveal delay={0.24}><div className="hero-actions"><MotionLink className="button button-primary" data-sound href="#work">See the work <ArrowDown size={17} /></MotionLink><MotionButton className="text-button" data-sound type="button" onClick={copyEmail}><CopyLabel copied={copied}>{copied ? "Email copied" : "Copy email"} {copied ? <Check size={16} /> : <PaperPlaneTilt size={16} />}</CopyLabel></MotionButton></div></Reveal><Reveal delay={0.32}><div className="proof-row"><span>7 projects</span><span>Python + ML focus</span><span>Open to internships</span></div></Reveal><DataInstrument /></div><Reveal className="hero-art" delay={0.16} variant="panel"><Terminal /><p className="hero-note">Try <b>help</b>, <b>projects</b>, <b>skills</b>, or <b>about</b>.</p></Reveal></MotionSection>
        <MotionSection id="work" className="section-pad section-block"><SectionHeading title="Selected projects">Select a project to see the app and its source code.</SectionHeading><ProjectExplorer projects={projects} /></MotionSection>
        <MotionSection id="ai-era" className="section-pad section-block ai-era"><SectionHeading title="Building with AI">I use AI coding agents while learning the fundamentals. I write the specs, choose the architecture, and review the code. These are the products I’m working on.</SectionHeading><ProjectDisclosures items={aiEra} /></MotionSection>
        <MotionSection id="about" className="section-pad section-block"><SectionHeading title="About me" /><div className="about-grid"><Reveal className="about-copy" sequence><p>I am a CSIT undergraduate focused on Python, machine learning, data analysis, and practical web development.</p><div className="about-facts"><span><Briefcase size={17} /> Open to internships</span><span><Code size={17} /> Python + ML</span><span><Sparkle size={17} /> Learning by building</span></div></Reveal><Contributions /></div></MotionSection>
        <MotionSection id="journey" className="section-pad section-block"><SectionHeading title="What I’m learning">From Python fundamentals to models, apps, and deployment.</SectionHeading><LearningJourney /></MotionSection>
        <MotionSection id="skills" className="section-pad section-block"><SectionHeading title="Tools I use">The languages and libraries behind these projects.</SectionHeading><div className="skills-grid">{skills.map(([name, desc], i) => <Reveal key={name} delay={i * 0.045} variant="slide"><article className="skill-card surface"><span className="skill-index">0{i + 1}</span><strong>{name}</strong><span>{desc}</span></article></Reveal>)}</div></MotionSection>
        <MotionSection id="contact" className="section-pad section-block"><div className="surface contact-card"><Reveal variant="panel"><h2>Get in touch</h2><p>I’m open to internships and collaborations. Email me or connect on LinkedIn.</p></Reveal><Reveal className="contact-actions" sequence><MotionLink className="contact-email" href={`mailto:${email}`}>{email}</MotionLink><MotionButton className="button button-primary" data-sound type="button" onClick={copyEmail}><CopyLabel copied={copied}>{copied ? "Email copied" : "Copy email"} {copied ? <Check size={17} /> : <PaperPlaneTilt size={17} />}</CopyLabel></MotionButton><MotionLink className="button button-secondary" data-sound href={linkedin} target="_blank" rel="noreferrer"><LinkedinLogo size={17} /> LinkedIn</MotionLink><MotionLink className="button button-secondary" data-sound href="https://github.com/SohailKhan0525" target="_blank" rel="noreferrer"><GithubLogo size={17} /> GitHub</MotionLink></Reveal></div></MotionSection>
      </main>

      <LiveStats />

      </div>
      <UnderpageFooter linkedin={linkedin} />
    </div>
  );
}
