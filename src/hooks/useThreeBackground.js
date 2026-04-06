import { useEffect } from 'react';
import * as THREE from 'three';

const sectionCameraTargets = {
  'home':           { z: 3.0, y:  0.00, fov: 75, pOpacity: 0.80, sOpacity: 0.15 },
  'about':          { z: 3.9, y: -0.15, fov: 72, pOpacity: 0.55, sOpacity: 0.10 },
  'projects':       { z: 4.7, y: -0.20, fov: 70, pOpacity: 0.45, sOpacity: 0.08 },
  'skills':         { z: 5.3, y: -0.15, fov: 68, pOpacity: 0.40, sOpacity: 0.12 },
  'resume':         { z: 4.8, y: -0.30, fov: 70, pOpacity: 0.35, sOpacity: 0.10 },
  'certifications': { z: 5.5, y: -0.25, fov: 67, pOpacity: 0.30, sOpacity: 0.10 },
  'contact':        { z: 4.2, y:  0.05, fov: 73, pOpacity: 0.55, sOpacity: 0.15 }
};

const useThreeBackground = (containerId, prefersReducedMotion) => {
  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'high-performance' });
    } catch {
      console.warn('WebGL not supported — background animation disabled.');
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.sortObjects = false;
    container.appendChild(renderer.domElement);

    const isMobile = window.innerWidth < 768;
    const particlesCount = isMobile ? 300 : 1200;
    const posArray = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 10;
    }

    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.02,
      color: 0x00f3ff,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    const geometry2 = new THREE.IcosahedronGeometry(1, 1);
    const material2 = new THREE.MeshBasicMaterial({
      color: 0xbc13fe,
      wireframe: true,
      transparent: true,
      opacity: 0.15
    });
    const wireframeSphere = new THREE.Mesh(geometry2, material2);
    scene.add(wireframeSphere);

    camera.position.z = 3;

    let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
    let gyroX = 0, gyroY = 0;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    let lastMouseMove = 0;
    const MOUSE_THROTTLE = 16;
    const onMouseMove = (event) => {
      const now = Date.now();
      if (now - lastMouseMove >= MOUSE_THROTTLE) {
        mouseX = (event.clientX - windowHalfX);
        mouseY = (event.clientY - windowHalfY);
        lastMouseMove = now;
      }
    };
    document.addEventListener('mousemove', onMouseMove);

    let lastGyroUpdate = 0;
    const GYRO_THROTTLE = 33;
    const onDeviceOrientation = (event) => {
      const now = performance.now();
      if (now - lastGyroUpdate < GYRO_THROTTLE) return;
      lastGyroUpdate = now;
      if (event.gamma && event.beta) {
        gyroX = event.gamma * 2;
        gyroY = event.beta * 2;
      }
    };
    window.addEventListener('deviceorientation', onDeviceOrientation);

    let rawScrollY = 0;
    let smoothScrollY = 0;
    const SCROLL_LERP = 0.04;
    const PARTICLES_SCROLL_FACTOR = 0.00025;
    const SPHERE_SCROLL_FACTOR = 0.00012;
    const CAMERA_SECTION_LERP = isMobile ? 0.015 : 0.025;
    const OPACITY_LERP = 0.02;
    const TILT_LERP = 0.06;
    const TILT_STRENGTH = isMobile ? 0.00007 : 0.00013;
    let prevRawScrollY = 0;
    let cameraXTilt = 0;

    let activeCameraTarget = { ...sectionCameraTargets['home'] };

    const sectionCameraObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = sectionCameraTargets[entry.target.id];
          if (target) Object.assign(activeCameraTarget, target);
        }
      });
    }, { threshold: 0.35 });
    document.querySelectorAll('section[id]').forEach(s => sectionCameraObserver.observe(s));

    const onScroll = () => {
      rawScrollY = window.scrollY;
      const limit = document.documentElement.scrollHeight - window.innerHeight;
      const progress = limit > 0 ? rawScrollY / limit : 0;
      const scrollProgressEl = document.getElementById('scroll-progress');
      if (scrollProgressEl) scrollProgressEl.style.width = (progress * 100) + '%';
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    const clock = new THREE.Clock();
    const MOBILE_FRAME_INTERVAL = 1000 / 30;
    let lastFrameTime = 0;
    let animationId;

    function animate(time = 0) {
      animationId = requestAnimationFrame(animate);
      if (isMobile) {
        if (time - lastFrameTime < MOBILE_FRAME_INTERVAL) return;
        lastFrameTime = time;
      }
      const elapsedTime = clock.getElapsedTime();

      if (window.innerWidth < 900 && (gyroX !== 0 || gyroY !== 0)) {
        targetX = gyroX;
        targetY = gyroY;
      } else {
        targetX = mouseX * 0.001;
        targetY = mouseY * 0.001;
      }

      particlesMesh.rotation.y = elapsedTime * 0.05;
      particlesMesh.rotation.x += 0.05 * (targetY - particlesMesh.rotation.x);
      particlesMesh.rotation.y += 0.05 * (targetX - particlesMesh.rotation.y);
      wireframeSphere.rotation.x = elapsedTime * 0.1;
      wireframeSphere.rotation.y = elapsedTime * 0.1;

      const scale = 1 + Math.sin(elapsedTime * 2) * 0.05;
      wireframeSphere.scale.set(scale, scale, scale);

      if (!prefersReducedMotion) {
        smoothScrollY += (rawScrollY - smoothScrollY) * SCROLL_LERP;
        camera.position.z += (activeCameraTarget.z - camera.position.z) * CAMERA_SECTION_LERP;
        camera.position.y += (activeCameraTarget.y - camera.position.y) * CAMERA_SECTION_LERP;
        const scrollVelocityNow = rawScrollY - prevRawScrollY;
        prevRawScrollY = rawScrollY;
        cameraXTilt = scrollVelocityNow * TILT_STRENGTH;
        camera.rotation.x += (cameraXTilt - camera.rotation.x) * TILT_LERP;
        if (Math.abs(camera.fov - activeCameraTarget.fov) > 0.05) {
          camera.fov += (activeCameraTarget.fov - camera.fov) * CAMERA_SECTION_LERP;
          camera.updateProjectionMatrix();
        }
        particlesMaterial.opacity += (activeCameraTarget.pOpacity - particlesMaterial.opacity) * OPACITY_LERP;
        material2.opacity += (activeCameraTarget.sOpacity - material2.opacity) * OPACITY_LERP;
        particlesMesh.position.y = smoothScrollY * PARTICLES_SCROLL_FACTOR;
        wireframeSphere.position.y = -smoothScrollY * SPHERE_SCROLL_FACTOR;
      }

      renderer.render(scene, camera);
    }
    animate();

    const onVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationId);
        clock.stop();
      } else {
        clock.start();
        lastFrameTime = 0;
        animate();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    let resizeTimer;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }, 100);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animationId);
      document.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('deviceorientation', onDeviceOrientation);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('resize', onResize);
      sectionCameraObserver.disconnect();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [containerId, prefersReducedMotion]);
};

export default useThreeBackground;
