/* ============================================================
   1. CONFIGURATION
============================================================ */
const CONFIG = {
  emailJS: {
    publicKey: "YITu4swbGHXKFsR0q",
    serviceID: "service_kmvnnax",
    templateID: "template_yadt1ng"
  },
  colors: {
    particles: 0x00f3ff,
    connections: 0xbc13fe
  }
};

/* ============================================================
   2. INIT (DOM READY)
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  if (typeof emailjs !== "undefined") {
    emailjs.init(CONFIG.emailJS.publicKey);
  }
});

/* ============================================================
   3. THREE.JS BACKGROUND
============================================================ */
const container = document.getElementById("canvas-container");
if (container && window.THREE) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  camera.position.z = 3;

  /* PARTICLES */
  const isMobile = window.innerWidth < 768;
  const particlesCount = isMobile ? 600 : 1500;
  const posArray = new Float32Array(particlesCount * 3);

  for (let i = 0; i < posArray.length; i++) {
    posArray[i] = (Math.random() - 0.5) * 10;
  }

  const particlesGeometry = new THREE.BufferGeometry();
  particlesGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(posArray, 3)
  );

  const particlesMaterial = new THREE.PointsMaterial({
    size: 0.02,
    color: CONFIG.colors.particles,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });

  const particlesMesh = new THREE.Points(
    particlesGeometry,
    particlesMaterial
  );
  scene.add(particlesMesh);

  /* WIREFRAME SPHERE */
  const wireframeSphere = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      color: CONFIG.colors.connections,
      wireframe: true,
      transparent: true,
      opacity: 0.15
    })
  );
  scene.add(wireframeSphere);

  /* INTERACTION */
  let mouseX = 0,
    mouseY = 0,
    gyroX = 0,
    gyroY = 0,
    targetX = 0,
    targetY = 0;

  let windowHalfX = window.innerWidth / 2;
  let windowHalfY = window.innerHeight / 2;

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX - windowHalfX;
    mouseY = e.clientY - windowHalfY;
  });

  /* iOS GYRO PERMISSION */
  if (
    typeof DeviceOrientationEvent !== "undefined" &&
    typeof DeviceOrientationEvent.requestPermission === "function"
  ) {
    document.body.addEventListener(
      "click",
      async () => {
        try {
          await DeviceOrientationEvent.requestPermission();
        } catch {}
      },
      { once: true }
    );
  }

  window.addEventListener("deviceorientation", (e) => {
    if (e.gamma !== null && e.beta !== null) {
      gyroX = e.gamma * 0.02;
      gyroY = e.beta * 0.02;
    }
  });

  const clock = new THREE.Clock();

  function animate() {
    const t = clock.getElapsedTime();

    if (window.innerWidth < 900 && (gyroX || gyroY)) {
      targetX = gyroX;
      targetY = gyroY;
    } else {
      targetX = mouseX * 0.001;
      targetY = mouseY * 0.001;
    }

    particlesMesh.rotation.y += 0.001 * (targetX - particlesMesh.rotation.y);
    particlesMesh.rotation.x += 0.001 * (targetY - particlesMesh.rotation.x);
    particlesMesh.rotation.y += 0.002;

    wireframeSphere.rotation.x = t * 0.1;
    wireframeSphere.rotation.y = t * 0.1;

    const scale = 1 + Math.sin(t * 2) * 0.05;
    wireframeSphere.scale.set(scale, scale, scale);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  window.addEventListener("resize", () => {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

/* ============================================================
   4. SCROLL REVEAL
============================================================ */
document.querySelectorAll(".reveal").forEach((el) => {
  new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) el.classList.add("active");
    },
    { threshold: 0.15 }
  ).observe(el);
});

/* ============================================================
   5. TYPEWRITER
============================================================ */
const roles = ["AI ENGINEER", "ML ENGINEER", "DATA SCIENTIST"];
let roleIndex = 0,
  charIndex = 0,
  deleting = false;

