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

// Init EmailJS
document.addEventListener("DOMContentLoaded", () => {
  if (typeof emailjs !== "undefined") emailjs.init(CONFIG.emailJS.publicKey);
});

/* ============================================================
   2. THREE.JS 3D BACKGROUND (Responsive & Gyroscope)
============================================================ */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // High DPI fix
document.getElementById('canvas-container').appendChild(renderer.domElement);

// --- GEOMETRY: PARTICLE SPHERE ---
const isMobile = window.innerWidth < 768;
const particlesCount = isMobile ? 600 : 1500; // Performance optimization for mobile
const posArray = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount * 3; i++) {
  posArray[i] = (Math.random() - 0.5) * 10;
}

const particlesGeometry = new THREE.BufferGeometry();
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

const particlesMaterial = new THREE.PointsMaterial({
  size: 0.02,
  color: CONFIG.colors.particles,
  transparent: true,
  opacity: 0.8,
  blending: THREE.AdditiveBlending
});

const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// --- CONNECTING LINES (WIRE SPHERE) ---
const geometry2 = new THREE.IcosahedronGeometry(1, 1);
const material2 = new THREE.MeshBasicMaterial({ 
  color: CONFIG.colors.connections, 
  wireframe: true, 
  transparent: true, 
  opacity: 0.15 
});
const wireframeSphere = new THREE.Mesh(geometry2, material2);
scene.add(wireframeSphere);

camera.position.z = 3;

// --- INTERACTION VARIABLES ---
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;
let gyroX = 0;
let gyroY = 0;

const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

// --- MOUSE MOVEMENT (DESKTOP) ---
document.addEventListener('mousemove', (event) => {
  mouseX = (event.clientX - windowHalfX);
  mouseY = (event.clientY - windowHalfY);
});

// --- GYROSCOPE (MOBILE) ---
// This detects phone rotation and updates gyro variables
window.addEventListener('deviceorientation', (event) => {
  // gamma: left-to-right tilt in degrees, beta: front-to-back tilt
  if (event.gamma && event.beta) {
    gyroX = event.gamma * 2; // Multiplier for sensitivity
    gyroY = event.beta * 2;
  }
});

// --- ANIMATION LOOP ---
const clock = new THREE.Clock();

function animate() {
  const elapsedTime = clock.getElapsedTime();

  // Determine target based on device type (Mouse or Gyro)
  if (window.innerWidth < 900 && (gyroX !== 0 || gyroY !== 0)) {
    // Use Gyro data on mobile if available
    targetX = gyroX;
    targetY = gyroY;
  } else {
    // Use Mouse data on desktop
    targetX = mouseX * 0.001;
    targetY = mouseY * 0.001;
  }

  // Smooth Rotation Logic
  particlesMesh.rotation.y = elapsedTime * 0.05; // Constant slow spin
  particlesMesh.rotation.x += 0.05 * (targetY - particlesMesh.rotation.x);
  particlesMesh.rotation.y += 0.05 * (targetX - particlesMesh.rotation.y);

  wireframeSphere.rotation.x = elapsedTime * 0.1;
  wireframeSphere.rotation.y = elapsedTime * 0.1;

  // Breathing/Pulse effect
  const scale = 1 + Math.sin(elapsedTime * 2) * 0.05;
  wireframeSphere.scale.set(scale, scale, scale);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

// --- RESIZE HANDLER ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});


/* ============================================================
   3. SCROLL REVEAL ANIMATIONS (Intersection Observer)
============================================================ */
const revealElements = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("active");
    }
  });
}, { threshold: 0.15 });

revealElements.forEach((el) => revealObserver.observe(el));


/* ============================================================
   4. TYPEWRITER EFFECT
============================================================ */
const roles = ["AI ENGINEER", "ML ENGINEER", "DATA SCIENTIST"];
let roleIndex = 0;
let charIndex = 0;
let isDeleting = false;
const typeTarget = document.getElementById("typewriter");

function type() {
  const currentRole = roles[roleIndex];
  
  if (isDeleting) {
    typeTarget.textContent = currentRole.substring(0, charIndex - 1);
    charIndex--;
  } else {
    typeTarget.textContent = currentRole.substring(0, charIndex + 1);
    charIndex++;
  }

  if (!isDeleting && charIndex === currentRole.length) {
    setTimeout(() => isDeleting = true, 2000);
  } else if (isDeleting && charIndex === 0) {
    isDeleting = false;
    roleIndex = (roleIndex + 1) % roles.length;
  }

  const speed = isDeleting ? 50 : 100;
  setTimeout(type, speed);
}
if(typeTarget) type();


/* ============================================================
   5. MOBILE MENU & CURSOR
============================================================ */
const mobileToggle = document.getElementById('mobile-toggle');
const navLinks = document.querySelector('.nav-links');

if (mobileToggle) {
  mobileToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    mobileToggle.classList.toggle('active'); // Animate hamburger
  });
  
  // Close menu when a link is clicked
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
      mobileToggle.classList.remove('active');
    });
  });
}

// Custom Cursor Logic (Desktop Only)
const cursorDot = document.querySelector("[data-cursor-dot]");
const cursorOutline = document.querySelector("[data-cursor-outline]");

if (window.innerWidth > 900) {
  window.addEventListener("mousemove", (e) => {
    const posX = e.clientX;
    const posY = e.clientY;
    cursorDot.style.left = `${posX}px`;
    cursorDot.style.top = `${posY}px`;
    cursorOutline.animate({ left: `${posX}px`, top: `${posY}px` }, { duration: 500, fill: "forwards" });
  });
}


/* ============================================================
   6. FORMS & POPUPS
============================================================ */
// Contact Form
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('.submit-btn span');
    const originalText = btn.textContent;
    btn.textContent = "TRANSMITTING...";
    
    try {
      await emailjs.send(CONFIG.emailJS.serviceID, CONFIG.emailJS.templateID, {
        from_name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        reply_to: document.getElementById("email").value,
        message: document.getElementById("message").value
      });
      btn.textContent = "SUCCESS";
      contactForm.reset();
      setTimeout(() => btn.textContent = originalText, 3000);
    } catch (err) {
      console.error(err);
      btn.textContent = "FAILED";
      setTimeout(() => btn.textContent = originalText, 3000);
    }
  });
}

// Model Popup
const modelBtn = document.getElementById('model-only-btn');
const modal = document.getElementById('custom-modal');
const closeModal = document.getElementById('close-modal');

if (modelBtn && modal && closeModal) {
  modelBtn.addEventListener('click', (e) => {
    e.preventDefault();
    modal.classList.add('active');
  });
  closeModal.addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });
}


/* ============================================================
   7. PRELOADER
============================================================ */
window.addEventListener("load", () => {
  const preloader = document.getElementById("preloader");
  const loaderText = preloader.querySelector(".loader-text");
  const stages = ["LOADING CORE...", "CONNECTING NEURAL NETWORK", "SYSTEM READY"];
  let step = 0;

  const interval = setInterval(() => {
    if (step < stages.length) {
      loaderText.textContent = stages[step];
      step++;
    } else {
      clearInterval(interval);
      preloader.style.opacity = "0";
      setTimeout(() => preloader.style.display = "none", 500);
    }
  }, 600);
});
