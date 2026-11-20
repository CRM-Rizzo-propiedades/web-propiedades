/** Datos de la inmobiliaria que se repiten en todo el sitio. */
export const site = {
  name: 'Rizzo Propiedades',
  url: 'https://www.rizzopropiedades.com.ar',
  tagline: 'Propiedades que inspiran.',
  taglineEm: 'Experiencias que perduran.',
  address: 'Amancio Alcorta 112',
  city: 'Lanús, Buenos Aires',
  phones: [
    { label: '(011) 4241-2468', href: 'tel:01142412468' },
    { label: '+54 11 3080-4156', href: 'tel:+5491130804156' },
  ],
  email: 'info@rizzopropiedades.com.ar',
  /** Número de WhatsApp, solo dígitos (wa.me). */
  whatsapp: '5491130804156',
  hours: 'Lun – Vie: 10:00 – 13:00 y 15:00 – 18:00',
  hoursShort: 'Lun–Vie 10–13 y 15–18',
  social: {
    instagram: 'https://instagram.com/rizzopropiedades',
    facebook: 'https://www.facebook.com/rizzopropiedadesok/',
    tiktok: 'https://www.tiktok.com/@rizzopropiedades',
    youtube: 'https://www.youtube.com/@rizzopropiedades',
  },
} as const;

export function whatsappUrl(text?: string): string {
  const base = `https://wa.me/${site.whatsapp}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
