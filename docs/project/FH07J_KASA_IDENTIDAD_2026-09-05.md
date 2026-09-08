# FH07J — identidad del enchufe Kasa

**Actualización posterior FH07K:** la certeza negativa sobre energía queda superada por [evidencia contradictoria del manual 2024](FH07K_EP10_INSTALACION_2026-09-05.md). El campo actual está ausente, no false; instalación ahora documentada. Este informe conserva el checkpoint anterior y sus pruebas, no el estado vigente.

## Contrato de corrección

Fecha: 2026-09-05. Alcance local autorizado: catálogo y reseña del slug existente `tp-link-kasa-smart-plug-mini`. No publicar ni renovar datos comerciales.

Problema: nombre/modelo genéricos y `energyMonitoring: true` sin respaldo; la reseña ya advertía que ese flag no estaba verificado.

Evidencia consultada:

- [Amazon, ASIN B091FXQQMQ](https://www.amazon.com/dp/B091FXQQMQ): título y descripción identifican EP10P2, paquete de dos EP10. Lectura pública recuperada por buscador, no respuesta autenticada de Creators API ni comprobación de inventario actual.
- [Kasa EP10, fabricante US](https://www.kasasmart.com/us/products/smart-plugs/kasa-smart-plug-mini-ep10): producto EP10. Su sección de contenido describe una unidad; no trasladar ese paquete al ASIN de dos unidades.
- [Respuesta de soporte TP-Link, 14 noviembre 2022](https://community.tp-link.com/en/smart-home/threads/topic/588562): EP10 sin medición de energía; distingue KP125/EP25. Es evidencia de soporte histórica, no una prueba física ni de firmware actual.

Cambio mínimo: identificar el modelo EP10 y el paquete observado EP10P2 en catálogo/reseña, retirar el flag afirmativo de energía, adjuntar fuentes y conservar rutas, ASIN, afiliación y fechas comerciales. No inferir compatibilidad de otros modelos.

Aceptación: consumidor de especificaciones/comparación sin afirmación positiva de medición; reseña distingue paquete y límites; datos comerciales intactos; pruebas dirigidas, build y revisión del resultado renderizado. Instalación permanece unknown hasta revisar manual específico; no sumar este producto a los 14 perfiles documentados todavía.

## Juzgado inicial — mismo agente, cuatro perspectivas

- Producto 2/5: elimina confusión de compra entre variantes; pendiente comprobación renderizada.
- Técnica 2/5: corrección de datos sobre consumidores existentes, sin ampliar esquema ni cambiar rutas; pendiente validar.
- Datos/editorial 2/5: fuentes diferenciadas por afirmación. Revisión de hardware, generación y firmware no comprobadas; la ficha comercial puede cambiar.
- Operación 2/5: reversible localmente, sin API ni publicación. No acredita stock, ofertas ni acceso comercial.

Dictamen inicial: REQUIERE VALIDACIÓN LOCAL. FH-07 continúa parcial; no cierra el catálogo ni la entrega A.

## Resultado verificado

APROBADO LOCAL para esta corrección acotada. Catálogo: modelo `EP10 (EP10P2 two-pack)`, energía false y tres fuentes. Reseña: identidad observada, paquete y límites explícitos. Ninguna publicación ni cambio de precio/rating/fecha comercial. Los otros 27 productos no se editaron en este bloque.

- 690/690 pruebas, cero omitidas. Primera ejecución encontró la expectativa histórica de modelo desconocido; se actualizó al modelo observado y se corrigió el detector de descargo para aceptar tanto «a» como «an», sin retirar el requisito.
- Tipos: 246 archivos, 0 errores, 0 advertencias, 18 hints existentes. Lint y diff-check aprobados.
- Build: 88 páginas. SEO: 0 errores y 0 advertencias.
- Navegador local aislado: ficha/reseña en 1440 y 390 px; HTTP 200, identidad y fuente presentes, sin desbordamiento. Reseña con límites visibles; ficha mantiene calificador conservador «Catalog: No (unverified)». Dos capturas de reseña inspeccionadas. El primer intento de captura usó un selector ambiguo entre artículo y tarjeta; se precisó sin cambiar UI.
- Auditor editorial: tres archivos, cuatro candidatos de alt vacío. Verificación en navegador: son los dos avatares ocultos en cada página, no las fotos de producto. No se validaron fotos remotas ni derechos de imagen.

Juzgado final del bloque, mismo agente: producto 3/5 (variante distinguida); técnica 3/5 (validación local); datos/editorial 3/5 (fuentes y límites trazables); operación 3/5 (reversible, sin actividad externa). FH-07 integral permanece 2/5 y parcial. Cinco tareas hechas y 27 restantes.

Siguiente acción ejecutable: manual EP10 US para instalación, con hardware/firmware desconocidos y sin inferir funciones de KP125/EP25. Luego continuar identidad/variantes del catálogo. Los 14 perfiles documentados y 14 unknown no cambian aún.
