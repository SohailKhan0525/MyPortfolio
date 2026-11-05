"use client";

import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { ACESFilmicToneMapping, PMREMGenerator, SRGBColorSpace, type WebGLRenderTarget } from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { createRobotAnimator, settleRobotAnimator, stepRobotAnimator } from "./behavior";
import { createRobotRig } from "./rig";
import { createRobotRenderQuality, resetRobotQualityWindow, ROBOT_DPR, sampleRobotRenderQuality } from "./render-quality";

type Props = { active: boolean; reduced: boolean; onReady: () => void; onError: () => void };

function Robot({ active, reduced, onReady, onError, onQualityChange }: Props & { onQualityChange: (dpr: number) => void }) {
  const { scene } = useLoader(GLTFLoader, "/models/minty_robot_v2.glb");
  const animator = useMemo(() => createRobotAnimator(), []);
  const rig = useMemo(() => {
    const model = createRobotRig(scene);
    model.applyPose(animator.pose);
    return model;
  }, [scene, animator]);
  const { gl, invalidate, camera, size, scene: world } = useThree();
  const quality = useRef(createRobotRenderQuality());
  const lastState = useRef("");
  const prepared = useRef(false);
  const warmFrames = useRef(0);
  const announced = useRef(false);
  const readyFrame = useRef<number | null>(null);
  const wasActive = useRef(false);

  useEffect(() => {
    // A fixed vertical frame and width-aware zoom contain even the full sideways fall.
    // Looking slightly down shows the plinth without making the face hard to read.
    if ("isOrthographicCamera" in camera) {
      camera.zoom = Math.min(size.height / 3.1, size.width / 4.1);
      camera.position.set(0, 3.1, 11);
      camera.lookAt(0, 1.15, 0);
      camera.updateProjectionMatrix();
      invalidate();
    }
  }, [camera, size.width, size.height, invalidate]);

  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => { event.preventDefault(); onError(); };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl, onError]);

  useEffect(() => {
    let cancelled = false;
    prepared.current = false;
    warmFrames.current = 0;
    announced.current = false;
    const previousEnvironment = world.environment;
    const previousIntensity = world.environmentIntensity;
    let environmentTarget: WebGLRenderTarget | undefined;
    // A tiny, locally generated studio provides broad reflections without an
    // HDR download. Create it once, before shader preparation, never per frame.
    const studio = new RoomEnvironment();
    let generator: PMREMGenerator | undefined;
    // Compile with the final lighting before exposing the canvas. The neutral
    // smile stays still through preparation; the greeting starts after reveal.
    try {
      generator = new PMREMGenerator(gl);
      environmentTarget = generator.fromScene(studio, 0.04, 0.1, 100, { size: 128 });
      world.environment = environmentTarget.texture;
      world.environmentIntensity = 0.55;
      gl.compileAsync(world, camera).then(() => {
        if (cancelled) return;
        prepared.current = true;
        invalidate();
      }).catch(() => { if (!cancelled) onError(); });
    } catch {
      onError();
    } finally {
      // The generated texture belongs to this effect; the capture scene and
      // generator can be released immediately after the one-time prefilter.
      studio.dispose();
      generator?.dispose();
    }
    return () => {
      cancelled = true;
      prepared.current = false;
      if (readyFrame.current !== null) cancelAnimationFrame(readyFrame.current);
      readyFrame.current = null;
      if (world.environment === environmentTarget?.texture) {
        world.environment = previousEnvironment;
        world.environmentIntensity = previousIntensity;
      }
      environmentTarget?.dispose();
    };
  }, [gl, world, camera, rig, invalidate, onError]);

  useEffect(() => {
    if (reduced) {
      rig.applyPose(settleRobotAnimator(animator));
      gl.domElement.dataset.robotState = "resting";
      lastState.current = "";
    }
    invalidate();
  }, [reduced, rig, animator, gl, invalidate]);

  useEffect(() => {
    wasActive.current = false;
    resetRobotQualityWindow(quality.current);
    invalidate();
  }, [active, invalidate]);

  useEffect(() => () => {
    if (readyFrame.current !== null) cancelAnimationFrame(readyFrame.current);
    rig.dispose();
  }, [rig]);

  useFrame((_, delta) => {
    if (!prepared.current) return;
    if (!announced.current) {
      // Two completed frames settle camera sizing and upload geometry before
      // the DOM fades in. Demand mode needs an explicit second invalidation.
      warmFrames.current++;
      if (warmFrames.current < 2) invalidate();
      else if (readyFrame.current === null) {
        readyFrame.current = requestAnimationFrame(() => {
          readyFrame.current = null;
          announced.current = true;
          onReady();
        });
      }
      return;
    }
    if (active && !reduced) {
      // Measure only actual uninterrupted playback. Warmup/hidden-tab delays
      // cannot downgrade the renderer, and two slow windows are required.
      if (wasActive.current) {
        const nextDpr = sampleRobotRenderQuality(quality.current, delta);
        if (nextDpr !== null) onQualityChange(nextDpr);
      }
      // The first resumed frame must not advance by time spent in a hidden tab.
      const pose = stepRobotAnimator(animator, wasActive.current ? Math.min(delta, 0.05) : 0);
      rig.applyPose(pose);
      wasActive.current = true;
      if (lastState.current !== animator.state) {
        lastState.current = animator.state;
        gl.domElement.dataset.robotState = animator.state;
      }
    }
  });

  return <primitive object={rig.root} dispose={null} />;
}

export default function RobotScene(props: Props) {
  // Installed Fiber 9.8.2 reapplies its DPR prop on configure/resize. Persist the
  // chosen tier in that prop (at most two updates), rather than a setter that a
  // later visibility change could silently overwrite with the initial budget.
  const [dpr, setDpr] = useState<number>(ROBOT_DPR);
  return <div className="robot-canvas" aria-hidden="true">
    <Canvas orthographic camera={{ position: [0, 3.1, 11], near: 0.1, far: 40, zoom: 72 }}
      frameloop={props.active ? "always" : "demand"} dpr={dpr} shadows={false}
      resize={{ scroll: false, debounce: 0 }}
      gl={{ alpha: true, antialias: true, powerPreference: "default", stencil: false,
        toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.05, outputColorSpace: SRGBColorSpace }}
      fallback={null}>
      <ambientLight intensity={0.35} color="#eff8f4" />
      <directionalLight position={[3, 5, 6]} intensity={2.4} color="#fff1dc" />
      <directionalLight position={[-4, 2, 3]} intensity={0.65} color="#c9e9f5" />
      <directionalLight position={[2, 4, -4]} intensity={1} color="#d8fff1" />
      <Suspense fallback={null}><Robot {...props} onQualityChange={setDpr} /></Suspense>
    </Canvas>
  </div>;
}
