/* ============================================================
   1. CONFIGURATION
============================================================ */
const CONFIG = {
  emailJS: {
    publicKey: "YITu4swbGHXKFsR0q",
    serviceID: "service_kmvnnax",
    templateID: "template_yadt1ng"
  },
  supabase: {
    url: "YOUR_SUPABASE_PROJECT_URL",
    anonKey: "YOUR_SUPABASE_ANON_KEY",
    visitsTable: "portfolio_visits"
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
const particlesCount = isMobile ? 300 : 1200; // Performance optimization for mobile
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
const geometry2 = new THREE.IcosahedronGeometry(1, 0); // detail=0: 20 faces (was 1: ~80 faces) — better perf
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
let lastGyroUpdate = 0;
const GYRO_THROTTLE = 33; // ~30fps

window.addEventListener('deviceorientation', (event) => {
  const now = performance.now();
  if (now - lastGyroUpdate < GYRO_THROTTLE) return;
  lastGyroUpdate = now;
  // gamma: left-to-right tilt in degrees, beta: front-to-back tilt
  if (event.gamma && event.beta) {
    gyroX = event.gamma * 2; // Multiplier for sensitivity
    gyroY = event.beta * 2;
  }
});

// --- SMOOTH SCROLL CAMERA PARALLAX ---
let rawScrollY = 0;
let smoothScrollY = 0;
const SCROLL_LERP = 0.04;                    // Smoothing factor: lower = silkier
const PARTICLES_SCROLL_FACTOR = 0.00025;     // Parallax speed for particle cloud
const SPHERE_SCROLL_FACTOR = 0.00012;        // Parallax speed for wireframe sphere

// --- SECTION-AWARE CINEMATIC CAMERA TARGETS ---
// Each section defines where the Three.js camera smoothly travels to
const sectionCameraTargets = {
  'home':           { z: 3.0, y:  0.00, fov: 75, pOpacity: 0.80, sOpacity: 0.15 },
  'about':          { z: 3.9, y: -0.15, fov: 72, pOpacity: 0.55, sOpacity: 0.10 },
  'projects':       { z: 4.7, y: -0.20, fov: 70, pOpacity: 0.45, sOpacity: 0.08 },
  'skills':         { z: 5.3, y: -0.15, fov: 68, pOpacity: 0.40, sOpacity: 0.12 },
  'resume':         { z: 4.8, y: -0.30, fov: 70, pOpacity: 0.35, sOpacity: 0.10 },
  'certifications': { z: 5.5, y: -0.25, fov: 67, pOpacity: 0.30, sOpacity: 0.10 },
  'contact':        { z: 4.2, y:  0.05, fov: 73, pOpacity: 0.55, sOpacity: 0.15 }
};
// Start at home target; updated by sectionCameraObserver
let activeCameraTarget = { ...sectionCameraTargets['home'] };
// Lerp speed — slightly slower on mobile for smoothness at 30 fps
const CAMERA_SECTION_LERP = isMobile ? 0.015 : 0.025;
// Opacity lerp for particle field transitions
const OPACITY_LERP = 0.02;
// Camera tilt lerp — how quickly the tilt snaps back after scrolling
const TILT_LERP = 0.06;

// Scroll-velocity tilt — camera tilts forward when scrolling fast (cinematic dolly)
let prevRawScrollY = 0;
let cameraXTilt = 0;
const TILT_STRENGTH = isMobile ? 0.00007 : 0.00013;

// Observe each section; update camera target when it enters the viewport
const sectionCameraObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const target = sectionCameraTargets[entry.target.id];
      if (target) Object.assign(activeCameraTarget, target);
    }
  });
}, { threshold: 0.35 });
document.querySelectorAll('section[id]').forEach(s => sectionCameraObserver.observe(s));

const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let prefersReducedMotion = reducedMotionQuery.matches;
reducedMotionQuery.addEventListener('change', (e) => {
  prefersReducedMotion = e.matches;
  // Sync smoothScrollY so there is no jarring jump on preference change
  smoothScrollY = rawScrollY;
  // Snap camera to active target immediately (no lerp drift)
  if (e.matches) {
    camera.position.z = activeCameraTarget.z;
    camera.position.y = activeCameraTarget.y;
    camera.rotation.x = 0;
    camera.fov = activeCameraTarget.fov;
    camera.updateProjectionMatrix();
  }
});

// --- SCROLL PROGRESS BAR ---
const scrollProgressEl = document.getElementById('scroll-progress');
function updateScrollProgress(progress) {
  if (scrollProgressEl) scrollProgressEl.style.width = (progress * 100) + '%';
}

// --- LENIS SMOOTH SCROLLING ---
let lenis;
if (!prefersReducedMotion && typeof Lenis !== 'undefined') {
  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothTouch: false,
  });

  lenis.on('scroll', ({ scroll, limit }) => {
    rawScrollY = scroll;
    const progress = limit > 0 ? scroll / limit : 0;
    updateScrollProgress(progress);
  });
} else {
  // Fallback: native scroll tracking
  window.addEventListener('scroll', () => {
    rawScrollY = window.scrollY;
    const limit = document.documentElement.scrollHeight - window.innerHeight;
    const progress = limit > 0 ? rawScrollY / limit : 0;
    updateScrollProgress(progress);
  }, { passive: true });
}

// --- HERO PARALLAX ZOOM ON SCROLL ---
const heroTextEl = document.querySelector('.hero-text');
const HERO_PARALLAX_SPEED = 0.25;    // How fast hero content moves relative to scroll
const HERO_FADE_MULTIPLIER = 1.4;    // How quickly hero fades as user scrolls past
const HERO_SCALE_FACTOR = 0.06;      // Max scale increase at bottom of hero section
const HERO_REVEAL_TRANSITION_MS = 900; // Slightly longer than the 0.8s reveal CSS transition

