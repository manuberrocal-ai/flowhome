# FlowHome — plan de trabajo priorizado

Vista derivada de [BACKLOG.json](BACKLOG.json). Estados y criterios se editan allí; este plan no mantiene una segunda versión manual.

32 tareas: 8 hechas en su alcance y 24 parciales, pendientes, bloqueadas o diferidas. Hecho no significa publicado ni operación real.

Dirección y siguiente acción: [prompt maestro](PROMPT_MAESTRO.md). Valoración y límites: [juzgado integral](JUZGADO_INTEGRAL.md). [Plan anterior preservado](PLAN_DE_TRABAJO_HISTORICO_FH00B_2026-09-08.md).

## Estados y dependencias

| ID | Prioridad | Trabajo | Estado | Depende de |
|---|---|---|---|---|
| FH-00 | P0 | Dirección y registro únicos | hecho | — |
| FH-01 | P0 | Reconciliar V3 con main actual | hecho | FH-00 |
| FH-02 | P0 | Unir versión, artefacto y despliegue | hecho | FH-01 |
| FH-03 | P0 | Separar configuración local, staging y producción | parcial | FH-01 |
| FH-04 | P1 | Consolidar calidad y trabajos programados | parcial | FH-01 |
| FH-05 | P0 | Reconciliar vigencia comercial entre bloques | hecho | FH-01 |
| FH-06 | P0 | Sustituir el scoring heredado de datos manuales | hecho | FH-01 |
| FH-07 | P0 | Cerrar identidad y hechos del catálogo US | hecho | FH-00 |
| FH-08 | P1 | Cerrar revisión editorial de las 23 piezas | hecho | FH-07 |
| FH-09 | P1 | Verificar imágenes fieles por modelo, procedencia y rendimiento | parcial | FH-07 |
| FH-10 | P1 | Comprobar atribución y consentimiento reales | parcial | FH-03 |
| FH-11 | P1 | Probar autenticación y sincronización reales | bloqueado_acceso | FH-03 |
| FH-12 | P1 | Revalidar SEO y accesibilidad de la entrega A | parcial | FH-01, FH-08 |
| FH-13 | P0 | Entregar versión editorial A | pendiente_aprobacion | FH-02, FH-03, FH-05, FH-06, FH-07, FH-08, FH-09, FH-12, FH-23 |
| FH-14 | P0 | Resolver cuenta y entrada Amazon existentes | bloqueado_acceso | — |
| FH-15 | P1 | Validar las cuatro operaciones Amazon reales | bloqueado_acceso | FH-14 |
| FH-16 | P0 | Diseñar almacenamiento y entrega de datos vigentes | parcial | FH-05 |
| FH-17 | P1 | Persistir cola e idempotencia entre ejecuciones | parcial | FH-03, FH-16 |
| FH-18 | P1 | Conectar adquisición, validación y oferta visible | bloqueado_acceso | FH-15, FH-16, FH-17 |
| FH-19 | P1 | Activar y observar revisión diaria | pendiente_aprobacion | FH-04, FH-17, FH-21 |
| FH-20 | P2 | Suministrar grafo real de compatibilidad | parcial | FH-07 |
| FH-21 | P1 | Observabilidad y rollback verificables | parcial | FH-02 |
| FH-22 | P1 | Línea de base única con ventanas comparables | parcial | FH-10 |
| FH-23 | P1 | Resolver inventario de dependencias y PRs abiertas | hecho | FH-01 |
| FH-24 | P1 | Integrar gobierno remoto y decisión de licencia | parcial | FH-01 |
| FH-25 | P2 | Medir sostenibilidad económica | pendiente | FH-22 |
| FH-26 | P2 | Evaluar CRO con tráfico suficiente | diferido | FH-13, FH-22 |
| FH-27 | P3 | Activar lifecycle sólo con necesidad demostrada | diferido | FH-11, FH-22 |
| FH-28 | P3 | Probar un canal de adquisición adicional | diferido | FH-08, FH-22, FH-25 |
| FH-29 | P3 | Evaluar Canadá u otros comercios | diferido | FH-07, FH-22, FH-25 |
| FH-30 | P2 | Revisiones D30, D60 y D90 | diferido | FH-13, FH-22 |
| FH-31 | P1 | Liberar ofertas conectadas B | pendiente_aprobacion | FH-13, FH-18, FH-19, FH-21 |

