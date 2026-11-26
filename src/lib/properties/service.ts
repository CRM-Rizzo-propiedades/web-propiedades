import { PUBLIC_PROPERTY_SERVICE_URL } from 'astro:env/client';
import { TYPE_LABEL } from './format';
import type { Operation, Property, PropertyType } from './types';

/**
 * Cliente del catálogo público de property-service. Corre en el navegador: el
 * endpoint no pide token, así que no hace falta un backend intermedio.
 * Las formas de abajo copian `WebProperty` / `WebPropertyList` del contrato del
 * servicio (property-service/src/contract/property-service.contract.ts).
 */
interface WebProperty {
  id: string;
  code: string;
  operation: 'RENT' | 'SALE' | 'TEMPORARY_RENT';
  propertyType: string;
  title: string | null;
  description: string | null;
  street: string | null;
  streetNumber: string | null;
  locality: { id: number; name: string } | null;
  latitude: number | null;
  longitude: number | null;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  coveredAreaM2: number | null;
  totalAreaM2: number | null;
  price: number | null;
  currency: string | null;
  expenses: number | null;
  hasGarage: boolean | null;
  creditEligible: boolean | null;
  photos: string[];
  featured: boolean;
  updatedAt: string;
}

interface WebPropertyList {
  items: WebProperty[];
  total: number;
}

const TIMEOUT_MS = 10_000;

/**
 * El catálogo se guarda en `sessionStorage` para pintar al instante en la próxima
 * navegación. Es una caché corta: el servicio ya reutiliza su listado por un minuto.
 */
const CACHE_KEY = 'rizzoprop:properties:v1';
const CACHE_TTL_MS = 5 * 60_000;

async function get<T>(path: string): Promise<T | null> {
  const url = new URL(path, PUBLIC_PROPERTY_SERVICE_URL.replace(/\/?$/, '/'));
  const res = await fetch(url, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  // 400: id con formato inválido (el servicio exige UUID). Para el sitio es "no existe".
  if (res.status === 404 || res.status === 400) return null;
  if (!res.ok) throw new Error(`property-service respondió ${res.status} en ${url.pathname}`);
  return (await res.json()) as T;
}

function readCache(): Property[] | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { savedAt?: unknown; items?: unknown };
    if (typeof parsed.savedAt !== 'number' || !Array.isArray(parsed.items)) return null;
    if (Date.now() - parsed.savedAt > CACHE_TTL_MS) return null;
    return parsed.items.filter(
      (item): item is Property =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as Property).id === 'string' &&
        typeof (item as Property).code === 'string',
    );
  } catch {
    return null;
  }
}

function writeCache(items: Property[]) {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), items }));
  } catch {
    // Modo privado o cuota llena: la caché es opcional.
  }
}

async function loadListing(): Promise<Property[]> {
  const list = await get<WebPropertyList>('web/properties');
  const items = (list?.items ?? []).map(toProperty);
  writeCache(items);
  return items;
}

let listing: Promise<Property[]> | undefined;

/** Una sola request por página aunque varios scripts pidan el listado. */
export function fetchProperties(): Promise<Property[]> {
  if (listing) return listing;

  const cached = readCache();
  if (cached) {
    // Stale-while-revalidate: se muestra ya y el catálogo fresco queda para la
    // próxima navegación. Si el refresco falla, la caché sigue sirviendo.
    listing = Promise.resolve(cached);
    void loadListing().catch(() => {});
    return listing;
  }

  listing = loadListing();
  // Si falla, el próximo llamado vuelve a intentar.
  listing.catch(() => (listing = undefined));
  return listing;
}

/** Por id (UUID) o por el número de Hammer (los links del sitio anterior). null si no está publicada. */
export async function fetchProperty(id: string): Promise<Property | null> {
  const key = id.trim();

  // Si se viene del listado, la ficha se arma sin esperar otra request.
  const cached = readCache()?.find((p) => p.id === key || p.code === key);
  if (cached) return cached;

  const item = await get<WebProperty>(`web/properties/${encodeURIComponent(key)}`);
  return item ? toProperty(item) : null;
}

const OPERATIONS: Record<string, Operation> = {
  SALE: 'venta',
  RENT: 'alquiler',
  TEMPORARY_RENT: 'alquiler',
};

function toOperation(value: string): Operation {
  const operation = OPERATIONS[value];
  if (!operation) {
    console.warn(`[propiedades] operación desconocida: ${value}`);
    return 'venta';
  }
  return operation;
}

/** Tipos del servicio sin equivalente en el sitio (edificio, hotel...) quedan como "otro". */
function toType(value: string): PropertyType {
  return Object.hasOwn(TYPE_LABEL, value) ? (value as PropertyType) : 'otro';
}

function toCurrency(value: string | null): 'USD' | 'ARS' {
  const currency = value?.trim().toUpperCase();
  if (currency === 'USD' || currency === 'ARS') return currency;
  if (currency) console.warn(`[propiedades] moneda desconocida: ${value}`);
  return 'USD';
}

function toProperty(w: WebProperty): Property {
  const type = toType(w.propertyType);
  const photos = [
    ...new Set(
      w.photos
        .filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
        .map((url) => url.trim()),
    ),
  ];

  return {
    id: w.id,
    code: w.code,
    operation: toOperation(w.operation),
    type,
    title: w.title?.trim() || null,
    street: [w.street, w.streetNumber].filter(Boolean).join(' ') || null,
    locality: w.locality ? { id: String(w.locality.id), name: w.locality.name } : null,
    price: w.price ? { amount: w.price, currency: toCurrency(w.currency) } : null,
    expenses: w.expenses || null,
    rooms: w.rooms,
    bedrooms: w.bedrooms,
    bathrooms: w.bathrooms,
    garage: w.hasGarage ? 'Sí' : null,
    totalArea: w.totalAreaM2,
    coveredArea: w.coveredAreaM2,
    creditEligible: w.creditEligible ?? false,
    description: w.description ?? '',
    photos,
    location:
      w.latitude != null && w.longitude != null ? { lat: w.latitude, lng: w.longitude } : null,
    featured: w.featured ?? false,
  };
}
