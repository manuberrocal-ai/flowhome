# FH-16 — decisión de almacenamiento y entrega comercial
Fecha: 2026-09-06. Estado: **propuesta local revisable; no implementada ni activada**.
Contrato de trabajo: diseñar la frontera entre datos editoriales durables y contenido comercial temporal reutilizando infraestructura existente. Probar posteriormente los invariantes con datos sintéticos; no consultar Amazon, cambiar permisos, migrar bases ni publicar.

## Hechos comprobados y riesgo

- Astro genera HTML estático. getCommerceData filtra fuente/identidad/fechas durante la generación, pero eso no convierte un HTML en caducable cuando pasan horas en un despliegue/CDN.
- Block8 exige permisos revisados y captura válida; su ingreso devuelve snapshots y anomalías en memoria. No implementa por sí mismo borrado de un almacén.
- La migración 006 contiene block10_price_snapshots, block10_offers y block10_jobs. Ofertas enlazan snapshots con ON DELETE RESTRICT. Las tablas son privadas y los grants directos de servicio están revocados. Existir en SQL **no prueba migración remota aplicada**.
- El colector diario guarda ASINs y metadatos propios, no respuestas comerciales. Preservar esa frontera.
- Search y quiz serializan la proyección comercial en la compilación; producto/review/comparación pueden renderizar valores frescos de una fuente soportada. Esas superficies necesitan un gate explícito de entrega estática antes de conectar un proveedor, aunque el catálogo manual actual no los publique.
- La lista anónima ya no incorpora precios nuevos desde botones ni muestra subtotal; el normalizador todavía acepta precios heredados. No convertirlo en caché comercial.

## Decisión propuesta

**Entrega A:** HTML, JSON de búsqueda, schema, feeds, atributos y archivos de build sin precio/rating/disponibilidad adquiridos de Amazon, incluso si el dato sintético parece fresco. Mantener texto editorial y CTA normal. Añadir gate de proyección estática y prueba de artefacto antes de considerar cerrada esta etapa.

**Primera B:** priorizar funciones de servidor ya previstas en Supabase y la cola existente para metadatos propios. Sin nueva base, KV, Redis ni almacenamiento de respuestas comerciales. Endpoint futuro separado del build, sólo lectura pública de proyección mínima; adquisición autenticada en servidor, nunca token Amazon en cliente. La ubicación final depende de entorno Supabase comprobado (FH-03); esta preferencia no autoriza despliegue.

**Sin caché comercial durable inicialmente:** solicitar datos sólo dentro de cuota autorizada, revisar en memoria y descartarlos al terminar la petición; ante coste/cuota insuficiente mostrar CTA, no almacenar indefinidamente. No reutilizar una respuesta entre peticiones en esta primera versión. Esto reduce carga de purga/backup a costa de disponibilidad comercial y llamadas. No promete borrado físico instantáneo de RAM controlada por el runtime.

**Cola durable:** ASIN, referencia de identidad, intención de revisión, estado, versión y razón codificada; nunca respuesta, precio, título API, URL de imagen, cupón ni cuerpo de error. FH-17 debe reconciliar su contrato de payload con esta lista permitida, no insertar arbitrariamente en block10_jobs.

## Alternativas evaluadas

| Alternativa | Ventaja | Criterio que no satisface hoy |
|---|---|---|
| Recompilar cada hora | Reutiliza Astro | Un fallo de cron o artefacto antiguo deja datos vencidos; descartada como garantía de caducidad. |
| Snapshots comerciales en tablas 006 | Relaciones/cola existentes | No hay diseño de retención de copias/WAL/backups ni purga de dependencias; no activar con contenido Amazon. |
| Nueva caché con TTL | Menos llamadas | Nueva infraestructura/coste y borrado físico no demostrado; diferida, no necesaria para A. |
| Petición comercial sin persistencia | Menor superficie de retención, falla con CTA | Requiere presupuesto real, endpoint y permisos; preferida para ensayo B limitado, no implementada. |

## Contrato de vigencia por campo

Cada observación necesita ASIN/modelo/bundle/mercado/moneda exactos, permiso revisado ligado a fuente/cuenta/uso, captura UTC válida y fecha límite. El endpoint obtiene estos datos de su adaptador confiable; no acepta etiquetas de fuente enviadas por navegador como autorización.

effectiveExpiry = min(capturedAt + techo central del campo, capturedAt + TTL autorizado, permiso.validUntil, expiry explícito si existe).

Precio, disponibilidad y rating tienen capturas independientes; una promoción requiere todas las observaciones usadas todavía elegibles. Captura futura, reloj inválido, permiso ambiguo/revocado, identidad no resuelta, aprobación ausente o now >= effectiveExpiry: omitir el campo; no convertirlo en 0. Aprobación, reintento y rollback no renuevan capturedAt. Política central actual: techo exclusivo de 24 horas; un permiso puede reducirlo, nunca ampliarlo.

Revalidar al recibir respuesta y justo antes de enviarla. Revalidar permisos al servir, no sólo al capturar. Emitir serverTime y límites por campo, sin exponer IDs de permisos internos. No reconstruir respuesta vencida ante timeout/429/error.

## HTTP, navegador y HTML

Respuesta comercial y errores: Cache-Control: no-store; no ETag/304, stale-while-revalidate, stale-if-error ni caché de aplicación. No mezclar respuesta con archivos estáticos. Verificar cabeceras finales en todas las capas; el archivo public/_headers del sitio no demuestra cómo responderá una función separada.

