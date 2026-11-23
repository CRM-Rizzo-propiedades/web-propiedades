import { whatsappUrl } from '../../config/site';
import {
  cardSpecs,
  detailSpecs,
  formatAddress,
  formatExpenses,
  formatPrice,
  OPERATION_LABEL,
  propertyUrl,
  TYPE_LABEL,
  whatsappText,
} from './format';
import type { Property } from './types';

/**
 * HTML de las tarjetas y de la ficha, armado en el navegador con los datos del
 * servicio. Todo texto que viene del servicio pasa por `esc`.
 *
 * Fotos por vista: las tarjetas piden su foto principal apenas se arman (sin
 * lazy) y la ficha pide todas las de su galería al abrirse.
 */
export function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const PIN_ICON =
  '<svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>';

/** Tarjeta del listado y de la home. `filterable` agrega los data-* que usan los filtros. */
export function cardHtml(p: Property, filterable = false): string {
  const address = formatAddress(p);
  const price = formatPrice(p) ?? 'Consultar precio';
  const specs = cardSpecs(p);
  const alt = `${TYPE_LABEL[p.type]}${address ? ` en ${address}` : ''}`;
  const data = filterable
    ? Object.entries({
        'data-prop-card': '',
        'data-op': p.operation,
        'data-tipo': p.type,
        'data-ambientes': p.rooms ?? 0,
        'data-banios': p.bathrooms ?? 0,
        'data-cochera': p.garage ? 1 : 0,
        'data-credito': p.creditEligible ? 1 : 0,
        'data-valor': p.price?.amount ?? 0,
        'data-zona': p.locality?.id ?? '',
      })
        .map(([k, v]) => ` ${k}="${esc(v)}"`)
        .join('')
    : '';
  const img = p.photos[0]
    ? `<img src="${esc(p.photos[0])}" alt="${esc(alt)}" decoding="async" class="prop-card-img" data-fallbacks="${esc(p.photos.slice(1, 6).join(' '))}" />`
    : '<div class="prop-card-img prop-card-img--ph" aria-hidden="true"></div>';
  const expenses =
    p.operation === 'alquiler' && p.expenses
      ? `<p class="prop-expensas">Expensas: ARS ${esc(p.expenses.toLocaleString('es-AR'))}</p>`
      : '';
  return `<article class="prop-card reveal" data-tilt${data}>
  <a href="${esc(propertyUrl(p))}" class="prop-card-link" aria-label="${esc(`Ver ficha de ${detailTitle(p)}`)}">
    <div class="prop-card-img-wrap">${img}<span class="prop-badge">${esc(OPERATION_LABEL[p.operation])}</span></div>
    <div class="prop-card-body">
      <span class="prop-tipo">${esc(TYPE_LABEL[p.type])}</span>
      <h3 class="prop-title">${esc(p.title ?? TYPE_LABEL[p.type])}</h3>
      <p class="prop-loc">${PIN_ICON}${esc(address)}</p>
      <p class="prop-price">${esc(price)}</p>
      ${expenses}
      ${specs ? `<p class="prop-specs">${esc(specs)}</p>` : ''}
    </div>
  </a>
</article>`;
}

/** El título de la propiedad o, si no tiene, "Tipo en Calle 123, Localidad". */
export function detailTitle(p: Property): string {
  if (p.title) return p.title;
  const address = formatAddress(p);
  return `${TYPE_LABEL[p.type]}${address ? ` en ${address}` : ''}`;
}

