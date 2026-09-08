# FH13N — PR autorizada y corrección local verificada

## Estado remoto autorizado

El propietario autorizó únicamente subir `review/flowhome-local-20260908-fh13m`, commit `5cc6c95cafb78993b3f04cd4a074139e680ef21c`, y abrir PR contra main, sin fusionar/publicar/activar servicios. Se completó esa operación: [PR12, borrador](https://github.com/manuberrocal-ai/flowhome/pull/12). Su descripción declara el fallo posterior de validación limpia y que no está lista para fusionar.

Antes de la subida se revalidaron automatismos de Cloudflare: producción false y previews none. La primera subida falló por GITHUB_TOKEN inválido; se usó la sesión existente del mismo propietario en el keyring de GitHub CLI, sin imprimir secretos ni cambiar configuración permanente. La variable se apartó sólo en el proceso de esa operación y se restauró. No se fusionó ni se publicó la web.

Lectura remota posterior: main sigue en `d038534f3341cc4546e2fc8b66eb19cafdbac771`; la rama de PR está exactamente en `5cc6c95cafb78993b3f04cd4a074139e680ef21c`. Main es antecesor de esa fuente, sin commits exclusivos remotos en la comparación. La PR incluye1086 archivos; no se interpreta esa ausencia de divergencia como revisión semántica exhaustiva.

## Fallo detectado y causa corregida

La suite completa ejecutada en FH13M limpio falló pese a build/SEO correctos. El checkout Windows convertía a CRLF texto de fuente no cubierto por la regla limitada a public; pruebas que extraían listas con `productSlugs:\n` devolvían listas vacías. Además, el lector compartido frontmatterMarkdown sólo reconocía delimitadores LF, afectando consumidores de calidad y sindicación de Markdown CRLF.

Se amplió la política Git a todos los textos (`* text=auto eol=lf`), manteniendo detección binaria. El lector ahora admite LF y CRLF sin reescribir el cuerpo ni debilitar validaciones. Dos pruebas nuevas comprueban metadata/cuerpo en ambos formatos y delimitadores ausentes/incompletos. La prueba de checkout añade texto de fuente y README al caso de recursos públicos/binario.

## Corrección sólo local

Checkpoint `b12a60edcb8b8b729c0d1062117cdae3e0ccc0ab`, rama local `review/flowhome-local-20260908-fh13n`, checkout limpio separado `C:\AGENTES\Proyectos\flowhome-review-fh13n`. No se subió este commit ni se sustituyó silenciosamente el SHA autorizado de la PR. La nueva actualización remota necesita confirmación específica.

Resultados sobre este checkout exacto:

- 973/973 pruebas, lint correcto; tipos427 archivos,0 errores/advertencias y18 hints existentes.
- Calidad automatizada:15 reseñas pasan; no certifica veracidad editorial por sí sola. Enlaces:0 stale y5 unknown, sin enlaces rechazados; no convierte unknown en verificado.
- Build production/auth=false/analytics=false:88 páginas; SEO88 sin errores/advertencias. No instalación nueva: se reutilizaron dependencias mediante junction.
- Audit npm de dependencias de producción:0 vulnerabilidades notificadas. GitHub había señalado4 high sobre la rama predeterminada; son superficies distintas y no se cerraron alertas remotas.
- Checkout limpio y diff-check correcto. Los421 archivos coinciden exactamente con el [inventario FH13M](FH13M_CANDIDATO_2026-09-08.json), árbol `a4496fa28e97c0000353e953dac041fe7ec2ac2722ad173848e41b71108a48c5`. Se reutiliza el inventario de bytes, no la identidad de fuente antigua. No se duplica el listado de421 archivos.

La suite se repitió porque falló en fuente limpia y se corrigió la causa. No se repitieron navegador/Lighthouse: los bytes estáticos coinciden. No hay smoke online de una entrega nueva ni aprobación de release.

## Juzgado propio

Producto3/5 local: mismos bytes de interfaz, sin afirmar mejora de captación medida. Técnica3/5 local: regresión de portabilidad corregida y controles atados al nuevo commit. Datos/editorial3/5 local: metadata no se pierde con CRLF y unknown permanece explícito. Operación2/5 integral: PR borrador creada dentro de autorización; corrección todavía local y publicación pendiente de revisión/manifiesto/rollback/aprobación. FH-13 permanece pendiente_aprobacion.
