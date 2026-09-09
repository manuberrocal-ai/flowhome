# FlowHome — estado integral y entrega editorial A
Fecha de corte: 7 de septiembre de 2026, 03:07 UTC.

Actualización posterior: el propietario autorizó la sustitución local de fotografías. Implementada y validada en [FH09B](FH09B_SUSTITUCION_ILUSTRACIONES_2026-09-07.md). Esa decisión ya no falta. Este informe y su inventario quedan como corte histórico; peso de los nuevos PNG, candidato y publicación siguen pendientes. No se autorizó desplegar.

Estado de ejecución posterior: objetivo marcado BLOQUEADO el 7 de septiembre tras tres turnos con la misma dependencia de decisiones/accesos del propietario y sin nueva autorización. No significa terminado. Primer paso para reanudar: acreditar permisos de imágenes o autorizar su sustitución por ilustraciones propias rotuladas; esta decisión no autoriza publicación. El heartbeat sigue pausado y no se afirma trabajo en segundo plano.

**Resultado: desarrollo local validado; entrega NO LISTA PARA PUBLICAR.** El objetivo completo sigue abierto. El corte anterior FH13A es histórico y no describe los bytes actuales.

## Objetivo y alcance

Construir un sitio editorial de hogar inteligente para Estados Unidos, confiable, útil y medible. Primero A: catálogo, guías, comparaciones, cuestionario, calculadora y guardado anónimo, con compra directa y límites explícitos. Después B: datos comerciales autorizados y vigentes, adquisición/revisión durable y automatizaciones observadas. No confundir documentación, simulación o prueba local con acceso real o publicación.

Herramientas existentes: Astro/TypeScript y Tailwind para el sitio; Node para validadores y automatización; pruebas automatizadas y navegador Edge/Playwright; GitHub Actions para el flujo preparado de calidad; Cloudflare Pages como destino previsto; Supabase/PostgreSQL y Amazon Creators API para funciones conectadas aún sujetas a acceso/aprobación. No se agregó infraestructura, plugin ni dependencia para este paquete. El sitio y su documentación están en inglés; el seguimiento del proyecto, en español.

## Estado comprobado ahora

- 28 fichas, 15 reviews y ocho guías dentro de una compilación de 88 páginas. No es una comprobación de las mismas rutas en producción.
- Última validación general FH20AR: 895 pruebas, lint, tipos y build aprobados; tipos sobre 344 archivos, cero errores/advertencias y 18 hints. No se repitió la suite en este corte documental.
- Compatibilidad local: condiciones/fuentes por campo, selección del quiz, comparaciones y relaciones temporales. Los datos caducan y se retiran; las restricciones de versión no se generalizan a un producto sin contexto.
- Pruebas de navegador recientes: comparación 18; quiz 26; ficha de relaciones 26; contrato v2 cuatro. Son alcances distintos, no una suma de cobertura de todo el sitio ni pruebas físicas de los productos.
- Presentaciones vivas sin activación pública; autorización simulada. No se instaló un proveedor aprobado ni se habilitó un endpoint público.
- Datos comerciales no verificados no se presentan como precios, ratings u ofertas actuales. Amazon conectado y medición real siguen pendientes.

## Inventario exacto de revisión

[Inventario con hashes](FH13B_INVENTARIO_LOCAL_2026-09-07.json).

| Dato | Estado |
|---|---|
| Base Git | 116e04df648d97cae9d4aae03f190e81109937ab |
| SHA de fuente final | No existe en este paquete: sourceSha null |
| Cambios al observar | 176 entradas seguidas y 452 archivos no seguidos |
| Archivos de dist | 160 |
| Tamaño local total | 15925670 bytes; no equivale a peso descargado de una página |
| Hash del inventario ordenado | 601142905d8d939cb86275b84d83cbe2d1a8ed097ca9ef9031c84d8d17f964bd |
| Entorno | local |
| Cuenta / analítica | desactivadas / desactivadas |
| Proyecto Supabase seleccionado | ninguno |
| Checkout limpio / entorno production | ambos rechazados por los verificadores reales |
| Rollback autorizado | no identificado |
| Publicable | no |

Respecto al inventario FH13A: 88 archivos con ruta conservada cambiaron, 1 se añadió y 1 se retiró de la salida generada. Se registran en el JSON de este corte. No se borraron archivos del usuario al preparar este informe. El inventario no conserva los bytes por sí solo, no demuestra procedencia de un commit limpio ni sustituye el manifiesto exigido por el flujo de publicación.

## Backlog completo

Estados tomados del registro operativo: ocho hechas, once parciales, cuatro bloqueadas por acceso, tres pendientes de aprobación, una pendiente y cinco diferidas. “Hecho” conserva el alcance de aceptación local definido en el backlog; no atribuye pruebas remotas donde no existen.

