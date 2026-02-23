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
    description: `Seismic activity forecasting tool analyzing decades of geological data to assess risk factors. Trained ML model available with predictive capabilities.<br><br><b>📚 What I Learned</b><br><br><b>1. Data Exploration</b><br>Loaded 782 earthquake records (13 columns, all float64/int64, no nulls). Key statistics: magnitude ranged 6.5–9.1 (mean 6.94), depth ranged 0–700+ km (mean ~84 km), sig mean ~870.<br><br><b>2. Data Cleaning</b><br>Applied coordinate validity checks to filter physically impossible latitude/longitude values. No rows were removed (dataset was already clean), but the guard is essential for production pipelines.<br><br><b>3. Exploratory Data Analysis (EDA)</b><br>Created distribution plots (<code>sns.histplot</code> with KDE) for four key features:<br>• <b>Magnitude</b> – right-skewed; most events in the 6.5–7.0 range (131 at M 6.5, 115 at M 6.6)<br>• <b>CDI</b> – bimodal; many events with CDI = 0 (not felt by public)<br>• <b>MMI</b> – concentrated between 5 and 7<br>• <b>Sig</b> – roughly bell-shaped, centred around 750–900<br><br><b>4. Baseline Model – Random Forest</b><br>Features: all 12 columns except <code>tsunami</code>. Split: 80% train / 20% test (random_state=42).<br><br><b>Results:</b><br>• Accuracy: <b>93.6%</b><br>• Precision / Recall (class 0): 0.98 / 0.91<br>• Precision / Recall (class 1): 0.89 / 0.97<br>• F1-score (macro avg): 0.94<br>• Confusion matrix: [[83 8] [2 64]] — only 10 misclassifications total<br><br><b>5. Feature Importance</b><br>Plotted a horizontal bar chart of feature importances. <code>Year</code> and <code>Month</code> were identified as low-information features worth dropping.<br><br><b>6. Refined Model (Dropping Low-Value Features)</b><br>Removed <code>Year</code> and <code>Month</code>; accuracy dropped slightly to ~89.8% vs 93.6%, suggesting those columns provided some signal — motivating further feature analysis and tuning.<br><br><b>7. Hyperparameter Tuning</b><br><b>Grid Search CV</b> – exhaustive search over n_estimators [100, 200, 300, 500] and max_depth [None, 5, 10]. Best result: max_depth=None, n_estimators=500, mean CV score ≈ 88.8%.<br><br><b>Randomized Search CV</b> – faster alternative (n_iter=5, n_jobs=3, cv=5) sampling a subset of combinations. Key takeaway: fully grown trees (<code>max_depth=None</code>) with more estimators consistently gave the best cross-validated score.<br><br><b>Results Summary:</b><br>• Random Forest (all 12 features): <b>93.6%</b><br>• Random Forest (without Year & Month): 89.8%<br>• Random Forest (GridSearchCV best, without Year & Month): ~88.8% (CV)<br><br>The baseline Random Forest with all features achieved the highest test accuracy of <b>93.6%</b>, demonstrating that seismic measurements alone can reliably predict tsunami occurrence.`
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
