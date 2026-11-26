/**
 * Galería de la ficha: anterior/siguiente y deslizar en el celular (de prop-detail.js).
 * Devuelve `refresh` para cuando se sacan fotos que no cargaron.
 *
 * Al cambiar de foto, la actual se desenfoca y sale hacia un costado mientras entra
 * la siguiente. Además de verse mejor, le da a la foto nueva unos milisegundos para
 * bajar la primera vez; la anterior y la siguiente se piden por adelantado.
 */

const TRANSITION_MS = 480;
const EASING = 'cubic-bezier(.22,.61,.36,1)';

export function initGallery(root: HTMLElement): () => void {
  const track = root.querySelector<HTMLElement>('.pd-gal-track');
  const counter = root.querySelector<HTMLElement>('[data-gallery-counter]');
  const controls = root.querySelectorAll<HTMLElement>(
    '[data-gallery-prev], [data-gallery-next], .pd-gal-ctrl-row',
  );
  const items = () => [...root.querySelectorAll<HTMLElement>('.pd-gal-item')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  let current = 0;
  let running: Animation[] = [];

  /**
   * El fondo desenfocado se arma recién cuando la foto se muestra: si se dejara
   * en el HTML, todas las fotos se pedirían al abrir la ficha.
   */
  function showBackground(item: HTMLElement) {
    const bg = item.querySelector<HTMLElement>('.pd-gal-bg');
    const url = bg?.dataset.bg;
    if (bg && url && !bg.style.backgroundImage) {
      bg.style.backgroundImage = `url(${JSON.stringify(url)})`;
    }
  }

  /** La anterior y la siguiente empiezan a bajar ya: el próximo paso suele ser instantáneo. */
  function preloadNeighbors(list: HTMLElement[]) {
    if (list.length < 2) return;
    for (const offset of [1, -1]) {
      const img = list[(current + offset + list.length) % list.length]!.querySelector('img');
      if (img) img.loading = 'eager';
    }
  }

  /** Mientras una foto baja no se ve vacía de golpe: aparece con un fundido al cargar. */
  root.querySelectorAll<HTMLImageElement>('.pd-gal-img').forEach((img) => {
    if (img.complete && img.naturalWidth > 0) return;
    img.classList.add('is-pending');
    img.addEventListener('load', () => img.classList.remove('is-pending'), { once: true });
  });

  function show(list: HTMLElement[], active: HTMLElement) {
    list.forEach((item) => item.classList.toggle('is-active', item === active));
  }

  function slide(from: HTMLElement, to: HTMLElement, direction: 1 | -1) {
    // Un cambio nuevo a mitad de otro: el anterior termina de golpe. Solo las que
    // siguen corriendo: finish() sobre una ya cancelada la vuelve a aplicar (y la
    // foto que salió quedaría invisible para siempre).
    running.forEach((animation) => {
      if (animation.playState === 'running') animation.finish();
    });

    from.classList.add('is-active', 'is-leaving');
    to.classList.add('is-active');
    const options: KeyframeAnimationOptions = { duration: TRANSITION_MS, easing: EASING };
    // fill: la que sale queda invisible hasta ocultarla; si no, volvería a verse un
    // instante debajo de la nueva si esta todavía no cargó.
    const leaving = from.animate(
      [
        { transform: 'translateX(0)', filter: 'blur(0)', opacity: 1 },
        { transform: `translateX(${-direction * 30}%)`, filter: 'blur(12px)', opacity: 0 },
      ],
      { ...options, fill: 'forwards' },
    );
    const entering = to.animate(
      [{ transform: `translateX(${direction * 100}%)` }, { transform: 'translateX(0)' }],
      options,
    );
    running = [leaving, entering];

    leaving.finished
      .catch(() => {})
      .then(() => {
        from.classList.remove('is-leaving');
        // Si mientras tanto se volvió a esta foto, queda visible.
        if (items()[current] !== from) from.classList.remove('is-active');
        leaving.cancel();
        running = running.filter((animation) => animation !== leaving && animation !== entering);
      });
  }

  /** `direction`: 1 hacia la siguiente, -1 hacia la anterior, 0 sin animación. */
  function goTo(index: number, direction: 1 | -1 | 0 = 0) {
    const list = items();
    if (!list.length) return;
    const from = list[current];
    current = (index + list.length) % list.length;
    const to = list[current]!;

    showBackground(to);
    if (direction && from && from !== to && from.isConnected && !reducedMotion.matches) {
      slide(from, to, direction);
    } else {
      running.forEach((animation) => animation.cancel());
      running = [];
      list.forEach((item) => item.classList.remove('is-leaving'));
      show(list, to);
    }
    preloadNeighbors(list);

    if (counter) counter.textContent = `${current + 1} / ${list.length}`;
    controls.forEach((el) => (el.hidden = list.length < 2));
  }

  root.querySelector('[data-gallery-prev]')?.addEventListener('click', () => goTo(current - 1, -1));
  root.querySelector('[data-gallery-next]')?.addEventListener('click', () => goTo(current + 1, 1));

  let startX = 0;
  track?.addEventListener('touchstart', (e) => (startX = e.touches[0]!.clientX), { passive: true });
  track?.addEventListener(
    'touchend',
    (e) => {
      const dx = e.changedTouches[0]!.clientX - startX;
      if (Math.abs(dx) > 40 && items().length > 1) {
        if (dx < 0) goTo(current + 1, 1);
        else goTo(current - 1, -1);
      }
    },
    { passive: true },
  );

  goTo(0);

  // Al sacar una foto, se queda en la misma posición (o la última), sin animar.
  return () => goTo(Math.min(current, items().length - 1));
}
