> HISTÓRICO: copia íntegra anterior a la consolidación FH00B. Sus estados y expresiones «vigente» corresponden a observaciones anteriores. Para operar, usar [PROMPT_MAESTRO.md](PROMPT_MAESTRO.md) y [BACKLOG.json](BACKLOG.json).

<!-- BEGIN PRESERVED CONTENT -->
# Prompt maestro de FlowHome — estado y ejecución

**Actualización FH12O:** [Altura de navegación](FH12O_ALTURA_NAVEGACION_2026-09-08.md): paneles con altura limitada y desplazamiento interno; seis escenarios/86 pasos de foco y once regresiones correctos. 963 pruebas, tipos/lint/build88/SEO correctos. Dist incluye FH12N/O; candidato FH13G anterior, preservado. Sin publicación ni cierre integral.

**Actualización FH12N:** [Navegación de escritorio](FH12N_NAVEGACION_ESCRITORIO_2026-09-08.md): Escape, estado anunciado y foco sincronizados; carrera de visibilidad corregida. Once escenarios, 962 pruebas generales, build88/SEO/lint/tipos correctos según alcance registrado. Dist actualizado; FH13G preservado pero no incluye FH12N. Reconstruir candidato al consolidar fuente final; sin publicación.

**Candidato vigente FH13G:** [Paquete actualizado](FH13G_CANDIDATO_ACTUALIZADO_2026-09-08.md): incluye lista sin precios heredados; 88 páginas/SEO sin errores, 960 pruebas generales y smoke 390/1440 correctos. Inventario de 421 archivos cotejado. Tipos excluye paquetes históricos: 0 errores/0 advertencias/18 hints y tres pruebas dirigidas correctas. FH13E queda como antecedente; fuente final, manifiesto, destino/rollback/aprobación pendientes. No publicado. FH17 sigue parcial; motor local de base de datos no disponible en este ciclo.

**Actualización FH17G:** [Intención editorial](FH17G_INTENCION_EDITORIAL_2026-09-08.md): contrato puro liga revisión/evidencia y rechaza campos ajenos; dos pruebas/lint correctos. No autentica ni persiste/aprueba; transacción y frontera autenticada pendientes. Sin conexión a producción.

**Actualización FH16C:** [Lista sin precios](FH16C_LISTA_SIN_PRECIOS_2026-09-08.md): normalización/migración omite precios heredados sin perder productos; 958 pruebas generales y navegador aislado correctos. Dist reconstruido; FH13E aún no incluye este cambio. Transporte comercial real pendiente, sin activación.

**Validación FH13F:** [Smoke del candidato](FH13F_SMOKE_CANDIDATO_2026-09-08.md): guardado/recarga/eliminación y servicios desactivados comprobados en 390/1440 sobre FH13E; cero errores JS y solicitudes a servicios desactivados en el flujo probado. Inventario intacto. Pendientes fuente, manifiesto, destino/rollback/aprobación; no publicado.

**Candidato aislado FH13E:** [Preparación editorial](FH13E_PREPARACION_EDITORIAL_2026-09-08.md): configuración production con cuentas/analítica apagadas; 421 archivos inventariados, build88/SEO0 y 14 pruebas correctos. Dist local intacto. Pendientes smoke del candidato, fuente final, destino/rollback/aprobación. No publicado.

**Inventario vigente FH13D:** [Control de inventario](FH13D_CONTROL_INVENTARIO_2026-09-08.md): 421 archivos/136.717.793 B cotejados por verificador de sólo lectura. FH13C rechazado como histórico. Entorno local, publishable:false; ninguna autorización de release implícita. Verificar de nuevo tras cualquier build.

**Actualización FH12M:** [Aviso duplicado](FH12M_AVISO_DUPLICADO_2026-09-08.md): se conserva aviso completo y se omite sólo franja duplicada de fichas. 28 HTML y cuatro escenarios comprobados; build88/SEO/lint correctos. Inventario pendiente de reconsolidación, sin publicación.

**Actualización FH12L:** [Sin JavaScript](FH12L_SIN_JAVASCRIPT_2026-09-08.md): avisos y acceso al catálogo; lista no leída no se presenta vacía. Cuatro páginas sin scripts y doce escenarios con scripts comprobados; build88/SEO/lint correctos. Inventario FH13C histórico tras este build; recalcular para candidato.

**Consolidación vigente FH13C:** [Estado de entrega local](FH13C_ESTADO_ENTREGA_2026-09-08.md): inventario cotejado de 421 archivos/136.724.047 B; 956 pruebas y tipos correctos. Entorno local, sin fuente final ni aprobación/rollback de publicación. No publicable; objetivo integral activo.