const typeTarget = document.getElementById("typewriter");
if (typeTarget) {
  (function type() {
    const text = roles[roleIndex];
    charIndex += deleting ? -1 : 1;
    typeTarget.textContent = text.substring(0, charIndex);

    if (!deleting && charIndex === text.length) {
      setTimeout(() => (deleting = true), 1500);
    } else if (deleting && charIndex === 0) {
      deleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
    }

    setTimeout(type, deleting ? 50 : 100);
  })();
}

/* ============================================================
   6. MOBILE MENU
============================================================ */
const mobileToggle = document.getElementById("mobile-toggle");
const navLinks = document.querySelector(".nav-links");

if (mobileToggle && navLinks) {
  mobileToggle.addEventListener("click", () => {
    mobileToggle.classList.toggle("active");
    navLinks.classList.toggle("active");
  });

  navLinks.querySelectorAll("a").forEach((link) =>
    link.addEventListener("click", () => {
      navLinks.classList.remove("active");
      mobileToggle.classList.remove("active");
    })
  );
}

/* ============================================================
   7. CUSTOM CURSOR (DESKTOP)
============================================================ */
const cursorDot = document.querySelector("[data-cursor-dot]");
const cursorOutline = document.querySelector("[data-cursor-outline]");

if (window.innerWidth > 900 && cursorDot && cursorOutline) {
  window.addEventListener("mousemove", (e) => {
    const { clientX: x, clientY: y } = e;
    cursorDot.style.left = `${x}px`;
    cursorDot.style.top = `${y}px`;
    cursorOutline.animate(
      { left: `${x}px`, top: `${y}px` },
      { duration: 400, fill: "forwards" }
    );
  });

  document.querySelectorAll("a, button, input, textarea").forEach((el) => {
    el.addEventListener("mouseenter", () =>
      document.body.classList.add("hovering")
    );
    el.addEventListener("mouseleave", () =>
      document.body.classList.remove("hovering")
    );
  });
}

/* ============================================================
   8. CONTACT FORM
============================================================ */
const contactForm = document.getElementById("contact-form");
if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector(".submit-btn span");
    const original = btn.textContent;

    btn.textContent = "TRANSMITTING...";
    try {
      await emailjs.send(
        CONFIG.emailJS.serviceID,
        CONFIG.emailJS.templateID,
        {
          from_name: contactForm.name.value,
          email: contactForm.email.value,
          reply_to: contactForm.email.value,
          message: contactForm.message.value
        }
      );
      btn.textContent = "SUCCESS";
      contactForm.reset();
    } catch {
      btn.textContent = "FAILED";
    }
    setTimeout(() => (btn.textContent = original), 3000);
  });
}

/* ============================================================
   9. PRELOADER
============================================================ */
window.addEventListener("load", () => {
  const preloader = document.getElementById("preloader");
  if (!preloader) return;

  const text = preloader.querySelector(".loader-text");
  const steps = [
    "LOADING CORE...",
    "CONNECTING NEURAL NETWORK",
    "SYSTEM READY"
  ];

  let i = 0;
  const interval = setInterval(() => {
    if (i < steps.length) {
      text.textContent = steps[i++];
    } else {
      clearInterval(interval);
      preloader.style.opacity = "0";
      setTimeout(() => (preloader.style.display = "none"), 500);
    }
  }, 600);
});

/* ============================================================
   10. SKILLS + MAGNETIC LINKS
============================================================ */
document.querySelectorAll(".skill-block").forEach((skill) => {
  const progress = skill.querySelector(".progress");
  const percent = skill.querySelector(".skill-percent");
  if (!progress || !percent) return;

  const value = parseInt(progress.style.width || "0");
  percent.textContent = `${value}%`;
  percent.classList.add(value >= 70 ? "green" : "red");
});

if (window.innerWidth > 900) {
  document.querySelectorAll(".magnetic-link").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      el.style.transform = `translate(${x * 0.3}px, ${y * 0.5}px)`;
    });
    el.addEventListener("mouseleave", () => {
      el.style.transform = "translate(0,0)";
    });
  });
}
