/** Galería de la ficha: anterior/siguiente y deslizar en el celular (de prop-detail.js). */
export function initGallery(root: HTMLElement) {
  const items = root.querySelectorAll<HTMLElement>('.pd-gal-item');
  const track = root.querySelector<HTMLElement>('.pd-gal-track');
  const counter = root.querySelector<HTMLElement>('[data-gallery-counter]');
  if (items.length < 2 || !track) return;

  let current = 0;
  function goTo(index: number) {
    items[current]!.classList.remove('is-active');
    current = (index + items.length) % items.length;
    items[current]!.classList.add('is-active');
    if (counter) counter.textContent = `${current + 1} / ${items.length}`;
  }

  root.querySelector('[data-gallery-prev]')?.addEventListener('click', () => goTo(current - 1));
  root.querySelector('[data-gallery-next]')?.addEventListener('click', () => goTo(current + 1));

  let startX = 0;
  track.addEventListener('touchstart', (e) => (startX = e.touches[0]!.clientX), { passive: true });
  track.addEventListener(
    'touchend',
    (e) => {
      const dx = e.changedTouches[0]!.clientX - startX;
      if (Math.abs(dx) > 40) goTo(dx < 0 ? current + 1 : current - 1);
    },
    { passive: true },
  );
}
