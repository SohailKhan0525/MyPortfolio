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
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'high-performance' });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Optimized DPI for performance
renderer.sortObjects = false; // Disable automatic sorting for better performance
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

// --- MOUSE MOVEMENT (DESKTOP) - THROTTLED ---
let lastMouseMove = 0;
const MOUSE_THROTTLE = 16; // ~60fps

document.addEventListener('mousemove', (event) => {
  const now = Date.now();
  if (now - lastMouseMove >= MOUSE_THROTTLE) {
    mouseX = (event.clientX - windowHalfX);
    mouseY = (event.clientY - windowHalfY);
    lastMouseMove = now;
  }
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
const roles = ["ML ENGINEER IN BEGINNER"];
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
    // Don't delete if only one role, just stay at the end
    if (roles.length === 1) {
      return;
    }
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

/* ============================================================
   HOVER PANEL - Show/Hide on Project Card Click
============================================================ */
const hoverPanel = document.getElementById('hover-panel');
const panelTitle = document.getElementById('panel-title');
const panelDescription = document.getElementById('panel-description');
const closePanelBtn = document.querySelector('.close-panel-btn');

// Project data for hover panel
const projectData = {
  'house-price': {
    title: 'HOUSE PRICE PREDICTION',
    description: `Advanced regression model using <b>Random Forest Regressor</b> with <b>Scikit-Learn</b> to predict real estate values with high accuracy. Built with <b>Python</b> and deployed on <b>Streamlit</b> for live predictions.<br><br><b>Model Performance: R² = 0.95 | Random Forest Regressor</b><br><br><b>📚 What I Learned (Expanded)</b><br><br><b>1) Most ML time is spent before modeling</b><br>I learned that preprocessing is the core of real projects. The raw data had mixed formats, missing values, and text-heavy fields. Cleaning them correctly was more important than quickly fitting a model.<br><br><b>2) Text-to-numeric conversion is a key practical skill</b><br>Fields like Carpet Area, Floor, and Amount(in rupees) are not directly model-ready. I learned how to parse and transform these into consistent numeric variables.<br><br><b>3) Unit normalization matters a lot</b><br>Area values came in different units (sqft, sqm, sqyard). Converting all of them into one unit (SQFT) improved consistency and reduced hidden noise.<br><br><b>4) Target engineering affects model stability</b><br>Converting Amount(in rupees) into a clean numeric target (Price(in lakhs)) taught me how important a stable target representation is for regression performance.<br><br><b>5) Data constraints improve robustness</b><br>Filtering unrealistic area and price ranges helped remove extreme outliers and made the model more stable on practical values.<br><br><b>6) Multiple metrics give better judgment</b><br>I learned not to depend on only one metric. Reading R², MAE, and RMSE together gave a fuller view of both fit quality and prediction error scale.<br><br><b>7) Comparing models is better than guessing</b><br>Trying Random Forest, Gradient Boosting, and Decision Tree in the same setup helped me choose the best model objectively instead of by assumption.<br><br><b>8) Categorical encoding must be deployment-ready</b><br>I learned that saving encoded column order (columns.pkl) is essential. Without the exact feature schema, app-time predictions can break or become inconsistent.<br><br><b>9) Dropping temporary columns prevents confusion</b><br>During feature engineering I created helper columns (like parsed area and amount values). Removing these after use keeps the final training dataset clean and reproducible.<br><br><b>10) End-to-end delivery is the real milestone</b><br>The biggest learning is that successful ML is not only training a model. It is building a full pipeline that can be understood, reused, and connected to a real app.`
  },
  'earthquake': {
    title: 'GLOBAL EARTHQUAKE PREDICTION',
    description: 'Seismic activity forecasting tool analyzing decades of geological data to assess risk factors. Trained ML model available with predictive capabilities.'
  },
  'heart-disease': {
    title: 'HEART DISEASE PREDICTION',
    description: 'Diagnostic support tool using logistic regression to identify potential cardiac health risks. ML model trained on medical datasets for disease prediction.'
  },
  'student-mgmt': {
    title: 'STUDENT MANAGEMENT',
    description: 'Backend architecture for academic record keeping and student data processing. Python-based system for managing student information and records.'
  },
  'student-pass': {
    title: 'STUDENT PASS/FAIL PREDICTOR',
    description: 'Classification model to predict student pass or fail outcomes based on academic features. ML model trained to forecast academic performance.'
  },
  'bank': {
    title: 'BANK MANAGEMENT',
    description: 'Python-based bank system for account creation, deposits, withdrawals, and inquiries. Complete banking operations management system.'
  },
  'file-handling': {
    title: 'FILE HANDLING SYSTEM',
    description: 'Python-based file handling system to create, read, update, and delete files. Complete file management operations implementation.'
  }
};

// Smooth panel open function
function openPanel(projectKey) {
  if (projectKey && projectData[projectKey]) {
    const data = projectData[projectKey];
    panelTitle.textContent = data.title;
    panelDescription.innerHTML = data.description;
    
    // Trigger animation
    requestAnimationFrame(() => {
      if (hoverPanel) hoverPanel.classList.add('active');
    });
  }
}

// Smooth panel close function
function closePanel() {
  if (hoverPanel) {
    hoverPanel.classList.remove('active');
  }
}

// Click behavior for all devices
document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('click', (e) => {
    // Don't trigger if clicking on links
    if (e.target.closest('.link-btn')) {
      return;
    }
    const projectKey = card.getAttribute('data-project');
    openPanel(projectKey);
  });
});

