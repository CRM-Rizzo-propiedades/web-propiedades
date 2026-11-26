/**
 * Galería de la ficha: anterior/siguiente y deslizar en el celular (de prop-detail.js).
 * Devuelve `refresh` para cuando se sacan fotos que no cargaron.
 */
export function initGallery(root: HTMLElement): () => void {
  const track = root.querySelector<HTMLElement>('.pd-gal-track');
  const counter = root.querySelector<HTMLElement>('[data-gallery-counter]');
  const controls = root.querySelectorAll<HTMLElement>(
    '[data-gallery-prev], [data-gallery-next], .pd-gal-ctrl-row',
  );
  const items = () => root.querySelectorAll<HTMLElement>('.pd-gal-item');

  let current = 0;

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

  function goTo(index: number) {
    const list = items();
    if (!list.length) return;
    list.forEach((item) => item.classList.remove('is-active'));
    current = (index + list.length) % list.length;
    list[current]!.classList.add('is-active');
    showBackground(list[current]!);
    if (counter) counter.textContent = `${current + 1} / ${list.length}`;
    controls.forEach((el) => (el.hidden = list.length < 2));
  }

  root.querySelector('[data-gallery-prev]')?.addEventListener('click', () => goTo(current - 1));
  root.querySelector('[data-gallery-next]')?.addEventListener('click', () => goTo(current + 1));

  let startX = 0;
  track?.addEventListener('touchstart', (e) => (startX = e.touches[0]!.clientX), { passive: true });
  track?.addEventListener(
    'touchend',
    (e) => {
      const dx = e.changedTouches[0]!.clientX - startX;
      if (Math.abs(dx) > 40 && items().length > 1) goTo(dx < 0 ? current + 1 : current - 1);
    },
    { passive: true },
  );

  goTo(0);

  // Al sacar una foto, se queda en la misma posición (o la última).
  return () => goTo(Math.min(current, items().length - 1));
}
