"use client";

import { ArrowRight, ArrowUpRight, GithubLogo } from "@phosphor-icons/react";
import { LayoutGroup, motion, useAnimationControls, useInView } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { usePortfolioMotion } from "./MotionPreferences";
import ProjectIllustration from "./ProjectIllustration";
import "./project-explorer.css";

type Project = readonly [
  number: string,
  title: string,
  category: string,
  description: string,
  stack: readonly string[],
  appUrl: string,
  sourceUrl: string,
];

type Filter = "all" | "ml" | "python";
const filters: readonly { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "ml", label: "Machine learning" },
  { id: "python", label: "Python apps" },
];

function matchesFilter(project: Project, filter: Filter) {
  const isPythonApp = project[2] === "Python app" || project[2] === "Python CLI";
  return filter === "all" || (filter === "python" ? isPythonApp : !isPythonApp);
}

const ease = [0.22, 1, 0.36, 1] as const;
const settle = { type: "spring" as const, stiffness: 360, damping: 34, mass: 0.8 };

function ProjectChoice({ project, active, index, reduced, onSelect }: {
  project: Project;
  active: boolean;
  index: number;
  reduced: boolean;
  onSelect: () => void;
}) {
  const row = useRef<HTMLLIElement>(null);
  // Observe a stationary wrapper. Horizontal phone choices arrive only when
  // actually uncovered, not while they are still outside the scroller.
  const inView = useInView(row, { once: true, amount: 0.25 });
  return <li ref={row}>
    <motion.div className="project-explorer-row-arrival" initial={false}
      animate={reduced || !inView ? { opacity: 1, y: 0 } : { opacity: [0.65, 1], y: [14, 0] }}
      transition={{ type: "tween", duration: reduced ? 0 : 0.5, delay: reduced ? 0 : Math.min(index * 0.045, 0.18), ease }}>
      <motion.button type="button" className="project-explorer-option" data-sound
        aria-pressed={active} aria-controls="project-detail" onClick={onSelect}
        whileTap={reduced ? undefined : { scale: 0.985 }} transition={settle}>
        {active && <motion.span className="project-explorer-selection" aria-hidden="true"
          layoutId={reduced ? undefined : "selected-project"} transition={reduced ? { duration: 0 } : settle} />}
        <span className="project-explorer-number" aria-hidden="true">{project[0]}</span>
        <span className="project-explorer-name"><strong>{project[1]}</strong><small>{project[2]}</small></span>
        <ArrowRight className="project-explorer-arrow" size={18} aria-hidden="true" />
      </motion.button>
    </motion.div>
  </li>;
}