function updateHeroParallax(scrollY) {
  if (!heroTextEl || prefersReducedMotion) return;
  const heroH = window.innerHeight;
  const progress = Math.min(scrollY / heroH, 1);
  const translateY = scrollY * HERO_PARALLAX_SPEED;
  const opacity = 1 - progress * HERO_FADE_MULTIPLIER;
  const scale = 1 + progress * HERO_SCALE_FACTOR;
  heroTextEl.style.transform = `translateY(${translateY}px) scale(${scale})`;
  heroTextEl.style.opacity = Math.max(0, opacity);
}

// --- ANIMATION LOOP ---
const clock = new THREE.Clock();
const MOBILE_FRAME_INTERVAL = 1000 / 30; // 30fps cap on mobile
let lastFrameTime = 0;
let animationId;

function animate(time = 0) {
  animationId = requestAnimationFrame(animate);

  // Drive Lenis smooth scroll each frame
  if (lenis) lenis.raf(time);

  // Cap to 30fps on mobile to reduce GPU load
  if (isMobile) {
    if (time - lastFrameTime < MOBILE_FRAME_INTERVAL) return;
    lastFrameTime = time;
  }

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

  // Smooth camera scroll parallax (premium cinematic feel)
  if (!prefersReducedMotion) {
    smoothScrollY += (rawScrollY - smoothScrollY) * SCROLL_LERP;
  } else {
    // Keep smoothScrollY in sync so toggling preference never causes a jump
    smoothScrollY = rawScrollY;
  }
  if (!prefersReducedMotion) {
    // Section-aware camera: lerp toward the target Z/Y for the active section
    camera.position.z += (activeCameraTarget.z - camera.position.z) * CAMERA_SECTION_LERP;
    camera.position.y += (activeCameraTarget.y - camera.position.y) * CAMERA_SECTION_LERP;

    // Cinematic tilt: forward lean based on scroll velocity (dolly-push feel)
    const scrollVelocityNow = rawScrollY - prevRawScrollY;
    prevRawScrollY = rawScrollY;
    cameraXTilt = scrollVelocityNow * TILT_STRENGTH;
    camera.rotation.x += (cameraXTilt - camera.rotation.x) * TILT_LERP;

    // FOV breathing per section — widens on hero, narrows as user explores deeper
    if (Math.abs(camera.fov - activeCameraTarget.fov) > 0.05) {
      camera.fov += (activeCameraTarget.fov - camera.fov) * CAMERA_SECTION_LERP;
      camera.updateProjectionMatrix();
    }

    // Particle field visual density transitions per section
    particlesMaterial.opacity += (activeCameraTarget.pOpacity - particlesMaterial.opacity) * OPACITY_LERP;
    material2.opacity += (activeCameraTarget.sOpacity - material2.opacity) * OPACITY_LERP;

    // Particle cloud and sphere slow parallax (depth layers)
    particlesMesh.position.y = smoothScrollY * PARTICLES_SCROLL_FACTOR;
    wireframeSphere.position.y = -smoothScrollY * SPHERE_SCROLL_FACTOR;

    updateHeroParallax(smoothScrollY);
  }

  renderer.render(scene, camera);
}
animate();

// Pause Three.js when the browser tab is hidden to save GPU/CPU
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cancelAnimationFrame(animationId);
    clock.stop();
  } else {
    clock.start();
    lastFrameTime = 0;
    animate();
  }
});

// --- RESIZE HANDLER (debounced) ---
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }, 100);
});


/* ============================================================
   3. SCROLL REVEAL ANIMATIONS (Intersection Observer — with reverse)
============================================================ */
const revealElements = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("active");
      // Once hero-text has revealed, remove the CSS transition so
      // real-time scroll parallax updates run without CSS easing interference
      if (entry.target.classList.contains('hero-text')) {
        setTimeout(() => {
          entry.target.style.transition = 'none';
        }, HERO_REVEAL_TRANSITION_MS);
      }
    } else if (entry.boundingClientRect.top > 0) {
      // Element is below the viewport — user scrolled back up; reset for re-entry
      entry.target.classList.remove("active");
      // Restore transition so the re-entry animation looks cinematic
      if (entry.target.classList.contains('hero-text')) {
        entry.target.style.transition = '';
      }
    }
  });
}, { threshold: 0.1 });

revealElements.forEach((el) => revealObserver.observe(el));

// Directional reveal elements (reveal-left / reveal-right)
const directionalRevealEls = document.querySelectorAll('.reveal-left, .reveal-right');
const directionalRevealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
    } else if (entry.boundingClientRect.top > 0) {
      entry.target.classList.remove('active');
    }
  });
}, { threshold: 0.1 });
directionalRevealEls.forEach(el => directionalRevealObserver.observe(el));


/* ============================================================
   4. TYPEWRITER EFFECT (role — started after name typing finishes)
============================================================ */
const roles = ["BEGINNER ML ENGINEER"];
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
// Role typing is started by startHeroTyping() after name is done


/* ============================================================
   5. MOBILE MENU & CURSOR
============================================================ */
const mobileToggle = document.getElementById('mobile-toggle');
const navLinks = document.querySelector('.nav-links');
const navBackdrop = document.getElementById('nav-backdrop');

function openMobileNav() {
  navLinks.classList.add('active');
  mobileToggle.classList.add('active');
  if (navBackdrop) navBackdrop.classList.add('active');
}

function closeMobileNav() {
  navLinks.classList.remove('active');
  mobileToggle.classList.remove('active');
  if (navBackdrop) navBackdrop.classList.remove('active');
}

if (mobileToggle) {
  mobileToggle.addEventListener('click', () => {
    if (navLinks.classList.contains('active')) {
      closeMobileNav();
    } else {
      openMobileNav();
    }
  });
  
  // Close menu when a link is clicked
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', closeMobileNav);
  });
}

