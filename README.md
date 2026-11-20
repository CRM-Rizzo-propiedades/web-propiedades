# web-propiedades

Sitio público de Rizzo Propiedades, hecho con [Astro](https://astro.build). Reemplaza al
sitio estático anterior (`rizzo-propiedades-web`), con la misma estética y las mismas
páginas.

## Páginas

| Ruta | Qué es |
| --- | --- |
| `/` | Inicio: hero, cifras, propiedades destacadas, servicios, nosotros y contacto |
| `/propiedades` | Listado con filtros (operación, tipo, localidad, ambientes, baños, cochera, crédito, precio). El filtro queda en la URL |
| `/propiedades/[id]` | Ficha: galería, datos, descripción, mapa y consulta por WhatsApp |

Las URLs viejas (`propiedades.html`, `propiedad.html?id=…`) redirigen desde `netlify.toml`.

## Propiedades

Todavía no hay ninguna cargada: `getProperties()` devuelve una lista vacía y las páginas
muestran un aviso. No hay conexión con el servicio de propiedades ni con Hammer.

Todo el sitio las pide por `src/lib/properties/index.ts` (`getProperties`, `getProperty`,
`getFeaturedProperties`), con la forma de `src/lib/properties/types.ts`. Cuando esté el
backend se cambia solo ese archivo. El schema de propiedades no es público, así que el
navegador nunca le habla directo: lo consulta un backend (por ejemplo, una función de
Netlify) con sus credenciales en variables de entorno.

## Formularios

Contacto y tasación usan Netlify Forms (`data-netlify`). Funcionan solo publicados en
Netlify.

## Desarrollo

```sh
npm install
npm run dev      # http://localhost:4321
npm run check    # tipos
npm run build    # genera dist/
npm run preview  # sirve dist/
```

## Deploy

Netlify con `netlify.toml`: `npm run build` y publica `dist/`.

Las fotos de `public/img` son de stock con licencia Creative Commons; los créditos están en
`src/data/image-credits.json`.