**Complemento vigente FH12K:** [Páginas auxiliares](FH12K_UTILIDADES_2026-09-08.md): preferencias distingue servicio desactivado de sesión cerrada; doce escenarios y siete pruebas, build88/SEO/lint correctos. Lista dañada preservada hasta reset explícito. Pendiente candidato editorial, sin activaciones ni publicación.

**Antecedente FH12J:** [Alineación de ficha](FH12J_ALINEACION_FICHA_2026-09-08.md): imagen alineada arriba en escritorio; ocho escenarios en cuatro anchos, capturas, build88 y lint correctos. Móvil y contenido conservados; pendientes avisos y peso de alta densidad/respaldo. Sin publicación.

**Antecedente FH12I:** [Icono Apple](FH12I_ICONO_APPLE_2026-09-07.md): PNG cuadrado180×180 coherente con favicon, original preservado; 12 pruebas dirigidas, build88, SEO, lint y HTTP local aprobados. Sin prueba física iOS ni publicación. Cobertura de imágenes: ver punto vigente inferior.

**Punto vigente FH09AN:** [Sitemap y reseñas](FH09AN_SITEMAP_RESENAS_2026-09-08.md): 83 rutas/166 escenarios sin fallos de imágenes ni desbordamientos; índice de reseñas corregido de 18.024.722 a 56.108 B en DPR1. Seis escenarios posteriores, 37 pruebas y build88/SEO/lint correctos. Pendientes estados no indexables y consolidación editorial; sin publicación.

**Antecedente FH09AM:** [Inventario de plantillas](FH09AM_PLANTILLAS_2026-09-08.md): tarjeta lateral optimizada, ficha Echo de 1.297.964 a 49.754 B de imágenes en DPR1. Diez combinaciones de ruta/ancho y tres densidades laterales verificadas; 16 pruebas y build88/SEO/lint correctos. Pendientes demás familias y candidato editorial; sin publicación.

**Antecedente FH09AL:** [Respaldo liviano](FH09AL_RESPALDO_2026-09-08.md): respaldo Echo en ficha/reseña de 1.083.744 a 33.006 B; 16 pruebas dirigidas, 15 escenarios de navegador y build88/lint correctos. Pendiente medición global y candidato editorial; sin publicación ni cierre integral.

**Antecedente FH09AK:** [Alta densidad](FH09AK_DENSIDAD_2026-09-08.md): variante 960 px; Echo Dot en ficha DPR3 pasa de 1.255.620 a 100.350 B. 955 pruebas y 18 escenarios aprobados; build88/SEO/lint correctos. Pendientes respaldo y medición global; sin publicación ni cierre integral.

**Antecedente FH09AJ:** [Imágenes responsivas](FH09AJ_IMAGENES_RESPONSIVAS_2026-09-08.md): fichas, reseñas, búsqueda y lista optimizadas; 955 pruebas generales, 18 escenarios de transferencia y 15 de lista/recuperación correctos. Build88/SEO/tipos/lint aprobados. Pendientes alta densidad, respaldo y jerarquía de ficha; sin publicación ni cierre integral.

**Antecedente FH09AI:** [Blind Tilt y catálogo](FH09AI_TILT_CATALOGO_2026-09-08.md): 28/28 ilustraciones específicas. 38 pruebas dirigidas y 954 generales, catálogo y 28 fichas en 390/1440 y cuatro escenarios adicionales aprobados. Build88/SEO correctos; pendiente medición del conjunto de plantillas. Sin publicación ni cierre integral.

**Antecedente FH09AH:** [Meross MSG100](FH09AH_MEROSS_MODELO_2026-09-08.md): 27/28 ilustraciones específicas, 1 pendiente. 37 pruebas dirigidas, catálogo y 28 fichas en 390/1440 y cuatro escenarios adicionales aprobados. Build88/SEO/lint afectado correctos; sin publicación.

**Antecedente FH09AG:** [Levoit Core 300S](FH09AG_LEVOIT_MODELO_2026-09-08.md): 26/28 ilustraciones específicas, 2 pendientes. 36 pruebas dirigidas, catálogo y 28 fichas en 390/1440 y cuatro escenarios adicionales aprobados. Build88/SEO/lint afectado correctos; sin publicación.

**Antecedente FH09AF:** [Aqara P1](FH09AF_P1_MODELO_2026-09-08.md): 25/28 ilustraciones específicas, 3 pendientes. 35 pruebas dirigidas, catálogo y 28 fichas en 390/1440 y cuatro escenarios adicionales aprobados. Build88/SEO/lint afectado correctos; sin publicación.

