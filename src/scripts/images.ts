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

/** Tope de fotos alternativas por tarjeta. */
const MAX_FALLBACKS = 2;

/**
 * Si fallan varias fotos seguidas sin que cargue ninguna, el problema no es una URL
 * vieja sino el servidor (caído, o limitando con 429 por exceso de requests). Ahí
 * se dejan de probar alternativas: solo sumarían requests y alargarían el bloqueo.
 *
 * El contador es por vista y se reinicia con cada `load`: lo que importa son los
 * fallos consecutivos, no el total. Con 6, una sola tarjeta con fotos viejas no
 * alcanza para bloquear al resto.
 */
const BLOCKED_AFTER = 6;

/** `data-fallbacks` lleva un JSON con las otras fotos. */
function parseFallbacks(raw: string | undefined): string[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value)
      ? value.filter((url): url is string => typeof url === 'string' && url.length > 0)
      : [];
  } catch {
    return [];
  }
}

/** Tarjetas: las fotos alternativas están en `data-fallbacks`. */
export function handleCardImages(root: ParentNode) {
  let consecutiveFailures = 0;
  let blocked = false;

  const noteLoad = () => {
    consecutiveFailures = 0;
    blocked = false;
  };

  const noteFailure = () => {
    consecutiveFailures++;
    if (consecutiveFailures >= BLOCKED_AFTER) blocked = true;
    return !blocked;
  };

  root.querySelectorAll<HTMLImageElement>('img.prop-card-img').forEach((img) => {
    const fallbacks = parseFallbacks(img.dataset.fallbacks);
    let used = 0;
    img.addEventListener('load', noteLoad);

    const showPlaceholder = () => {
      const ph = document.createElement('div');
      ph.className = 'prop-card-img prop-card-img--ph';
      ph.setAttribute('aria-hidden', 'true');
      img.replaceWith(ph);
    };

    const next = () => {
      const canRetry = noteFailure();
      const url = canRetry && used < MAX_FALLBACKS ? fallbacks.shift() : undefined;
      if (url) {
        used++;
        img.src = url;
        onBroken(img, next);
        return;
      }
      showPlaceholder();
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
  const MAX_HERO_ATTEMPTS = 3;
  let heroAttempts = 0;

  const heroImg = () => hero?.querySelector<HTMLImageElement>('.prop-detail-hero-img') ?? null;

  function showHeroPlaceholder() {
    if (hero && !hero.querySelector('.prop-detail-hero-ph')) {
      hero.innerHTML = '<div class="prop-detail-hero-ph"></div>';
    }
  }

  function watchHero(img: HTMLImageElement) {
    onBroken(img, () => {
      const photos = [...root.querySelectorAll<HTMLImageElement>('.pd-gal-img')];
      const current = img.src;
      const alternative = photos.find((photo) => photo.src !== current);
      if (alternative && heroAttempts < MAX_HERO_ATTEMPTS) {
        heroAttempts++;
        img.src = alternative.src;
        watchHero(img);
        return;
      }
      showHeroPlaceholder();
    });
  }

  function refreshHero() {
    if (!hero) return;

    const first = root.querySelector<HTMLImageElement>('.pd-gal-img');
    if (!first) {
      showHeroPlaceholder();
      return;
    }

    const img = heroImg();
    if (!img) {
      // El hero había quedado en placeholder: se rearma con la foto que quedó.
      hero.innerHTML = `<img class="prop-detail-hero-img" src="${first.src}" alt="Imagen principal de la propiedad" loading="eager" />`;
      const created = heroImg();
      if (created) watchHero(created);
      return;
    }

    if (img.src === first.src) return;
    img.src = first.src;
    watchHero(img);
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
  const img = heroImg();
  if (img) watchHero(img);
}
