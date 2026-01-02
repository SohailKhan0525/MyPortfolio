/* ============================================================
   EMAILJS CONFIG
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  emailjs.init("YITu4swbGHXKFsR0q");

  const form = document.getElementById("contact-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const message = document.getElementById("message").value.trim();

    if (!name || !email || !message) {
      showPopup("Please fill all fields", false);
      return;
    }

    try {
      await emailjs.send("service_kmvnnax", "template_yadt1ng", {
        from_name: name,
        reply_to: email,
        message,
      });

      showPopup("Message sent — thank you!", true);
      form.reset();
    } catch (err) {
      console.error(err);
      showPopup("Failed to send — try again.", false);
    }
  });
});

/* ============================================================
   POPUP TOAST
============================================================ */
function showPopup(msg, ok = true) {
  let p = document.getElementById("popup");
  if (!p) {
    p = document.createElement("div");
    p.id = "popup";
    document.body.appendChild(p);
  }

  Object.assign(p.style, {
    position: "fixed",
    bottom: "36px",
    left: "50%",
    transform: "translateX(-50%)",
    padding: "12px 20px",
    borderRadius: "10px",
    fontWeight: "700",
    background: ok ? "#00c8ff" : "#ff4b4b",
    color: "#000",
    opacity: "1",
    zIndex: 9999,
    transition: "opacity .6s ease",
  });

  p.textContent = msg;
  setTimeout(() => (p.style.opacity = "0"), 2600);
}

/* ============================================================
   SKILLS — CATEGORY FIRST, THEN ITEMS
============================================================ */
(function () {
  const categories = document.querySelectorAll(".skill-category");

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const cat = entry.target;
        cat.classList.add("visible");

        // Progress bars
        const fills = cat.querySelectorAll(".fill");
        fills.forEach((f, i) => {
          const level = parseInt(f.getAttribute("data-level") || 0);
          const width = level <= 5 ? 5 : level;
          setTimeout(() => (f.style.width = width + "%"), 200 + i * 120);
        });

        obs.unobserve(cat);
      });
    },
    { threshold: 0.2 }
  );

  categories.forEach((c) => obs.observe(c));
})();

/* ============================================================
   SKILL TILE 3D TILT
============================================================ */
(function () {
  if (!("ontouchstart" in window)) {
  document.querySelectorAll("[data-tilt]").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;

      const rx = (y - 0.5) * 14;
      const ry = (x - 0.5) * -14;

      el.style.transform =
        `rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px) scale(1.03)`;
    });

    el.addEventListener("mouseleave", () => {
      el.style.transform = "";
    });
  });
})();

/* ============================================================
   NAVBAR — SMOOTH SCROLL + ACTIVE HIGHLIGHT + MOBILE TOGGLE
============================================================ */
(function () {
  const nav = document.querySelector(".navbar nav");
  const navLinks = document.querySelectorAll(".navbar nav a");
  const toggle = document.getElementById("nav-toggle");

  // Smooth scroll
  navLinks.forEach((a) => {
    a.addEventListener("click", (e) => {
      const target = document.querySelector(a.getAttribute("href"));
      if (!target) return;

      e.preventDefault();
      const offset = target.getBoundingClientRect().top + window.scrollY - 90;

      window.scrollTo({
        top: offset,
        behavior: "smooth",
      });

      if (nav.classList.contains("open")) closeNav();
    });
  });

  // Active highlight
  const sections = document.querySelectorAll("section[id]");
  window.addEventListener("scroll", () => {
    const top = window.scrollY + 120;
    let current = "";

    sections.forEach((sec) => {
      if (top >= sec.offsetTop) current = sec.id;
    });

    navLinks.forEach((a) => {
      a.classList.toggle("active", a.getAttribute("href") === `#${current}`);
    });
  });

  // Toggle handlers
  function openNav() {
    nav.classList.add("open");
    toggle.setAttribute("aria-expanded", "true");
  }
  function closeNav() {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }

  if (toggle) {
    toggle.addEventListener("click", () => {
      nav.classList.contains("open") ? closeNav() : openNav();
    });
  }
})();

/* ============================================================
   PARTICLE BACKGROUND
============================================================ */
class ParticleSystem {
  constructor(canvas, opts) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.dpr = Math.max(1, window.devicePixelRatio || 1);
    this.particles = [];

    this.opts = Object.assign(
      {
        count: window.innerWidth < 900 ? 45 : 90,
        speed: 0.35,
        size: 1.6,
        linkDist: 120,
        hueStart: 200,
        hueEnd: 215,
        alpha: 0.6,
      },
      opts || {}
    );

    this.resize();
    this.init();
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    this.canvas.width = this.canvas.clientWidth * this.dpr;
    this.canvas.height = this.canvas.clientHeight * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  init() {
    this.particles = [];
    for (let i = 0; i < this.opts.count; i++) this.particles.push(this.create());
    this.last = performance.now();
    requestAnimationFrame(() => this.animate());
  }