// Close panel button
if (closePanelBtn) {
  closePanelBtn.addEventListener('click', closePanel);
}

// Close panel when clicking outside
if (hoverPanel) {
  document.addEventListener('click', (e) => {
    if (!hoverPanel.contains(e.target) && !e.target.closest('.project-card')) {
      closePanel();
    }
  });
}

// Custom Cursor Logic (Desktop Only) - Optimized with RAF
const cursorDot = document.querySelector("[data-cursor-dot]");
const cursorOutline = document.querySelector("[data-cursor-outline]");
let cursorX = 0, cursorY = 0;
let outlineX = 0, outlineY = 0;

if (window.innerWidth > 900) {
  // Smooth cursor outline following
  function animateCursor() {
    outlineX += (cursorX - outlineX) * 0.2;
    outlineY += (cursorY - outlineY) * 0.2;
    cursorOutline.style.left = `${outlineX}px`;
    cursorOutline.style.top = `${outlineY}px`;
    requestAnimationFrame(animateCursor);
  }
  animateCursor();
  
  // Optimized mousemove with cursor position update
  let cursorMoveHandler = (e) => {
    cursorX = e.clientX;
    cursorY = e.clientY;
    cursorDot.style.left = `${cursorX}px`;
    cursorDot.style.top = `${cursorY}px`;
  };
  
  document.addEventListener("mousemove", cursorMoveHandler);
  
  // Event delegation for interactive elements - OPTIMIZED
  const selectiveSelectors = 'a, button, input, textarea, select, .link-btn, .btn-3d, .submit-btn, .nav-links a, .magnetic-link, .resume-btn, .hire-me-btn, .social-links a, .project-card, .skill-block, .card-links a';
  
  document.addEventListener('mouseenter', (e) => {
    const target = e.target.closest(selectiveSelectors);
    if (target) document.body.classList.add('cursor-interactive');
  }, true);
  
  document.addEventListener('mouseleave', (e) => {
    const target = e.target.closest(selectiveSelectors);
    if (target) document.body.classList.remove('cursor-interactive');
  }, true);
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
const modalCloseButtons = document.querySelectorAll('[data-modal-close]');
let lastFocusedElement = null;

const openModelModal = () => {
  if (!modal || !modelBtn || !closeModal) return;
  lastFocusedElement = document.activeElement;
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  modelBtn.setAttribute('aria-expanded', 'true');
  closeModal.focus();
};

const closeModelModal = () => {
  if (!modal || !modelBtn) return;
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  modelBtn.setAttribute('aria-expanded', 'false');
  if (lastFocusedElement) lastFocusedElement.focus();
};

if (modelBtn && modal && closeModal) {
  modelBtn.addEventListener('click', openModelModal);
  modelBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openModelModal();
    }
  });
  modalCloseButtons.forEach(btn => btn.addEventListener('click', closeModelModal));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModelModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModelModal();
    }
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

/* ============================================================
   8. SKILLS PROGRESS HOVER LOGIC
============================================================ */
document.querySelectorAll(".skill-block").forEach(skill => {
  const progress = skill.querySelector(".progress");
  const percentText = skill.querySelector(".skill-percent");

  if (!progress || !percentText) return;

  const value = parseInt(progress.style.width);

  percentText.textContent = `${value}%`;

  if (value >= 70) {
    percentText.classList.add("green");
  } else {
    percentText.classList.add("red");
  }
});
