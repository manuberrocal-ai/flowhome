# FH13M — recursos públicos con finales de línea definidos

Se corrigió la variación de checkout detectada en FH13L mediante `.gitattributes`: `public/** text=auto eol=lf`. La detección automática conserva binarios. Se normalizaron sólo finales CRLF de recursos textuales existentes, sin cambiar contenido, imágenes, rutas ni diseño.

La nueva prueba usa un repositorio temporal real con core.autocrlf=true y checkout-index: cuatro rutas de texto, incluyendo archivo sin extensión, SVG y .well-known, salen LF; un binario conserva exactamente sus bytes. Prueba y lint dirigido correctos. No se instala ninguna dependencia.

Checkpoint local sucesor: `5cc6c95cafb78993b3f04cd4a074139e680ef21c`, rama `review/flowhome-local-20260908-fh13m`. Frente a FH13L sólo cambia .gitattributes y la prueba: los blobs de contenido público ya estaban normalizados en Git. Se usó índice independiente, sin mover la rama de trabajo ni enviar commits.

Checkout limpio separado `C:\AGENTES\Proyectos\flowhome-review-fh13m`, dependencias existentes reutilizadas por junction. Build production con auth/analytics false:88 páginas; SEO88 sin errores/advertencias, status limpio. [Inventario](FH13M_CANDIDATO_2026-09-08.json):421 archivos,136708531 bytes, árbol `a4496fa28e97c0000353e953dac041fe7ec2ac2722ad173848e41b71108a48c5`.

Respecto al checkout FH13L,28 archivos cambian únicamente LF/CRLF, comprobado por contenido normalizado, y393 conservan el hash exacto. No hay cambios binarios ni semánticos detectados en esa comparación. No se afirma igualdad binaria con candidatos anteriores ni reproducibilidad de una instalación fresca/Linux: la prueba local establece la política de checkout y esta construcción concreta.

No se repitió la suite completa de970 pruebas, navegador ni Lighthouse: sólo cambian atributos de Git, formato y su prueba específica. Build/SEO se repitieron porque se modifican bytes copiados al artefacto. El candidato sigue publishable:false y sourceReviewApproved:false; no hay aprobación, publicación, push ni activación de servicios.

Juzgado propio: producto3/5 local (misma experiencia); técnica3/5 local (variación de checkout corregida y comprobada); datos/editorial3/5 local (contenido y binarios conservados); operación2/5 integral (fuente exacta y build limpio, revisión final/integración/manifiesto/aprobación todavía pendientes). FH-13 no se cierra.
