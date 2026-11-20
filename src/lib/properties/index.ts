import type { Locality, Property } from './types';

export * from './types';
export * from './format';

/**
 * Único punto por donde el sitio obtiene propiedades.
 *
 * Por ahora no hay propiedades: devuelve una lista vacía. Cuando exista el backend (una función de
 * Netlify que consulta el servicio de propiedades con sus credenciales; el schema no
 * es público), se reemplaza el cuerpo de estas funciones y nada más.
 */
export async function getProperties(): Promise<Property[]> {
  return [];
}

export async function getProperty(id: string): Promise<Property | null> {
  return (await getProperties()).find((p) => p.id === id) ?? null;
}

export async function getFeaturedProperties(limit = 6): Promise<Property[]> {
  const all = await getProperties();
  const featured = all.filter((p) => p.featured);
  return (featured.length ? featured : all).slice(0, limit);
}

/** Localidades con al menos una propiedad, para el filtro. */
export function localitiesOf(properties: Property[]): Locality[] {
  const byId = new Map<string, Locality>();
  for (const p of properties) if (p.locality) byId.set(p.locality.id, p.locality);
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
}
