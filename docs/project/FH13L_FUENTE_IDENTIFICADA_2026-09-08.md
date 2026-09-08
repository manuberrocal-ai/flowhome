# FH13L — fuente exacta y construcción limpia para revisión

## Resultado

Se creó una instantánea Git local del conjunto existente, sin mover la rama de trabajo ni alterar su índice. Rama de conservación `review/flowhome-local-20260908-fh13l`, commit `bb8a9942653e20e34f57a1f3c051cf0a5ed586e9`, árbol `6f18551eb947868a03b09d876de5e7ec03605d74`, 1306 archivos. Es un checkpoint de revisión, NO una aprobación semántica de todos sus cambios ni una entrega autorizada.

Antes y después se compararon HEAD y status completo del checkout original: iguales. El índice original estaba vacío y se conservó; la instantánea se preparó con un índice temporal independiente. No hubo push, merge, cambio de main ni ejecución remota. Los archivos originales siguen en su estado de trabajo. La instantánea incluye los borradores de B como fuente, no como migraciones activadas.

La revisión preliminar buscó cuatro patrones conocidos de credenciales/clave privada en archivos de texto menores de2MB: sin coincidencias. Es una heurística limitada, no escaneo exhaustivo de secretos ni certificación para publicar el repositorio.

## Construcción desde el checkpoint

Se creó checkout separado y limpio en `C:\AGENTES\Proyectos\flowhome-review-fh13l`, HEAD detached al commit exacto. Se reutilizaron las dependencias locales ya instaladas mediante junction de node_modules; no hubo instalación nueva. Por tanto, se prueba construcción desde fuente limpia, no reproducibilidad de una instalación fresca ni equivalencia con CI/Linux.

Build con production/auth=false/analytics=false:88 páginas. SEO88 páginas sin errores/advertencias. Git status vacío al terminar. [Inventario local](FH13L_CANDIDATO_2026-09-08.json):421 archivos,136708898 bytes, SHA-256 de árbol `a895765eb6ccce873a9e89ebead4bd08512b9a9134fc31da2ed7dc3f788320fa`. El registro de entorno confirma production, cuenta/analítica apagadas y Supabase null. `publishable:false`, `sourceReviewApproved:false`.

## Diferencia detectada, no ocultada

Frente a FH13H,409 archivos coinciden en hash y12 difieren exclusivamente por LF/CRLF, comprobado comparando contenido después de normalizar CRLF a LF. Son security.txt, BingSiteAuth.xml, _headers, _redirects, consent-prepaint.js, favicon.svg, humans.txt, images/quiz-qr.svg, llms.txt, opensearch.xml, robots.txt y site.webmanifest. Aumentan97 bytes en total; no se afirma igualdad binaria del candidato.

Esto localiza un requisito pendiente de reproducibilidad: fijar finales de línea para los recursos públicos antes de sellar la entrega final. No se repitió la matriz de navegador ni Lighthouse; la comparación no sustituye el smoke online del artefacto aprobado. Los resultados anteriores conservan sus superficies y fechas.

## Próximo cierre de A

Conservar ambos candidatos y este checkpoint. Normalizar la política de finales de línea, revisar fuente definitiva e integrar por el proceso del repositorio; producir manifiesto del workflow protegido y aprobar cambios/destino/rollback concretos. El checkpoint identifica el trabajo pero no sustituye esa revisión. No empieza D0, no se publica y no se reactivan servicios.

## Juzgado propio

Producto3/5 local: contenido y recorridos conservados. Técnica3/5 local: la construcción ya tiene fuente identificada y checkout limpio; dependencias/CI y bytes finales pendientes. Datos/editorial3/5 local: no se inventa revisión exhaustiva ni certeza sobre secretos. Operación2/5 integral: checkpoint recuperable y comparación trazable, sin aprobación ni despliegue. FH-13 sigue pendiente_aprobacion.
