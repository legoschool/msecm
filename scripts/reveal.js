/* MSECM — scroll reveal + number count-up
   Vanilla JS, no dependencies. Honors prefers-reduced-motion. */

(() => {
  const REVEAL_CLASS = 'is-visible';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Brand link → scroll to top ────────────────────────────────────────────
  // `href="#top"` would normally target an element with id="top", but the
  // header itself is sticky so jumping to its position never triggers a
  // visible scroll. Handle it explicitly.
  document.querySelectorAll('[data-scroll-top]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: reduceMotion ? 'auto' : 'smooth',
      });
    });
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  const countUp = (el) => {
    const target = parseFloat(el.dataset.countTo);
    if (!Number.isFinite(target)) return;

    // Pacing: bigger targets get a slightly longer ride, but cap at 1.6s
    // so 4-digit years don't drag.
    const dur = Math.min(1600, 600 + Math.log10(Math.max(10, target)) * 220);
    const start = performance.now();
    const isInt = Number.isInteger(target);
    // data-count-comma: 6,731처럼 천 단위 쉼표를 찍는다(연도에는 붙이지 않음)
    const fmt = (n) => ('countComma' in el.dataset ? n.toLocaleString('en-US') : n.toString());

    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const v = easeOutCubic(t) * target;
      el.textContent = isInt ? fmt(Math.floor(v)) : v.toFixed(1);
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = fmt(target);
    };
    requestAnimationFrame(tick);
  };

  // ── Reduced motion: snap everything to final state ────────────────────────
  if (reduceMotion) {
    document.querySelectorAll('[data-reveal]').forEach((el) =>
      el.classList.add(REVEAL_CLASS)
    );
    document.querySelectorAll('[data-count-to]').forEach((el) => {
      el.textContent = 'countComma' in el.dataset ? Number(el.dataset.countTo).toLocaleString('en-US') : el.dataset.countTo;
    });
    return;
  }

  // ── Generic scroll reveal ─────────────────────────────────────────────────
  // Items entering together (same IO callback batch) get a small per-item
  // delay so a grid full of cards staggers in sequence rather than popping
  // all at once.
  const revealIO = new IntersectionObserver(
    (entries) => {
      let i = 0;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        if (i > 0) entry.target.style.transitionDelay = `${i * 70}ms`;
        entry.target.classList.add(REVEAL_CLASS);
        revealIO.unobserve(entry.target);
        i++;
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );

  document.querySelectorAll('[data-reveal]').forEach((el) => revealIO.observe(el));

  // ── Number count-up (separate observer w/ higher threshold) ───────────────
  const numberIO = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        countUp(entry.target);
        numberIO.unobserve(entry.target);
      }
    },
    { threshold: 0.6 }
  );

  document.querySelectorAll('[data-count-to]').forEach((el) => numberIO.observe(el));
})();
