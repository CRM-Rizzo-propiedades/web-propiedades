/**
 * Una propiedad tal como la muestra el sitio.
 *
 * Es independiente de la fuente: `service.ts` convierte el catálogo público de
 * property-service a esta forma; el sitio no conoce los códigos de Hammer.
 */
export type Operation = 'venta' | 'alquiler';

export type PropertyType =
  | 'casa'
  | 'chalet'
  | 'duplex'
  | 'departamento'
  | 'ph'
  | 'local'
  | 'oficina'
  | 'galpon'
  | 'lote'
  | 'campo'
  | 'cochera'
  | 'otro';

export interface Money {
  amount: number;
  currency: 'USD' | 'ARS';
}

export interface Locality {
  id: string;
  name: string;
}

export interface Property {
  /** Identificador público (aparece en la URL de la ficha). */
  id: string;
  /** Código visible (en Hammer, su número): el que conoce la inmobiliaria. */
  code: string;
  operation: Operation;
  type: PropertyType;
  /** El título cargado en Hammer o en el panel; null si no tiene. */
  title: string | null;
  /** Calle y altura, sin la localidad. */
  street: string | null;
  locality: Locality | null;
  /** null: "Consultar precio". */
  price: Money | null;
  /** Expensas mensuales en ARS. */
  expenses: number | null;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  /** Tipo de cochera ("Garage", "Doble"...); null si no tiene. */
  garage: string | null;
  totalArea: number | null;
  coveredArea: number | null;
  creditEligible: boolean;
  description: string;
  /** URLs de las fotos; la primera es la principal. */
  photos: string[];
  location: { lat: number; lng: number } | null;
  /** Destacada en la página de inicio. */
  featured: boolean;
}