export default function ProjectExplorer({ projects }: { projects: readonly Project[] }) {
  const { reduced } = usePortfolioMotion();
  const layoutId = useId();
  const [selection, setSelection] = useState({ filter: "all" as Filter, id: projects[0]?.[0], direction: 1 });
  const visibleProjects = projects.filter(project => matchesFilter(project, selection.filter));
  const selected = visibleProjects.find(project => project[0] === selection.id) ?? visibleProjects[0];
  const selectedIndex = projects.findIndex(project => project === selected);
  const stage = useAnimationControls();

  useEffect(() => {
    // Set the visible state immediately, then replace pending child tweens with
    // zero-duration ones if reduced motion changes during a stagger.
    if (reduced) {
      stage.set("static");
      void stage.start("static", { duration: 0, delay: 0 });
    } else void stage.start("present");
    return () => stage.stop();
  }, [stage, selected?.[0], reduced]);

  function chooseFilter(filter: Filter) {
    setSelection(current => {
      const matching = projects.filter(project => matchesFilter(project, filter));
      const id = matching.find(project => project[0] === current.id)?.[0] ?? matching[0]?.[0];
      return { filter, id, direction: projects.findIndex(project => project[0] === id) >= projects.findIndex(project => project[0] === current.id) ? 1 : -1 };
    });
  }

  function chooseProject(project: Project) {
    setSelection(current => ({ ...current, id: project[0], direction: projects.indexOf(project) >= projects.findIndex(item => item[0] === current.id) ? 1 : -1 }));
  }

  const summaryMotion = {
    static: { opacity: 1, x: 0, y: 0, transition: { duration: 0 } },
    enter: { opacity: 0.65, x: selection.direction * 16, y: 8 },
    present: { opacity: 1, x: 0, y: 0, transition: { type: "tween" as const, duration: reduced ? 0 : 0.48, ease } },
  };

  return (
    <LayoutGroup id={layoutId}><div className="project-explorer" data-reduced={reduced}>
      <div className="project-explorer-toolbar">
        <div className="project-explorer-filters" role="group" aria-label="Filter projects">
          {filters.map(filter => (
            <button
              key={filter.id}
              type="button"
              data-sound
              className="project-explorer-filter"
              aria-pressed={selection.filter === filter.id}
              aria-controls="project-options"
              onClick={() => chooseFilter(filter.id)}
            >
              {selection.filter === filter.id && <motion.span aria-hidden="true" className="project-explorer-filter-indicator"
                layoutId={reduced ? undefined : "project-filter"} transition={reduced ? { duration: 0 } : settle} />}
              {filter.label}<span>{projects.filter(project => matchesFilter(project, filter.id)).length}</span>
            </button>
          ))}
        </div>
        <p className="project-explorer-count">{visibleProjects.length} {visibleProjects.length === 1 ? "project" : "projects"}</p>
      </div>

      {selected ? (
        <div className="project-explorer-layout">
          <div className="project-explorer-index">
            <p className="project-explorer-hint" id="project-browse-hint">Swipe to browse · tap to select <ArrowRight size={16} aria-hidden="true" /></p>
            <motion.ul layoutScroll className="project-explorer-list" id="project-options" key={selection.filter} aria-label="Select a project">
              {visibleProjects.map((project, index) => <ProjectChoice key={project[0]} project={project}
                active={selected[0] === project[0]} index={index} reduced={reduced} onSelect={() => chooseProject(project)} />)}
            </motion.ul>
          </div>

          <article id="project-detail" className="project-explorer-detail" aria-labelledby="selected-project-title">
            <motion.div
              key={selected[0]}
              className="project-explorer-content"
              data-direction={selection.direction}
              initial={reduced ? false : "enter"}
              animate={stage}
              variants={{ static: { transition: { delayChildren: 0, staggerChildren: 0 } }, present: { transition: { delayChildren: 0, staggerChildren: reduced ? 0 : 0.055 } } }}
            >
              <div className="project-explorer-summary">
                <motion.div variants={summaryMotion} className="project-explorer-meta"><span>{selected[2]}</span><span>{selected[0]} / {String(projects.length).padStart(2, "0")}</span></motion.div>
                <motion.h3 variants={summaryMotion} id="selected-project-title">{selected[1]}</motion.h3>
                <motion.p variants={summaryMotion} className="project-explorer-description">{selected[3]}</motion.p>
                <motion.ul variants={summaryMotion} className="project-explorer-stack" aria-label="Technologies">{selected[4].map(technology => <li key={technology}>{technology}</li>)}</motion.ul>
              </div>
              <motion.figure className="project-explorer-illustration"
                variants={{ static: { opacity: 1, x: 0, scale: 1, transition: { duration: 0 } }, enter: { opacity: 0.5, x: selection.direction * 20, scale: 0.97 },
                  present: { opacity: 1, x: 0, scale: 1, transition: { type: "tween", duration: reduced ? 0 : 0.6, ease } } }}>
                <ProjectIllustration index={selectedIndex} />
                <figcaption>Concept study · {selected[2]}</figcaption>
              </motion.figure>
            </motion.div>
              {/* Links update in the same render as selection and never exit.
                  There is only one live project; rapid taps cannot open stale work. */}
              <div className="project-explorer-actions">
                <motion.a
                  className="project-explorer-link project-explorer-link-primary"
                  data-sound href={selected[5]} target="_blank" rel="noreferrer"
                  whileTap={reduced ? undefined : { scale: 0.98 }}
                >Open project <ArrowUpRight size={17} aria-hidden="true" /></motion.a>
                <motion.a
                  className="project-explorer-link project-explorer-link-source"
                  data-sound href={selected[6]} target="_blank" rel="noreferrer"
                  whileTap={reduced ? undefined : { scale: 0.98 }}
                ><GithubLogo size={18} aria-hidden="true" /> Source</motion.a>
              </div>
          </article>
        </div>
      ) : <p className="project-explorer-empty">No projects in this category yet.</p>}
      <p className="project-explorer-announcement" role="status" aria-atomic="true">{selected ? `Showing ${selected[1]}` : "No projects in this category yet."}</p>
    </div></LayoutGroup>
  );
}
