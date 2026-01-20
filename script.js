(function () {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const navToggle = document.querySelector('.nav__toggle');
  const navLinks = document.getElementById('navLinks');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    navLinks.addEventListener('click', (e) => {
      const target = e.target;
      if (target && target.tagName === 'A') {
        navLinks.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  const revealEls = Array.from(document.querySelectorAll('.reveal'));
  const revealNow = (el) => el.classList.add('is-visible');

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            revealNow(entry.target);
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.14 }
    );

    for (const el of revealEls) io.observe(el);
  } else {
    for (const el of revealEls) revealNow(el);
  }

  const contactForm = document.getElementById('contactForm');
  const formHint = document.getElementById('formHint');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(contactForm);

      const name = String(fd.get('name') || '').trim();
      const email = String(fd.get('email') || '').trim();
      const message = String(fd.get('message') || '').trim();

      const subject = encodeURIComponent(`Portfolio inquiry — ${name}`);
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}\n`);

      const mailto = `mailto:srivarshini09.edu@gmail.com?subject=${subject}&body=${body}`;
      window.location.href = mailto;

      if (formHint) {
        formHint.textContent = 'Opening your email client…';
      }
    });
  }

  // Subtle animated "neural" background
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let w = 0;
  let h = 0;
  let dpr = 1;

  const state = {
    t: 0,
    nodes: [],
    maxNodes: 34,
    maxDist: 180,
    speed: 0.22,
  };

  const palette = {
    blue: [74, 163, 255],
    violet: [176, 108, 255],
    copper: [233, 184, 114],
  };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.floor(window.innerWidth);
    h = Math.floor(window.innerHeight);

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const base = Math.max(26, Math.min(46, Math.floor((w * h) / 52000)));
    state.maxNodes = base;
    state.maxDist = Math.max(140, Math.min(220, Math.floor(w / 5)));

    if (state.nodes.length === 0) {
      initNodes();
    } else {
      while (state.nodes.length > state.maxNodes) state.nodes.pop();
      while (state.nodes.length < state.maxNodes) state.nodes.push(makeNode());
    }
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function makeNode() {
    return {
      x: rand(0, w),
      y: rand(0, h),
      vx: rand(-1, 1) * state.speed,
      vy: rand(-1, 1) * state.speed,
      r: rand(1.2, 2.1),
      p: rand(0.15, 0.55),
    };
  }

  function initNodes() {
    state.nodes = [];
    for (let i = 0; i < state.maxNodes; i++) state.nodes.push(makeNode());
  }

  function step() {
    if (prefersReducedMotion) {
      render(true);
      return;
    }

    state.t += 1;

    for (const n of state.nodes) {
      n.x += n.vx;
      n.y += n.vy;

      if (n.x < -20) n.x = w + 20;
      if (n.x > w + 20) n.x = -20;
      if (n.y < -20) n.y = h + 20;
      if (n.y > h + 20) n.y = -20;
    }

    render(false);
    requestAnimationFrame(step);
  }

  function render(staticFrame) {
    ctx.clearRect(0, 0, w, h);

    // Gentle parallax based on scroll
    const scrollY = window.scrollY || 0;
    const par = Math.min(20, scrollY * 0.02);

    // Vignette
    const grd = ctx.createRadialGradient(w * 0.5, h * 0.1, 60, w * 0.5, h * 0.2, Math.max(w, h));
    grd.addColorStop(0, 'rgba(233,184,114,0.07)');
    grd.addColorStop(0.26, 'rgba(74,163,255,0.035)');
    grd.addColorStop(0.50, 'rgba(176,108,255,0.028)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    // Links
    for (let i = 0; i < state.nodes.length; i++) {
      const a = state.nodes[i];
      for (let j = i + 1; j < state.nodes.length; j++) {
        const b = state.nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < state.maxDist) {
          const alpha = (1 - dist / state.maxDist) * 0.14;
          // Gold-forward: copper as primary, blue as subtle accent
          const useBlue = (i + j) % 7 === 0;
          const c = useBlue ? palette.blue : palette.copper;
          ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y + par);
          ctx.lineTo(b.x, b.y + par);
          ctx.stroke();
        }
      }
    }

    // Nodes
    for (const n of state.nodes) {
      const a = 0.35;
      ctx.fillStyle = `rgba(255,255,255,${a * n.p})`;
      ctx.beginPath();
      ctx.arc(n.x, n.y + par, n.r, 0, Math.PI * 2);
      ctx.fill();

      // Small accent glow (blend copper + violet)
      const useBlueGlow = (Math.floor(n.x + n.y) % 9 === 0);
      const glow = useBlueGlow ? palette.blue : palette.copper;
      ctx.fillStyle = `rgba(${glow[0]},${glow[1]},${glow[2]},${0.10 * n.p})`;
      ctx.beginPath();
      ctx.arc(n.x, n.y + par, n.r + 2, 0, Math.PI * 2);
      ctx.fill();
    }

    if (staticFrame) {
      // no-op; just render once
    }
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();
  requestAnimationFrame(step);
})();
