# FH16E — permiso de disponibilidad independiente

## Contrato y cambio

La ficha de verified-task-brief fija: permisos antiguos no conceden disponibilidad; precio autorizado permanece evaluable por separado; ingreso/promoción no evaden el permiso; vencimiento exclusivo y captura propia; sin modificar permisos reales ni activar servicios.

`SourcePermission.availability` es opcional para lectura de formatos existentes, pero obligatorio para autorizar disponibilidad. Contiene identificador propio, estado, inicio, fin y TTL. El permiso padre debe seguir aprobado y sus límites temporales también se respetan. Identificador vacío o igual al permiso padre, ambigüedad, revocación, fechas inválidas/futuras, TTL inválido o superior al techo central producen rechazo. No se infiere disponibilidad de `currentPriceAllowed`.

`availabilityPermissionFor` revalida identidad y calcula el límite exclusivo con captura de disponibilidad, TTL propio y ambos vencimientos de permisos. Se usa en `ingestOffers` y `isOfferPromotable`. El ingreso recorta el vencimiento de la oferta al menor límite aplicable, incluso cuando se proporcionó un vencimiento explícito posterior. Las fechas de captura no se renuevan. La revisión administrativa consume la misma barrera y no reemplaza permiso faltante.

Archivos afectados: `src/lib/blocks/block8/evidence.ts`, `freshness.ts`, `ingestion.ts`, fixture sintética común y pruebas nuevas. Sólo las fixtures reciben permisos sintéticos explícitos. No se migraron registros, no se añadió ningún permiso a datos reales y no se cambiaron identidades de claves existentes.

## Evidencia de verificación

-16 pruebas dirigidas iniciales correctas, incluyendo regresiones de evidencia anteriores.
-981/981 pruebas generales, lint correcto.
-Después se añadió el caso de captura propia y la aserción de revisión administrativa:5/5 pruebas del archivo final correctas y lint dirigido repetido. No se presenta como suite general de982 ejecutada.
-Tipos429 archivos:0 errores,0 advertencias,18 hints existentes.
-Build88; SEO88,0 errores/advertencias; diff-check correcto.
-Pruebas cubren permiso ausente, revocado, desconocido, ambiguo, identificador inválido, fecha inválida, inicio posterior a captura, límite exacto de TTL, TTL inválido, captura futura, captura independiente, plazo explícito recortado y rechazo administrativo. El precio sigue válido en la prueba sin permiso de disponibilidad.

No se repitió navegador: no se conectaron estos módulos a componentes o rutas públicas y el cambio no modifica interfaz. A conserva su barrera estática; build no prueba permisos reales ni transporte. Sin push, PR nueva, migración o publicación.

## Juzgado propio y siguiente paso

Producto2/5 integral B: evita promociones que usan disponibilidad no autorizada, sin ofrecer todavía datos vivos. Técnica3/5 local para este cambio: ingreso/promoción/administración comparten el rechazo y los límites están probados. Datos/editorial2/5 integral: derechos por campo empiezan a separarse, pero rating, precio anterior y permisos reales siguen pendientes. Operación2/5 integral: compatibilidad conservadora, sin migrar ni activar; registros sin nuevo permiso dejan de ser promocionables y requieren revisión, no un relleno automático.

FH16D conserva el hallazgo previo; esta etapa resuelve su herencia de precio hacia disponibilidad en Block8. Todavía faltan evidencia y permisos de rating/otros campos, proyección autorizada del servidor, transporte efímero, cuotas y retirada de cliente. No registrar un endpoint que omita esas barreras. FH-16 sigue parcial.