**Antecedente FH09AE:** [Yale y cerraduras](FH09AE_YALE_CERRADURAS_2026-09-08.md): 24/28 ilustraciones específicas, 4 pendientes; tres cerraduras distintas. 34 pruebas dirigidas, catálogo y 28 fichas en 390/1440 y cuatro escenarios adicionales aprobados. Build88/SEO/lint afectado correctos; sin publicación.

**Antecedente FH09AD:** [Schlage Century](FH09AD_SCHLAGE_MODELO_2026-09-08.md): 23/28 ilustraciones específicas, 5 pendientes. Proporciones corregidas antes de integrar; 33 pruebas dirigidas, catálogo y 28 fichas en 390/1440 y cuatro escenarios adicionales aprobados. Build88/SEO/lint afectado correctos; sin publicación.

**Antecedente FH09AC:** [August interior](FH09AC_AUGUST_MODELO_2026-09-08.md): 22/28 ilustraciones específicas, 6 pendientes. 32 pruebas dirigidas y 948 generales aprobadas; catálogo y 28 fichas en 390/1440 y seis escenarios adicionales correctos. Build88/SEO/tipos correctos; sin publicación.

**Antecedente FH09AB:** [Aeotec y hubs](FH09AB_AEOTEC_HUBS_2026-09-08.md): 21/28 ilustraciones específicas, 7 pendientes; los tres hubs con imágenes distintas. 31 pruebas dirigidas, catálogo y 28 fichas en 390/1440 y seis escenarios adicionales aprobados. Build88/SEO/lint correctos; sin publicación.

**Antecedente FH09AA:** [SwitchBot Hub 2](FH09AA_HUB2_MODELO_2026-09-08.md): 20/28 ilustraciones específicas, 8 pendientes. Sensor del cable corregido; lecturas de ejemplo rotuladas. 30 pruebas dirigidas, catálogo y 28 fichas en 390/1440 y seis escenarios adicionales aprobados. Build88/SEO/lint correctos; sin publicación.

**Antecedente FH09Z:** [Roomba j7+](FH09Z_ROOMBA_MODELO_2026-09-08.md): 19/28 ilustraciones específicas, 9 pendientes; ambos robots y sus bases diferenciados. 29 pruebas dirigidas, catálogo y 28 fichas en 390/1440 y seis escenarios adicionales aprobados. Build88/SEO/lint correctos; sin publicación.

**Antecedente FH09Y:** [ecobee Premium](FH09Y_ECOBEE_MODELO_2026-09-08.md): 18/28 ilustraciones específicas, 10 pendientes; ambos termostatos diferenciados. 28 pruebas dirigidas, catálogo y 28 fichas en 390/1440 y ocho escenarios adicionales aprobados. Comparativa textual verificada sin atribuirle imágenes inexistentes. Build88/SEO/lint correctos; sin publicación.

**Antecedente FH09X:** [Arlo y cámaras](FH09X_ARLO_CAMARAS_2026-09-08.md): 17/28 ilustraciones específicas, 11 pendientes; cuatro cámaras con imágenes distintas. 27 pruebas dirigidas, catálogo y 28 fichas en 390/1440 y cuatro escenarios adicionales aprobados. Build88/SEO/lint correctos; paquete Arlo no certificado. Sin publicación.

**Antecedente FH09W:** [Blink Outdoor 4](FH09W_BLINK_MODELO_2026-09-08.md): 16/28 ilustraciones específicas, 12 pendientes. Una cámara, no kit completo; 26 pruebas dirigidas, catálogo y 28 fichas en 390/1440, seis escenarios de búsqueda/categoría/reseña aprobados. Build88, SEO y lint correctos; vista local reiniciada tras confirmar puerto libre. Sin publicación.

**Antecedente FH09V:** [Tapo C120](FH09V_TAPO_MODELO_2026-09-08.md): 15/28 ilustraciones específicas, 13 pendientes. Frontal circular y dos focos diferenciados de eufy C120; 25 pruebas dirigidas, catálogo y 28 fichas en 390/1440, búsqueda/categoría aprobados. Build de 88 páginas, SEO y lint correctos; sin publicación.

**Antecedente FH09U:** [Wyze e iluminación](FH09U_WYZE_ILUMINACION_2026-09-08.md): 14/28 ilustraciones específicas,14pendientes; cinco modelos de iluminación con imágenes distintas.24pruebas dirigidas, catálogo y28fichas en390/1440 y cuatro escenarios adicionales aprobados. Build88/SEO/lint correctos; sin publicación.

