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

let listing: Promise<Property[]> | undefined;

/** Una sola request por página aunque varios scripts pidan el listado. */
export function fetchProperties(): Promise<Property[]> {
  listing ??= get<WebPropertyList>('web/properties').then((list) =>
    (list?.items ?? []).map(toProperty),
  );
  // Si falla, el próximo llamado vuelve a intentar.
  listing.catch(() => (listing = undefined));
  return listing;
}

/** Por id (UUID) o por el número de Hammer (los links del sitio anterior). null si no está publicada. */
export async function fetchProperty(id: string): Promise<Property | null> {
  const item = await get<WebProperty>(`web/properties/${encodeURIComponent(id)}`);
  return item ? toProperty(item) : null;
}

const OPERATION: Record<WebProperty['operation'], Operation> = {
  SALE: 'venta',
  RENT: 'alquiler',
  TEMPORARY_RENT: 'alquiler',
};

/** Tipos del servicio sin equivalente en el sitio (edificio, hotel...) quedan como "otro". */
function toType(value: string): PropertyType {
  return value in TYPE_LABEL ? (value as PropertyType) : 'otro';
}

function toCurrency(value: string | null): 'USD' | 'ARS' {
  return value?.toUpperCase() === 'ARS' ? 'ARS' : 'USD';
}

function toProperty(w: WebProperty): Property {
  const type = toType(w.propertyType);
  return {
    id: w.id,
    code: w.code,
    operation: OPERATION[w.operation] ?? 'venta',
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
    photos: w.photos,
    location:
      w.latitude != null && w.longitude != null ? { lat: w.latitude, lng: w.longitude } : null,
    featured: w.featured ?? false,
  };
}
