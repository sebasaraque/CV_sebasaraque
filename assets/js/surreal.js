/* Sebastián Araque — Surreal CV interactions (vanilla, no deps) */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- language ---------- */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  const params = new URLSearchParams(location.search);
  let lang = params.get('lang') || store.get('sa-lang') ||
    ((navigator.language || 'es').toLowerCase().startsWith('es') ? 'es' : 'en');
  const setLang = (l) => { lang = l; root.lang = l; store.set('sa-lang', l); };
  setLang(lang === 'en' ? 'en' : 'es');
  $('#langBtn').addEventListener('click', () => setLang(lang === 'es' ? 'en' : 'es'));

  /* ---------- loader ---------- */
  const loader = $('#loader'), num = $('#loaderNum');
  let n = 0;
  const finish = () => { loader.classList.add('done'); document.body.classList.add('ready'); };
  if (reduce) finish();
  else {
    const tick = () => {
      n = Math.min(100, n + Math.ceil(Math.random() * 9));
      num.textContent = String(n).padStart(2, '0');
      if (n < 100) setTimeout(tick, 28); else setTimeout(finish, 250);
    };
    tick();
  }

  /* ---------- cursor ---------- */
  const cursor = $('#cursor');
  let mx = innerWidth / 2, my = innerHeight / 2;
  if (finePointer) {
    addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      cursor.classList.add('is-on');
      cursor.style.transform = `translate(${mx}px, ${my}px)`;
    });
    $$('a, button, .tilt, .cluster li').forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-big'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-big'));
    });
  }

  /* ---------- hero parallax, eye, reality lens ---------- */
  const hero = $('#hero');
  let depthEls = [];
  const readDepth = () => {
    depthEls = $$('[data-depth]', hero).map((el) => {
      el.style.transform = '';
      const base = getComputedStyle(el).transform;
      return { el, d: parseFloat(el.dataset.depth), base: base === 'none' ? '' : base };
    });
  };
  readDepth(); addEventListener('resize', readDepth);
  const iris = $('#iris');
  const portrait = $('#portrait');
  const real = $('#realLayer');

  if (finePointer && !reduce) {
    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      hero.style.setProperty('--mx', px.toFixed(3));
      hero.style.setProperty('--my', py.toFixed(3));
      const dx = (px - 0.5) * 2, dy = (py - 0.5) * 2;
      depthEls.forEach(({ el, d, base }) => {
        el.style.transform = `translate(${-dx * d * 30}px, ${-dy * d * 20}px) ${base}`;
      });
      // eye follows the cursor
      const er = iris.parentElement.getBoundingClientRect();
      const ang = Math.atan2(e.clientY - (er.top + er.height / 2), e.clientX - (er.left + er.width / 2));
      iris.style.transform = `translate(${Math.cos(ang) * 9}px, ${Math.sin(ang) * 5}px)`;
      // lens reveals the "real" layer under the dream
      const pr = portrait.getBoundingClientRect();
      const lx = e.clientX - pr.left, ly = e.clientY - pr.top;
      const inside = lx > 0 && ly > 0 && lx < pr.width && ly < pr.height;
      portrait.classList.toggle('lens', inside);
      real.style.setProperty('--lx', lx + 'px');
      real.style.setProperty('--ly', ly + 'px');
    });
    hero.addEventListener('mouseleave', () => portrait.classList.remove('lens'));
  }

  /* ---------- star / crosshair field ---------- */
  const cv = $('#stars'), ctx = cv.getContext('2d');
  let stars = [], W = 0, H = 0, dpr = Math.min(devicePixelRatio || 1, 2);
  const resize = () => {
    W = cv.width = innerWidth * dpr; H = cv.height = innerHeight * dpr;
    cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
    const count = Math.round((innerWidth * innerHeight) / 26000);
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      s: (Math.random() * 3 + 2) * dpr, v: (Math.random() * 0.25 + 0.05) * dpr,
      p: Math.random() * Math.PI * 2, cross: Math.random() < 0.35
    }));
  };
  const draw = (t) => {
    ctx.clearRect(0, 0, W, H);
    for (const s of stars) {
      s.y -= s.v; if (s.y < -10) { s.y = H + 10; s.x = Math.random() * W; }
      const a = 0.25 + 0.35 * Math.sin(t / 900 + s.p);
      ctx.strokeStyle = ctx.fillStyle = `rgba(255,227,214,${a})`;
      if (s.cross) {
        ctx.lineWidth = dpr * 0.8;
        ctx.beginPath();
        ctx.moveTo(s.x - s.s * 1.6, s.y); ctx.lineTo(s.x + s.s * 1.6, s.y);
        ctx.moveTo(s.x, s.y - s.s * 1.6); ctx.lineTo(s.x, s.y + s.s * 1.6);
        ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(s.x, s.y, s.s * 0.25, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (!reduce) requestAnimationFrame(draw);
  };
  resize(); addEventListener('resize', resize); requestAnimationFrame(draw);

  /* ---------- melting noise animation ---------- */
  const meltNoise = $('#meltNoise');
  if (!reduce && meltNoise) {
    let f = 0;
    const melt = () => {
      f += 0.006;
      meltNoise.setAttribute('baseFrequency', `${(0.004 + Math.sin(f) * 0.0012).toFixed(4)} ${(0.012 + Math.cos(f * 0.7) * 0.004).toFixed(4)}`);
      requestAnimationFrame(melt);
    };
    melt();
  }

  /* ---------- nav state ---------- */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('is-scrolled', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- reveal + counters ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      const b = en.target.querySelector('[data-count]');
      if (b) {
        const target = +b.dataset.count, t0 = performance.now();
        const step = (t) => {
          const k = Math.min(1, (t - t0) / 1400);
          b.textContent = Math.round(target * (1 - Math.pow(1 - k, 3)));
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
      io.unobserve(en.target);
    });
  }, { threshold: 0.15 });
  $$('.reveal').forEach((el, i) => { el.style.transitionDelay = (i % 4) * 90 + 'ms'; io.observe(el); });

  /* stagger skill chips */
  $$('.cluster li').forEach((li, i) => li.style.setProperty('--i', i));

  /* ---------- horizontal "infinite corridor" ---------- */
  const work = $('#work'), track = $('#workTrack');
  const jobs = $$('.job', track);
  const desktop = matchMedia('(min-width: 901px)');
  const sizeWork = () => {
    if (!desktop.matches) { work.style.removeProperty('--work-h'); track.style.transform = ''; jobs.forEach(j => j.style.transform = ''); return; }
    const dist = track.scrollWidth - innerWidth;
    work.style.setProperty('--work-h', `${dist + innerHeight}px`);
  };
  const moveWork = () => {
    if (!desktop.matches) return;
    const r = work.getBoundingClientRect();
    const dist = track.scrollWidth - innerWidth;
    const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)));
    track.style.transform = `translate3d(${-p * dist}px,0,0)`;
    if (reduce) return;
    const cx = innerWidth / 2;
    jobs.forEach((j) => {
      const jr = j.getBoundingClientRect();
      const off = (jr.left + jr.width / 2 - cx) / innerWidth; // -1..1
      j.style.transform = `rotateY(${off * -28}deg) translateZ(${-Math.abs(off) * 160}px) translateY(${Math.sin(off * 3) * 18}px)`;
    });
  };
  sizeWork(); moveWork();
  addEventListener('resize', () => { sizeWork(); moveWork(); });
  addEventListener('scroll', moveWork, { passive: true });
  addEventListener('load', () => { sizeWork(); moveWork(); });

  /* ---------- 3D tilt + glow ---------- */
  if (finePointer && !reduce) {
    $$('.tilt').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 10}deg) rotateY(${(x - 0.5) * 12}deg)`;
        el.style.setProperty('--gx', x * 100 + '%');
        el.style.setProperty('--gy', y * 100 + '%');
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- contact warp on hover ---------- */
  const big = $('#contactBig'), warp = $('#warpMap');
  if (big && warp && !reduce) {
    let s = 0, goal = 0;
    big.addEventListener('mouseenter', () => (goal = 14));
    big.addEventListener('mouseleave', () => (goal = 0));
    const loop = () => {
      s += (goal - s) * 0.08;
      warp.setAttribute('scale', s.toFixed(2));
      requestAnimationFrame(loop);
    };
    loop();
  }

  /* ---------- printable CV ---------- */
  $('#printBtn').addEventListener('click', () => window.print());
  $('#year').textContent = new Date().getFullYear();
})();