function mapUrl(p: Property): string | null {
  if (!p.location) return null;
  const { lat, lng } = p.location;
  const d = 0.004;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d},${lat - d},${lng + d},${lat + d}&layer=mapnik&marker=${lat},${lng}`;
}

function galleryHtml(photos: string[]): string {
  if (!photos.length) return '';
  const items = photos
    .map(
      (url, i) => `<div class="pd-gal-item${i === 0 ? ' is-active' : ''}" role="listitem">
        <div class="pd-gal-bg" style="background-image:url(${esc(JSON.stringify(url))})"></div>
        <img src="${esc(url)}" alt="Foto ${i + 1} de la propiedad" class="pd-gal-img" />
      </div>`,
    )
    .join('');
  const controls =
    photos.length > 1
      ? `<button type="button" class="pd-gal-btn pd-gal-btn--prev" aria-label="Foto anterior" data-gallery-prev>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <button type="button" class="pd-gal-btn pd-gal-btn--next" aria-label="Siguiente foto" data-gallery-next>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M9 18l6-6-6-6" /></svg>
        </button>
        <div class="pd-gal-ctrl-row"><span class="pd-gal-counter" aria-live="polite" data-gallery-counter>1 / ${photos.length}</span></div>`
      : '';
  return `<div class="prop-detail-gallery" aria-label="Galería de fotos" data-gallery>
    <div class="pd-gal-inner"><div class="pd-gal-track" role="list">${items}</div>${controls}</div>
  </div>`;
}

/** Contenido completo de la ficha (hero + cuerpo). */
export function detailHtml(p: Property): string {
  const tipo = TYPE_LABEL[p.type];
  const op = OPERATION_LABEL[p.operation];
  const address = formatAddress(p);
  const price = formatPrice(p) ?? 'Consultar precio';
  const expenses = formatExpenses(p);
  const specs = detailSpecs(p);
  const paragraphs = p.description.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  const map = mapUrl(p);

  const hero = p.photos[0]
    ? `<img class="prop-detail-hero-img" src="${esc(p.photos[0])}" alt="Imagen principal de la propiedad" loading="eager" />`
    : '<div class="prop-detail-hero-ph"></div>';

  return `<div class="prop-detail-hero">
    <div class="prop-detail-hero-media" data-hero-photo>${hero}</div>
    <div class="prop-detail-hero-overlay" aria-hidden="true"></div>
    <a href="/propiedades" class="prop-detail-hero-back" aria-label="Volver a propiedades">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7"></path></svg>
      Volver
    </a>
    <div class="prop-detail-hero-content">
      <div class="prop-detail-op-row">
        <span class="prop-badge prop-badge--${esc(p.operation)}">${esc(op)}</span>
        <span class="prop-tipo pd-hero-tipo">${esc(tipo)}</span>
      </div>
      <h1 class="prop-detail-title">${esc(detailTitle(p))}</h1>
      ${
        address
          ? `<p class="prop-detail-loc-hero">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
        <span>${esc(address)}</span></p>`
          : ''
      }
    </div>
  </div>

  <section class="prop-detail-body">
    <div class="container">
      <div class="prop-detail-grid">
        <div>
          ${galleryHtml(p.photos)}
          ${
            paragraphs.length
              ? `<h2 class="prop-detail-desc-title">Descripción</h2>
          <div class="prop-detail-desc">${paragraphs.map((t) => `<p>${esc(t)}</p>`).join('')}</div>`
              : ''
          }
          ${
            map
              ? `<h2 class="prop-detail-desc-title pd-map-title">Ubicación</h2>
          <div class="prop-detail-map" aria-label="Mapa de ubicación">
            <iframe src="${esc(map)}" title="Ubicación de la propiedad" loading="lazy" allowfullscreen class="pd-map-iframe"></iframe>
          </div>`
              : ''
          }
        </div>

        <aside class="prop-detail-sidebar" aria-label="Información y contacto">
          <p class="prop-detail-sidebar-tipo">${esc(tipo)}</p>
          <p class="prop-detail-sidebar-op">Operación: ${esc(op)}</p>
          <p class="prop-detail-price">${esc(price)}</p>
          ${expenses ? `<p class="prop-detail-expensas">${esc(expenses)}</p>` : ''}
          ${
            specs.length
              ? `<div class="prop-detail-specs-grid">${specs
                  .map(
                    (s) => `<div class="pd-spec-chip">
                <span class="pd-spec-icon" aria-hidden="true">${s.icon}</span>
                <span class="pd-spec-label">${esc(s.label)}</span>
                <span class="pd-spec-val">${esc(s.value)}</span>
              </div>`,
                  )
                  .join('')}</div>`
              : ''
          }
          <div class="prop-detail-divider" aria-hidden="true"></div>
          <a href="${esc(whatsappUrl(whatsappText(p)))}" class="btn btn-gold btn-full prop-detail-cta" target="_blank" rel="noopener">Consultar por WhatsApp</a>
          <a href="/#contacto" class="btn btn-outline-dark btn-full prop-detail-cta">Enviar consulta</a>
          <a href="/propiedades" class="prop-detail-back-link">← Ver todas las propiedades</a>
        </aside>
      </div>
    </div>
  </section>`;
}
