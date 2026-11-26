import type { Operation, Property, PropertyType } from './types';

export const TYPE_LABEL: Record<PropertyType, string> = {
  casa: 'Casa',
  chalet: 'Chalet',
  duplex: 'Dúplex',
  departamento: 'Departamento',
  ph: 'PH',
  local: 'Local',
  oficina: 'Oficina',
  galpon: 'Galpón',
  lote: 'Lote',
  campo: 'Campo',
  cochera: 'Cochera',
  otro: 'Propiedad',
};

export const OPERATION_LABEL: Record<Operation, string> = {
  venta: 'VENTA',
  alquiler: 'ALQUILER',
};

const number = new Intl.NumberFormat('es-AR');

export function formatPrice(p: Property): string | null {
  return p.price ? `${p.price.currency} ${number.format(p.price.amount)}` : null;
}

export function formatExpenses(p: Property): string | null {
  return p.expenses ? `Expensas: ARS ${number.format(p.expenses)}` : null;
}

/** "Calle 123, Localidad". */
export function formatAddress(p: Property): string {
  return [p.street, p.locality?.name].filter(Boolean).join(', ');
}

/** Resumen corto para la tarjeta: "277 m² · 3 dorm. · 3 baños". */
export function cardSpecs(p: Property): string {
  const parts: string[] = [];
  const area = p.coveredArea ?? p.totalArea;
  if (area) parts.push(`${number.format(area)} m²`);
  if (p.bedrooms) parts.push(`${p.bedrooms} dorm.`);
  if (p.bathrooms) parts.push(`${p.bathrooms} baño${p.bathrooms > 1 ? 's' : ''}`);
  return parts.join(' · ');
}

export interface SpecChip {
  icon: string;
  label: string;
  value: string;
}

/** Datos de la ficha. */
export function detailSpecs(p: Property): SpecChip[] {
  const specs: SpecChip[] = [];
  if (p.rooms) specs.push({ icon: '🛋', label: 'Ambientes', value: String(p.rooms) });
  if (p.bedrooms) specs.push({ icon: '🛏', label: 'Dormitorios', value: String(p.bedrooms) });
  if (p.bathrooms) specs.push({ icon: '🚿', label: 'Baños', value: String(p.bathrooms) });
  if (p.garage) specs.push({ icon: '🚗', label: 'Cochera', value: p.garage });
  if (p.totalArea) specs.push({ icon: '📐', label: 'Sup. total', value: `${number.format(p.totalArea)} m²` });
  if (p.coveredArea) specs.push({ icon: '📏', label: 'Sup. cubierta', value: `${number.format(p.coveredArea)} m²` });
  return specs;
}

/** La ficha es una sola página estática que lee el id de la URL. */
export function propertyUrl(p: Pick<Property, 'id'>): string {
  return `/propiedades/ficha?id=${encodeURIComponent(p.id)}`;
}

export function whatsappText(p: Property): string {
  const address = formatAddress(p);
  return (
    `Hola, me interesa la propiedad: ${TYPE_LABEL[p.type]}` +
    (address ? ` en ${address}` : '') +
    ` (${OPERATION_LABEL[p.operation]}). Código ${p.code}. ¿Podría darme más información?`
  );
}