Las dependencias ordenan el cierre, no obligan a esperar cuando existe preparación local independiente. Los roles son funciones, no personas ya asignadas. Las evidencias fechadas de cada tarea se conservan en su registro del backlog.

## Criterios de cierre

### FH-00 — Dirección y registro únicos

Estado: hecho. Responsabilidad: Responsable del proyecto. Ejecución: local.

Prompt, juzgado, evidencia y backlog enlazados; documentos históricos identificados como antecedentes.

### FH-01 — Reconciliar V3 con main actual

Estado: hecho. Responsabilidad: Ingeniería. Ejecución: local.

Copia recuperable del trabajo local; comparar semánticamente 17a4ec1, 50bad4d y d038534; preservar las correcciones V3 y el kit remoto; diff revisable y pruebas de la base integrada.

### FH-02 — Unir versión, artefacto y despliegue

Estado: hecho. Responsabilidad: Ingeniería. Ejecución: local.

El mismo SHA verificado identifica checkout, artefacto y despliegue; hash del dist y rollback concreto; eliminar dependencia de main móvil durante la espera de aprobación.

### FH-03 — Separar configuración local, staging y producción

Estado: parcial. Responsabilidad: Ingeniería. Ejecución: local.

Matriz de entornos sin valores secretos; configuración ausente no selecciona silenciosamente un proyecto Supabase; estado real de cada entorno registrado; build valida variables necesarias.

### FH-04 — Consolidar calidad y trabajos programados

Estado: parcial. Responsabilidad: Ingeniería. Ejecución: local.

Un control requerido estable por PR; mismo conjunto de validaciones reutilizado; QA por impacto; tareas diarias sin repetir builds idénticos; Actions fijadas y compatibles; controles de rama conservados.

### FH-05 — Reconciliar vigencia comercial entre bloques

Estado: hecho. Responsabilidad: Datos. Ejecución: local.

Block12, Block8, UI y runbooks usan la misma política vigente; precios no aceptan siete días; probar antes, en y después de 24 h; política de retención ligada a permiso de fuente.

### FH-06 — Sustituir el scoring heredado de datos manuales

Estado: hecho. Responsabilidad: Datos/Editorial. Ejecución: local.

discover:products deja de aprobar por ratings/precios manuales vencidos; usa señales con cobertura y procedencia; retirar o aislar consumidores heredados; categorías de comisión comprobadas, faltantes null.

### FH-07 — Cerrar identidad y hechos del catálogo US

Estado: hecho. Responsabilidad: Editorial. Ejecución: lectura.

28/28 registros con modelo, generación, ASIN, bundle, mercado y fuente por afirmación o unknown explícito; firmware, bridge/controller, suscripción e instalación diferenciados.

### FH-08 — Cerrar revisión editorial de las 23 piezas

Estado: hecho. Responsabilidad: Editorial. Ejecución: local.

15 reviews y 8 guías con necesidad propia, fuentes, método, autoría honesta y limitaciones; quitar o matizar afirmaciones sin evidencia; inventario de títulos y contenido coincide con lo visible.

### FH-09 — Verificar imágenes fieles por modelo, procedencia y rendimiento

Estado: parcial. Responsabilidad: Editorial/UX. Ejecución: lectura.

Identificar fielmente cada modelo promocionado con imágenes autorizadas y procedencia verificable; las ilustraciones genéricas rotuladas de FH09B no satisfacen la solicitud actual. No inventar fotos exactas. Mantener fallback y geometría, optimizar peso y medir las plantillas actuales.

