# FH20AB — Preparación reproducible de la aprobación

Resultado: comprobador local de preparación, sin instalar proveedor ni aceptar autorizaciones. Estado público sin cambios. La guía Verified Task Brief llevó a distinguir evidencia documental, registros de revisión y autorización autenticada como criterios diferentes.

## Hallazgo y cambio

El setter de runtime admite un proveedor suministrado por código; su nombre no acredita quién lo aprobó. Las pruebas aisladas ya utilizan esa entrada intencionalmente. El resolutor conserva sus funciones de investigación y no se cambió para confundir aprobación editorial con evidencia técnica.
El nuevo comando `node scripts/qa/compatibility-release-readiness.mjs` emite una huella SHA-256 del snapshot y pendientes por identidad, revisión, responsable y superficie. Es un informe de preparación: **no es una barrera ejecutada por el runtime ni un mecanismo de autenticación**. No reemplaza controles de acceso ni autorización del propietario.
La huella depende del orden serializado del grafo; no es un SHA de commit ni firma de aprobación. Cambiar texto, alcance o historial cambia la huella. Los nombres de revisores, aun con veredicto aprobado, se tratan como registros no autenticados. El comando siempre termina con código nativo 2 y devuelve `publicationAuthorized: false` y `canInstallProvider: false`, incluso si todas las revisiones registradas dicen approved.

## Evidencia actual

[Paquete exacto](FH20AB_PREPARACION_PUBLICACION_2026-09-06.json), generado 2026-09-07T01:18:14.862Z. Huella: `da6295c97a21f3f99072caa6a5f4f2044606819b8260b6185b32a562aff4bf61`.
28 modelos sin identidad comercial/versionada completa; 115 relaciones sin aprobación registrada; 460 ubicaciones sin aprobación registrada y sin responsable asignado. Cero errores estructurales y cero ubicaciones indisponibles a la fecha del paquete. Cero indisponibles sólo describe resolución documental, no autorización.
La cola conserva los dos Bluetooth y las dos diferencias de alcance de FH20AA; sus fuentes y condiciones de reapertura siguen vigentes. No se repitió su investigación ni se alteraron los booleanos.

## Validación

Cinco pruebas dirigidas iniciales aprobadas; 837 pruebas completas aprobadas con la versión final. Lint aprobado; tipos: 322 archivos, cero errores/advertencias y 18 hints. Build de 88 páginas y diff-check aprobados.
Comprobación adicional del proceso hijo confirmó código nativo 2 y ambas autorizaciones falsas. PowerShell envolvió inicialmente ese código no cero como 1: se verificó el proceso Node directamente para no atribuirle un código incorrecto. No se cambió la lógica para que esta comprobación pase como un despliegue autorizado.
Se probaron identidad de snapshot, no mutación, aprobación autoafirmada insuficiente, supersesión por rechazo/pending, fechas futuras/anteriores a evidencia, responsables vacíos, caducidad, texto discordante y disputa de una sola superficie.

## Juzgado y siguiente paso

Evaluación propia 1–5: producto 4, técnica 4, datos/editorial 3, operación 2. Mejora: el número de señales no se presenta como número de autorizaciones; el paquete muestra el trabajo humano y de integración pendiente. No representa revisores independientes ni revisión física.
Siguiente tarea local: verificar la integración de revisión con componentes Astro reales de forma aislada, sin sustituir el proveedor público, sin incluir el grafo de revisión completo en el cliente y sin usar datos documentales como prueba de variante exacta. La proyección empaquetada de FH20H ya pasó: no repetirla como sustituto del render integral.
Para activar/publicar siguen siendo necesarios autorización autenticada del snapshot y sus textos condicionados, alcance comercial/hardware o presentación restringida explícita, integración de servidor aprobada y artefacto/destino/rollback autorizados. FH-20 parcial; ocho tareas hechas/24 restantes. Objetivo activo; heartbeat horario pausado.