// Close mobile nav when clicking the backdrop
if (navBackdrop) {
  navBackdrop.addEventListener('click', closeMobileNav);
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
    description: `Seismic activity forecasting tool analyzing decades of geological data to assess risk factors. Trained ML model available with predictive capabilities.<br><br><b>📚 What I Learned</b><br><br><b>1. Data Exploration</b><br>Loaded 782 earthquake records (13 columns, all float64/int64, no nulls). Key statistics: magnitude ranged 6.5–9.1 (mean 6.94), depth ranged 0–700+ km (mean ~84 km), sig mean ~870.<br><br><b>2. Data Cleaning</b><br>Applied coordinate validity checks to filter physically impossible latitude/longitude values. No rows were removed (dataset was already clean), but the guard is essential for production pipelines.<br><br><b>3. Exploratory Data Analysis (EDA)</b><br>Created distribution plots (<code>sns.histplot</code> with KDE) for four key features:<br>• <b>Magnitude</b> – right-skewed; most events in the 6.5–7.0 range (131 at M 6.5, 115 at M 6.6)<br>• <b>CDI</b> – bimodal; many events with CDI = 0 (not felt by public)<br>• <b>MMI</b> – concentrated between 5 and 7<br>• <b>Sig</b> – roughly bell-shaped, centred around 750–900<br><br><b>4. Baseline Model – Random Forest</b><br>Features: all 12 columns except <code>tsunami</code>. Split: 80% train / 20% test (random_state=42).<br><br><b>Results:</b><br>• Accuracy: <b>93.6%</b><br>• Precision / Recall (class 0): 0.98 / 0.91<br>• Precision / Recall (class 1): 0.89 / 0.97<br>• F1-score (macro avg): 0.94<br>• Confusion matrix: [[83 8] [2 64]] — only 10 misclassifications total<br><br><b>5. Feature Importance</b><br>Plotted a horizontal bar chart of feature importances. <code>Year</code> and <code>Month</code> were identified as low-information features worth dropping.<br><br><b>6. Refined Model (Dropping Low-Value Features)</b><br>Removed <code>Year</code> and <code>Month</code>; accuracy dropped slightly to ~89.8% vs 93.6%, suggesting those columns provided some signal — motivating further feature analysis and tuning.<br><br><b>7. Hyperparameter Tuning</b><br><b>Grid Search CV</b> – exhaustive search over n_estimators [100, 200, 300, 500] and max_depth [None, 5, 10]. Best result: max_depth=None, n_estimators=500, mean CV score ≈ 88.8%.<br><br><b>Randomized Search CV</b> – faster alternative (n_iter=5, n_jobs=3, cv=5) sampling a subset of combinations. Key takeaway: fully grown trees (<code>max_depth=None</code>) with more estimators consistently gave the best cross-validated score.<br><br><b>Results Summary:</b><br>• Random Forest (all 12 features): <b>93.6%</b><br>• Random Forest (without Year & Month): 89.8%<br>• Random Forest (GridSearchCV best, without Year & Month): ~88.8% (CV)<br><br>The baseline Random Forest with all features achieved the highest test accuracy of <b>93.6%</b>, demonstrating that seismic measurements alone can reliably predict tsunami occurrence.`
  },
  'heart-disease': {
    title: 'HEART DISEASE PREDICTION',
    description: `Diagnostic support tool using <b>Logistic Regression</b> to identify potential cardiac health risks. ML model trained on medical datasets for disease prediction.<br><br><b>🧠 What I Learned</b><br><br><b>1) Logistic Regression</b><br>Logistic Regression is a linear classifier that estimates the probability of a binary outcome using a sigmoid function. The trained model (<code>Logistic_regression.pkl</code>) uses <b>L2 regularization</b> (Ridge penalty) with the <b>lbfgs</b> solver and <code>C=1.0</code>. The model takes <b>15 input features</b> and learns a coefficient for each one; larger absolute coefficients indicate stronger influence on the prediction. Features such as <code>FastingBS</code>, <code>ChestPainType_ATA</code>, and <code>ST_Slope_Up</code> received the highest coefficients, meaning they are the most predictive of heart disease risk. Binary classification outputs: <b>0 = Low Risk</b>, <b>1 = High Risk</b>.<br><br><b>2) Feature Engineering & Preprocessing</b><br>Categorical columns (<code>Sex</code>, <code>ChestPainType</code>, <code>RestingECG</code>, <code>ExerciseAngina</code>, <code>ST_Slope</code>) were converted to numerical form using <b>one-hot encoding</b>. Drop-first encoding was applied so one category per feature becomes the implicit reference (e.g., <code>Sex_F</code> is the baseline; only <code>Sex_M</code> is kept). The final feature set stored in <code>columns.pkl</code> contains exactly 15 columns: <code>Age</code>, <code>RestingBP</code>, <code>Cholesterol</code>, <code>FastingBS</code>, <code>MaxHR</code>, <code>Oldpeak</code>, <code>Sex_M</code>, <code>ChestPainType_ATA</code>, <code>ChestPainType_NAP</code>, <code>ChestPainType_TA</code>, <code>RestingECG_Normal</code>, <code>RestingECG_ST</code>, <code>ExerciseAngina_Y</code>, <code>ST_Slope_Flat</code>, <code>ST_Slope_Up</code>.<br><br><b>3) Feature Scaling</b><br><b>StandardScaler</b> (<code>scaler.pkl</code>) standardizes all 15 features so each has mean ≈ 0 and standard deviation ≈ 1 before feeding into the model; this is important for Logistic Regression since it is sensitive to the scale of input features. A second scaler (<code>heart_scaler.pkl</code>) was fitted on only the 5 continuous numeric features (<code>Age</code>, <code>RestingBP</code>, <code>Cholesterol</code>, <code>MaxHR</code>, <code>Oldpeak</code>) with learned means ~53.5, ~132.5, ~244.5, ~136.8, ~0.72 respectively. Scaling must be applied with the <b>same fitted scaler</b> used during training; fitting a new scaler on test/live data would introduce data leakage.<br><br><b>4) Model Persistence</b><br>After training, the model and preprocessing objects were serialized to <code>.pkl</code> files using <b>joblib</b>. Four artifacts are saved: <code>Logistic_regression.pkl</code> (model), <code>scaler.pkl</code> (full scaler), <code>heart_scaler.pkl</code> (numeric-only scaler), and <code>columns.pkl</code> (expected feature order). At prediction time, <code>joblib.load()</code> restores each artifact so the exact same preprocessing pipeline is applied to new inputs.<br><br><b>5) End-to-End Prediction Pipeline</b><br>Raw user input → create a dict with the right feature keys → build a <code>DataFrame</code> → fill missing one-hot columns with 0 → reorder columns to match <code>columns.pkl</code> → <code>scaler.transform()</code> → <code>model.predict()</code> → display result. Ensuring the column order matches what the model was trained on is critical; mismatched columns silently produce wrong predictions.`
  },
  'student-mgmt': {
    title: 'STUDENT MANAGEMENT',
    description: `A Python-based student record system using <b>OOP</b> and a <b>JSON file database</b> for adding, updating, viewing, and removing student data — driven by a menu-based CLI.<br><br><b>📚 What I Learned</b><br><br><b>1) Object-Oriented Programming (OOP)</b><br>Defined a <code>Student</code> <b>class</b> to encapsulate all student-related data and behavior. Used <b>class attributes</b> (<code>data</code>, <code>database</code>) shared across all instances to hold the in-memory dataset and file path. Used <b>instance methods</b> (<code>addstudent</code>, <code>updatestudent</code>, <code>viewstudent</code>, <code>removestudent</code>, <code>viewall</code>) for CRUD operations.<br><br><b>2) Static Methods vs. Class Methods</b><br><b><code>@staticmethod</code></b> — used for <code>__generatestudentid()</code> because it doesn't need access to the class or any instance.<br><b><code>@classmethod</code></b> — used for <code>__update()</code> because it needs the class reference (<code>cls</code>) to open the correct database file.<br><br><b>3) Unique ID Generation with <code>random</code> and <code>string</code></b><br>Generated a human-readable unique student ID by combining <code>random.choices(string.ascii_letters, k=7)</code> for 7 random letters, <code>random.choices(string.digits, k=4)</code> for 4 random digits, <code>random.choices("!@#$%&", k=1)</code> for 1 special character, then shuffling all parts with <code>random.shuffle()</code> and calling <code>.capitalize()</code> to make the first character uppercase.<br><br><b>4) JSON as a Persistent Local Database</b><br>Learned to read a JSON file on startup with <code>json.loads()</code> and write back with <code>json.dumps()</code>. Used <code>pathlib.Path.exists()</code> to safely check if the database file exists before opening it, and create it if it doesn't.<br><br><b>5) CRUD Operations</b><br><b>C</b>reate — <code>addstudent()</code> collects input, validates age (must be 8 or above), and saves the record.<br><b>R</b>ead — <code>viewstudent()</code> finds one student by ID; <code>viewall()</code> displays all students in the dataset.<br><b>U</b>pdate — <code>updatestudent()</code> looks up by ID and allows partial updates (press Enter to keep the old value).<br><b>D</b>elete — <code>removestudent()</code> confirms with the user before deleting.<br><br><b>6) List Comprehensions for Filtering</b><br>Used list comprehensions to filter the in-memory list by student ID:<br><code>studdata = [i for i in Student.data if i['studentid'] == stuid]</code><br><br><b>7) Input Validation</b><br>Validated that a student's age is 8 or above before creating a record. Allowed users to skip fields during an update by pressing Enter to keep the old value.<br><br><b>8) Exception Handling</b><br>Wrapped file I/O and user input in <code>try/except</code> blocks to handle errors gracefully and keep the program running.<br><br><b>9) Menu-Driven CLI with <code>while True</code></b><br>Built an interactive console loop that keeps running until the user presses <b>6 to exit</b>, mapping numeric choices to the appropriate method calls.`
  },
  'student-pass': {
    title: 'STUDENT PASS/FAIL PREDICTOR',
    description: `Binary classification model using <b>Logistic Regression</b> with <b>Scikit-Learn</b> to predict whether a student will pass or fail based on demographic and academic features. Built with <b>Python</b> and deployed on <b>Streamlit</b> for live predictions.<br><br><b>🧠 What I Learned</b><br><br><b>1. Problem Type — Binary Classification</b><br>The target variable is binary: <b>0 → Fail</b>, <b>1 → Pass</b>. The model outputs a probability for each class via <code>predict_proba</code>, and the higher-probability class is used as the prediction.<br><br><b>2. Input Features</b><br>Five categorical features are used as inputs:<br>• <b>Gender:</b> female, male<br>• <b>Race / Ethnicity:</b> group A, group B, group C, group D, group E<br>• <b>Parental Level of Education:</b> associate's degree, bachelor's degree, high school, master's degree, some college, some high school<br>• <b>Lunch Type:</b> free/reduced, standard<br>• <b>Test Preparation Course:</b> completed, none<br><br><b>3. One-Hot Encoding (<code>pd.get_dummies</code>)</b><br>Since all inputs are categorical, they are converted to numeric binary columns using one-hot encoding with <code>pd.get_dummies</code>. To avoid the <b>dummy variable trap</b> (multicollinearity), one category per feature is dropped as the reference/baseline level. The 12 encoded columns saved in <code>columns.pkl</code> are: <code>gender_male</code>, <code>race/ethnicity_group B/C/D/E</code>, <code>parental level of education_bachelor's/high school/master's/some college/some high school</code>, <code>lunch_standard</code>, <code>test preparation course_none</code>. When encoding new input, <code>df_encoded.reindex(columns=columns, fill_value=0)</code> ensures the column order and set exactly match training — critical for correct inference.<br><br><b>4. Model — Logistic Regression</b><br>Algorithm: <code>sklearn.linear_model.LogisticRegression</code><br>• <b>penalty:</b> l2 — Ridge regularization to reduce overfitting<br>• <b>C:</b> 1.0 — Inverse regularization strength (default, balanced)<br>• <b>solver:</b> lbfgs — Efficient quasi-Newton solver for small/medium datasets<br>• <b>max_iter:</b> 1000 — Extended from default 100 to allow convergence<br>• <b>class_weight:</b> balanced — Adjusts weights inversely proportional to class frequencies to handle class imbalance<br>• <b>random_state:</b> 42 — Ensures reproducibility<br><br><b>5. Feature Coefficients & Their Meaning</b><br>Positive = more likely to pass, Negative = less likely to pass:<br>• <code>lunch_standard</code>: +1.198 — Standard lunch is the strongest positive predictor<br>• <code>parental level of education_master's degree</code>: +1.031 — Highest parental education boosts pass probability<br>• <code>race/ethnicity_group D</code>: +0.965 | <code>group E</code>: +0.962 — Positive relative to group A baseline<br>• <code>test preparation course_none</code>: −1.028 — Not completing prep course strongly lowers pass probability<br>• <code>gender_male</code>: −0.868 — Males slightly less likely to pass relative to females in this dataset<br>• <code>parental level of education_some high school</code>: −0.934 — Negative effect<br><br><b>6. Model Persistence with <code>joblib</code></b><br><code>joblib.dump</code> / <code>joblib.load</code> is used to serialize and reload the trained model and supporting objects: <code>pass_fail_model.pkl</code>, <code>columns.pkl</code>, <code>unique_categories.pkl</code>. <code>joblib</code> is preferred over <code>pickle</code> for scikit-learn objects because it is more efficient when the object contains large NumPy arrays.`
  },
  'bank': {
    title: 'BANK MANAGEMENT',
    description: `A Python-based bank system using <b>OOP</b> and a <b>JSON file database</b> for account creation, deposits, withdrawals, balance inquiries, and account deletion — driven by a menu-based CLI.<br><br><b>📚 What I Learned</b><br><br><b>1) Object-Oriented Programming (OOP)</b><br>Designed a <code>Bank</code> class with <b>class-level attributes</b> (<code>data</code>, <code>database</code>) shared across all instances. Used <b><code>@classmethod</code></b> methods so operations always work on the shared class state. Implemented <b>private methods</b> (<code>__update</code>, <code>__generateaccountno</code>) to encapsulate internal logic and prevent outside access.<br><br><b>2) JSON File Handling (Data Persistence)</b><br>Read and wrote a <b>JSON file</b> (<code>data.json</code>) as a lightweight database. Used <code>json.loads()</code> / <code>json.dumps()</code> for serialisation. Learned why a file-based database is useful when a full SQL/NoSQL setup is not available.<br><br><b>3) Pathlib for File Operations</b><br>Used <code>Path(filename).exists()</code> to <b>safely check</b> if a file exists before reading it. Automatically created the database file on first run if it was missing.<br><br><b>4) Input Validation</b><br>Validated <b>age</b> (must be 18 or above) before creating an account. Validated <b>PIN length</b> (must be exactly 4 digits). Validated <b>deposit limits</b> (amount must be between 0 and 15,000). Checked <b>sufficient balance</b> before allowing a withdrawal.<br><br><b>5) CRUD Operations</b><br><b>C</b>reate — collected user details and appended a new record to the JSON list. <b>R</b>ead — filtered the list with a <b>list comprehension</b> to find the matching account. <b>U</b>pdate — selectively overwrote only the fields that changed, then saved back to disk. <b>D</b>elete — removed the record by index and persisted the updated list.<br><br><b>6) Random & String Modules</b><br>Generated <b>unique account numbers</b> by combining <code>random.choices()</code> on <code>string.ascii_letters</code>, <code>string.digits</code>, and special characters. Used <code>random.shuffle()</code> to randomise the order so the format is unpredictable.<br><br><b>7) Error Handling</b><br>Wrapped file I/O in <code>try/except</code> blocks to catch unexpected errors on startup. Caught non-numeric input in the main menu loop with <code>try/except</code>.<br><br><b>8) Menu-Driven CLI Design</b><br>Built an interactive <code>while True</code> loop that keeps running until the user presses <b>7 to quit</b>. Mapped numeric choices to the appropriate method calls cleanly.`
  },
  'file-handling': {
    title: 'FILE HANDLING SYSTEM',
    description: `A menu-driven CLI application using <b>Python</b> to create, read, and delete files through a clean <b>while True</b> loop interface.<br><br><b>📚 What I Learned</b><br><br><b>1) Using <code>pathlib</code> for Path and File Operations</b><br><code>Path('')</code> creates a Path object for the current directory. <code>path.rglob('*')</code> recursively lists every file and folder — cleaner than nested <code>os.walk()</code> calls. <code>p.exists()</code> and <code>p.is_file()</code> guard operations before acting on a path.<br><br><b>2) Working with <code>open()</code> and Context Managers</b><br>Using the <b>with statement</b> ensures the file is automatically closed even if an error occurs. <code>open(p, 'w')</code> creates or overwrites for writing; <code>open(p, 'r')</code> opens for reading.<br><br><b>3) Deleting Files with <code>os.remove()</code></b><br><code>os.remove(name)</code> permanently removes a file. Always verify the file exists and is a regular file before calling it to avoid unexpected errors.<br><br><b>4) Building a Menu-Driven CLI with a <code>while True</code> Loop</b><br>A <code>while True</code> loop combined with a <code>break</code> statement creates an infinite menu that exits only when the user explicitly chooses to quit. <code>if / elif / else</code> chains map each numeric choice to its handler function.<br><br><b>5) Enumerating a List with <code>enumerate()</code></b><br><code>enumerate(items)</code> pairs each item with a zero-based index, making it easy to print a numbered list without a manual counter variable.<br><br><b>6) Error Handling with <code>try / except</code></b><br>Wrapping risky operations in <code>try / except Exception as err</code> prevents the program from crashing unexpectedly and surfaces helpful error messages while keeping the program running.<br><br><b>7) f-Strings for Clean Output</b><br>Python f-strings allow variables and expressions to be embedded directly inside string literals — more readable than <code>+</code> concatenation or <code>.format()</code>.<br><br><b>8) Organising Code into Functions</b><br>Each operation (<code>readfileandfolder</code>, <code>createfile</code>, <code>readfile</code>, <code>deletefile</code>) is encapsulated in its own function — keeping the main loop short and each concern isolated.`
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

// Detect touch-primary devices (excludes hybrid laptops with touchscreens)
const isTouchDevice = () => window.matchMedia('(hover: none) and (pointer: coarse)').matches;

// Change hint text on touch devices
if (isTouchDevice()) {
  document.querySelectorAll('.card-hint span').forEach(span => {
    span.textContent = 'Tap to learn more';
  });
}

// Track the currently tapped card for efficient class management
let tappedCard = null;

// Click behavior for all devices
document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('click', (e) => {
    // Don't trigger if clicking on links
    if (e.target.closest('.link-btn')) {
      return;
    }
    const projectKey = card.getAttribute('data-project');

    // Two-tap behavior on touch devices
    if (isTouchDevice() && card !== tappedCard) {
      // First tap: highlight the card and show the hint
      if (tappedCard) tappedCard.classList.remove('card-tapped');
      tappedCard = card;
      card.classList.add('card-tapped');
      return;
    }

    // Second tap (or desktop click): open panel
    if (tappedCard) {
      tappedCard.classList.remove('card-tapped');
      tappedCard = null;
    }
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
      if (tappedCard) {
        tappedCard.classList.remove('card-tapped');
        tappedCard = null;
      }
    }
  });
}

