import type { Locality, Property } from './types';

export * from './types';
export * from './format';
export { fetchProperties, fetchProperty } from './service';

/**
 * Las propiedades se piden en el navegador, en cada carga de página, al catálogo
 * público de property-service (ver service.ts). Las páginas son HTML estático y
 * los scripts de src/scripts/ arman las tarjetas y la ficha (ver render.ts).
 */

export function featuredOf(all: Property[], limit = 6): Property[] {
  const featured = all.filter((p) => p.featured);
  return (featured.length ? featured : all).slice(0, limit);
}

/** Localidades con al menos una propiedad, para el filtro. */
export function localitiesOf(properties: Property[]): Locality[] {
  const byId = new Map<string, Locality>();
  for (const p of properties) if (p.locality) byId.set(p.locality.id, p.locality);
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
}
