"use client";

import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { createRobotAnimator, settleRobotAnimator, stepRobotAnimator } from "./behavior";
import { createRobotRig } from "./rig";

type Props = { active: boolean; reduced: boolean; onReady: () => void; onError: () => void };

function Robot({ active, reduced, onReady, onError }: Props) {
  const { scene } = useLoader(GLTFLoader, "/models/minty_robot_v2.glb");
  const animator = useMemo(() => createRobotAnimator(), []);
  const rig = useMemo(() => {
    const model = createRobotRig(scene);
    model.applyPose(animator.pose);
    return model;
  }, [scene, animator]);
  const { gl, invalidate, camera, size } = useThree();
  const lastState = useRef("");
  const firstFrame = useRef(true);
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
    if (reduced) {
      rig.applyPose(settleRobotAnimator(animator));
      gl.domElement.dataset.robotState = "resting";
      lastState.current = "";
    }
    invalidate();
  }, [reduced, rig, animator, gl, invalidate]);

  useEffect(() => {
    wasActive.current = false;
    invalidate();
  }, [active, invalidate]);

  useEffect(() => () => {
    if (readyFrame.current !== null) cancelAnimationFrame(readyFrame.current);
    rig.dispose();
  }, [rig]);

  useFrame((_, delta) => {
    if (active && !reduced) {
      // The first resumed frame must not advance by time spent offscreen/scrolling.
      const pose = stepRobotAnimator(animator, wasActive.current ? Math.min(delta, 0.05) : 0);
      rig.applyPose(pose);
      wasActive.current = true;
      if (lastState.current !== animator.state) {
        lastState.current = animator.state;
        gl.domElement.dataset.robotState = animator.state;
      }
    }
    if (firstFrame.current) {
      firstFrame.current = false;
      // Notify after a model frame has actually reached the renderer.
      readyFrame.current = requestAnimationFrame(onReady);
    }
  });

  return <primitive object={rig.root} dispose={null} />;
}

export default function RobotScene(props: Props) {
  return <div className="robot-canvas" aria-hidden="true">
    <Canvas orthographic camera={{ position: [0, 3.1, 11], near: 0.1, far: 40, zoom: 72 }}
      frameloop={props.active ? "always" : "demand"} dpr={[1, 1.35]} shadows={false}
      resize={{ scroll: false, debounce: 0 }}
      gl={{ alpha: true, antialias: true, powerPreference: "low-power", stencil: false }}
      fallback={null}>
      <ambientLight intensity={1.25} />
      <directionalLight position={[3, 5, 6]} intensity={2.5} />
      <directionalLight position={[-4, 2, 1]} intensity={1} color="#c8f7ed" />
      <Suspense fallback={null}><Robot {...props} /></Suspense>
    </Canvas>
  </div>;
}