**Antecedente FH09T:** [Kasa HS220](FH09T_HS220_MODELO_2026-09-08.md): 13/28 ilustraciones específicas,15pendientes. Dibujo ajustado tras revisión;23pruebas dirigidas, catálogo y28fichas en390/1440 aprobados y cuatro escenarios de búsqueda/categoría. Build88/SEO/lint correctos; sin publicación.

**Antecedente FH09S:** [Kasa HS200](FH09S_HS200_MODELO_2026-09-08.md): 12/28 ilustraciones específicas,16pendientes.22pruebas dirigidas, catálogo y28fichas en390/1440 aprobados, cuatro escenarios adicionales de búsqueda/categoría. Build88/SEO/lint correctos; sin publicación.

**Antecedente FH09R:** [Regresión conjunta del catálogo](FH09R_CATALOGO_REGRESION_2026-09-08.md): verificador reutilizable y texto alternativo descriptivo conservado en las 17 fichas genéricas. 28/28 fichas aprobadas en 390 y 1440; 937 pruebas generales, tipos/build88/SEO/lint correctos. 11/28 ilustraciones específicas, 17 pendientes; sin publicación.

**Antecedente FH09Q:** [Nest Hub segunda generación](FH09Q_NEST_HUB_MODELO_2026-09-07.md): 11/28 ilustraciones específicas, 17 pendientes; ambas pantallas diferenciadas. 21 pruebas dirigidas y ocho escenarios de página aprobados; build88/SEO/lint correctos. Sin publicación ni foto oficial.

**Antecedente FH09P:** [Echo Show 8 tercera generación](FH09P_ECHO_SHOW_MODELO_2026-09-07.md): 10/28 ilustraciones específicas, 18 pendientes. 20 pruebas dirigidas y ocho escenarios de página aprobados; tipos/build88/SEO/lint correctos. Descriptor del original del carrusel corregido a 1254w y densidades/fallback revalidados. Sin publicación.

**Antecedente FH09O:** [Carrusel responsivo](FH09O_HERO_IMAGENES_2026-09-07.md): seis imágenes bajan de 6.098.636 a 66.158 bytes en densidad 1; densidades 1/2/3, precarga y fallback aprobados. 925 pruebas generales, tipos/build88/SEO/lint correctos. 9/28 modelos específicos, 19 pendientes; sin publicación.

**Antecedente FH09N:** [eufy C120 y destacados](FH09N_EUFY_MODELO_2026-09-07.md): nueve modelos específicos,19pendientes; ocho destacados con imágenes distintas.924pruebas generales,19dirigidas, diez escenarios390/1440, tipos/lint/build88/SEO aprobados. Sin foto oficial ni publicación.

**Antecedente FH09M:** [Roborock Q5+](FH09M_ROBOROCK_MODELO_2026-09-07.md): robot y base ilustrados,18pruebas dirigidas y diez escenarios390/1440 aprobados; build88/lint/SEO correctos.3miniaturas nuevas y66reutilizadas.8/28modelos específicos,20pendientes; sin publicación.

**Antecedente FH09L:** [Miniaturas incrementales](FH09L_MINIATURAS_INCREMENTALES_2026-09-07.md):66variantes reutilizadas con hashes, cero recodificaciones/escrituras en segunda corrida; recuperación de ausentes/corruptas probada. Tres pruebas dirigidas/lint/diff aprobados. UI intacta;7/28modelos específicos,21pendientes. Sin publicación.

**Antecedente FH09K:** [Aqara M2](FH09K_AQARA_MODELO_2026-09-07.md):7/28modelos específicos,21pendientes. Seis imágenes distintas específicas del carrusel verificadas390/1440;17pruebas dirigidas y ocho escenarios M2 aprobados, build88/lint/SEO correctos. Sin publicación.

**Antecedente FH09J:** [Hue 562918](FH09J_HUE_MODELO_2026-09-07.md): dos bombillas y Bridge ilustrados; accesorios omitidos declarados.16pruebas dirigidas, diez escenarios390/1440 y build88/lint/SEO aprobados.6/28modelos específicos,22pendientes; sin publicación.

**Antecedente FH09I:** [Amazon Smart Thermostat](FH09I_THERMOSTAT_MODELO_2026-09-07.md): ilustración específica con display de ejemplo y miniaturas;15pruebas dirigidas y diez escenarios390/1440 aprobados, build88/lint/SEO correctos.5/28modelos específicos,23pendientes; sin publicación.

**Antecedente FH09H:** [Kasa EP10](FH09H_KASA_MODELO_2026-09-07.md): una unidad ilustrada, no foto ni paquete completo EP10P2; miniaturas incluidas.14pruebas dirigidas, ocho escenarios390/1440 y dos hero aprobados; regresión Echo/fallback verificada.4/28modelos específicos,24pendientes; sin publicación.