// Custom Cursor Logic (Desktop Only) - Optimized with RAF & transform (no layout reflow)
const cursorDot = document.querySelector("[data-cursor-dot]");
const cursorOutline = document.querySelector("[data-cursor-outline]");
let cursorX = 0, cursorY = 0;
let outlineX = 0, outlineY = 0;

if (window.innerWidth > 900) {
  // Smooth cursor outline following — uses transform (GPU-composited)
  function animateCursor() {
    outlineX += (cursorX - outlineX) * 0.2;
    outlineY += (cursorY - outlineY) * 0.2;
    cursorOutline.style.transform = `translate(${outlineX}px, ${outlineY}px)`;
    requestAnimationFrame(animateCursor);
  }
  animateCursor();
  
  // Optimized mousemove — transform avoids triggering layout
  let cursorMoveHandler = (e) => {
    cursorX = e.clientX;
    cursorY = e.clientY;
    cursorDot.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
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
const noLiveDemoBtn = document.getElementById('no-live-demo-btn');
const modal = document.getElementById('custom-modal');
const closeModal = document.getElementById('close-modal');
const modalCloseButtons = document.querySelectorAll('[data-modal-close]');
let lastFocusedElement = null;

const openModelModal = (triggerBtn) => {
  if (!modal || !closeModal) return;
  lastFocusedElement = document.activeElement;
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  if (triggerBtn) triggerBtn.setAttribute('aria-expanded', 'true');
  closeModal.focus();
};

const closeModelModal = () => {
  if (!modal) return;
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  if (modelBtn) modelBtn.setAttribute('aria-expanded', 'false');
  if (noLiveDemoBtn) noLiveDemoBtn.setAttribute('aria-expanded', 'false');
  if (lastFocusedElement) lastFocusedElement.focus();
};

if (modelBtn && modal && closeModal) {
  modelBtn.addEventListener('click', () => openModelModal(modelBtn));
  modelBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openModelModal(modelBtn);
    }
  });
}

