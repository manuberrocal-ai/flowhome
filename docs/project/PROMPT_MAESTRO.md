# Prompt maestro de FlowHome — estado y ejecución

## Objetivo y autoridad

Convertir FlowHome en un sitio editorial de smart home US, en inglés, confiable, útil y medible: ayudar a elegir, comparar requisitos, guardar una selección anónima y llegar a Amazon. El objetivo comercial son comisiones de compras calificadas y costes reales medibles, no actividad de automatización ni promesas de ingresos.

Trabajar continuamente sobre el siguiente pendiente autorizado de mayor impacto. Preparar primero la entrega editorial A; seguir con datos conectados y operación B. Un bloqueo de cuenta no bloquea tareas locales independientes. No recrear esperas horarias ni afirmar trabajo en segundo plano sin ejecución real.

Proyecto: `C:\AGENTES\Proyectos\flowhome`. Conservar marca, logos, rutas, tipografías y estilo navy/teal/orange; comunicar al propietario en español. Los cambios locales reversibles y pruebas están autorizados. Publicaciones, despliegues, envíos, pagos y cambios de producción requieren autorización concreta.

## Fuentes operativas y mantenimiento

- [BACKLOG.json](BACKLOG.json): única fuente de estados, dependencias, responsables por función y criterios completos de las 32 tareas. Sus evidencias fechadas conservan el alcance de cada prueba.
- [Plan de trabajo](PLAN_DE_TRABAJO.md): vista derivada del backlog, no segunda lista manual.
- [Juzgado integral](JUZGADO_INTEGRAL.md): valoración actual y límites, sin revisores independientes inventados.
- [Prompt anterior completo](PROMPT_MAESTRO_HISTORICO_FH00B_2026-09-08.md): antecedentes preservados, no instrucciones de estado vigente.

Actualizar la sección correspondiente, no anteponer una sucesión de hitos. Los informes fechados conservan el detalle. Para sincronizar el plan, obtener la vista con `node scripts/qa/project-plan.mjs --render`, aplicarla como edición revisable y comprobar `node scripts/qa/project-plan.mjs`. Este comando sólo lee/compara o imprime; no modifica archivos. Mantener aceptación y autoridad al actualizar estados.

## Estado comprobado — candidato FH13Q y gobierno FH24A

| Área | Evidencia actual | Pendiente real |
|---|---|---|
| Fuente y entrega | FH13Q identifica2ec3e0a limpio,1368 archivos y421 artefactos iguales a la vista local; original116e04d preservado. PR12 borrador sigue5cc6c95 por lectura actual | Revisión externa/CodeQL, aprobación de actualización y publicación, manifiesto protegido/destino/rollback |
| Catálogo/editorial | 28 productos documentados, 15 reseñas y ocho guías revisadas; unknown explícito | No confundir documentación con prueba física, compatibilidad certificada o paquete comercial exacto |
| Imágenes | 28 ilustraciones específicas rotuladas y variantes responsivas; [FH09AN](FH09AN_SITEMAP_RESENAS_2026-09-08.md) registra medición de plantillas | No son fotos oficiales ni certificados de bundle; rendimiento de entrega final y permisos de datos conectados independientes |
| Interfaz | FH13Q:135/135 casos y91HTTP sobre candidato limpio, sin errores de preparación/cierre; favicon, navegación, catálogo y estados preservados | No equivale a auditoría humana exhaustiva o certificación; producción y campo pendientes |
| Calidad | FH13Q:1032 pruebas, lint/tipos/build88/SEO y controles estructurales correctos; [FH12R](FH12R_RENDIMIENTO_FH13Q_2026-09-08.md): doce muestras, presupuestos aprobados | Corregir contraste y nombres accesibles detectados; conservar evidencia histórica; campo pendiente |
| Datos comerciales | [FH16C](FH16C_LISTA_SIN_PRECIOS_2026-09-08.md): lista sin precios heredados; barrera estática conserva A sin ofertas/ratings vivos | Transporte efímero, permisos, cuotas y retiro de datos vencidos de extremo a extremo |
| Cola y decisiones | [FH17K](FH17K_AUDITORIA_APROVISIONAMIENTO_2026-09-08.md): auditoría de provisión y consumidor probados localmente, junto a decisiones/carreras previas | 012/013 fuera de migrations: alta aprobada, integración e identidad real. Fixture detenida/conservada, ejecución de decisiones revocada |
| Cuentas y Amazon | Propietario declara acceso; búsquedas autorizadas agotadas sin entrada utilizable | Ubicación/cuenta específica o sesión aprobada; no volver a rastrear secretos por rutina |
| Medición y operación | Contratos locales y lecturas históricas en backlog | Eventos, RLS/sync, costes, comisiones, incidentes y restauración reales siguen sin cierre |

