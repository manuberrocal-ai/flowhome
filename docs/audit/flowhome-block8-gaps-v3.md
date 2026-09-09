# FlowHome V3: corrección de las brechas de Block 8

Fecha de verificación local: 2026-09-04. Estado: **B8-01..06 corregidos y verificados localmente; sin activación comercial**. Las reproducciones de B8-01..06 que siguen documentan el estado anterior al parche; no describen resultados vigentes después de la corrección. Este trabajo no autoriza APIs, cuentas, scraping, retención de contenido ni despliegues. Los ejemplos y permisos de prueba son sintéticos y se ejecutaron sin red.

## Decisión y alcance

La auditoría encontró que las pruebas anteriores no demostraban los controles necesarios de identidad, procedencia, permisos y vigencia. El parche agrega controles y regresiones explícitas. El ciclo diario V3 y la proyección pública de `src/lib/commerce-data.ts` conservan sus controles independientes: este encargo no los conecta con Block 8.

La política conservadora adoptada en V3 permite datos comerciales Amazon autorizados durante menos de 24 horas, sin convertir un precio manual en vigente ni asumir derechos de feeds desconocidos. Una ventana de caché no autoriza un historial comercial Amazon de 30, 90 o 180 días. Cualquier almacenamiento histórico exige primero una base de permisos explícita; no basta con cambiar una constante. Referencia de política utilizada por la revisión principal: [Amazon Associates Program Policies](https://affiliate-program.amazon.com/help/operating/policies).

## Reproducciones anteriores al parche y criterios de cierre

Todas las referencias de línea corresponden al árbol local revisado, no a una versión publicada. Instante fijo usado: `now = 2026-09-04T12:00:00Z`; captura reciente: `2026-09-04T11:00:00Z`.

### B8-01 — La oferta puede renovar un snapshot manual antiguo

Evidencia: `src/lib/blocks/block8/ingestion.ts:92` conserva en el contrato del registro sólo ID, variante, comerciante, precio y anomalía; `:204` valida esos campos, pero no la fuente, captura, mercado o moneda del snapshot. `src/lib/blocks/block8/admin.ts:58` usa el estado promocionable sin recargar la evidencia.

Reproducción: registrar `old-manual`, variante `v1`, comerciante autorizado `m1`, precio sintético `88`, fuente `manual`, captura `2020-01-01T00:00:00Z`, sin anomalía. Ingresar una oferta `amazon-creators-api` con la misma identidad/precio, `snapshotId: old-manual`, captura reciente, stock reciente y vencimiento válido `2026-09-04T13:00:00Z`. Resultado observado: `inserted`, `pending_review`. `applyOverride` con `override_promote` devuelve `applied`; la fuente/captura del snapshot no impiden el ascenso.

Cierre: exigir evidencia enlazada existente y vigente, con identidad completa (variante, comerciante, mercado, moneda), procedencia exacta y permisos de uso. Validar de nuevo al promover y puntuar. Una revisión humana no debe ampliar derechos ni renovar una captura. Pruebas negativas: snapshot manual, caducado, futuro, mercado/moneda distintos o procedencia incompatible; positiva: snapshot autorizado íntegro.

### B8-02 — Vencimiento inválido pasa a ser ausencia de vencimiento

Evidencia: `src/lib/blocks/block8/ingestion.ts:329` usa `toStrictUtc(input.expiresAt ?? null)`; el resultado `null` se entrega a frescura. `src/lib/blocks/block8/freshness.ts:45` no distingue dato ausente de dato inválido.

Reproducción: con la oferta del caso anterior, suministrar `expiresAt: 'not-a-date'`. Para aislar esta brecha se repitió también con un snapshot reciente de fuente `amazon-creators-api`. En ambos casos el resultado observado es una entidad insertada con `expiresAt: null`, `pending_review`; `override_promote` devuelve `applied`.

Cierre: si el vencimiento fue suministrado pero es inválido, rechazar la fila o mantener estado no publicable con razón específica. Validar orden captura/vencimiento y el tope permitido por fuente. Cubrir fecha inválida, calendario inválido, vacío, vencimiento anterior o igual a captura, fecha futura excesiva y límite exacto de expiración. La ausencia debe tener una política explícita; nunca equivaler silenciosamente a un permiso sin límite.

### B8-03 — Historial ajeno y duplicado produce “mínimo verificado”

Evidencia: `src/lib/blocks/block8/scoring.ts:64` no recibe identidad o fuente de la oferta; `:66` reduce el historial a precio/anomalía/captura. `:85` cuenta filas sin identidad ni deduplicación y `:137` permite la afirmación con tres filas. `src/lib/blocks/block8/freshness.ts:95` sólo exige un `lastSnapshotId` no vacío, sin resolverlo.

Reproducción: oferta activa/aprobada, precio `88`, lista `140`, stock/captura recientes, `lastSnapshotId: 'does-not-exist'`, fuente `Unknown`. Repetir tres veces el mismo snapshot con ID `same-repeated`, variante/comerciante de otro producto, fuente `Unknown`, precio `120`, captura reciente y `anomaly: false`. Resultado observado de `computeDealScore`: `label: 'lowest_price'`, `verified: true`, `confidence: 'high'`.

Cierre: transportar y verificar procedencia e identidad hasta el punto de puntuación; resolver el snapshot de respaldo, contar observaciones únicas realmente autorizadas y validar precios finitos positivos. No emitir mínimos históricos con datos cuya licencia no permita conservarlos/compararlos. Pruebas negativas: otra variante/comerciante/mercado/moneda, fuente desconocida, ID inexistente, filas duplicadas y números inválidos; positiva: evidencia suficiente permitida y coherente. “Unknown” debe permanecer desconocido.

### B8-04 — Resolución ambigua entre mercados depende del orden

Evidencia: `src/lib/blocks/block8/ingestion.ts:127` no recibe mercado; `:134` devuelve la primera coincidencia por identificador y tipo.

Reproducción: dos variantes con ASIN sintético `B0FIXTURE01`, una US/USD (`v1`) y otra CA/CAD (`v-ca`). `resolveVariant` devuelve `v1`; al invertir el registro devuelve `v-ca`. Ambas respuestas dicen `resolved`.

Cierre: incorporar mercado (y comerciante cuando aplique) a la identidad de resolución, rechazar ambigüedad y no depender del orden de entrada. Cubrir ASIN compartido entre mercados y duplicados contradictorios dentro del mismo mercado. Mantener la prohibición de coincidencia difusa por nombre.

### B8-05 — La clave idempotente pierde los límites entre campos

Evidencia: `src/lib/blocks/block8/ingestion.ts:105` concatena implícitamente los caracteres de cada parte en un FNV de 32 bits, sin estructura ni tipos. `src/lib/blocks/block8/admin.ts:77` repite la misma composición para auditoría. Los consumidores `src/lib/blocks/block10/operations.ts`, `analytics.ts` y `admin.ts` importan la clave de ingestión.

Reproducción: `buildIdempotencyKey('example', ['ab', 'c'])` y `buildIdempotencyKey('example', ['a', 'bc'])` producen exactamente `example:1a47e90b`. No es una colisión probabilística: ambos inputs generan el mismo flujo de caracteres.

Cierre: serialización canónica con límites/tipos inequívocos y estrategia de unicidad adecuada al almacenamiento; verificar contenido al detectar duplicado. Diseñar migración/versionado para registros existentes antes de cambiar IDs persistidos. Cubrir particiones ambiguas, tipos `1` frente a `'1'`, duplicación legítima, concurrencia y compatibilidad de Block 10. No modificar sólo un constructor y dejar la copia de auditoría incoherente.

### B8-06 — Tiempo y retención no comparten la política pública V3

Evidencia: `src/lib/blocks/block8/domain.ts:315` define precio de siete días; `:321`, historial de noventa días. `src/lib/blocks/block8/freshness.ts:44` incluye el instante final (`<=`). `src/lib/blocks/block8/domain.ts:66` normaliza fechas imposibles; `src/lib/blocks/block8/freshness.ts:39` serializa `now` sin comprobar validez.

Reproducciones observadas:

- `isPriceSnapshotFresh({ capturedAt: '2026-09-02T12:00:00Z' }, now).fresh` devuelve `true` a las 48 horas.
- `toStrictUtc('2026-02-30T12:00:00Z')` devuelve `2026-03-02T12:00:00.000Z`.
- `isPriceSnapshotFresh({ capturedAt: recent }, new Date('invalid'))` lanza `RangeError`.

Cierre: separar permisos/retención por fuente de las reglas de scoring; datos Amazon con límite exclusivo de 24 horas y eliminación/renovación efectiva, sin historial no autorizado. Validación estricta de calendario, futuros y referencia temporal inválida con resultado no publicable, sin excepción inesperada. Probar antes, en y después del límite y revisar consumidores de los helpers compartidos en Block 9 y Block 10. Una constante de 24 horas por sí sola no resuelve las demás brechas.

## Controles implementados y contratos reutilizables

| Contrato local | Uso que conserva valor | Condición antes de uso público |
| --- | --- | --- |
| `IngestOutcome`, `summariseIngestion` | Resultados por fila y aislamiento de fallos parciales | Razones sin PAC ni secretos; no confundir `inserted` con autorizado/publicable |
| `KnownVariants`, `KnownMerchants` | Registro de identidad | Coincidencia única; autorización exacta `true`; mercado/moneda coherentes |
| `CommercialEvidenceContext`, `SourcePermission` | Evidencia completa y permisos por fuente/comerciante/mercado/moneda | Registro confiable suministrado por el llamador; no derivar permisos del payload o de una etiqueta |
| `ingestPriceSnapshots`, `ingestOffers` | Transformaciones puras y claves de contenido v2 | Snapshot manual sólo como dato local, nunca oferta actual; oferta caducada/incoherente rechazada sin precio en resultado |
| `isOfferPromotable`, `computeDealScore` | Estados y desglose explicable | Contexto enlazado obligatorio para autorizar; sin permiso histórico independiente no hay mínimo verificado |
| `applyOverride`, `verifyAuditTrail` | Descripción inmutable del cambio y auditoría | Revalidación del contexto actual; ID del objetivo coincidente; no se amplían permisos; persistencia atómica del llamador |

### Comportamiento nuevo

- B8-01: `evidence.ts` exige snapshot existente, no anómalo, con identidad, fuente, precio, precio de lista y captura exactamente coincidentes. Cada promoción/puntuación revalida el registro y su permiso; ninguna aprobación renueva una captura. Fuente manual/desconocida nunca autoriza datos comerciales actuales.
- B8-02: vencimiento inválido, anterior/igual a captura, mayor al TTL o fuera del permiso falla cerrado. Si falta, la ingestión calcula el menor límite entre captura + TTL y expiración del permiso; ausencia ya no significa vigencia ilimitada.
- B8-03: `SourcePermission.history` requiere otro `permissionId`, `floorClaimsAllowed === true` y retención explícita. Por defecto no existe permiso histórico (`FRESHNESS_WINDOWS_MS.history = 0`). Se valida cada fila contra el registro completo y se deduplica por ID, clave y observación canónica. Cambiar IDs no convierte una observación en tres. Amazon nunca supera 24 horas, incluso con una declaración de historial; el control positivo de 90 días usa únicamente un feed sintético con permiso separado, no una afirmación sobre derechos reales.
- B8-04: `resolveVariant` acepta mercado explícito; la forma anterior sólo resuelve una coincidencia única. Registros ambiguos se rechazan independientemente del orden.
- B8-05: `idempotency.ts` usa SHA-256 sobre contenido canónico y tipado, formato `prefix:v2:<64 caracteres hex>`. Los constructores incluyen campos materiales; expiración, stock, respaldo, lista, envío y cupones no se confunden con reintentos idénticos. La copia de claves de auditoría usa el mismo constructor.
- B8-06: capturas y referencias exigen UTC completo y calendario real. Ventanas actuales son exclusivas de 24 horas o menores según permiso. Referencia inválida retorna estado desconocido/bloqueado sin excepción; una fecha imposible no se normaliza a otra fecha. Block9 hereda el calendario estricto sin cambiar su ventana propia de compatibilidad.

### Compatibilidad y límite de migración

La firma de promoción conserva `offer, now` y agrega el tercer argumento opcional `evidence`; omitirlo falla cerrado. `applyOverride` agrega el mismo tercer argumento. `DealScoreInput` incorpora `evidence` y exige historial con identidad completa; inputs antiguos sin evidencia quedan desconocidos. Los registros locales heredados no se reescriben ni borran.

Si cualquiera de los conjuntos de claves suministrados a una ingestión contiene formato anterior/desconocido, se rechaza con `legacy_idempotency_migration_required`. `Block10.enqueueJob` produce el mismo error al intentar encolar sobre jobs legados y rechaza `idempotency_content_conflict` si una clave actual coincide pero el payload canónico difiere. Los trabajos existentes aún pueden reclamarse/finalizarse por sus IDs originales; no se reenvían por crear una nueva clave v2. Reconciliar o migrar datos persistidos requiere un plan autorizado, equivalencia de contenido verificada y una restricción única/transacción en el almacén. No hay migración, conexión o garantía de concurrencia durable ejecutada aquí.

SHA-256 usa `node:crypto` en el contrato **server-only** de claves. La inspección de imports no halló consumidores de Block8/Block10 desde páginas, componentes o scripts cliente; Block9 sólo toma tipos y UTC de `domain.ts`, que no importa criptografía. No importar estos contratos de claves desde un bundle cliente.

### Evidencia de validación local

- `node --test test/block8-*.test.mjs test/block9-*.test.mjs test/block10-*.test.mjs test/block11-*.test.mjs`: **216/216 PASS** después de las correcciones de revisión.
- `test/block8-evidence-regressions.test.mjs`: positivos y negativos de los seis hallazgos, incluyendo promoción tras revocación, captura reescrita, historial ajeno/duplicado, claves legadas y fronteras temporales.
- `test/block10-platform.test.mjs`: formatos nuevos compatibles, colisión de particiones eliminada, bloqueo de nuevo enqueue legado y finalización del trabajo antiguo sin alterar su ID.
- `test/block9-domain.test.mjs` y `test/block9-freshness.test.mjs`: rechazo de fecha imposible y `24:00` a través del helper compartido; un vencimiento suministrado inválido no pasa a ser ausencia ni habilita publicación/aprobación. La ventana propia de 180 días de Block9 no cambia.
- `npm.cmd run lint`: PASS después del parche.
- `npm.cmd run typecheck`: 227 archivos, 0 errores, 0 advertencias y 18 sugerencias no bloqueantes en la revisión final del árbol compartido.
- `git diff --check` sobre el alcance modificado: PASS, con avisos de conversión LF/CRLF del entorno.
- La suite completa `npm.cmd test` se intentó; en ese momento falló por `ENOENT docs/content/claim-ledger-v3.md` desde `test/editorial-claims.test.mjs`, trabajo editorial ajeno todavía en curso. No se declara aquí PASS global ni se modifica ese archivo.

La revisión independiente ejecutó 112 aserciones propias sobre las seis barreras y detectó dos bordes: el vencimiento inválido del consumidor Block9 y el payload distinto bajo la misma clave de Block10. Ambos se reprodujeron de forma independiente, se corrigieron y se cubrieron con regresiones; la suite dirigida de 216 pruebas pasó nuevamente. Esto no equivale a una segunda aprobación del revisor sobre el parche posterior.

Estos resultados no prueban autenticidad externa de permisos, licencia de un feed, almacenamiento con eliminación automática, despliegue o comportamiento público; esas capacidades siguen fuera del alcance. No fue una auditoría exhaustiva de Block8 más allá de los seis hallazgos. No se ejecutó build para preservar el `dist` de la revisión integrada del coordinador.
