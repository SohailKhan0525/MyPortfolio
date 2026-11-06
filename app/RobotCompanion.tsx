"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap, useGSAP } from "./gsap";
import { usePortfolioMotion } from "./MotionPreferences";
import "./robot-companion.css";

const directory = "/models/minty-gsap/";
const expressions = ["smile", "neutral", "cry", "angry", "sleepy", "dizzy", "confused", "blink-half", "blink-closed", "look-left", "look-right"] as const;
type Expression = typeof expressions[number];
type Behavior = "look" | "wave" | "tilt" | "smile" | "cry" | "angry" | "sleepy" | "spin" | "stumble";
const actions: readonly Behavior[] = ["look", "look", "wave", "tilt", "smile", "cry", "angry", "sleepy", "spin", "stumble"];

/** The original sculpture, rendered once into transparent shoulder/head layers.
 * GSAP is the only runtime animator; no canvas, WebGL, video or image animation.
 * The body portal keeps Minty fixed outside section transforms and clipping.
 */
export default function RobotCompanion() {
  const { ready, reduced } = usePortfolioMotion();
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [pageVisible, setPageVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const stage = useRef<HTMLElement>(null);
  const master = useRef<gsap.core.Timeline | null>(null);
  const ambient = useRef<gsap.core.Timeline | null>(null);
  const turnReady = useRef(false);
  const active = ready && loaded && !reduced && pageVisible && !menuOpen && !failed;

  useEffect(() => {
    setHost(document.body);
    const visibility = () => setPageVisible(!document.hidden);
    const menu = (event: Event) => setMenuOpen(Boolean((event as CustomEvent<{ open: boolean }>).detail?.open));
    visibility();
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("portfolio:menu-state", menu);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("portfolio:menu-state", menu);
    };
  }, []);

  useEffect(() => {
    if (!host) return;
    let alive = true;
    const paths = ["base", "body", "left-arm", "right-arm", ...expressions.map(name => `head-${name}`)];
    const preload = (file: string) => new Promise<void>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve();
      image.onerror = reject;
      image.src = `${directory}${file}.webp`;
      if (image.complete && image.naturalWidth) resolve();
    });
    Promise.all(paths.map(preload)).then(() => { if (alive) setLoaded(true); }).catch(() => { if (alive) setFailed(true); });
    // Nonessential turn media does not delay the greeting or static reduced view.
    preload("turn-atlas").then(() => { if (alive) turnReady.current = true; }).catch(() => {});
    return () => { alive = false; };
  }, [host]);

  useGSAP(() => {
    const node = stage.current;
    if (!node || !ready || !loaded || failed) return;
    const actor = node.querySelector<HTMLElement>(".minty-actor")!;
    const layers = node.querySelector<HTMLElement>(".minty-layers")!;
    const head = node.querySelector<HTMLElement>(".minty-head")!;
    const leftArm = node.querySelector<HTMLElement>(".minty-left-arm")!;
    const rightArm = node.querySelector<HTMLElement>(".minty-right-arm")!;
    const turn = node.querySelector<HTMLElement>(".minty-turn")!;
    const heads = Array.from(head.querySelectorAll<HTMLElement>("[data-expression]"));
    const face = (name: Expression) => heads.find(image => image.dataset.expression === name)!;
    const allParts = [actor, layers, head, leftArm, rightArm];
    gsap.set(allParts, { x: 0, y: 0, xPercent: 0, yPercent: 0, rotation: 0, scale: 1 });
    gsap.set(heads, { opacity: 0 });
    gsap.set(face("smile"), { opacity: 1 });
    gsap.set(layers, { opacity: 1 });
    gsap.set(turn, { opacity: 0 });
    node.dataset.behavior = reduced ? "rest" : "greeting";
    if (reduced) return;

    let disposed = false;
    let lastAction: Behavior | null = null;
    const timeline = gsap.timeline({ paused: true });
    master.current = timeline;
    const breath = gsap.timeline({ paused: true, repeat: -1, yoyo: true })
      .to(layers, { y: -1.6, rotation: 0.5, duration: 2.2, ease: "sine.inOut" });
    ambient.current = breath;

    const expression = (tl: gsap.core.Timeline, value: Expression, position?: gsap.Position) => {
      tl.set(heads, { opacity: 0 }, position).set(face(value), { opacity: 1 }, "<");
    };
    const blink = (tl: gsap.core.Timeline, after: Expression = "neutral") => {
      expression(tl, "blink-half");
      tl.to({}, { duration: 0.045 });
      expression(tl, "blink-closed");
      tl.to({}, { duration: 0.055 });
      expression(tl, "blink-half");
      tl.to({}, { duration: 0.075 });
      expression(tl, after);
    };
    const wave = (tl: gsap.core.Timeline) => {
      expression(tl, "smile");
      tl.to(rightArm, { rotation: -118, duration: 0.48, ease: "power2.inOut" })
        .to(head, { rotation: -3, y: 1.2, duration: 0.4, ease: "sine.inOut" }, "<")
        .to(rightArm, { rotation: -144, duration: 0.15, repeat: 5, yoyo: true, ease: "sine.inOut" })
        .to(rightArm, { rotation: 0, duration: 0.55, ease: "power2.inOut" })
        .to(head, { rotation: 0, y: 0, duration: 0.45, ease: "sine.inOut" }, "<");
    };
    const spin = (tl: gsap.core.Timeline) => {
      // Sampled sculpture views avoid a flat CSS flip pretending to be a 3D turn.
      const view = { frame: 0 };
      tl.call(() => {
        if (turnReady.current) { gsap.set(layers, { opacity: 0 }); gsap.set(turn, { opacity: 1 }); }
      }).to(view, { frame: 23, duration: 1.3, ease: "none", snap: { frame: 1 }, onUpdate: () => {
        const frame = Math.min(23, Math.max(0, Math.round(view.frame)));
        turn.style.backgroundPosition = `${frame % 6 * 20}% ${Math.floor(frame / 6) * (100 / 3)}%`;
      } }).set(turn, { opacity: 0 }).set(layers, { opacity: 1 });
    };
    const wobble = (tl: gsap.core.Timeline) => {
      tl.to(actor, { rotation: -5, duration: 0.18, ease: "sine.inOut" })
        .to(actor, { rotation: 6, duration: 0.25, repeat: 3, yoyo: true, ease: "sine.inOut" })
        .to(actor, { rotation: 0, duration: 0.3, ease: "power2.out" });
    };
    const idle = (tl: gsap.core.Timeline) => {
      expression(tl, "neutral");
      tl.to({}, { duration: gsap.utils.random(1.2, 2.6) });
      blink(tl);
      tl.to({}, { duration: gsap.utils.random(1.3, 3.4) });
    };

    wave(timeline);
    timeline.to({}, { duration: 2 });
    blink(timeline, "smile");
    timeline.call(() => { node.dataset.behavior = "spin"; });
    spin(timeline);
    expression(timeline, "dizzy");
    wobble(timeline);
    timeline.call(() => { node.dataset.behavior = "tumble"; });
    timeline.to(actor, { rotation: 84, xPercent: -23, yPercent: -4.3, scale: 0.78, duration: 0.7, ease: "power2.in" });
    expression(timeline, "confused");
    timeline.to({}, { duration: 1.45 }).to(head, { rotation: -5, duration: 0.35, yoyo: true, repeat: 1, ease: "sine.inOut" });
    timeline.to(actor, { rotation: 0, xPercent: 0, yPercent: 0, scale: 1, duration: 1.75, ease: "power2.inOut" });
    blink(timeline, "smile");

    timeline.eventCallback("onComplete", () => {
      if (disposed) return;
      timeline.clear();
      timeline.set([actor, head, leftArm, rightArm], { x: 0, y: 0, xPercent: 0, yPercent: 0, rotation: 0, scale: 1 });
      timeline.call(() => { node.dataset.behavior = "idle"; });
      idle(timeline);
      let action = actions[Math.floor(Math.random() * actions.length)];
      if (action === lastAction) action = action === "look" ? "tilt" : "look";
      lastAction = action;
      timeline.call(() => { node.dataset.behavior = action; });
      if (action === "wave") wave(timeline);
      else if (action === "spin") { spin(timeline); expression(timeline, "dizzy"); wobble(timeline); }
      else if (action === "stumble") { expression(timeline, "confused"); wobble(timeline); }
      else if (action === "look") {
        const direction = Math.random() < 0.5 ? -1 : 1;
        expression(timeline, direction < 0 ? "look-left" : "look-right");
        timeline.to(head, { rotation: direction * 3, x: direction * 1.5, duration: 0.6, delay: 0.12, ease: "power2.inOut" })
          .to({}, { duration: gsap.utils.random(1.1, 2.3) }).to(head, { rotation: 0, x: 0, duration: 0.7, ease: "power2.inOut" });
      } else if (action === "tilt") {
        expression(timeline, "smile");
        timeline.to(head, { rotation: Math.random() < 0.5 ? -6 : 6, duration: 0.7, ease: "sine.inOut" })
          .to({}, { duration: 0.9 }).to(head, { rotation: 0, duration: 0.75, ease: "sine.inOut" });
      } else {
        expression(timeline, action);
        if (action === "cry") timeline.to(head, { y: 2, rotation: -2, duration: 0.26, repeat: 7, yoyo: true, ease: "sine.inOut" });
        else if (action === "angry") timeline.to([leftArm, rightArm], { rotation: index => index ? -9 : 9, duration: 0.4, ease: "power2.out" }).to({}, { duration: 1.5 });
        else if (action === "sleepy") timeline.to(head, { rotation: 7, y: 3, duration: 1.1, ease: "sine.inOut" }).to({}, { duration: 1.5 });
        else timeline.to({}, { duration: 2 });
        timeline.to([head, leftArm, rightArm], { rotation: 0, x: 0, y: 0, duration: 0.6, ease: "sine.inOut" });
      }
      blink(timeline);
      timeline.restart();
    });
    if (!document.hidden && !menuOpen) { timeline.play(); breath.play(); }
    return () => {
      disposed = true;
      timeline.kill(); breath.kill();
      master.current = null; ambient.current = null;
    };
  }, { scope: stage, dependencies: [host, ready, reduced, loaded, failed], revertOnUpdate: true });

  useEffect(() => {
    master.current?.paused(!active);
    ambient.current?.paused(!active);
  }, [active]);

  if (!host) return null;
  return createPortal(<figure ref={stage} className="robot-companion" role="img"
    aria-label="Minty, a little mint-colored robot. It waves, looks around and occasionally takes a playful tumble."
    data-active={active} data-reduced={reduced} data-loaded={loaded} data-failed={failed} data-menu-open={menuOpen}
    aria-busy={!loaded && !failed}>
    {failed ? <img className="robot-poster" src="/models/minty-robot-still.webp" width="1280" height="640" alt="" /> :
      <div className="minty-scene" aria-hidden="true">
        <img className="minty-base" src={`${directory}base.webp`} width="384" height="384" alt="" />
        <div className="minty-actor">
          <div className="minty-layers">
            <img className="minty-left-arm" src={`${directory}left-arm.webp`} width="384" height="384" alt="" />
            <img className="minty-body" src={`${directory}body.webp`} width="384" height="384" alt="" />
            <img className="minty-right-arm" src={`${directory}right-arm.webp`} width="384" height="384" alt="" />
            <div className="minty-head">{expressions.map(expression => <img key={expression} data-expression={expression}
              src={`${directory}head-${expression}.webp`} width="384" height="384" alt="" />)}</div>
          </div>
          <div className="minty-turn" />
        </div>
      </div>}
  </figure>, host);
}