## Artefactos: distinguir fuente, vista y candidato

[FH13Q](FH13Q_REVISION_ACTUALIZADA_2026-09-08.md): revisión local actual2ec3e0a,62 archivos frente a FH13P, checkout limpio con1032 pruebas/lint/tipos/build88/SEO y421 archivos inventariados.135 casos de navegador/91HTTP correctos sobre ese SHA. Inventario y calidad en docs/project; capturas/reporte en C:/AGENTES/Informes/flowhome/fh13q-browser-20260908. No acredita instalación fresca ni publicación. FH13P y anteriores son históricos conservados. PR12 sigue5cc6c95: actualizarla requiere aprobación específica, sin fusión/publicación implícita.

[FH12Q](FH12Q_ERROR_CONSENTIMIENTO_2026-09-08.md) añade respuesta accesible al fallo de guardado del consentimiento en la carpeta original:977 pruebas, build88/SEO y31 casos de navegador correctos. Dist actual cambia; los candidatos FH13M/N y su inventario no representan esta modificación. No se subió ningún cambio nuevo.

[FH13O](FH13O_NAVEGADOR_CANDIDATO_2026-09-08.md) completa navegador sobre el checkout limpio b12a60e:134/134 casos y91/91HTTP, hashes preservados y checkout limpio. Sustituye la carencia de matriz propia de ese candidato, no los resultados históricos de otros artefactos. No hubo build nuevo, publicación ni actualización de PR.

La lectura [FH24A](FH24A_GOBIERNO_REMOTO_2026-09-08.md) confirma quality/Analyze correctos y CodeQL fallido en PR12. Las reglas exigen los primeros, no el contexto CodeQL ni una aprobación humana mínima. PR12 sigue borrador/BLOCKED; no atribuir esa condición únicamente a CodeQL. Production tiene revisor, pero permite autoaprobación y bypass administrativo. Ninguna regla fue cambiada.

- [FH13N](FH13N_REVISION_PR_2026-09-08.md): PR12 autorizada en borrador apunta a FH13M (`5cc6c95`), cuya suite limpia falló. La corrección local `b12a60e` amplía LF a la fuente y admite frontmatter CRLF;973 pruebas y controles completos pasan en checkout limpio y sus421 archivos coinciden byte por byte con inventarioM. No subir esta corrección sin confirmar la actualización de la PR; no confundir fuente remota con local.

- [FH13M](FH13M_FINALES_LINEA_2026-09-08.md): checkpoint `5cc6c95cafb78993b3f04cd4a074139e680ef21c`, política LF para texto público, prueba real de checkout y build88/SEO desde copia limpia. Inventario421; diferencias con FH13L sólo de finales de línea. Candidato no aprobado ni publicable; dependencias reutilizadas.

- [FH13L](FH13L_FUENTE_IDENTIFICADA_2026-09-08.md): checkpoint local `bb8a9942653e20e34f57a1f3c051cf0a5ed586e9`, construido desde checkout limpio separado; build88/SEO correctos.421 archivos,12 diferencias sólo LF/CRLF respecto FH13H. Fuente identificada, no aprobada; dependencias reutilizadas. Normalizar finales de línea antes de sellar entrega. No mover/reutilizar las huellas anteriores como si fueran este candidato.