if (noLiveDemoBtn && modal && closeModal) {
  noLiveDemoBtn.addEventListener('click', () => openModelModal(noLiveDemoBtn));
  noLiveDemoBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openModelModal(noLiveDemoBtn);
    }
  });
}

if (modal && closeModal) {
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
  const stages = ["LOADING CORE...", "CONNECTING TO NEURAL NETWORK...", "SYSTEM READY"];
  let step = 0;

  const interval = setInterval(() => {
    if (step < stages.length) {
      loaderText.textContent = stages[step];
      step++;
    } else {
      clearInterval(interval);
      preloader.style.opacity = "0";
      setTimeout(() => {
        preloader.style.display = "none";
        // Open cinematic letterbox bars (black edges animate out)
        document.querySelectorAll('.letterbox-bar').forEach(bar => {
          requestAnimationFrame(() => bar.classList.add('open'));
        });
        startHeroTyping();
      }, 500);
    }
  }, 600);
});

/* ============================================================
   HERO NAME TYPING EFFECT
============================================================ */
function startHeroTyping() {
  const nameEl = document.querySelector('.glitch-header');
  if (!nameEl) {
    if (typeTarget) type();
    return;
  }

  const fullName = nameEl.getAttribute('data-text') || 'MOHD ZAHEER UDDIN';

  if (prefersReducedMotion) {
    // Skip typing animation; show immediately and enable glitch
    nameEl.textContent = fullName;
    nameEl.setAttribute('data-text', fullName);
    nameEl.classList.add('typing-done');
    if (typeTarget) type();
    return;
  }

  // Clear visible text for typing effect
  nameEl.textContent = '';
  let idx = 0;

  function typeNameChar() {
    const current = fullName.slice(0, idx);
    nameEl.textContent = current;
    nameEl.setAttribute('data-text', current);

    if (idx < fullName.length) {
      idx++;
      setTimeout(typeNameChar, 75);
    } else {
      // Full name displayed — restore data-text and enable glitch effect
      nameEl.setAttribute('data-text', fullName);
      nameEl.classList.add('typing-done');
      // Small pause, then start role typewriter
      setTimeout(() => {
        if (typeTarget) type();
      }, 300);
    }
  }
  typeNameChar();
}