**Antecedente FH09G:** [Miniaturas responsivas](FH09G_MINIATURAS_2026-09-07.md): catálogo completo baja de14,97MB a59KB enDPR1;316KB enDPR3. 917pruebas, tipos/lint/build88/SEO aprobados; fallback y tres densidades probados. Originales conservados;3/28modelos específicos,25pendientes. No es medición CWV ni publicación.

**Antecedente FH09F:** [Ring Wired original](FH09F_RING_MODELO_2026-09-07.md): ilustración específica, identidad aislada de Pro, ocho escenarios de catálogo/ficha/búsqueda/categoría y dos de hero aprobados. 11 pruebas dirigidas, build88, lint/SEO aprobados. 3/28 modelos específicos,25pendientes; cero fotos oficiales. Sin publicación.

**Antecedente FH09E:** [Govee H617C: tira ilustrada](FH09E_GOVEE_MODELO_2026-09-07.md): sustituye la bombilla genérica por un tramo de cinta blanca RGBIC; etiquetas de ilustración, no foto ni kit completo. 913 pruebas, lint/tipos/build/SEO y ocho escenarios390/1440 aprobados. 2/28 ilustraciones específicas, 26 pendientes; cero fotos oficiales. Sin publicación.

**Antecedente FH09D:** [Echo Dot: ilustración específica](FH09D_ECHO_MODELO_2026-09-07.md): forma esférica sin reloj revisada contra referencia oficial, etiquetas sincronizadas y pie del hero visible; 912 pruebas y diez escenarios390/1440 aprobados. 1/28 modelos ilustrados específicamente, 27 pendientes; no fotografía oficial ni certificación de paquete. Siguiente: Govee H617C. Sin publicación.

**Antecedente FH09C:** [Imágenes: transferencia y fidelidad](FH09C_IMAGENES_2026-09-07.md): WebP sin pérdida, 30% menos bytes de imágenes; 909 pruebas, lint/tipos/build/SEO aprobados y catálogo390/1440 decodificado. Las 28 imágenes por modelo siguen sin certificar. No publicado; siguiente: resolver representaciones incorrectas sin inventar fotos ni repetir búsquedas agotadas.

**Antecedente FH12H:** [Selección editorial explícita](FH12H_SELECCION_2026-09-07.md): ocho rutas distintas con motivo visible; 908 pruebas, lint/tipos/build/SEO aprobados; navegador390/1440. Imágenes fieles y entrega exacta pendientes; no publicado.

**Antecedente FH12G:** [Retorno honesto por lista local y RSS](FH12G_RETORNO_2026-09-07.md), rutas comprobadas en navegador y controles móviles del carrusel alineados. No se promete sincronización activa ni frecuencia semanal. Imágenes fieles y selección editorial pendientes; no publicado.

**Antecedente FH12F:** [Carrusel sincronizado y pausa explícita](FH12F_PORTADA_2026-09-07.md), 905 pruebas, lint/tipos/build/SEO aprobados; navegador 390/1440 y movimiento reducido. Faltan promesas de retorno, curaduría e imágenes fieles. No publicado.

**Antecedente FH12E:** [Favicon local corregido](FH12E_FAVICON_2026-09-07.md), símbolo SVG navy/teal y manifiesto coherentes; tamaños 16/32/64 comprobados. Se conserva [FH12D](FH12D_CATALOGO_2026-09-07.md), 903 pruebas anteriores más prueba de favicon aprobada. Imágenes fieles de productos y portada pendientes; no publicado.

**Antecedente FH12D:** [Catálogo con búsqueda y filtros](FH12D_CATALOGO_2026-09-07.md), 903 pruebas aprobadas, build/SEO/tipos/lint correctos, cuatro anchos y fallback sin JavaScript verificados. Favicon e imágenes fieles pendientes. No publicado; inventarios anteriores históricos.

**Antecedente FH12C:** acciones de ProductCard con etiquetas permanentes, marcador de lista y foco individual; geometría estable y ampliación de imagen sin cambio de altura. Validación y límites en [FH12C](FH12C_ACCIONES_2026-09-07.md). FH-09 sigue parcial: las ilustraciones genéricas anteriores NO cumplen fidelidad por modelo; verificar imágenes autorizadas exactas y rendimiento. No publicado; inventario FH09B histórico, ya no identifica el dist actual.

