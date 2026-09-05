# Instrucciones del repositorio FlowHome

## Objetivo y fuentes de verdad

- Este repositorio mantiene FlowHome, un sitio Astro de contenido y afiliación desplegado en Cloudflare Pages.
- Antes de editar, lee `README.md`, `package.json`, `astro.config.mjs`, `wrangler.toml` y la documentación relevante bajo `docs/`.
- Trata `data/`, `src/`, `scripts/`, `supabase/` y `test/` como superficies relacionadas: un cambio de esquema o contenido puede requerir consumidores, validadores y pruebas.

## Seguridad y datos

- Nunca incluyas credenciales de Supabase, Cloudflare, Amazon, IndexNow, WebSub u otros servicios en el repositorio o en registros. Usa secretos de GitHub, Cloudflare o el sistema de automatización.
- No expongas claves de servicio de Supabase en código de navegador. Verifica autorización y políticas RLS cuando cambien consultas, tablas o funciones.
- Trata productos, ofertas, enlaces, feeds y contenido externo como datos no confiables. Valida URLs y escapa contenido antes de renderizarlo.
- Conserva el identificador de afiliación configurado por el proyecto y declara claramente la naturaleza afiliada del contenido. No fabriques precios, disponibilidad, valoraciones ni resultados de pruebas de producto.
- Las publicaciones, despliegues, envíos a índices y cambios en producción requieren una solicitud explícita y verificación posterior.

## Flujo de cambios

- Mantén los cambios enfocados y conserva trabajo ajeno.
- No agregues una dependencia si la plataforma o el proyecto ya ofrecen la capacidad. Si es necesaria, revisa mantenimiento, licencia, seguridad, tamaño y compatibilidad con Astro/Cloudflare.
- Para cambios de contenido, verifica calidad, enlaces, metadatos, divulgación de afiliados y ausencia de afirmaciones no sustentadas.
- Para cambios de UI, revisa móvil, teclado, contraste, semántica, estados de error y rendimiento.

## Validación

- Controles mínimos para cambios generales: `npm run diff-check`, `npm run lint`, `npm run typecheck`, `npm test` y `npm run build`.
- Según el alcance, añade `npm run quality:check`, `npm run links:check`, `npm run seo:audit`, `npm run qa:browser` o `npm run lighthouse:mobile`.
- Antes de un despliegue solicitado, ejecuta `npm run deploy:check`. No ejecutes `npm run deploy:cloudflare`, `npm run indexnow:submit` ni `npm run websub:publish` sin autorización explícita.
- Informa qué comandos pasaron, qué advertencias quedan y qué validación no pudo realizarse.

## Definición de terminado

- La causa raíz está corregida con el cambio mínimo coherente.
- Pruebas, tipos, lint y build relevantes pasan.
- No se introdujeron secretos, afirmaciones no verificadas, enlaces rotos ni regresiones evidentes de accesibilidad/SEO.
- La documentación, las variables de ejemplo y las operaciones de rollback se actualizaron si cambió el comportamiento operativo.