### FH-10 — Comprobar atribución y consentimiento reales

Estado: parcial. Responsabilidad: Analítica. Ejecución: externo.

En entorno autorizado, aceptar produce un solo affiliate_click visible en DebugView; rechazar/revocar detiene analítica; documentar referidos de Google login y discrepancias sin alterar cuentas por inferencia.

### FH-11 — Probar autenticación y sincronización reales

Estado: bloqueado_acceso. Responsabilidad: Ingeniería. Ejecución: externo.

Cuenta de prueba autorizada: Google/email, dos dispositivos, logout, cambio de cuenta, offline/reintento y RLS; prueba negativa de acceso cruzado; nunca bloquear compra/guardado anónimo.

### FH-12 — Revalidar SEO y accesibilidad de la entrega A

Estado: parcial. Responsabilidad: SEO/UX. Ejecución: local.

88 rutas o cambios justificados; 83 indexables según política; canonicals/status/schema/teclado/7 tamaños; producción comprobada tras publicación; INP y CWV de campo separados de Lighthouse.

### FH-13 — Entregar versión editorial A

Estado: pendiente_aprobacion. Responsabilidad: Propietario/Ingeniería. Ejecución: externo.

Paquete exacto con cambios, pruebas y rollback aprobado; publicar sólo contenido sustentado y guardado anónimo, sin ofertas no verificadas ni promesas de funciones inactivas; smoke online del SHA; iniciar D0.

### FH-14 — Resolver cuenta y entrada Amazon existentes

Estado: bloqueado_acceso. Responsabilidad: Propietario. Ejecución: lectura.

Identificar cuenta/tienda aprobada y almacén/nombre de entrada; verificar habilitación sin revelar claves; distinguir Associates, Creators y acceso anterior; no repetir búsqueda agotada sin pista nueva.

### FH-15 — Validar las cuatro operaciones Amazon reales

Estado: bloqueado_acceso. Responsabilidad: Ingeniería/Datos. Ejecución: externo.

Llamadas acotadas de SearchItems, GetItems, GetVariations y GetBrowseNodes con contrato actual, identidad exacta y redacción de secretos; documentar cuotas, errores, permisos y campos realmente disponibles.

### FH-16 — Diseñar almacenamiento y entrega de datos vigentes

Estado: parcial. Responsabilidad: Ingeniería/Datos. Ejecución: local.

Decisión revisable que prioriza infraestructura existente; define dato permitido, TTL, purga, cachés, borrado y fallos; HTML y clientes nunca conservan oferta vencida; no basar caducidad en cron.

### FH-17 — Persistir cola e idempotencia entre ejecuciones

Estado: parcial. Responsabilidad: Ingeniería. Ejecución: local.

Adaptador durable mínimo probado con dos runners, reintento y reinicio; identidad y payload, revisión, estado y auditoría sobreviven; expiración independiente de aprobación.

### FH-18 — Conectar adquisición, validación y oferta visible

Estado: bloqueado_acceso. Responsabilidad: Ingeniería/Datos. Ejecución: externo.

Una oferta real recorre proveedor→validación→revisión→serving; expira también en caché/HTML/navegador; caída de API oculta datos inválidos; permisos de fuente confirmados antes de persistir.

### FH-19 — Activar y observar revisión diaria

Estado: pendiente_aprobacion. Responsabilidad: Propietario/Operaciones. Ejecución: externo.

Primera corrida remota observada y repetición sin duplicados; horario y kill switch; Amazon sigue en dry-run si FH-15 no está cerrado; fallos notifican sólo al destino autorizado; ninguna autopublicación.

### FH-20 — Suministrar grafo real de compatibilidad

Estado: parcial. Responsabilidad: Editorial/Datos. Ejecución: local.