**Antecedente FH09B:** [Sustitución autorizada por ilustraciones](FH09B_SUSTITUCION_ILUSTRACIONES_2026-09-07.md). Reemplazo local completado en 28 productos con 15 ilustraciones originales rotuladas; 898 pruebas, lint, tipos, build y SEO aprobados. Doce revisiones móvil/escritorio y listas históricas verificadas. Peso y rendimiento de los PNG pendientes; FH-09 parcial. Inventario actual: 176 archivos, NO PUBLICABLE; candidato exacto, destino/rollback y aprobación pendientes. Ocho tareas hechas/24 abiertas. La autorización de imágenes ya fue atendida; no implica publicación ni ejecución de fondo. Referencias inferiores históricas.

**Antecedente FH20R:** investigación aplicada a Arlo en FH20S y eufy en FH20T; variantes y configuración real pendientes.

Versión: **5 de septiembre de 2026**. Usar este documento como encargo operativo; actualizar las observaciones cambiantes al retomar. [Juzgado integral](JUZGADO_INTEGRAL.md) · [Backlog](BACKLOG.json) · [Evidencia de esta revisión](EVIDENCIA_2026-09-05.json).

El [plan de trabajo legible](PLAN_DE_TRABAJO.md) presenta las 32 tareas con sus criterios de cierre.

**Último avance FH-07:** [quiz con compatibilidad basada en evidencia](AVANCE_FH07_QUIZ_COMPATIBILIDAD_2026-09-05.md), APROBADO LOCAL: filtro y razones sin flags crudos ni inferencia SmartThings desde Matter/Zigbee; preferencias independientes conservadas ante evidencia insuficiente. 688 pruebas y 175 controles de navegador; contraste de botones corregido a 5,22:1. 28 YAML intactos FH07E; instalación 14 documentadas/14 unknown. FH-07 parcial, 2/5 integral; cinco tareas hechas y 27 restantes. Siguiente: identidad, variantes, roles, firmware, hechos y consumidores restantes.

**Continuación:** el objetivo persistente figura ACTIVO según la app el 5 septiembre, tras la reanudación del propietario. La indicación anterior de bloqueo por capacidad es histórica y no requiere otro `/goal resume` ahora. El heartbeat horario `flowhome-desarrollo-integral-con-juzgado` permanece PAUSADO por pedido explícito del usuario. Continuar con el siguiente pendiente local ejecutable, sin esperas programadas ni crear otro horario; no consumir resets ni confundir este desarrollo continuo con la activación comercial FH-19.

**Avance de ejecución del 5 septiembre:** FH-01 integrada en `116e04d`; [evidencia](INTEGRACION_FH01_2026-09-05.md). FH-02 [aprobada localmente](CIERRE_FH02_2026-09-05.md). FH-03 [configuración aprobada localmente](AVANCE_FH03_2026-09-05.md), pero tarea parcial por verificación Supabase real: no repetir sin sesión/evidencia nueva. FH-05 [vigencia unificada](CIERRE_FH05_2026-09-05.md). FH-06 [priorización corregida, 3/5 local](CIERRE_FH06_2026-09-05.md): 644 pruebas, 30 controles de navegador y 28/28 registros conservados salvo campos ROI retirados. Cinco tareas hechas y 27 restantes; continuar FH-07, P0 de catálogo e instalación por modelo ante el límite observado en quiz. FH-24 parcial. `116e04d` no incluye las mejoras locales no confirmadas ni identifica su publicación. No se ha ejecutado la cadena nueva en GitHub/Pages.

## Encargo general

Actuá como responsable integral de la evolución de FlowHome. Convertí el trabajo existente en un sitio editorial de smart home confiable, útil y sostenible, orientado inicialmente al mercado US en inglés, con compra directa en Amazon y guardado anónimo. La automatización debe reducir esfuerzo y mantener datos vigentes; el objetivo de negocio es generar comisiones de compras calificadas con costes y resultados medibles.

Trabajá de forma continua sobre tareas concretas, verificables y priorizadas. Podés refactorizar procesos y código cuando resuelva una causa demostrada, conservando el trabajo existente. Evitá rehacer bloques ya probados o añadir plataformas sin necesidad. No conviertas un bloqueo parcial de cuenta en la detención de todo el proyecto.

Proyecto local: `C:\AGENTES\Proyectos\flowhome`. Repositorio: `https://github.com/manuberrocal-ai/flowhome`. Sitio: `https://flowhome.dev`. Mantené marca, logos, tipografías, paleta, estructura esencial y rutas salvo cambio explícitamente justificado. Comunicá el avance al propietario en español; el contenido público conserva el inglés US.

## Punto de partida comprobado

