/**
 * Interacciones comunes del sitio (portadas de main.js del sitio anterior): cursor,
 * menú, scroll suave, apariciones, contadores, tilt de tarjetas, parallax del hero y
 * formularios (contacto y tasación, recibidos por Netlify Forms).
 */

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fineHover = matchMedia('(hover: hover) and (pointer: fine)').matches;

function safe(fn: () => void, name: string) {
  try {
    fn();
  } catch (e) {
    console.warn(`[${name}]`, e);
  }
}

function navHeight(): number {
  return parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72;
}

/* ── Cursor ── */
function initCursor() {
  if (!fineHover) return;
  const cursor = document.querySelector<HTMLElement>('.cursor');
  const dot = cursor?.querySelector<HTMLElement>('.cursor-dot');
  const ring = cursor?.querySelector<HTMLElement>('.cursor-ring');
  if (!cursor || !dot || !ring) return;

  let mx = 0, my = 0, rx = 0, ry = 0;
  let firstMove = false;
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.left = `${mx}px`;
    dot.style.top = `${my}px`;
    if (!firstMove) {
      firstMove = true;
      rx = mx;
      ry = my;
      cursor.classList.add('is-ready');
    }
  });

  (function rafLoop() {
    rx = lerp(rx, mx, 0.14);
    ry = lerp(ry, my, 0.14);
    ring.style.left = `${rx}px`;
    ring.style.top = `${ry}px`;
    requestAnimationFrame(rafLoop);
  })();

  const HOVERABLES = 'a, button, [data-tilt], select, input, textarea, .filter-btn, .nav-overlay-link';
  document.addEventListener('mouseover', (e) => {
    if ((e.target as Element).closest(HOVERABLES)) cursor.classList.add('is-hovering');
  });
  document.addEventListener('mouseout', (e) => {
    if ((e.target as Element).closest(HOVERABLES)) cursor.classList.remove('is-hovering');
  });
}

/* ── Menú ── */
function initNav() {
  const header = document.getElementById('nav-header');
  const burger = document.querySelector<HTMLElement>('.nav-burger');
  const overlay = document.getElementById('nav-overlay');
  const closeBtn = overlay?.querySelector<HTMLElement>('.nav-overlay-close');
  if (!header || !overlay) return;

  const hero = document.getElementById('inicio');
  function updateNav() {
    const scrolled = scrollY > 30;
    header!.classList.toggle('is-scrolled', scrolled);
    if (hero) {
      const heroBottom = hero.getBoundingClientRect().bottom;
      header!.classList.toggle('is-hero', heroBottom > navHeight() && !scrolled);
    }
  }
  updateNav();
  window.addEventListener('scroll', updateNav, { passive: true });

  function openMenu() {
    overlay!.classList.add('is-open');
    burger?.classList.add('is-open');
    burger?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    closeBtn?.focus();
  }
  function closeMenu() {
    overlay!.classList.remove('is-open');
    burger?.classList.remove('is-open');
    burger?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  burger?.addEventListener('click', openMenu);
  closeBtn?.addEventListener('click', closeMenu);
  closeBtn?.addEventListener('touchend', (e) => {
    e.preventDefault();
    closeMenu();
  });
  overlay.querySelectorAll('.nav-overlay-link').forEach((link) => link.addEventListener('click', closeMenu));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeMenu();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  // Resalta el enlace de la sección visible (solo anclas de esta página).
  document.querySelectorAll<HTMLAnchorElement>('.nav-link').forEach((link) => {
    const href = link.getAttribute('href') ?? '';
    if (!href.startsWith('#')) return;
    const target = document.getElementById(href.slice(1));
    if (!target) return;
    new IntersectionObserver(([entry]) => link.classList.toggle('is-active', entry!.isIntersecting), {
      threshold: 0.35,
    }).observe(target);
  });
}

/* ── Scroll suave en anclas ── */
function initSmoothScroll() {
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    const id = a?.getAttribute('href');
    if (!id || id === '#') return;
    const el = document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    window.scrollTo({
      top: el.getBoundingClientRect().top + scrollY - navHeight(),
      behavior: reduced ? 'auto' : 'smooth',
    });
  });
}

/* ── Aparición al hacer scroll ── */
let revealObserver: IntersectionObserver | undefined;

