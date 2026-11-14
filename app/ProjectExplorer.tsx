"use client";

import { ArrowLeft, ArrowRight, ArrowUpRight, GithubLogo } from "@phosphor-icons/react";
import { Flip } from "gsap/Flip";
import { useLayoutEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "./gsap";
import { usePortfolioMotion } from "./MotionPreferences";
import ProjectIllustration from "./ProjectIllustration";
import "./project-explorer.css";

gsap.registerPlugin(Flip);

type Project = readonly [number: string, title: string, category: string, description: string,
  stack: readonly string[], appUrl: string, sourceUrl: string];
type Filter = "all" | "ml" | "python";
const filters: readonly { id: Filter; label: string }[] = [
  { id: "all", label: "All work" }, { id: "ml", label: "Machine learning" }, { id: "python", label: "Python apps" },
];

export function matchesProjectFilter(project: Project, filter: Filter) {
  const application = project[2] === "Python app" || project[2] === "Python CLI";
  return filter === "all" || (filter === "python" ? application : !application);
}

type ExplorerProps = {
  projects: readonly Project[];
  launchRequest?: { id: string; serial: number } | null;
};

export default function ProjectExplorer({ projects, launchRequest }: ExplorerProps) {
  const scope = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLUListElement>(null);
  const flipState = useRef<ReturnType<typeof Flip.getState> | null>(null);
  const { reduced, ready } = usePortfolioMotion();
  const [selection, setSelection] = useState({ filter: "all" as Filter, id: projects[0]?.[0], direction: 1 });
  const [appliedLaunch, setAppliedLaunch] = useState<number | null>(null);
  const visible = projects.filter(project => matchesProjectFilter(project, selection.filter));
  const selected = visible.find(project => project[0] === selection.id) ?? visible[0];
  const index = selected ? projects.indexOf(selected) : -1;
  const visibleIndex = selected ? visible.indexOf(selected) : -1;

  // Apply each visit before committing. The scroll destination and its links
  // then describe the requested study even when a previous filter excluded it.
  if (launchRequest && launchRequest.serial !== appliedLaunch) {
    setAppliedLaunch(launchRequest.serial);
    const nextIndex = projects.findIndex(project => project[0] === launchRequest.id);
    const next = projects[nextIndex];
    if (next && next[0] !== selected?.[0]) {
      setSelection({
        id: next[0],
        filter: matchesProjectFilter(next, selection.filter) ? selection.filter : "all",
        direction: nextIndex < index ? -1 : 1,
      });
    }
  }

  useLayoutEffect(() => {
    const rail = railRef.current;
    if (!rail || rail.scrollWidth <= rail.clientWidth) return;
    const button = rail.querySelector<HTMLButtonElement>('button[aria-pressed="true"]');
    if (!button) return;
    const bounds = rail.getBoundingClientRect();
    const buttonBounds = button.getBoundingClientRect();
    if (buttonBounds.left < bounds.left || buttonBounds.right > bounds.right) {
      rail.scrollLeft += buttonBounds.left - bounds.left;
    }
  }, [selected?.[0], selection.filter, appliedLaunch]);

  useGSAP(() => {
    if (!ready || reduced || !scope.current) return;
    gsap.fromTo(".project-explorer-detail", { y: 32 }, {
      y: 0, duration: 0.9, ease: "power3.out", clearProps: "transform",
      scrollTrigger: { trigger: scope.current, start: "top 88%", once: true },
    });
    gsap.fromTo(".project-explorer-toolbar-rule", { scaleX: 0 }, {
      scaleX: 1, duration: 1, ease: "power3.inOut",
      scrollTrigger: { trigger: scope.current, start: "top 90%", once: true },
    });
  }, { scope, dependencies: [ready, reduced], revertOnUpdate: true });

  useGSAP(() => {
    if (!scope.current || !ready) return;
    if (flipState.current && !reduced) {
      Flip.from(flipState.current, {
        duration: 0.55, ease: "power3.inOut", scale: false, nested: true,
        onEnter: elements => gsap.fromTo(elements, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, clearProps: "opacity,transform" }),
        onComplete: () => ScrollTrigger.refresh(),
      });
    }
    flipState.current = null;
    if (reduced) return;
    const detail = scope.current.querySelector<HTMLElement>(".project-explorer-detail");
    const belowFold = detail && detail.getBoundingClientRect().top >= window.innerHeight;
    const timeline = gsap.timeline({ defaults: { ease: "power3.out" },
      scrollTrigger: belowFold ? { trigger: detail, start: "top 88%", once: true } : undefined,
    });
    timeline.fromTo(".project-explorer-summary > *", { y: 22, opacity: 0.3 }, {
      y: 0, opacity: 1, duration: 0.6, stagger: 0.055, clearProps: "transform,opacity",
    }, 0)
      .fromTo(".project-explorer-large-number > span", { yPercent: selection.direction * 105 }, {
        yPercent: 0, duration: 0.7, clearProps: "transform",
      }, 0)
      .fromTo(".project-explorer-illustration", { x: selection.direction * 28, opacity: 0.3 }, {
        x: 0, opacity: 1, duration: 0.7, clearProps: "transform,opacity",
      }, 0.05);
  }, { scope, dependencies: [selected?.[0], selection.filter, selection.direction, ready, reduced], revertOnUpdate: true });

  function chooseFilter(filter: Filter) {
    if (filter === selection.filter) return;
    if (!reduced && scope.current) {
      const rows = scope.current.querySelectorAll(".project-explorer-choice");
      Flip.killFlipsOf(rows, true);
      flipState.current = Flip.getState(rows);
    }
    const matching = projects.filter(project => matchesProjectFilter(project, filter));
    const next = matching.find(project => project[0] === selection.id) ?? matching[0];
    setSelection({ filter, id: next?.[0], direction: next && projects.indexOf(next) < index ? -1 : 1 });
  }

  function chooseProject(project: Project) {
    if (project[0] === selection.id) return;
    setSelection(current => ({ ...current, id: project[0], direction: projects.indexOf(project) < index ? -1 : 1 }));
  }

  function stepProject(direction: number) {
    const next = visible[visibleIndex + direction];
    if (next) chooseProject(next);
  }

  return <div ref={scope} className="project-explorer" data-reduced={reduced}>
    <div className="project-explorer-toolbar">
      <div className="project-explorer-filters" role="group" aria-label="Filter projects">
        {filters.map(filter => <button key={filter.id} type="button" data-sound
          className="project-explorer-filter" aria-pressed={selection.filter === filter.id}
          aria-controls="project-options" onClick={() => chooseFilter(filter.id)}>
          {filter.label}<span>{projects.filter(project => matchesProjectFilter(project, filter.id)).length}</span>
        </button>)}
      </div>
      <p className="project-explorer-count">Index / {String(visible.length).padStart(2, "0")}</p>
      <span className="project-explorer-toolbar-rule" aria-hidden="true" />
    </div>

    {selected ? <div className="project-explorer-layout">
      <div className="project-explorer-index">
        <p className="project-explorer-hint">Browse the studies <ArrowRight size={16} aria-hidden="true" /></p>
        <ul ref={railRef} className="project-explorer-list" id="project-options" aria-label="Select a project">
          {projects.map(project => <li key={project[0]} className="project-explorer-choice"
            data-flip-id={`project-${project[0]}`} hidden={!matchesProjectFilter(project, selection.filter)}>
            <button type="button" className="project-explorer-option" data-sound
              data-project-choice={project[0]} aria-pressed={selected[0] === project[0]}
              aria-controls="project-detail" onClick={() => chooseProject(project)}>
              <span className="project-explorer-number" aria-hidden="true">{project[0]}</span>
              <span className="project-explorer-name"><strong>{project[1]}</strong><small>{project[2]}</small></span>
              <ArrowUpRight className="project-explorer-arrow" size={18} aria-hidden="true" />
            </button>
          </li>)}
        </ul>
        <div className="project-explorer-pagination">
          <span>{String(visibleIndex + 1).padStart(2, "0")} <span aria-hidden="true">/</span> {String(visible.length).padStart(2, "0")}</span>
          <div>
            <button type="button" onClick={() => stepProject(-1)} disabled={visibleIndex === 0} aria-label="Previous project"><ArrowLeft size={19} /></button>
            <button type="button" onClick={() => stepProject(1)} disabled={visibleIndex === visible.length - 1} aria-label="Next project"><ArrowRight size={19} /></button>
          </div>
        </div>
      </div>

      <article id="project-detail" className="project-explorer-detail" aria-labelledby="selected-project-title" tabIndex={-1}>
        <div className="project-explorer-study-header"><span>Project study</span><span>Python / applied learning</span></div>
        <div className="project-explorer-large-number" aria-hidden="true"><span>{selected[0]}</span></div>
        <div className="project-explorer-content" data-direction={selection.direction}>
          <div className="project-explorer-summary">
            <div className="project-explorer-meta"><span>{selected[2]}</span><span>{selected[0]} — {String(projects.length).padStart(2, "0")}</span></div>
            <h3 id="selected-project-title">{selected[1]}</h3>
            <p className="project-explorer-description">{selected[3]}</p>
            <ul className="project-explorer-stack" aria-label="Technologies">{selected[4].map(technology => <li key={technology}>{technology}</li>)}</ul>
          </div>
          <figure className="project-explorer-illustration">
            <ProjectIllustration index={index} />
            <figcaption>Concept study · {selected[2]}</figcaption>
          </figure>
        </div>
        {/* The links change with React state immediately; animations never leave stale targets behind. */}
        <div className="project-explorer-actions">
          <a className="project-explorer-link project-explorer-link-primary" data-sound href={selected[5]} target="_blank" rel="noreferrer">Open project <ArrowUpRight size={20} aria-hidden="true" /></a>
          <a className="project-explorer-link project-explorer-link-source" data-sound href={selected[6]} target="_blank" rel="noreferrer"><GithubLogo size={18} aria-hidden="true" /> Source</a>
        </div>
      </article>
    </div> : <p className="project-explorer-empty">No projects in this category yet.</p>}
    <p className="project-explorer-announcement" role="status" aria-atomic="true">{selected ? `Showing ${selected[1]}` : "No projects in this category yet."}</p>
  </div>;
}