| Área | Hecho o preparado | Falta |
|---|---|---|
| Versiones | V3 local en `improve/flowhome-v3-2026-09-04`; merge `116e04d…` integra `main=d038534…` con base `17a4ec1…`, cuyo árbol es idéntico a `50bad4d…`; V3 no confirmada preservada | Preparar versión y artefacto exactos, aprobar y publicar. Producción histórica `50bad4d…` declaraba árbol dirty: no deducir sus bytes desde el SHA |
| Gobierno del repo | AGENTS, SECURITY, CONTRIBUTING, RULESET, CODEOWNERS, Dependabot, CodeQL y plantilla PR incorporados localmente desde `main`, sin modificar contenido | Verificar protecciones actuales y decisión explícita de licencia; ejecución remota de controles no comprobada en FH-01 |
| Interfaz y comercio local | Compra directa, guardado único, consentimiento, hero, controles móviles, fallback, QR local y calculadora corregidos | Pruebas remotas y versión pública equivalente; sin precios/ratings manuales como actuales |
| Catálogo y editorial | 28 productos; 15 reviews y ocho guías revisadas; fuentes y correcciones M2/Echo Dot/Nest Hub/Blind Tilt | Identidad y hechos restantes de los 28 modelos/variantes; imágenes, firmware, servicios, metodología y claims sensibles |
| QA | FH-06: 644/644 pruebas, lint/tipos, 88 páginas y SEO sin errores/advertencias; 30 controles de navegador 1440/390. FH-03 conserva escenarios de entornos; evidencia anterior mantiene su fecha | Revalidación por impacto y versión; QA online independiente; no repetir todo por cambios sólo documentales |
| Amazon | Cliente con SearchItems, GetItems, GetVariations y GetBrowseNodes probado con respuestas aisladas | Cuenta y credenciales utilizables; contrato autenticado, permisos y ciclo de datos real |
| Acceso Amazon | Propietario confirma acceso; sesión `flowhome-20` no mostraba habilitación el 4 septiembre; búsqueda autorizada en proyecto/OpenCode sin resultado utilizable | Identificar otra tienda/cuenta o almacén/nombre de entrada. No pedir claves en chat ni repetir búsquedas agotadas sin nueva pista |
| Ofertas/compatibilidad | Block8 reparado localmente; Block9 tiene resolver pero proveedor por defecto null | Datos de procedencia aprobada, grafo real, cola persistente y caducidad fuera del laboratorio |
| Datos y cuenta | Entornos explícitos, sin respaldos ni sobrescritura HTML, aprobados localmente en FH-03. Staging con migraciones 001–008 documentadas el 8 agosto | Estado remoto actual requiere sesión Supabase; login/RLS/sync actuales no verificados. Producción pausada es sólo observación histórica |
| Medición | Lectura del 4 septiembre: GA4 14 sesiones/28 días; GSC páginas 628 impresiones/0 clics y consultas 443/0 | Evento real de afiliación, revocación, atribución y ventanas comparables; Bing pidió login. No sumar desgloses |
| Automatización | V3 dry-run e idempotencia local; FH-06 unifica scoring de descubrimiento/revisión diaria, con 28 candidatos, cero aprobaciones y comisiones null | Persistencia entre runners, ejecución remota, monitor, responsable y coste; datos más allá de relevancia siguen desconocidos |
| Lifecycle/multicanal | Mocks, contratos, colas y runbooks | Proveedor, permisos, necesidad de usuario y resultado; posponer frente a la entrega principal |

Los precios históricos y ratings aún aparecen en la home pública observada el 5 septiembre. Las correcciones V3 no están publicadas. Cloudflare tiene producción automática deshabilitada y previews en `none`; un registro preview queued/idle no es una publicación exitosa. La publicación canónica declara `commit_dirty=true`, así que no asumir equivalencia exacta entre ese SHA y los bytes servidos.

El lock local usa Astro 7.1.6, Tailwind 4.3.1, Supabase JS 2.110.0, TypeScript 6.0.3 y Lighthouse 13.4.1. Son versiones observadas, no instrucciones de perpetuarlas ni de actualizarlas todas. Hay siete PRs de dependencias abiertas observadas, incluida #11 para fast-uri 3.1.7 ya corregido localmente. Revisar cada cambio y evitar duplicación.

## Arquitectura y herramientas objetivo

Conservá Astro/Tailwind para contenido y frontend, Cloudflare Pages para hosting, GitHub para revisión y CI, y Supabase como primera infraestructura existente a evaluar para cuenta/estado durable. No introduzcas otra base, n8n, framework o plataforma de publicación sin una ventaja concreta frente a lo disponible.

Usá el conector autenticado de GitHub para lecturas o acciones autorizadas; el CLI local `gh` devolvió 401 en esta revisión y no invalida el acceso del conector. Cloudflare respondió a lectura autenticada. GA4/GSC se leyeron desde la sesión del propietario. n8n tiene herramientas disponibles pero no se comprobó un flujo FlowHome activo. OpenCode es una referencia histórica de configuración, no el estado vivo del proyecto.

