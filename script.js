/* ============================================================
   1. CONFIGURATION
============================================================ */
const CONFIG = {
  // EmailJS Keys
  emailJS: {
    publicKey: "YITu4swbGHXKFsR0q",
    serviceID: "service_kmvnnax",
    templateID: "template_yadt1ng"
  },
  colors: {
    background: 0x050505,
    particles: 0x00f3ff,
    connections: 0xbc13fe
  }
};

// Init EmailJS
document.addEventListener("DOMContentLoaded", () => {
  if (typeof emailjs !== "undefined") {
    emailjs.init(CONFIG.emailJS.publicKey);
  }
});

/* ============================================================
   2. THREE.JS 3D BACKGROUND
============================================================ */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Performance opt
document.getElementById('canvas-container').appendChild(renderer.domElement);

// --- GEOMETRY: PARTICLE SPHERE ---
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = window.innerWidth < 768 ? 700 : 1500; // Fewer particles on mobile

const posArray = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount * 3; i++) {
  posArray[i] = (Math.random() - 0.5) * 10; // Spread particles
}

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

 //CONNECTING LINES (NEURAL NET)
//We create a secondary mesh for the 'core' look
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

// --- MOUSE INTERACTION ---
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;

const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

document.addEventListener('mousemove', (event) => {
  mouseX = (event.clientX - windowHalfX);
  mouseY = (event.clientY - windowHalfY);
});

// --- ANIMATION LOOP ---
const clock = new THREE.Clock();

function animate() {
  targetX = mouseX * 0.001;
  targetY = mouseY * 0.001;

  const elapsedTime = clock.getElapsedTime();

  // Rotate entire system
  particlesMesh.rotation.y = elapsedTime * 0.05;
  particlesMesh.rotation.x += 0.05 * (targetY - particlesMesh.rotation.x);
  particlesMesh.rotation.y += 0.05 * (targetX - particlesMesh.rotation.y);

  wireframeSphere.rotation.x = elapsedTime * 0.1;
  wireframeSphere.rotation.y = elapsedTime * 0.1;

  // Pulse effect (scale)
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
   3. CUSTOM CURSOR
============================================================ */
const cursorDot = document.querySelector("[data-cursor-dot]");
const cursorOutline = document.querySelector("[data-cursor-outline]");

window.addEventListener("mousemove", (e) => {
  const posX = e.clientX;
  const posY = e.clientY;

  // Dot follows instantly
  cursorDot.style.left = `${posX}px`;
  cursorDot.style.top = `${posY}px`;

  // Outline follows with lag (smoothness)
  cursorOutline.animate({
    left: `${posX}px`,
    top: `${posY}px`
  }, { duration: 500, fill: "forwards" });
});

// Hover effects
document.querySelectorAll('a, button, input, textarea').forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
});


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
    setTimeout(() => isDeleting = true, 2000); // Pause at end
  } else if (isDeleting && charIndex === 0) {
    isDeleting = false;
    roleIndex = (roleIndex + 1) % roles.length;
  }

  const speed = isDeleting ? 50 : 100;
  setTimeout(type, speed);
}
if(typeTarget) type();


/* ============================================================
   5. CONTACT FORM & INTERACTIONS
============================================================ */
// Mobile Menu
const mobileToggle = document.getElementById('mobile-toggle');
const navLinks = document.querySelector('.nav-links');

if (mobileToggle) {
  mobileToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
  });
}

// Contact Form Submit
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

/* ============================================================
   6. MAGNETIC BUTTONS (Desktop Only)
============================================================ */
if (window.innerWidth > 900) {
  const magnets = document.querySelectorAll('.magnetic-link');
  magnets.forEach((magnet) => {
    magnet.addEventListener('mousemove', (e) => {
      const rect = magnet.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      magnet.style.transform = `translate(${x * 0.3}px, ${y * 0.5}px)`;
    });
    
    magnet.addEventListener('mouseleave', () => {
      magnet.style.transform = 'translate(0, 0)';
    });
  });
}

/* ============================
   ABOUT ME ANIMATION
============================ */

const aboutSection = document.querySelector(".about-section");
const aboutText = document.querySelector(".about-text");
const aboutLogo = document.querySelector(".about-logo");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        aboutText.classList.add("show");
        aboutLogo.classList.add("show");
      }
    });
  },
  { threshold: 0.3 }
);

if (aboutSection) observer.observe(aboutSection);


/* ============================================================
   7. PRELOADER
============================================================ */
window.addEventListener("load", () => {
  const preloader = document.getElementById("preloader");
  const loaderText = preloader.querySelector(".loader-text");
  
  // Simulate system boot sequence
  const stages = ["LOADING CORE...", "CONNECTING NEURAL NETWORK", "SYSTEM READY"];
  let step = 0;

  const interval = setInterval(() => {
    if (step < stages.length) {
      loaderText.textContent = stages[step];
      loaderText.setAttribute("data-text", stages[step]);
      step++;
    } else {
      clearInterval(interval);
      preloader.style.opacity = "0";
      setTimeout(() => {
        preloader.style.display = "none";
      }, 500);
    }
  }, 600);
});

/* ============================================================
   8. CUSTOM MODEL POP-UP
============================================================ */
const modelBtn = document.getElementById('model-only-btn');
const modal = document.getElementById('custom-modal');
const closeModal = document.getElementById('close-modal');

if (modelBtn && modal && closeModal) {
  // Show Modal
  modelBtn.addEventListener('click', (e) => {
    e.preventDefault(); // Stop link from navigating
    modal.classList.add('active');
  });

  // Hide Modal (Close Button)
  closeModal.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  // Hide Modal (Click Outside)
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });
}
