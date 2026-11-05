"use client";

import { ArrowRight, ArrowUpRight, GithubLogo } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { useState } from "react";
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

export default function ProjectExplorer({ projects }: { projects: readonly Project[] }) {
  const { reduced } = usePortfolioMotion();
  const [selection, setSelection] = useState({ filter: "all" as Filter, id: projects[0]?.[0] });
  const visibleProjects = projects.filter(project => matchesFilter(project, selection.filter));
  const selected = visibleProjects.find(project => project[0] === selection.id) ?? visibleProjects[0];
  const selectedIndex = projects.findIndex(project => project === selected);

  function chooseFilter(filter: Filter) {
    setSelection(current => {
      const matching = projects.filter(project => matchesFilter(project, filter));
      return { filter, id: matching.find(project => project[0] === current.id)?.[0] ?? matching[0]?.[0] };
    });
  }

  return (
    <div className="project-explorer">
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
            <ul className="project-explorer-list" id="project-options" key={selection.filter} aria-label="Select a project">
              {visibleProjects.map(project => (
                <li key={project[0]}>
                  <button
                    type="button"
                    className="project-explorer-option"
                    data-sound
                    aria-pressed={selected[0] === project[0]}
                    aria-controls="project-detail"
                    onClick={() => setSelection(current => ({ ...current, id: project[0] }))}
                  >
                    <span className="project-explorer-number" aria-hidden="true">{project[0]}</span>
                    <span className="project-explorer-name"><strong>{project[1]}</strong><small>{project[2]}</small></span>
                    <ArrowRight className="project-explorer-arrow" size={18} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <article id="project-detail" className="project-explorer-detail" aria-labelledby="selected-project-title">
            <motion.div
              key={selected[0]}
              className="project-explorer-content"
              initial={reduced ? false : { opacity: 0.65, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "tween", duration: reduced ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="project-explorer-meta"><span>{selected[2]}</span><span>{selected[0]} / {String(projects.length).padStart(2, "0")}</span></div>
              <h3 id="selected-project-title">{selected[1]}</h3>
              <p className="project-explorer-description">{selected[3]}</p>
              <ul className="project-explorer-stack" aria-label="Technologies">{selected[4].map(technology => <li key={technology}>{technology}</li>)}</ul>
              <figure className="project-explorer-illustration">
                <ProjectIllustration index={selectedIndex} />
                <figcaption>Concept study · {selected[2]}</figcaption>
              </figure>
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
            </motion.div>
          </article>
        </div>
      ) : <p className="project-explorer-empty">No projects in this category yet.</p>}
      <p className="project-explorer-announcement" role="status" aria-atomic="true">{selected ? `Showing ${selected[1]}` : "No projects in this category yet."}</p>
    </div>
  );
}