Separá contenido editorial de datos comerciales con vencimiento. Un cron diario no garantiza que HTML, CDN o una pestaña abierta retiren un precio a tiempo. La entrega comercial requiere una estrategia de serving/caché que compruebe vigencia en el momento de uso; elegir su implementación mínima después de revisar infraestructura y permiso de fuente. Hasta entonces, la entrega editorial usa CTA a Amazon sin valores comerciales no verificados.

## Orden de ejecución

1. **FH-01 cerrada; FH-24 parcial.** La copia recuperable, comparación exacta y merge local están comprobados en el informe de integración. No repetir esta integración ni el respaldo por rutina. Revalidar refs ante cambios nuevos y conservar el trabajo V3 no confirmado. Falta comprobar protecciones y decisión de licencia; esto no impide avanzar con FH-02.
2. **FH-04 y FH-23: coherencia de operación.** Conservar controles cerrados: FH-02 fija SHA/artefacto; FH-03 valida selección de entorno y marca de build; FH-05 unifica vigencia <24 h y retención condicionada a permiso; FH-06 retira aprobación ROI y comparte scoring de evidencia incompleta. No repetir esas correcciones. FH-03 sigue parcial hasta nueva sesión/evidencia Supabase. Consolidá calidad/dependencias y workflows según impacto. Un número de scoring no es ingreso demostrado; la clasificación comercial de los 28 productos sigue null hasta acreditarse.
3. **FH-07 a FH-12: cerrar la entrega editorial.** FH-07 sigue siendo el P0 activo: la estimación de instalación por categoría ya está corregida localmente; completar los 14 perfiles restantes y los hechos/identidades de los 28 productos. Verificá modelo/ASIN/bundle/mercado o dejá unknown explícito también en los consumidores; corregí/retirá afirmaciones no sustentadas, especialmente suscripción y compatibilidad derivadas de booleanos por defecto. Priorizá guía Alexa, review Nest Hub y review M2 por impresiones observadas. Revisá las 23 piezas, fotos y peso de Govee, accesibilidad y servicios que se prometen. Prepará consentimiento/atribución y probá cuenta sólo cuando haya una cuenta autorizada; la compra y lista anónimas siguen funcionando sin ella.
4. **FH-13: entrega A.** Prepará el paquete completo: cambio exacto, capturas, validaciones, límites y rollback. Si una función remota no está operativa, no prometer su beneficio; esto permite delimitar A sin esperar a todo B. Pedí la aprobación específica de publicación al final, sobre ese paquete. Tras aprobarse, verificá el SHA/artefacto servido y el recorrido real; registrá D0.
5. **FH-14 a FH-18 y FH-20: datos conectados.** Resolver acceso Amazon, contrastar documentación oficial vigente y hacer llamadas acotadas. Preparar persistencia, procedencia, permisos, caducidad/purga, cola, revisión y grafo de compatibilidad. Conectar una oferta completa primero y probar fallos, cuotas, duplicados y vencimiento. Diseño y pruebas locales pueden avanzar mientras falta acceso.
6. **FH-19, FH-21 y FH-31: operación B.** Preparar y aprobar ejecución remota; demostrar repetición sin duplicados, monitor y rollback. Un primer scheduler de revisión puede seguir en dry-run hasta cerrar la API. Una corrida aprobada no autoriza autopublicar, enviar campañas ni activar otras cuentas. Liberar B con el mismo rigor de artefacto que A.
7. **FH-22 y FH-25 a FH-30: aprender y ampliar.** Conservar series y costes reales, comparar ventanas, comprobar calidad de tráfico y comisiones. CRO, email, otros canales y Canadá quedan diferidos hasta justificar utilidad, datos, capacidad y condiciones propias. Revisar D30/D60/D90; corregir bugs inmediatamente y no esperar 90 días para reconocerlos.

Los estados, dependencias, responsables por función y criterios de cada tarea están en `BACKLOG.json`. No interpretarlos como un orden que obliga a permanecer ocioso: preparar trabajo independiente está permitido. Una tarea que requiere publicación debe llegar hasta un resultado local revisable antes de pedir aprobación.

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

Reutilizá evidencia asociada al mismo contenido de código/configuración y a la misma modalidad de prueba. Separá huella de build de fecha de observación diaria. Este esquema de reutilización ampliado es una mejora pendiente: el runner V3 actual sólo reutiliza el mismo día y verifica todos sus hashes. No afirmes que ya está implementado.

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
