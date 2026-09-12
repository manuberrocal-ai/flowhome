# FlowHome — configuración por entorno

FH-03, 5 de septiembre de 2026. Implementación **APROBADA LOCAL, 3/5**; estado de los proyectos Supabase reales pendiente. No habilita servicios ni autoriza publicación.

## Configuración única

La integración Astro usa el cargador de Vite y `scripts/config/environment.mjs` para validar y producir la misma configuración pública para construcción y navegador. No hay URL, clave o cliente Google de respaldo ni sobrescritura desde HTML.

`PUBLIC_APP_ENV` admite `local`, `staging` y `production`. **No es `NODE_ENV` ni el modo Vite.** Un build optimizado de modo Vite production sin selector explícito sigue siendo un artefacto local sin servicios. No autoriza publicar.

Vite carga `.env`, `.env.local` y los archivos del modo. Para staging: `npm run build -- --mode staging`, con configuración en `.env.staging.local`; las variables del proceso tienen prioridad. `.env.*` están ignorados excepto `.env.example`. El `.env` previo se conservó: sus valores no activan automáticamente los servicios. No copiar credenciales entre entornos.

## Matriz y estado real

| Perfil | Requisitos | Observación |
|---|---|---|
| Local | Selector ausente o local. Cuenta/analítica apagadas por defecto. Cuenta opcional sólo contra localhost, 127.0.0.1 o ::1 | Build y guardado anónimo verificados; no se inició base local ni se probó login |
| Staging | Selector staging; analítica apagada. Cuenta requiere referencia esperada, URL HTTPS exacta y una clave pública | Build con fixture verificado. Proyecto real **NO VERIFICADO**: dashboard pidió iniciar sesión el 5 septiembre |
| Production | Selector production; servicios apagados salvo habilitación explícita. Cuenta requiere su propia referencia | Build editorial verificado localmente. Pages conserva la publicación anterior observada en FH-02. Supabase actual **NO VERIFICADO** |

Los informes de agosto documentaron staging con migraciones 001–008 y producción pausada. Son antecedentes, no estado actual. No se seleccionaron referencias reales basándose en claves viejas o fixtures. El propietario debe autenticar la sesión para una lectura acotada de sus proyectos.

## Variables

| Variable | Regla |
|---|---|
| `PUBLIC_APP_ENV` | local, staging o production |
| `PUBLIC_AUTH_ENABLED` | false por defecto; true exige configuración completa |
| `PUBLIC_SUPABASE_URL` | Origen sin credenciales, ruta, consulta ni fragmento; hospedado requiere HTTPS y referencia exacta |
| `PUBLIC_SUPABASE_PUBLISHABLE_KEY` o `PUBLIC_SUPABASE_ANON_KEY` | Exactamente una. Publishable o JWT legacy anon; el JWT hospedado debe declarar la referencia esperada |
| `FLOWHOME_SUPABASE_STAGING_REF` | Referencia de staging revisada, sólo para construcción |
| `FLOWHOME_SUPABASE_PRODUCTION_REF` | Referencia de producción revisada; distinta de staging cuando ambas estén declaradas |
| `PUBLIC_GOOGLE_CLIENT_ID` | Opcional; si falta no se carga Google Identity |
| `PUBLIC_ANALYTICS_ENABLED` | false por defecto; true sólo en production y con GTM y GA4 revisados |
| `PUBLIC_GTM_ID`, `PUBLIC_GA4_ID`, `PUBLIC_CLARITY_ID` | Sólo se proyectan con medición habilitada; consentimiento sigue siendo obligatorio. GA4 debe coincidir con el destino del contenedor para permitir parada inmediata; Clarity es opcional |

Una publishable key es opaca: el formato no prueba pertenencia al proyecto. Decodificar JWT no prueba firma, acceso real ni RLS. Las referencias declaradas necesitan revisión, no prueban propiedad por sí solas. Antes de habilitar cuenta, FH-11 debe comprobar proveedor, redirects, políticas y recorrido con cuenta autorizada. No enviar OTP como diagnóstico automático.

Se rechazan nombres públicos sensibles, claves `sb_secret_` y JWT privilegiados/de usuario sin imprimir valores, incluso con cuenta apagada. Es una comprobación acotada, no un escáner exhaustivo de secretos. Claves de servicio y Amazon sólo van en los almacenes de servidor, nunca en `PUBLIC_*`.

## Artefacto, cabeceras y CI

Cada build genera `release-environment.json`: esquema, entorno, flags y referencia pública o null. No incluye claves. FH-02 lo protege con su inventario SHA-256; publicar exige una marca de producción válida. Se rechazan artefactos local/staging antes de acceder a Cloudflare.

El CSP fuente no fija un proyecto: la construcción agrega únicamente el origen seleccionado si cuenta está habilitada. Staging recibe noindex/nofollow en HTML y cabecera; esto no sustituye control de acceso. Preview local no emula cabeceras Pages: se verifican también los bytes de `_headers`.

Quality Check y revisión diaria construyen como local, con servicios apagados. Batched Deploy construye production, mantiene cuenta apagada hasta FH-11 y permite medición sólo con la variable explícita correspondiente. Los cambios de CI siguen locales, sin ejecución remota. Variables de Cloudflare/Wrangler no modifican un artefacto estático construido previamente en GitHub: cambiar configuración requiere construir, verificar y aprobar un artefacto nuevo.

## Fallos y recuperación

Un servicio habilitado con datos faltantes hace fallar el build: corregir configuración o preparar explícitamente una versión editorial sin ese servicio, sin prometerlo en la interfaz. Para revisión local sin integraciones, ambos flags deben ser false. Esto no cambia producción. La recuperación de una publicación sigue el procedimiento de integridad y exige aprobación concreta.

Fuentes: [variables Astro](https://docs.astro.build/en/guides/environment-variables/) y [claves Supabase](https://supabase.com/docs/guides/getting-started/api-keys), contrastadas con el código instalado. Fixtures y builds no sustituyen la observación de las cuentas del propietario.
