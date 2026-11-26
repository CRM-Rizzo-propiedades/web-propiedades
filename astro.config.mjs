// @ts-check
import { defineConfig, envField } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.rizzopropiedades.com.ar',
  env: {
    schema: {
      // URL base de property-service. El navegador la usa para pedir el catálogo
      // público (/web/properties), que no requiere login.
      PUBLIC_PROPERTY_SERVICE_URL: envField.string({ context: 'client', access: 'public', url: true }),
    },
  },
});