| ID | Objetivo | Estado |
|---|---|---|
| FH-00 | Dirección y registro únicos | hecho |
| FH-01 | Reconciliar V3 con main actual | hecho |
| FH-02 | Unir versión, artefacto y despliegue | hecho |
| FH-03 | Separar configuración local, staging y producción | parcial |
| FH-04 | Consolidar calidad y trabajos programados | parcial |
| FH-05 | Reconciliar vigencia comercial entre bloques | hecho |
| FH-06 | Sustituir el scoring heredado de datos manuales | hecho |
| FH-07 | Cerrar identidad y hechos del catálogo US | hecho |
| FH-08 | Cerrar revisión editorial de las 23 piezas | hecho |
| FH-09 | Validar fotos, derechos y rendimiento online | parcial |
| FH-10 | Comprobar atribución y consentimiento reales | parcial |
| FH-11 | Probar autenticación y sincronización reales | bloqueado_acceso |
| FH-12 | Revalidar SEO y accesibilidad de la entrega A | parcial |
| FH-13 | Entregar versión editorial A | pendiente_aprobacion |
| FH-14 | Resolver cuenta y entrada Amazon existentes | bloqueado_acceso |
| FH-15 | Validar las cuatro operaciones Amazon reales | bloqueado_acceso |
| FH-16 | Diseñar almacenamiento y entrega de datos vigentes | parcial |
| FH-17 | Persistir cola e idempotencia entre ejecuciones | parcial |
| FH-18 | Conectar adquisición, validación y oferta visible | bloqueado_acceso |
| FH-19 | Activar y observar revisión diaria | pendiente_aprobacion |
| FH-20 | Suministrar grafo real de compatibilidad | parcial |
| FH-21 | Observabilidad y rollback verificables | parcial |
| FH-22 | Línea de base única con ventanas comparables | parcial |
| FH-23 | Resolver inventario de dependencias y PRs abiertas | hecho |
| FH-24 | Integrar gobierno remoto y decisión de licencia | parcial |
| FH-25 | Medir sostenibilidad económica | pendiente |
| FH-26 | Evaluar CRO con tráfico suficiente | diferido |
| FH-27 | Activar lifecycle sólo con necesidad demostrada | diferido |
| FH-28 | Probar un canal de adquisición adicional | diferido |
| FH-29 | Evaluar Canadá u otros comercios | diferido |
| FH-30 | Revisiones D30, D60 y D90 | diferido |
| FH-31 | Liberar ofertas conectadas B | pendiente_aprobacion |

Los criterios completos y sus evidencias se conservan en [BACKLOG.json](BACKLOG.json). No se cerró ninguna tarea por el mero hecho de actualizar el inventario.

## Decisiones que separan el trabajo local de la publicación

1. **Imágenes:** permisos e identidad exacta no acreditados por recurso. El informe FH09A comprobó decodificación, no licencias. Govee requiere resolver la discrepancia de referencia y el tamaño observado históricamente. Falta localizar permisos o decidir una sustitución visual admitida; no asumir que acceso general a una API autoriza cada imagen.
2. **Fuente final:** revisar el conjunto de cambios, establecer un commit/candidato exacto por el proceso del repositorio y ejecutar su CI. El SHA base no incluye estos cambios.
3. **Entorno/destino/recuperación:** construir production con configuración A explícita, comprobar proyecto/dominio y un deployment ID aprobado para recuperar. No usar una referencia histórica como prueba de rollback actual.
4. **Autorización:** aprobar ese candidato, alcance y destino antes de publicar. Esta ficha no solicita ni ejecuta una aprobación genérica.
5. **Después de la publicación autorizada:** comprobar URL/SHA, rutas, compra y guardado anónimo, cabeceras y comportamiento; fechar D0. Atribución, ingresos y revisiones D30/D60/D90 requieren datos reales y tiempo.

Amazon, cuentas y analítica pueden seguir apagados para A; no son una razón para añadir servicios alternativos. Tampoco habilitarlos automáticamente porque existan implementaciones y pruebas locales.

## Prompt operativo consolidado

Continuar desde este corte y el backlog, preservando cambios. Priorizar una causa o requisito verificable de la entrega A; implementar solo trabajo local autorizado y comprobar por impacto. No reiterar búsquedas de credenciales agotadas, auditorías idénticas ni ciclos completos sin cambios. No fabricar datos reales, derechos, autorización, ingresos o evidencia de publicación. Las relaciones por versión requieren contexto real; “no verificado” no es incompatibilidad.

Preparar el candidato exacto solo cuando estén resueltas las decisiones materiales. No activar B para resolver un bloqueo de A. Publicación, cuentas, envíos, pagos y cambios de producción requieren autorización específica. Si únicamente quedan decisiones o acceso externos, conservar el estado y solicitar la acción concreta; no fingir ejecución en segundo plano ni crear un heartbeat horario.

## Juzgado integral

Valoración propia, sin revisores independientes. Producto **3/5**: A local utilizable, imágenes y candidato final pendientes. Técnica **4/5**: controles, caducidad y pruebas locales sólidos; CI/candidato y operación remotos no verificados. Datos/editorial **3/5**: incertidumbres y condiciones explícitas; fuentes aprobadas, contexto físico y permisos visuales pendientes. Operación **2/5**: sin publicación autorizada, destino/rollback actuales ni observación D0.

La guía verified-task-brief exigió volver a comprobar los rechazos de checkout/entorno y separar inventario de revisión de artefacto publicable. Próximo paso útil: resolver las decisiones de imágenes y candidato exacto; cualquier trabajo local nuevo debe corregir un hallazgo demostrado, no ampliar infraestructura para mantener actividad artificial.