/* ============================================================
   8. SKILLS HOVER LOGIC — loader color by learning level
============================================================ */
// Threshold per design request: green for 30 or above, red below 30.
const SKILL_LEVEL_THRESHOLD = 30;

document.querySelectorAll(".skill-block").forEach(skill => {
  const percentText = skill.querySelector(".skill-percent");
  const loader = skill.querySelector(".skill-loader");

  if (!percentText || !loader) return;

  const value = Number(skill.dataset.level) || 0;
  const levelClass = value >= SKILL_LEVEL_THRESHOLD ? "green" : "red";

  percentText.textContent = "Still learning";
  percentText.classList.add(levelClass);
  loader.classList.add(levelClass);
});

/* ============================================================
   9. 3D CARD TILT EFFECT (Desktop only)
============================================================ */
if (window.innerWidth > 900) {
  document.querySelectorAll('.project-card').forEach(card => {
    const glow = card.querySelector('.card-glow');

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const rotX = (0.5 - y) * 12;
      const rotY = (x - 0.5) * 12;
      card.style.transform = `translateY(-10px) perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
      // Move glow spotlight to follow cursor (GPU-composited via CSS custom properties)
      if (glow) {
        glow.style.setProperty('--gx', `${(x - 0.5) * rect.width}px`);
        glow.style.setProperty('--gy', `${(y - 0.5) * rect.height}px`);
      }
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      // Reset glow to center
      if (glow) {
        glow.style.setProperty('--gx', '0px');
        glow.style.setProperty('--gy', '0px');
      }
    });
  });
}

/* ============================================================
   10. FOOTER VISIT ANALYTICS (Supabase backend)
============================================================ */
function formatNumber(num) {
  return Number(num || 0).toLocaleString('en-US');
}

function formatLastVisit(isoDate) {
  if (!isoDate) return 'First visit';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function getDayStamp(date = new Date()) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString().slice(0, 10);
}

function dayFromNumber(dayNumber) {
  return new Date(dayNumber * 86400000).toISOString().slice(0, 10);
}

const VISIBLE_DAYS_COUNT = 15;
let footerVisitAnalyticsData = null;

function createSupabaseAnalyticsClient() {
  if (!window.supabase || typeof window.supabase.createClient !== 'function') return null;
  const { url, anonKey } = CONFIG.supabase;
  if (!url || !anonKey || url.includes('YOUR_SUPABASE') || anonKey.includes('YOUR_SUPABASE')) return null;
  return window.supabase.createClient(url, anonKey);
}

async function getVisitAnalyticsData() {
  const client = createSupabaseAnalyticsClient();
  if (!client) return null;

  const table = CONFIG.supabase.visitsTable || 'portfolio_visits';
  const now = new Date();
  const todayStamp = getDayStamp(now);
  const todayStart = new Date(`${todayStamp}T00:00:00.000Z`);
  const tomorrowStart = new Date(todayStart.getTime() + 86400000);
  const visibleStart = new Date(todayStart.getTime() - (VISIBLE_DAYS_COUNT - 1) * 86400000);
  const todayNumber = Math.floor(todayStart.getTime() / 86400000);

  const { data: lastVisitRows, error: lastVisitError } = await client
    .from(table)
    .select('visited_at')
    .order('visited_at', { ascending: false })
    .limit(1);
  if (lastVisitError) throw lastVisitError;
  const lastVisitAt = lastVisitRows?.[0]?.visited_at || null;

  const { error: insertError } = await client.from(table).insert([{}]);
  if (insertError) throw insertError;

  const { count: totalVisits, error: totalError } = await client
    .from(table)
    .select('*', { count: 'exact', head: true });
  if (totalError) throw totalError;

  const { count: todayVisits, error: todayError } = await client
    .from(table)
    .select('*', { count: 'exact', head: true })
    .gte('visited_at', todayStart.toISOString())
    .lt('visited_at', tomorrowStart.toISOString());
  if (todayError) throw todayError;

  const { count: beforeWindowCount, error: beforeWindowError } = await client
    .from(table)
    .select('*', { count: 'exact', head: true })
    .lt('visited_at', visibleStart.toISOString());
  if (beforeWindowError) throw beforeWindowError;

  const { data: recentRows, error: recentRowsError } = await client
    .from(table)
    .select('visited_at')
    .gte('visited_at', visibleStart.toISOString())
    .lt('visited_at', tomorrowStart.toISOString())
    .order('visited_at', { ascending: true });
  if (recentRowsError) throw recentRowsError;

  const labels = [];
  const visibleStamps = [];
  const dailyCountsByStamp = {};
  for (let i = VISIBLE_DAYS_COUNT - 1; i >= 0; i--) {
    const stamp = dayFromNumber(todayNumber - i);
    visibleStamps.push(stamp);
    labels.push(stamp.slice(5));
    dailyCountsByStamp[stamp] = 0;
  }
  (recentRows || []).forEach((row) => {
    const stamp = getDayStamp(new Date(row.visited_at));
    if (Object.prototype.hasOwnProperty.call(dailyCountsByStamp, stamp)) {
      dailyCountsByStamp[stamp] += 1;
    }
  });

  const dailySeries = visibleStamps.map((stamp) => dailyCountsByStamp[stamp] || 0);
  const rolling15Series = dailySeries.map((_, idx) => {
    let sum = 0;
    for (let i = Math.max(0, idx - (VISIBLE_DAYS_COUNT - 1)); i <= idx; i++) {
      sum += dailySeries[i];
    }
    return sum;
  });

  let runningTotal = Number(beforeWindowCount || 0);
  const totalSeries = dailySeries.map((value) => {
    runningTotal += value;
    return runningTotal;
  });

  return {
    labels,
    totalVisits: Number(totalVisits || 0),
    todayVisits: Number(todayVisits || 0),
    lastVisitAt,
    dailySeries,
    rolling15Series,
    totalSeries
  };
}

function drawFooterVisitChart(data) {
  const chart = document.getElementById('visit-chart');
  if (!chart) return;
  const ctx = chart.getContext('2d');
  if (!ctx) return;

  const MIN_CHART_WIDTH = 320;
  const MIN_CHART_HEIGHT = 160;
  const CHART_PADDING = { top: 20, right: 16, bottom: 24, left: 12 };
  const MAX_X_AXIS_LABELS = 5;

  const dpr = window.devicePixelRatio || 1;
  const rect = chart.getBoundingClientRect();
  const width = Math.max(MIN_CHART_WIDTH, Math.floor(rect.width));
  const height = Math.max(MIN_CHART_HEIGHT, Math.floor(rect.height));
  chart.width = Math.floor(width * dpr);
  chart.height = Math.floor(height * dpr);
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, width, height);

  const plotW = width - CHART_PADDING.left - CHART_PADDING.right;
  const plotH = height - CHART_PADDING.top - CHART_PADDING.bottom;

  const series = [
    { name: 'Overall', values: data.totalSeries, color: '#00f3ff' },
    { name: 'Daily Visits', values: data.dailySeries, color: '#bc13fe' },
    { name: 'Last 15 Days', values: data.rolling15Series, color: '#44ff99' }
  ];

  const maxValue = Math.max(...series.flatMap((s) => s.values), 1);
  const toX = (i) => CHART_PADDING.left + (plotW * i) / (data.labels.length - 1 || 1);
  const toY = (v) => CHART_PADDING.top + plotH - (v / maxValue) * plotH;

  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = CHART_PADDING.top + (plotH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(CHART_PADDING.left, y);
    ctx.lineTo(width - CHART_PADDING.right, y);
    ctx.stroke();
  }

  series.forEach((line) => {
    ctx.beginPath();
    line.values.forEach((v, i) => {
      const x = toX(i);
      const y = toY(v);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = line.color;
    ctx.lineWidth = 2.2;
    ctx.shadowColor = line.color;
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.shadowBlur = 0;
  });

  ctx.fillStyle = 'rgba(220,220,220,0.72)';
  ctx.font = '10px Inter, sans-serif';
  const labelStride = Math.max(1, Math.ceil(data.labels.length / MAX_X_AXIS_LABELS));
  data.labels.forEach((label, i) => {
    if (i % labelStride !== 0 && i !== data.labels.length - 1) return;
    const x = toX(i);
    ctx.fillText(label, x - 14, height - 6);
  });

  let legendX = CHART_PADDING.left;
  series.forEach((line) => {
    ctx.fillStyle = line.color;
    ctx.fillRect(legendX, 4, 10, 10);
    legendX += 14;
    ctx.fillStyle = 'rgba(235,235,235,0.8)';
    ctx.fillText(line.name, legendX, 13);
    legendX += ctx.measureText(line.name).width + 14;
  });
}

async function initFooterVisitAnalytics() {
  const overallEl = document.getElementById('overall-visits');
  const todayEl = document.getElementById('today-visits');
  const last15El = document.getElementById('last-15-visits');
  const chart = document.getElementById('visit-chart');
  const summaryEl = document.getElementById('visit-chart-summary');
  if (!overallEl || !todayEl || !last15El || !chart) return;

  try {
    const data = await getVisitAnalyticsData();
    if (!data) {
      overallEl.textContent = '0';
      todayEl.textContent = '0';
      last15El.textContent = 'Set Supabase';
      if (summaryEl) summaryEl.textContent = 'Configure Supabase URL and anon key to enable visit analytics.';
      return;
    }

    footerVisitAnalyticsData = data;
    overallEl.textContent = formatNumber(data.totalVisits);
    todayEl.textContent = formatNumber(data.todayVisits);
    last15El.textContent = formatLastVisit(data.lastVisitAt);
    if (summaryEl) {
      summaryEl.textContent = `Overall visits: ${formatNumber(data.totalVisits)}. Today's visits: ${formatNumber(data.todayVisits)}. Last visit: ${formatLastVisit(data.lastVisitAt)}.`;
    }
    drawFooterVisitChart(data);
  } catch (error) {
    console.error('Footer visit analytics failed:', error);
    overallEl.textContent = '0';
    todayEl.textContent = '0';
    last15El.textContent = 'Unavailable';
    if (summaryEl) summaryEl.textContent = 'Visit analytics are currently unavailable.';
  }
}

window.addEventListener('load', () => {
  initFooterVisitAnalytics();
});
window.addEventListener('resize', () => {
  if (!document.getElementById('visit-chart') || !footerVisitAnalyticsData) return;
  drawFooterVisitChart(footerVisitAnalyticsData);
});