Fuente revisada reemplaza proveedor null; relaciones por dispositivo/acción/mercado/firmware; unknown ante contradicción/caducidad; probar quiz, producto, comparación y alternativas.

### FH-21 — Observabilidad y rollback verificables

Estado: parcial. Responsabilidad: Operaciones. Ejecución: local.

Monitor mínimo de disponibilidad/CTA y errores con responsable y destino definido; prueba de incidente y restauración; SLO calibrado a capacidad real, sin tiempos de respuesta ficticios.

### FH-22 — Línea de base única con ventanas comparables

Estado: parcial. Responsabilidad: Analítica. Ejecución: lectura.

Registrar fuente, fecha de extracción, ventana, denominador, versión, país/dispositivo y consentimiento; conservar julio y septiembre; obtener Bing al iniciar sesión; clicks no equivalen a ventas.

### FH-23 — Resolver inventario de dependencias y PRs abiertas

Estado: hecho. Responsabilidad: Ingeniería. Ejecución: local.

Auditoría posterior utilizable o cada excepción evaluada; conciliar fast-uri local 3.1.7 con PR #11; revisar siete PRs observadas por compatibilidad, sin duplicar parches ni fusionar automáticamente.

### FH-24 — Integrar gobierno remoto y decisión de licencia

Estado: parcial. Responsabilidad: Propietario/Ingeniería. Ejecución: local.

Conservar AGENTS, SECURITY, CONTRIBUTING, CODEOWNERS, Dependabot, CodeQL y plantilla existentes en main; verificar reglas remotas; documentar licencia explícita del titular sin inventar cesión.

### FH-25 — Medir sostenibilidad económica

Estado: pendiente. Responsabilidad: Propietario/Analítica. Ejecución: lectura.

Costes reales de hosting, ejecuciones, proveedores y edición; comisiones confirmadas netas de devoluciones; contribución y esfuerzo por contenido con periodo común; sin usar ticket×tasa como ROI probado.

### FH-26 — Evaluar CRO con tráfico suficiente

Estado: diferido. Responsabilidad: Producto/Analítica. Ejecución: tiempo.

Hipótesis, métrica primaria, guardrails, tamaño mínimo calculado y ventana comparable; pruebas de usabilidad pueden empezar antes; no usar 30 eventos como garantía de potencia.

### FH-27 — Activar lifecycle sólo con necesidad demostrada

Estado: diferido. Responsabilidad: Propietario/Ingeniería. Ejecución: externo.

Proveedor y dominio elegidos, consentimiento y baja, DNS/retención, cuota, entrega y reintentos verificados con destinatarios de prueba autorizados; medir beneficio antes de escalar.

### FH-28 — Probar un canal de adquisición adicional

Estado: diferido. Responsabilidad: Editorial/Propietario. Ejecución: externo.

Un canal con público y formato definidos, derechos y aprobación; API/políticas revalidadas al activarse; coste y tráfico cualificado medidos; descartar expansión sin señal.

### FH-29 — Evaluar Canadá u otros comercios

Estado: diferido. Responsabilidad: Propietario. Ejecución: externo.

Demanda y coste justifican mercado/retailer; contratos, moneda, ASIN/SKU, disponibilidad, privacidad y localización propios; hreflang sólo con equivalentes reales.

### FH-30 — Revisiones D30, D60 y D90

Estado: diferido. Responsabilidad: Producto/Analítica. Ejecución: tiempo.

D0 fechado en la entrega medida; fuentes/segmentos comparables, sesgos e intervalos; decidir continuar/revisar/diferir/parar sin garantía de ingresos; corregir fallos sin esperar D90.

### FH-31 — Liberar ofertas conectadas B

Estado: pendiente_aprobacion. Responsabilidad: Propietario/Ingeniería. Ejecución: externo.

Artefacto y aprobación específicos de la integración conectada; pruebas de caducidad/end-to-end y caída; observar primera operación; autorizar por separado cualquier envío o canal.