Cliente: no localStorage, sessionStorage, IndexedDB, service-worker cache ni persistencia en shortlist. Sólo presentación transitoria y descartable tras respuesta; revisar derechos aplicables antes de habilitar esa presentación. HTML inicial siempre sin datos comerciales. Temporizador de retirada conservador, limpieza al ocultarse/navegar, validación al volver y antes de actualizar DOM/CTA/analítica. Calcular duración restante con referencia del servidor y tiempo monotónico; reloj local atrasado no debe ampliar la vida. Respuesta retrasada más allá del margen permitido se rechaza.

Límite explícito: temporizadores JS, pestañas suspendidas, copias descargadas y cachés no conformes impiden prometer borrado visual/físico instantáneo universal. No presentar esa promesa como cumplida. Si el requisito exige garantía absoluta de no conservar valores en cualquier cliente, mantener modalidad A sin cifras; habilitar B sólo tras acordar un criterio observable y probarlo. No usar un timer como reemplazo del gate de origen.

## Retención, purga y restauración

1. Evitar ingestión durable de contenido comercial: no insertar respuestas en snapshots/offers, reports, artefactos CI, logs, trazas o dead letters.
2. Rechazos/anomalías conservan sólo razón e ID operativo; devolver entidad en memoria no autoriza retenerla.
3. Si se propone caché durable después: definir antes retención por campo, derechos, partición y relaciones, ruta de borrado, réplicas/backups/WAL/exports y verificación con el proveedor. Un DELETE lógico o TTL visible no prueba borrado de todas las copias.
4. Falla de purga/control de permisos: deshabilitar serving y nuevas capturas; alerta redactada. No continuar acumulando datos.
5. Incidente de contenido ya persistido: localizar inventario mínimo sin imprimir valores, aislar exposición, pedir aprobación para eliminación material y aplicar procedimiento recuperable sólo donde no contradiga el permiso. No crear backups improvisados de aquello que debe eliminarse.
6. Rollback de código restaura modalidad sin ofertas. No restaurar snapshots ni artefactos comerciales viejos; una nueva captura necesita permiso vigente.
7. Metadatos propios de auditoría: plazo propuesto 30 días operativos, pendiente de aprobación/privacidad, no permiso para conservar contenido publicitario. Identificadores de usuario no son necesarios para la lectura de oferta.

## Fallos y límites operativos

API caída/cuota agotada/cuenta no autorizada → CTA, sin precio histórico. Base/permiso inaccesible → CTA, sin asumir autorización previa. Cola caída → no adquirir trabajo nuevo; no publicación automática. Revisión humana pendiente más allá de expiry → descartar contenido y solicitar nueva captura, nunca renovar fechas.

No fijar cuota, tasa, SLO ni capacidad inventados. FH-15 aporta límite real; FH-21 responsable, destino y ensayo de incidentes. Concurrencia y reintentos usan límites de proveedor compartidos; servir una oferta no debe crear una avalancha ilimitada por visitas públicas.

## Validación requerida y estado

| Criterio observable | Estado |
|---|---|
| Infraestructura existente comparada; decisión mínima, sin nuevas dependencias | Documentado |
| Separación cola durable / contenido efímero y plan de borrado/restauración | Documentado; contrato de persistencia por probar FH-17 |
| HTML/build no contiene cifras aun con fixture API fresca | PENDIENTE: gate explícito y prueba |
| Expiry antes/en/después; permiso revocado; captura futura; campos independientes | Políticas previas probadas en FH-05; transporte nuevo NO VERIFICADO |
| Sin datos en cachés/almacenamiento/logs; respuesta lenta; pestaña suspendida | NO VERIFICADO: endpoint/cliente aún no implementados |
| Cuotas reales, derechos de datos/imágenes, entorno, borrado proveedor | NO VERIFICADO: requiere cuentas/permisos |
| Incidente, rollback y tráfico del endpoint real | NO VERIFICADO: FH-18/FH-21 y aprobación específica |

FH-16 **parcial**, no cerrada por tener un documento. Siguiente paso local: gate que impida materializar contenido comercial en artefactos estáticos, con fixture fresca sintética. Después: política pura de transporte y cola idempotente sin datos comerciales. No conectar aún proveedor.

## Fuentes y juzgado

Fuentes locales: commerce-data.ts, commercial-policy.ts, Block8 evidence/freshness/ingestion, test/commerce-public-projection.test.mjs, migration 006 y config de funciones Supabase; inspección dirigida, no auditoría completa de SQL.

[Políticas Amazon](https://affiliate-program.amazon.com/help/operating/policies), versión indicada 14-04-2026, consultada 06-09-2026: distingue retención limitada de contenido no imagen/URLs, prohibición de almacenar imágenes, ASINs y restricciones de cliente; exige indicación temporal en ciertos supuestos. No demuestra derechos de esta cuenta. La propuesta evita usar el máximo permitido como objetivo de almacenamiento.

[RFC 9111 §5.2.2.5](https://www.rfc-editor.org/rfc/rfc9111.html#section-5.2.2.5): no-store restringe almacenamiento/reutilización por cachés conformes, no garantiza borrado universal ni privacidad. Por eso también se impide persistencia de aplicación.

La skill verified-task-brief estructuró contrato, alternativas y matriz de NO VERIFICADO. Juzgado propio, no panel independiente: producto 4/5 (CTA útil sin ofertas engañosas); técnica 3/5 (decisión mínima, falta implementación); datos/editorial 4/5 (permisos separados de antigüedad, sin histórico implícito); operación 2/5 (cuotas, entorno, incidentes y eliminación reales pendientes). Valoración de propuesta, no cumplimiento productivo.