- `dist`: vista local reconstruida con FH12N/O/P. No es por sí sola un paquete autorizado ni un inventario inmutable.
- [FH13H](FH13H_ENTREGA_LOCAL_2026-09-08.md): candidato de revisión actualizado con FH12N/O/P, build88/SEO y smoke390/1440 correctos; inventario421 cotejado. `publishable:false`, `sourceSha:null`: no es release autorizado.
- FH13G permanece como candidato anterior preservado; su inventario describe su propia carpeta, no el código actual.
- [FH13J](FH13J_CONTROLES_ENTREGA_2026-09-08.md): la fuente operativa posterior rechaza despliegues automáticos habilitados o de estado desconocido en preflight/registro; 970 pruebas y controles generales correctos. No cambia contenido visual ni publica; debe incorporarse a la fuente definitiva revisada.
- FH13C/D/E y sus huellas son antecedentes con alcance propio. Ninguno se llama inventario vigente de `dist`.
- Producción y estado remoto: [FH13I](FH13I_RECUPERACION_2026-09-08.md) revalida por lectura proyecto, controles automáticos desactivados y despliegue canónico exitoso, pero marcado `commitDirty:true`. Tres rutas públicas responden200 y difieren del candidato. No equivale a aprobación, recuperación ensayada ni verificación online del candidato.

## Próxima secuencia

[FH16L](FH16L_SUSPENSION_PENDIENTE_2026-09-08.md): el intento de suspensión nativa no emitió freeze/resume en la sesión probada; NO VERIFICADO. No repetir ese probe sin demostrar las precondiciones del entorno. Continuar catálogo/comparación; la revisión del correo CodeQL confirmó correspondencia con las17 anotaciones previamente clasificadas, sin descartar alertas remotas.

Pendiente local B: [FH16T](FH16T_TRANSPORTE_RESERVA_2026-09-08.md) conecta transporte de cuota con lector bajo política de commit explícita:1032 pruebas correctas. No confirma JWT/PostgREST real ni su configuración; permisos/grants continúan desactivados. FH16S conserva presupuesto PostgreSQL local (12 solicitudes/3 admitidas y reinicio sin reset), no límites reales del proveedor. FH16R conserva autorización pre/post; faltan autoridad autenticada por cuenta, revisión y adquisición real. FH16P conserva comparación coordinada (84+28 comprobaciones), FH16N catálogo/ficha. FH16Q requiere entorno distinto para hidden/freeze/BFCache. No repetir búsquedas de claves ni pruebas de visibilidad fallidas sin evidencia nueva. FH13P es candidato anterior, no inventario actual. Conservar barrera estática y no activar proveedor con fixtures.

1. FH12S corrige localmente contraste y nombres accesibles de producto/tarjetas/lista. Su informe registra comprobaciones y medición dirigida, separadas de FH12R (FH13Q: cuatro rutas por tres muestras,97–99). Preparar el siguiente candidato con los cambios finales verificados; conservar2ec3e0a inmutable, ya no equivalente al árbol actual.1032 pruebas y135 casos/91HTTP corresponden sólo a FH13Q. PR12 conserva el checkpoint anterior autorizado: confirmar actualización antes de enviarlo; revisión externa, integración/manifiesto y publicación independientes.
2. Conservar FH13Q y los candidatos históricos. Sólo reconstruir en otra carpeta si cambia la fuente/configuración de entrega. Completar manifiesto y recuperación por el flujo del repositorio, sin convertir inventario local en aprobación.
3. Presentar el paquete con límites, destino y rollback identificados para aprobación concreta. No publicar ni convertir el respaldo del usuario al desarrollo en una aprobación de release.
4. Mientras falte dependencia externa, continuar FH-16/17/20 u otra tarea independiente de B con contratos y pruebas que acerquen al flujo real; no sustituir autenticación, permisos o persistencia por objetos ficticios. FH17I/J verifican decisiones y suspensión local; [FH17K](FH17K_AUDITORIA_APROVISIONAMIENTO_2026-09-08.md) añade auditoría de provisión, probada junto con el consumidor real bajo UID sintético. 012/013 siguen fuera de migrations: faltan alta con referencia de aprobación humana/evidencia revisada, rehabilitación, integración y autenticación real. La fixture fh17i conserva ejecución de decisiones revocada.
5. Verificar A online y registrar D0 sólo después del release aprobado. Activaciones comerciales, revisión diaria remota, canales y B requieren su evidencia y autorización propias. Costes, CRO, lifecycle, expansión y D30/D60/D90 mantienen todos sus criterios del backlog.

