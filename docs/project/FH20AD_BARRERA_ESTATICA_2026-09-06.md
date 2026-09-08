# FH20AD — Impedir que el HTML estático congele evidencia vigente

Resultado: la compilación normal rechaza un grafo de compatibilidad instalado y habilitado. La entrega editorial con proveedor nulo sigue compilando. No hay activación ni despliegue.

## Causa y protección

El resolutor evalúa vigencia al ejecutarse. En la entrega Astro estática eso sucede al construir: una página ya publicada no ejecuta otra vez ese reloj. Un cron de reconstrucción, una fecha impresa o un temporizador del cliente no hacen que el HTML anterior desaparezca de cachés, lectores sin JavaScript o buscadores.
La integración de entorno define `__FLOWHOME_STATIC_COMPATIBILITY__` en true, como política del build y no como variable PUBLIC configurable. Runtime lanza `STATIC_COMPATIBILITY_DELIVERY_BLOCKED` si se intenta entregar un grafo activo. El proveedor predeterminado nulo y los flags deshabilitados conservan su comportamiento. Tampoco se habilita un grafo ya vencido como atajo.
El guard cubre el camino central usado por las páginas actuales. No sustituye autenticación, revisión de fuente ni una barrera contra alguien que modifique intencionalmente el código. No se presenta como servicio de caducidad: evita esta forma insegura de activación hasta que exista la vía de entrega revisada.

## Prueba aislada y evidencia

El escenario nuevo `static-guard` inyectó el candidato sin retirar la protección: Astro abortó al renderizar una comparativa con el error esperado. La salida temporal parcial no es un artefacto publicable. El verificador devuelve éxito sólo porque constató ese rechazo concreto; otros errores siguen siendo fallos.
Los modos candidate/expired/disputed sustituyen el guard únicamente dentro de la transformación de servidor en memoria del script de revisión. No hay escape por variables de entorno ni cambio del runtime en disco. Cada uno volvió a producir 88 páginas y comprobó 115 condiciones de fichas, 52 de comparativas, 28 entradas del quiz, 21 secciones de alternativas y 27 bundles. Estos builds no son entregas aprobadas.
20 pruebas dirigidas y 839 completas aprobadas. Lint y diff-check aprobados. Tipos: 323 archivos, cero errores/advertencias y 18 hints. Build normal: 88 páginas. Comprobación adicional de ese dist: la afirmación documental Alexa de Tapo está ausente y ninguno de los 28 registros del quiz está marcado como compatibilidad verificada.
El [JSON de evidencia](FH20AD_BARRERA_ESTATICA_2026-09-06.json) conserva los destinos temporales y separa la prueba negativa de los renders de revisión.

## Dirección pendiente

Context7 corroboró en la [documentación de Astro sobre render a demanda](https://github.com/withastro/docs/blob/main/src/content/docs/en/guides/on-demand-rendering.mdx) la distinción entre generación estática y ejecución por solicitud, que requiere integración de servidor. No se instaló un adaptador ni se eligió por inferencia una migración de hosting.
Antes de retirar la barrera: fuente y snapshot aprobados; contexto exacto de mercado/superficie; comprobación de vigencia en servidor; caché que no sobrepase el dato y que respete disputas/revocación; ausencia de evidencia vencida en HTML/JSON y en clientes abiertos; fallo cerrado ante fuente no disponible; pruebas reales del transporte; aprobación específica de entrega y rollback. Las variantes o una presentación restringida por modelo requieren revisión explícita.
Siguiente trabajo local: contrato y prueba de respuesta a demanda con vigencia y caché, usando la infraestructura existente como restricción; conservar la entrega A estática y el proveedor nulo mientras la integración no esté aprobada. La revisión visual del candidato queda después de esa decisión de entrega, no como sustituto de ella.

## Juzgado

Evaluación propia 1–5: producto 4, técnica 4, datos/editorial 3, operación 2. Mejora: la configuración ya rechaza un modo que no cumpliría la vigencia prometida, en lugar de confiar sólo en instrucciones. Verified Task Brief mantuvo distintos los criterios de protección local y operación real. No hubo revisores independientes, pruebas físicas, aprobación de datos ni cambios remotos.
FH-20 parcial; ocho tareas hechas/24 restantes. Imágenes/variantes A, cuentas y autorizaciones pendientes. Objetivo activo; heartbeat horario pausado.