  create() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    return {
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * this.opts.speed,
      vy: (Math.random() - 0.5) * this.opts.speed,
      r: this.opts.size * (0.7 + Math.random() * 0.8),
      hue:
        this.opts.hueStart +
        Math.random() * (this.opts.hueEnd - this.opts.hueStart),
    };
  }

  animate() {
    const now = performance.now();
    const dt = now - this.last;
    this.last = now;

    this.update(dt / 16.66);
    this.draw();

    requestAnimationFrame(() => this.animate());
  }

  update(dt) {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
      if (p.y < -10) p.y = h + 10;
      if (p.y > h + 10) p.y = -10;
    }
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";

    for (let i = 0; i < this.particles.length; i++) {
      const a = this.particles[i];

      for (let j = i + 1; j < this.particles.length; j++) {
        const b = this.particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d = Math.sqrt(dx * dx + dy * dy);

        if (d < this.opts.linkDist) {
          ctx.strokeStyle = `hsla(${(a.hue + b.hue) / 2}, 90%, 60%, ${
            (1 - d / this.opts.linkDist) * 0.12
          })`;
          ctx.lineWidth = (1 - d / this.opts.linkDist) * 0.8;

          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    for (const p of this.particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue},90%,60%,${this.opts.alpha})`;
      ctx.fill();
    }
  }
}

(function () {
  const bg = document.getElementById("bg-canvas");
  if (!bg) return;

  const resize = () => {
    bg.style.width = window.innerWidth + "px";
    bg.style.height = window.innerHeight + "px";
  };
  resize();

  window.addEventListener("resize", resize);
  new ParticleSystem(bg);
})();

/* ============================================================
   LOGO PARTICLE RING
============================================================ */
(function () {
  if (window.innerWidth < 900) return;
  const canvas = document.getElementById("logo-canvas");
  if (!canvas) return;

  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  const parts = [];
  for (let i = 0; i < 28; i++) {
    const a = Math.random() * Math.PI * 2;

    parts.push({
      a,
      rad: 1 + Math.random() * 2,
      speed: 0.001 + Math.random() * 0.003,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    parts.forEach((p) => {
      p.a += p.speed * 16;

      const x = W / 2 + Math.cos(p.a) * 60;
      const y = H / 2 + Math.sin(p.a) * 60;

      ctx.beginPath();
      ctx.fillStyle = "rgba(58,203,255,0.14)";
      ctx.arc(x, y, p.rad, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }

  draw();
})();

/* ============================================================
   ROLE ROTATION
============================================================ */
(function () {
  const role = document.getElementById("role");
  if (!role) return;

  const roles = ["AI Engineer", "Tech Enthusiast"];
  let i = 0;

  setInterval(() => {
    role.style.opacity = "0";

    setTimeout(() => {
      i = (i + 1) % roles.length;
      role.textContent = roles[i];
      role.style.opacity = "1";
    }, 300);
  }, 3000);
})();

/* ============================================================
   PROJECT CARDS — REVEAL ON SCROLL
============================================================ */
(function () {
  const cards = document.querySelectorAll(".project-card-3d");

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  cards.forEach((c) => obs.observe(c));
})();

/* ============================================================
   PROJECT CARDS — 3D Tilt + Spark Particles + Border Glow
============================================================ */
(function () {
  const cards = document.querySelectorAll(".project-card-3d");

  cards.forEach((card) => {
if (window.innerWidth < 900) return;
    /* Spark Canvas */
    const canvas = document.createElement("canvas");
    canvas.className = "project-glow-canvas";
    card.appendChild(canvas);

    const ctx = canvas.getContext("2d");

    function resizeCanvas() {
      canvas.width = card.clientWidth;
      canvas.height = card.clientHeight;
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const sparks = [];
    for (let i = 0; i < 16; i++) {
      sparks.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: 1 + Math.random() * 2,
        a: 0.15 + Math.random() * 0.25,
      });
    }

    function animateSparks() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      sparks.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.fillStyle = `rgba(75,184,255, ${p.a})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animateSparks);
    }
    animateSparks();

    /* 3D Tilt */
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;

      const rx = (y - 0.5) * 16;
      const ry = (x - 0.5) * -16;

      card.style.transform =
        `translateY(-8px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      card.style.transition = "transform 0.08s";
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "translateY(0)";
      card.style.transition = "transform 0.45s ease";
    });

    /* Border Pulse */
    let glow = 0;
    function glowBorder() {
      glow += 0.03;
      const t = (Math.sin(glow) + 1) / 2;

      const hue = 190 + t * 40;
      const alpha = 0.25 + t * 0.25;

      card.style.boxShadow =
        `0 0 ${14 + t * 16}px rgba(75,184,255,0.25)`;
      card.style.border =
        `1px solid hsla(${hue},90%,65%,${alpha})`;

      requestAnimationFrame(glowBorder);
    }
    glowBorder();
  });
})();

/* ============================================================
   DARK / LIGHT MODE TOGGLE
============================================================ */
(function () {
  const toggle = document.getElementById("theme-toggle");
  const body = document.body;

  let saved = localStorage.getItem("theme");
  if (saved === "light") {
    body.classList.add("light-mode");
    toggle.classList.add("light");
  }

  toggle.addEventListener("click", () => {
    const isLight = body.classList.toggle("light-mode");
    toggle.classList.toggle("light", isLight);
    localStorage.setItem("theme", isLight ? "light" : "dark");
  });
})();

/* ============================================================
   PRELOADER FADE OUT
============================================================ */
window.addEventListener("load", () => {
  const loader = document.getElementById("preloader");

  loader.classList.add("fade-out");

  setTimeout(() => {
    loader.style.display = "none";
  }, 600);
});

// ============================================================
// NO LIVE DEMO POPUP HANDLER
// ============================================================
document.querySelectorAll(".no-demo").forEach(btn => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const message = btn.getAttribute("data-message") || "No live demo available for this project.";
    showPopup(message, false);
  });
});