## Herramientas

Conservar Astro/MDX/Tailwind, Node/TypeScript/ESLint y las pruebas existentes; Git/GitHub para fuente y CI; Cloudflare Pages para hosting; evaluar Supabase existente para cuenta/estado durable antes de introducir otra plataforma. Amazon Creators es la integración comercial pendiente, no una conexión ya operativa. GA4/GTM/GSC y Bing se comprueban sólo en el entorno autorizado. n8n, email y multicanal no se activan por disponibilidad de herramientas. OpenCode es antecedente de configuración, no estado vivo.

Separar contenido editorial estático de datos con vencimiento. El cron no retira por sí solo datos de HTML/CDN/pestañas abiertas. No instalar dependencias o servicios por conveniencia.

## Contratos que deben conservarse

- Comprar y guardar no requieren login. La lista es única, sin cantidades, subtotales o checkout ficticio; sólo la sincronización requiere identidad.
- Un precio, descuento, rating, disponibilidad o presupuesto necesita fuente admitida, identidad exacta, mercado/moneda, fecha válida y permiso correspondiente. El dato desconocido se oculta o se explica; no se convierte en cero ni en una oferta.
- Para la política comercial actual, probar el límite exclusivo de 24 horas y fechas inválidas/futuras. No permitir siete días por un runbook antiguo. La actualización de la fecha editorial no renueva un dato comercial.
- El catálogo plano no certifica interoperabilidad: distinguir radio nativa, controller, bridge, firmware, hubs adicionales, acción soportada y bundle.
- El consentimiento debe controlar transmisión real y revocación; navegación hacia Amazon no espera a analytics. No incorporar PII o secretos a eventos, URLs o reportes.
- Conservar fuente, fecha de extracción, ventana, denominador, versión y permisos. No sumar GSC consultas con páginas ni equiparar sesiones, clics, pedidos y comisiones.
- Preservar rutas, enlaces y schema visible. Afirmaciones de autoría, pruebas físicas, ahorro, ranking y testimonios requieren evidencia. `unknown` sigue siendo unknown. Datos sintéticos no pasan al grafo/catálogo real.
- La cola conserva revisión y estado entre ejecuciones. Idempotencia incluye identidad y contenido; una aprobación no extiende el vencimiento.

## Juzgado obligatorio por tarea

Antes de editar, escribí una ficha corta: problema concreto, evidencia, cambio mínimo propuesto, superficies afectadas, aceptación y validador. Evaluá desde cuatro perspectivas sin inventar revisores independientes:

| Perspectiva | Pregunta y decisión |
|---|---|
| Producto | ¿Qué decisión o recorrido del comprador mejora y qué objetivo desbloquea? Si no hay beneficio identificable, diferir |
| Técnica | ¿La causa y los consumidores están cubiertos? ¿Preserva rutas, configuración, reversibilidad y límites? |
| Datos/editorial | ¿Las afirmaciones y métricas tienen identidad, fuente, fechas, permiso y alcance? ¿Hay unknown convertido en certeza? |
| Operación | ¿Quién lo revisa, cuánto cuesta, cómo falla y cómo se recupera? ¿Se está confundiendo un mock con un servicio? |

Emití uno de estos dictámenes: **APROBADO LOCAL**, **APROBADO EN ENTORNO REAL**, **REQUIERE CORRECCIÓN**, **BLOQUEADO POR DEPENDENCIA**, **DIFERIDO CON MOTIVO**. Registrá evidencia a favor, limitación relevante y condición pendiente; no muestres deliberación interna. Para cambios de autorización, datos comerciales o release, agregá revisión independiente si está disponible y autorizada; si la realiza el mismo agente, declaralo.