function observeReveals(root: ParentNode) {
  revealObserver ??= new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          revealObserver!.unobserve(e.target);
        }
      });
    },
    { threshold: 0.04, rootMargin: '0px 0px -2% 0px' },
  );
  root.querySelectorAll<HTMLElement>('.reveal:not(.is-visible)').forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 0.08}s`;
    revealObserver!.observe(el);
  });
}

function initReveals() {
  observeReveals(document);
  // Por las dudas: a los 6 s se muestra lo que esté a la vista.
  setTimeout(() => {
    document.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('is-visible');
    });
  }, 6000);
}

/* ── Contadores ── */
function initCountUp() {
  const nums = document.querySelectorAll<HTMLElement>('.stat-num[data-count]');
  if (!nums.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        const el = entry.target as HTMLElement;
        const target = parseInt(el.dataset.count ?? '0', 10);
        const suffix = el.dataset.suffix ?? '';
        const duration = 1400;
        const start = performance.now();
        const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
        function tick(now: number) {
          const progress = Math.min((now - start) / duration, 1);
          el.textContent = Math.round(easeOut(progress) * target) + suffix;
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    },
    { threshold: 0.5 },
  );
  nums.forEach((el) => io.observe(el));
}

/* ── Tilt en tarjetas ── */
function initTilt(root: ParentNode = document) {
  if (!fineHover) return;
  root.querySelectorAll<HTMLElement>('[data-tilt]').forEach((card) => {
    let active = false;
    card.addEventListener('mouseover', () => (active = true));
    card.addEventListener('mouseout', () => {
      active = false;
      card.style.transform = '';
    });
    card.addEventListener('mousemove', (e) => {
      if (!active) return;
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg) translateY(-4px)`;
    });
  });
}

/* ── Parallax del hero ── */
function initHeroParallax() {
  const heroBg = document.querySelector<HTMLElement>('.hero-bg-img');
  if (!heroBg || reduced) return;
  window.addEventListener(
    'scroll',
    () => {
      heroBg.style.transform = `translateY(${Math.min(scrollY * 0.25, 60)}px)`;
    },
    { passive: true },
  );
}

/** Envía un formulario a Netlify Forms (POST a la raíz con form-name). */
function postNetlifyForm(form: HTMLFormElement): Promise<Response> {
  const body = new URLSearchParams();
  new FormData(form).forEach((value, key) => body.append(key, String(value)));
  return fetch('/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
}

/* ── Formulario de contacto ── */
function initContactForm() {
  const form = document.querySelector<HTMLFormElement>('#contact-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    form.classList.add('is-sending');
    const submit = form.querySelector<HTMLButtonElement>("[type='submit']");
    if (submit) submit.disabled = true;
    const done = () => {
      form.classList.remove('is-sending');
      form.classList.add('is-sent');
      setTimeout(() => {
        form.classList.remove('is-sent');
        form.reset();
        if (submit) submit.disabled = false;
      }, 3000);
    };
    // Como el sitio anterior: se muestra "enviado" aunque falle.
    postNetlifyForm(form).then(done, done);
  });
}

/* ── Modal de tasación ── */
function initTasacion() {
  const triggers = document.querySelectorAll('[data-tasacion-open]');
  const modal = document.getElementById('tasacion-modal');
  if (!triggers.length || !modal) return;

  const closeBtn = document.getElementById('tasacion-close');
  const backdrop = modal.querySelector('.tasacion-modal-backdrop');
  const form = document.querySelector<HTMLFormElement>('#tasacion-form');
  const success = document.getElementById('tasacion-success');

  function openModal() {
    modal!.removeAttribute('hidden');
    requestAnimationFrame(() => modal!.classList.add('is-open'));
    document.body.style.overflow = 'hidden';
    if (closeBtn) setTimeout(() => closeBtn.focus(), 380);
  }

  function closeModal() {
    modal!.classList.remove('is-open');
    setTimeout(() => {
      modal!.setAttribute('hidden', '');
      document.body.style.overflow = '';
      if (form) {
        form.style.display = '';
        form.classList.remove('is-sending', 'is-sent');
        const btn = form.querySelector<HTMLButtonElement>("button[type='submit']");
        if (btn) btn.disabled = false;
        form.reset();
      }
      success?.setAttribute('hidden', '');
    }, 340);
  }

  triggers.forEach((t) => t.addEventListener('click', openModal));
  closeBtn?.addEventListener('click', closeModal);
  backdrop?.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    form.classList.add('is-sending');
    const btn = form.querySelector<HTMLButtonElement>("button[type='submit']");
    if (btn) btn.disabled = true;
    const finish = () => {
      form.style.display = 'none';
      form.classList.remove('is-sending');
      success?.removeAttribute('hidden');
      setTimeout(closeModal, 3800);
    };
    postNetlifyForm(form).then(finish, finish);
  });
}

function boot() {
  safe(initCursor, 'initCursor');
  safe(initNav, 'initNav');
  safe(initSmoothScroll, 'initSmoothScroll');
  safe(initReveals, 'initReveals');
  safe(initCountUp, 'initCountUp');
  safe(() => initTilt(), 'initTilt');
  safe(initHeroParallax, 'initHeroParallax');
  safe(initContactForm, 'initContactForm');
  safe(initTasacion, 'initTasacion');
  document.documentElement.classList.add('is-ready');
}

boot();

/**
 * Para contenido que se agrega después de la carga (las tarjetas de propiedades,
 * que llegan por fetch): aparición al hacer scroll y tilt.
 */
export function enhance(root: ParentNode) {
  safe(() => observeReveals(root), 'observeReveals');
  safe(() => initTilt(root), 'initTilt');
}
