# FH13I — destino y recuperación observados, no autorizados

Lectura autenticada de Cloudflare Pages el 2026-09-08 a las 20:22:36 UTC. [Metadatos seleccionados](FH13I_ESTADO_REMOTO_2026-09-08.json), sin variables de entorno ni secretos. No se ejecutó escritura remota, publicación, rollback, commit ni push.

## Hallazgo

El proyecto `flowhome` mantiene `main` como rama de producción y `flowhome.dev` como dominio asociado. Las publicaciones automáticas de producción están desactivadas y previews en `none`.

El despliegue canónico observado es `3e58fd68-5c13-4c5e-a5f1-d3c9b5cb821e`, exitoso, creado el 10 de agosto de 2026. Declara SHA `50bad4d9fcec8a436ddfa94763081ad06d7277ab` y **commitDirty:true**. Su SHA declarado no permite reconstruir todos los bytes publicados. Es un posible destino de recuperación que exige revisión y aprobación, no un respaldo certificado ni una restauración ensayada.

La lectura `git ls-remote` devolvió `main` en `d038534f3341cc4546e2fc8b66eb19cafdbac771`; no devolvió una referencia para la rama local consultada. La base local continúa en `116e04df648d97cae9d4aae03f190e81109937ab`, rama `improve/flowhome-v3-2026-09-04`, con cambios sin registrar. Ninguna de estas referencias identifica por sí sola la fuente exacta del candidato FH13H. No se hizo fetch ni se alteraron referencias locales.

## Comprobación pública limitada

GET sin navegador ni transmisión de eventos, 2026-09-08 a las 20:22:50 UTC:

| Ruta | HTTP | Bytes | SHA-256 recibido | Igual al candidato FH13H |
|---|---:|---:|---|---|
| `/` | 200 | 221526 | d8def299f1dfed7cf8863932470c666c539973f9dae23335bfcf5a891440718e | No |
| `/products/` | 200 | 326549 | ab5b6afad0850a8b58f0d407f5dc36fce9d06ac82ae3ef16c33631bb7f26d8c2 | No |
| `/favicon.svg` | 200 | 262 | 4def0982419aaa17987ed1e53391ae53247a9e9e3b637c8d509514286d85a202 | No |

Las respuestas conservaron las URLs solicitadas y tipos HTML/SVG esperados. La comparación fue de buffers recibidos contra los archivos locales, no una comparación visual. Tres respuestas correctas no prueban toda la web, cachés, compras, accesibilidad, cuentas ni analítica; tampoco atribuyen estos bytes a un commit limpio. No se descargaron archivos a disco.

## Próximo requisito concreto

Revisar/versionar la fuente y construir el manifiesto protegido. Revisar si restaurar el despliegue observado sería aceptable, incluyendo defectos que regresen. Revalidar su identidad justo antes de cualquier acción aprobada: esta observación fechada no reemplaza el preflight. El candidato permanece `publishable:false`; FH-13 conserva `pendiente_aprobacion` y no empieza D0.

## Juzgado propio

Producto 3/5 local: las mejoras no se atribuyen a producción. Técnica 3/5 local: detectada la separación entre tres identidades de fuente. Datos/editorial 3/5 local: metadatos mínimos y observaciones fechadas, sin secretos. Operación 2/5 integral: destino y controles revalidados por lectura; recuperación y publicación todavía no ejecutadas. No se repiten navegador completo, build ni Lighthouse porque no se cambió el sitio.