Valorá madurez de 0 a 5 con la escala del juzgado: ausente, definido, parcial, probado localmente, comprobado en entorno real, sostenido con resultados. No promedies un fallo crítico con puntos de otras etapas. “APROBADO LOCAL” nunca significa que las cuentas, campañas o ingresos están funcionando.

## Ciclo de trabajo eficiente

Elegí la primera tarea de alto impacto cuyas dependencias permitan avanzar. Investigá, cambiá, verificá, juzgá y actualizá su registro. Mantené un solo cambio principal en curso; agrupá lecturas independientes y evitá volver a escanear el proyecto entero para cada archivo.

Tras dos correcciones sobre el mismo problema sin evidencia nueva, registrá la causa pendiente y elegí otro trabajo independiente o pedí sólo el dato necesario. No repitas login, búsqueda de secretos, instalación o auditoría de red que ya falló sin nueva razón. No conviertas este límite en excusa para abandonar una corrección que sí produjo evidencia nueva.

Reutilizá sólo evidencia íntegra correspondiente al código, configuración y modalidad comprobados; consultá los contratos actuales de FH-04. No inferir un resultado nuevo desde un conteo o una fecha antigua.

No hace falta ejecutar Lighthouse y 134 casos por una corrección exclusivamente documental. Tampoco alcanza una prueba de presencia de una cadena para aprobar un flujo remoto. Seleccioná el control que puede refutar el defecto y completá después los controles del proyecto que correspondan.

## Verificación y definición de terminado

Para código general: pruebas dirigidas y luego `npm test`, lint, tipos, build y diff-check según instrucciones vigentes. Para contenido: hechos, calidad, enlaces, render, schema e inventario SEO. Para UI: estados afectados, teclado, movimiento reducido y la matriz relevante; para la entrega completa, siete tamaños y 134 casos existentes o cobertura equivalente justificada.

Para rendimiento de release: cuatro rutas representativas por tres muestras, medianas mínimas 90/95/95/95, LCP ≤2500 ms, CLS ≤0,1 y TBT ≤200 ms. Mantener perfil offline reproducible y medición online separada. No presentar TBT como INP ni Lighthouse como datos de usuarios reales. La home tenía poco margen; una integración de terceros requiere revalidación.

Para API/datos: respuestas reales acotadas, identidad, permisos, cuotas, errores, reintento, duplicados, persistencia y expiración de extremo a extremo. Para despliegue: mismo SHA y artefacto aprobado, hash, URL, estado, fecha, smoke posterior y rollback verificable.

Una tarea se cierra sólo cuando su criterio observable está satisfecho y la evidencia corresponde a su versión/entorno. Si no pudo probarse, escribir **NO VERIFICADO**. El objetivo global exige A publicada y observada, B únicamente si se mantiene dentro del alcance aprobado, operación sostenible y decisiones comerciales sustentadas. El éxito de negocio no se promete ni se obtiene sumando pruebas.

## Autorización y entrega al propietario

Ya están autorizados el análisis, los cambios locales pertinentes, las pruebas y la preparación de resultados revisables. No volver a pedir autorización por cada edición reversible. La instrucción vigente del propietario y las reglas del repositorio reservan publicaciones, despliegues, envíos, pagos y cambios de producción para una solicitud explícita: prepará primero el paquete y planteá esa decisión una vez, sobre alcance y destino concretos.

No pidas que se peguen secretos. Si falta acceso, solicitá cuenta/tienda o nombre y ubicación de la entrada, o dejá la sesión correspondiente al propietario. La libertad para mejorar procesos no autentica otra cuenta ni habilita servicios por sí sola.

En cada entrega indicá: resultado, tareas cerradas, versión/entorno, verificaciones, pendientes y próximo trabajo útil. Mantené `BACKLOG.json` y la evidencia al día sin sobreescribir hechos históricos. El propietario debe poder retomar el proyecto leyendo este prompt y el backlog, sin reconstruir conversaciones anteriores.
