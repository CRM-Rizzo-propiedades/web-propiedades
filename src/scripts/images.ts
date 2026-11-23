/**
 * Fotos que no cargan. Las URLs vienen de Hammer y algunas dejan de existir
 * (404) hasta la próxima sincronización; en vez de mostrar el texto alternativo
 * roto, se prueba la siguiente foto o se saca la imagen.
 */

function onBroken(img: HTMLImageElement, handler: () => void) {
  img.addEventListener('error', handler, { once: true });
  // Por si falló antes de enganchar el listener.
  if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) handler();
}

/** Tarjetas: `data-fallbacks` lleva las otras fotos separadas por espacio. */
export function handleCardImages(root: ParentNode) {
  root.querySelectorAll<HTMLImageElement>('img.prop-card-img').forEach((img) => {
    const fallbacks = (img.dataset.fallbacks ?? '').split(' ').filter(Boolean);
    const next = () => {
      const url = fallbacks.shift();
      if (url) {
        img.src = url;
        onBroken(img, next);
        return;
      }
      const ph = document.createElement('div');
      ph.className = 'prop-card-img prop-card-img--ph';
      ph.setAttribute('aria-hidden', 'true');
      img.replaceWith(ph);
    };
    onBroken(img, next);
  });
}

/**
 * Ficha: una foto rota se saca de la galería; el hero pasa a la primera que
 * siga en pie. `onChange` avisa para actualizar la galería.
 */
export function handleDetailImages(root: ParentNode, onChange: () => void) {
  const hero = root.querySelector<HTMLElement>('[data-hero-photo]');

  function refreshHero() {
    if (!hero) return;
    const first = root.querySelector<HTMLImageElement>('.pd-gal-img');
    const img = hero.querySelector<HTMLImageElement>('img');
    if (!first) {
      hero.innerHTML = '<div class="prop-detail-hero-ph"></div>';
      return;
    }
    if (img && img.src !== first.src) img.src = first.src;
  }

  root.querySelectorAll<HTMLImageElement>('.pd-gal-img').forEach((img) => {
    onBroken(img, () => {
      img.closest('.pd-gal-item')?.remove();
      const gallery = root.querySelector<HTMLElement>('[data-gallery]');
      if (gallery && !gallery.querySelector('.pd-gal-item')) gallery.remove();
      refreshHero();
      onChange();
    });
  });
  // Sin galería (ninguna foto válida) el hero también puede venir roto.
  const heroImg = hero?.querySelector<HTMLImageElement>('img');
  if (heroImg) onBroken(heroImg, refreshHero);
}
