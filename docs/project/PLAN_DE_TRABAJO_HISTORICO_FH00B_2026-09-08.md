> HISTÓRICO: copia íntegra anterior a la consolidación FH00B. Sus estados y expresiones «vigente» corresponden a observaciones anteriores. Para operar, usar [PLAN_DE_TRABAJO.md](PLAN_DE_TRABAJO.md) y [BACKLOG.json](BACKLOG.json).

<!-- BEGIN PRESERVED CONTENT -->
# FlowHome — plan de trabajo priorizado

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

Estado: **5 de septiembre de 2026**. [Prompt maestro](PROMPT_MAESTRO.md) · [Juzgado integral](JUZGADO_INTEGRAL.md) · [Registro estructurado](BACKLOG.json).

Este plan contiene siete tareas completadas y 25 trabajos pendientes, parciales o diferidos. FH-00, FH-01, FH-02, FH-05, FH-06, FH-07 documental y [FH-08 editorial local](CIERRE_FH08_2026-09-06.md) están cerradas según sus criterios. FH-03 tiene configuración aprobada localmente, pero sigue parcial hasta verificar Supabase real con sesión del propietario. Siguiente: FH-09, recursos visuales, derechos y rendimiento. Las dependencias indican orden de cierre; puede adelantarse preparación local. No se asignan fechas ficticias a accesos, aprobaciones o resultados de negocio.

## Vista rápida

Antecedente del 5 septiembre, superado por el cierre FH07AA: [quiz con compatibilidad basada en evidencia](AVANCE_FH07_QUIZ_COMPATIBILIDAD_2026-09-05.md), APROBADO LOCAL: filtro y razones sin flags crudos ni inferencia SmartThings desde Matter/Zigbee; preferencias independientes conservadas ante evidencia insuficiente. 688 pruebas y 175 controles de navegador; contraste de botones corregido a 5,22:1. 28 YAML intactos FH07E; instalación 14 documentadas/14 unknown. FH-07 parcial, 2/5 integral; cinco tareas hechas y 27 restantes. Siguiente: identidad, variantes, roles, firmware, hechos y consumidores restantes.

| ID | Prioridad | Trabajo | Estado | Depende de |
|---|---|---|---|---|
| FH-00 | P0 | Dirección y registro únicos | hecho | — |
| FH-01 | P0 | Reconciliar V3 con main actual | hecho | FH-00 |
| FH-02 | P0 | Unir versión, artefacto y despliegue | hecho | FH-01 |
| FH-03 | P0 | Separar configuración local, staging y producción | parcial | FH-01 |
| FH-04 | P1 | Consolidar calidad y trabajos programados | parcial | FH-01 |
| FH-05 | P0 | Reconciliar vigencia comercial entre bloques | hecho | FH-01 |
| FH-06 | P0 | Sustituir el scoring heredado de datos manuales | hecho | FH-01 |
| FH-07 | P0 | Cerrar identidad y hechos del catálogo US | hecho (documental) | FH-00 |
| FH-08 | P1 | Cerrar revisión editorial de las 23 piezas | hecho local | FH-07 |
| FH-09 | P1 | Validar fotos, derechos y rendimiento online | parcial | FH-07 |
| FH-10 | P1 | Comprobar atribución y consentimiento reales | parcial | FH-03 |
| FH-11 | P1 | Probar autenticación y sincronización reales | bloqueado acceso | FH-03 |
| FH-12 | P1 | Revalidar SEO y accesibilidad de la entrega A | parcial | FH-01, FH-08 |
| FH-13 | P0 | Entregar versión editorial A | pendiente aprobacion | FH-02, FH-03, FH-05, FH-06, FH-07, FH-08, FH-09, FH-12, FH-23 |
| FH-14 | P0 | Resolver cuenta y entrada Amazon existentes | bloqueado acceso | — |
| FH-15 | P1 | Validar las cuatro operaciones Amazon reales | bloqueado acceso | FH-14 |
| FH-16 | P0 | Diseñar almacenamiento y entrega de datos vigentes | pendiente | FH-05 |
| FH-17 | P1 | Persistir cola e idempotencia entre ejecuciones | pendiente | FH-03, FH-16 |
| FH-18 | P1 | Conectar adquisición, validación y oferta visible | bloqueado acceso | FH-15, FH-16, FH-17 |
| FH-19 | P1 | Activar y observar revisión diaria | pendiente aprobacion | FH-04, FH-17, FH-21 |
| FH-20 | P2 | Suministrar grafo real de compatibilidad | parcial | FH-07 |
| FH-21 | P1 | Observabilidad y rollback verificables | parcial | FH-02 |
| FH-22 | P1 | Línea de base única con ventanas comparables | parcial | FH-10 |
| FH-23 | P1 | Resolver inventario de dependencias y PRs abiertas | pendiente | FH-01 |
| FH-24 | P1 | Integrar gobierno remoto y decisión de licencia | parcial | FH-01 |
| FH-25 | P2 | Medir sostenibilidad económica | pendiente | FH-22 |
| FH-26 | P2 | Evaluar CRO con tráfico suficiente | diferido | FH-13, FH-22 |
| FH-27 | P3 | Activar lifecycle sólo con necesidad demostrada | diferido | FH-11, FH-22 |
| FH-28 | P3 | Probar un canal de adquisición adicional | diferido | FH-08, FH-22, FH-25 |
| FH-29 | P3 | Evaluar Canadá u otros comercios | diferido | FH-07, FH-22, FH-25 |
| FH-30 | P2 | Revisiones D30, D60 y D90 | diferido | FH-13, FH-22 |
| FH-31 | P1 | Liberar ofertas conectadas B | pendiente aprobacion | FH-13, FH-18, FH-19, FH-21 |

## Criterios concretos de cierre

### FH-00 — Dirección y registro únicos

**Estado:** hecho. **Responsabilidad:** Responsable del proyecto. **Tipo de ejecución:** local.

**Terminado cuando:** Prompt, juzgado, evidencia y backlog enlazados; documentos históricos identificados como antecedentes.

**Referencia:** docs/project/PROMPT_MAESTRO.md.

### FH-01 — Reconciliar V3 con main actual

**Estado:** hecho. **Responsabilidad:** Ingeniería. **Tipo de ejecución:** local.

**Terminado cuando:** Copia recuperable del trabajo local; comparar semánticamente 17a4ec1, 50bad4d y d038534; preservar las correcciones V3 y el kit remoto; diff revisable y pruebas de la base integrada.

**Referencia:** [Integración FH-01](INTEGRACION_FH01_2026-09-05.md): merge `116e04d`, respaldo verificado, 451 hashes preservados y controles generales aprobados. V3 permanece como cambios locales no publicados.

### FH-02 — Unir versión, artefacto y despliegue

**Estado:** hecho. **Responsabilidad:** Ingeniería. **Tipo de ejecución:** local.

**Terminado cuando:** El mismo SHA verificado identifica checkout, artefacto y despliegue; hash del dist y rollback concreto; eliminar dependencia de main móvil durante la espera de aprobación.

**Referencia:** [Cierre FH-02](CIERRE_FH02_2026-09-05.md): SHA/IDs/manifiesto, preflight de recuperación y registro; 614 pruebas y ensayo de 159 archivos. Aprobación local; circuito remoto pendiente de FH-13.

### FH-03 — Separar configuración local, staging y producción

**Estado:** parcial. **Responsabilidad:** Ingeniería. **Tipo de ejecución:** local.

**Terminado cuando:** Matriz de entornos sin valores secretos; configuración ausente no selecciona silenciosamente un proyecto Supabase; estado real de cada entorno registrado; build valida variables necesarias.

**Referencia:** [Avance FH-03](AVANCE_FH03_2026-09-05.md): selección explícita, build/CSP/artefacto y consumidores aprobados localmente; 627 pruebas y seis escenarios de build. Falta verificar proyectos Supabase reales: sesión del propietario requerida; no repetir hasta nueva evidencia. Seguir FH-07.

### FH-04 — Consolidar calidad y trabajos programados

**Estado:** pendiente. **Responsabilidad:** Ingeniería. **Tipo de ejecución:** local.

**Terminado cuando:** Un control requerido estable por PR; mismo conjunto de validaciones reutilizado; QA por impacto; tareas diarias sin repetir builds idénticos; Actions fijadas y compatibles; controles de rama conservados.

**Referencia:** .github/workflows/.

### FH-05 — Reconciliar vigencia comercial entre bloques

**Estado:** hecho. **Responsabilidad:** Datos. **Tipo de ejecución:** local.

**Terminado cuando:** Block12, Block8, UI y runbooks usan la misma política vigente; precios no aceptan siete días; probar antes, en y después de 24 h; política de retención ligada a permiso de fuente.

**Referencia:** [Cierre FH-05](CIERRE_FH05_2026-09-05.md): política inmutable compartida, vencimiento exclusivo y permisos; 121 pruebas dirigidas y 634 completas, lint/tipos/build/SEO. APROBADO LOCAL, 3/5; serving/purga reales pendientes en FH-16/FH-18.

### FH-06 — Sustituir el scoring heredado de datos manuales

**Estado:** hecho. **Responsabilidad:** Datos/Editorial. **Tipo de ejecución:** local.

**Terminado cuando:** discover:products deja de aprobar por ratings/precios manuales vencidos; usa señales con cobertura y procedencia; retirar o aislar consumidores heredados; categorías de comisión comprobadas, faltantes null.

**Referencia:** [Cierre FH-06](CIERRE_FH06_2026-09-05.md): scoring compartido, 28 candidatos sin aprobación/comisión inferida, retiro de campos y consumidores ROI; 644 pruebas y 30 controles de navegador. APROBADO LOCAL, 3/5.

### FH-07 — Cerrar identidad y hechos del catálogo US

**Estado:** hecho documentalmente; ver [cierre y límites](CIERRE_FH07_2026-09-06.md). **Responsabilidad:** Editorial. **Tipo de ejecución:** lectura. No autoriza publicación ni certifica unidades; continuar FH-08.

**Terminado cuando:** 28/28 registros con modelo, generación, ASIN, bundle, mercado y fuente por afirmación o unknown explícito; firmware, bridge/controller, suscripción e instalación diferenciados.

**Referencia:** [Avance FH-07: quiz](AVANCE_FH07_QUIZ_COMPATIBILIDAD_2026-09-05.md). 688 pruebas y 175 controles de navegador; evidencia de ecosistema diferenciada, SmartThings no inferido, contraste corregido. Instalación 14/14, catálogo intacto y demás pendientes sin cambio.

### FH-08 — Cerrar revisión editorial de las 23 piezas

**Estado:** hecho local. **Responsabilidad:** Editorial. **Tipo de ejecución:** local.

**Terminado cuando:** 15 reviews y 8 guías con necesidad propia, fuentes, método, autoría honesta y limitaciones; quitar o matizar afirmaciones sin evidencia; inventario de títulos y contenido coincide con lo visible.

**Referencia:** [Cierre FH-08 y matriz de aceptación](CIERRE_FH08_2026-09-06.md).

### FH-09 — Validar fotos, derechos y rendimiento online

**Estado:** parcial. **Responsabilidad:** Editorial/UX. **Tipo de ejecución:** lectura.

**Terminado cuando:** Verificar foto exacta, permiso y decodificación; resolver Govee 1.62 MB con derivación admitida o alternativa; medir plantilla con recursos reales; mantener fallback y geometría.

**Referencia:** docs/audit/remote-service-checks-v3.md.

### FH-10 — Comprobar atribución y consentimiento reales

**Estado:** parcial. **Responsabilidad:** Analítica. **Tipo de ejecución:** externo.

**Terminado cuando:** En entorno autorizado, aceptar produce un solo affiliate_click visible en DebugView; rechazar/revocar detiene analítica; documentar referidos de Google login y discrepancias sin alterar cuentas por inferencia.

**Referencia:** src/lib/analytics.ts; docs/audit/current-measurement-v3.md.

### FH-11 — Probar autenticación y sincronización reales

**Estado:** bloqueado acceso. **Responsabilidad:** Ingeniería. **Tipo de ejecución:** externo.

**Terminado cuando:** Cuenta de prueba autorizada: Google/email, dos dispositivos, logout, cambio de cuenta, offline/reintento y RLS; prueba negativa de acceso cruzado; nunca bloquear compra/guardado anónimo.

**Referencia:** src/lib/cart-sync.ts.

### FH-12 — Revalidar SEO y accesibilidad de la entrega A

**Estado:** pendiente. **Responsabilidad:** SEO/UX. **Tipo de ejecución:** local.

**Terminado cuando:** 88 rutas o cambios justificados; 83 indexables según política; canonicals/status/schema/teclado/7 tamaños; producción comprobada tras publicación; INP y CWV de campo separados de Lighthouse.

**Referencia:** scripts/qa/.

### FH-13 — Entregar versión editorial A

**Estado:** pendiente aprobacion. **Responsabilidad:** Propietario/Ingeniería. **Tipo de ejecución:** externo.

**Terminado cuando:** Paquete exacto con cambios, pruebas y rollback aprobado; publicar sólo contenido sustentado y guardado anónimo, sin ofertas no verificadas ni promesas de funciones inactivas; smoke online del SHA; iniciar D0.

**Referencia:** docs/project/PROMPT_MAESTRO.md.

### FH-14 — Resolver cuenta y entrada Amazon existentes

**Estado:** bloqueado acceso. **Responsabilidad:** Propietario. **Tipo de ejecución:** lectura.

**Terminado cuando:** Identificar cuenta/tienda aprobada y almacén/nombre de entrada; verificar habilitación sin revelar claves; distinguir Associates, Creators y acceso anterior; no repetir búsqueda agotada sin pista nueva.

**Referencia:** docs/audit/credential-location-audit-v3.md.

### FH-15 — Validar las cuatro operaciones Amazon reales

**Estado:** bloqueado acceso. **Responsabilidad:** Ingeniería/Datos. **Tipo de ejecución:** externo.

**Terminado cuando:** Llamadas acotadas de SearchItems, GetItems, GetVariations y GetBrowseNodes con contrato actual, identidad exacta y redacción de secretos; documentar cuotas, errores, permisos y campos realmente disponibles.

**Referencia:** scripts/lib/amazon-creators.mjs.

### FH-16 — Diseñar almacenamiento y entrega de datos vigentes

**Estado:** pendiente. **Responsabilidad:** Ingeniería/Datos. **Tipo de ejecución:** local.

**Terminado cuando:** Decisión revisable que prioriza infraestructura existente; define dato permitido, TTL, purga, cachés, borrado y fallos; HTML y clientes nunca conservan oferta vencida; no basar caducidad en cron.

**Referencia:** docs/data/amazon-integration-v3.md.

### FH-17 — Persistir cola e idempotencia entre ejecuciones

**Estado:** pendiente. **Responsabilidad:** Ingeniería. **Tipo de ejecución:** local.

**Terminado cuando:** Adaptador durable mínimo probado con dos runners, reintento y reinicio; identidad y payload, revisión, estado y auditoría sobreviven; expiración independiente de aprobación.

**Referencia:** scripts/flowhome-daily.mjs.

### FH-18 — Conectar adquisición, validación y oferta visible

**Estado:** bloqueado acceso. **Responsabilidad:** Ingeniería/Datos. **Tipo de ejecución:** externo.

**Terminado cuando:** Una oferta real recorre proveedor→validación→revisión→serving; expira también en caché/HTML/navegador; caída de API oculta datos inválidos; permisos de fuente confirmados antes de persistir.

**Referencia:** src/lib/blocks/block8/.

### FH-19 — Activar y observar revisión diaria

**Estado:** pendiente aprobacion. **Responsabilidad:** Propietario/Operaciones. **Tipo de ejecución:** externo.

**Terminado cuando:** Primera corrida remota observada y repetición sin duplicados; horario y kill switch; Amazon sigue en dry-run si FH-15 no está cerrado; fallos notifican sólo al destino autorizado; ninguna autopublicación.

**Referencia:** .github/workflows/automation.yml.

### FH-20 — Suministrar grafo real de compatibilidad

**Estado:** pendiente. **Responsabilidad:** Editorial/Datos. **Tipo de ejecución:** local.

**Terminado cuando:** Fuente revisada reemplaza proveedor null; relaciones por dispositivo/acción/mercado/firmware; unknown ante contradicción/caducidad; probar quiz, producto, comparación y alternativas.

**Referencia:** src/lib/blocks/block9/runtime.ts.

### FH-21 — Observabilidad y rollback verificables

**Estado:** pendiente. **Responsabilidad:** Operaciones. **Tipo de ejecución:** local.

**Terminado cuando:** Monitor mínimo de disponibilidad/CTA y errores con responsable y destino definido; prueba de incidente y restauración; SLO calibrado a capacidad real, sin tiempos de respuesta ficticios.

**Referencia:** src/lib/blocks/block12/.

### FH-22 — Línea de base única con ventanas comparables

**Estado:** parcial. **Responsabilidad:** Analítica. **Tipo de ejecución:** lectura.

**Terminado cuando:** Registrar fuente, fecha de extracción, ventana, denominador, versión, país/dispositivo y consentimiento; conservar julio y septiembre; obtener Bing al iniciar sesión; clicks no equivalen a ventas.

**Referencia:** docs/audit/current-measurement-v3.md.

### FH-23 — Resolver inventario de dependencias y PRs abiertas

**Estado:** pendiente. **Responsabilidad:** Ingeniería. **Tipo de ejecución:** local.

**Terminado cuando:** Auditoría posterior utilizable o cada excepción evaluada; conciliar fast-uri local 3.1.7 con PR #11; revisar siete PRs observadas por compatibilidad, sin duplicar parches ni fusionar automáticamente.

**Referencia:** https://github.com/manuberrocal-ai/flowhome/pulls.

### FH-24 — Integrar gobierno remoto y decisión de licencia

**Estado:** parcial. **Responsabilidad:** Propietario/Ingeniería. **Tipo de ejecución:** local.

**Terminado cuando:** Conservar AGENTS, SECURITY, CONTRIBUTING, CODEOWNERS, Dependabot, CodeQL y plantilla existentes en main; verificar reglas remotas; documentar licencia explícita del titular sin inventar cesión.

**Referencia:** [Integración FH-01](INTEGRACION_FH01_2026-09-05.md). Kit incorporado sin cambios; protecciones remotas y decisión de licencia pendientes.

### FH-25 — Medir sostenibilidad económica

**Estado:** pendiente. **Responsabilidad:** Propietario/Analítica. **Tipo de ejecución:** lectura.

**Terminado cuando:** Costes reales de hosting, ejecuciones, proveedores y edición; comisiones confirmadas netas de devoluciones; contribución y esfuerzo por contenido con periodo común; sin usar ticket×tasa como ROI probado.

**Referencia:** docs/INTERNAL_PRODUCT_SELECTION.md; el estimador ROI heredado fue retirado en FH-06. Usar compras calificadas, devoluciones y costes reales, no el score editorial.

### FH-26 — Evaluar CRO con tráfico suficiente

**Estado:** diferido. **Responsabilidad:** Producto/Analítica. **Tipo de ejecución:** tiempo.

**Terminado cuando:** Hipótesis, métrica primaria, guardrails, tamaño mínimo calculado y ventana comparable; pruebas de usabilidad pueden empezar antes; no usar 30 eventos como garantía de potencia.

**Referencia:** src/lib/experiments.ts.

### FH-27 — Activar lifecycle sólo con necesidad demostrada

**Estado:** diferido. **Responsabilidad:** Propietario/Ingeniería. **Tipo de ejecución:** externo.

**Terminado cuando:** Proveedor y dominio elegidos, consentimiento y baja, DNS/retención, cuota, entrega y reintentos verificados con destinatarios de prueba autorizados; medir beneficio antes de escalar.

**Referencia:** supabase/functions/_shared/email-provider.js.

### FH-28 — Probar un canal de adquisición adicional

**Estado:** diferido. **Responsabilidad:** Editorial/Propietario. **Tipo de ejecución:** externo.

**Terminado cuando:** Un canal con público y formato definidos, derechos y aprobación; API/políticas revalidadas al activarse; coste y tráfico cualificado medidos; descartar expansión sin señal.

**Referencia:** src/lib/blocks/block11/.

### FH-29 — Evaluar Canadá u otros comercios

**Estado:** diferido. **Responsabilidad:** Propietario. **Tipo de ejecución:** externo.

**Terminado cuando:** Demanda y coste justifican mercado/retailer; contratos, moneda, ASIN/SKU, disponibilidad, privacidad y localización propios; hreflang sólo con equivalentes reales.

**Referencia:** docs/PROJECT_PLAN.md.

### FH-30 — Revisiones D30, D60 y D90

**Estado:** diferido. **Responsabilidad:** Producto/Analítica. **Tipo de ejecución:** tiempo.

**Terminado cuando:** D0 fechado en la entrega medida; fuentes/segmentos comparables, sesgos e intervalos; decidir continuar/revisar/diferir/parar sin garantía de ingresos; corregir fallos sin esperar D90.

**Referencia:** docs/BLOCK12_90_DAY_GATE.md.

### FH-31 — Liberar ofertas conectadas B

**Estado:** pendiente aprobacion. **Responsabilidad:** Propietario/Ingeniería. **Tipo de ejecución:** externo.

**Terminado cuando:** Artefacto y aprobación específicos de la integración conectada; pruebas de caducidad/end-to-end y caída; observar primera operación; autorizar por separado cualquier envío o canal.

**Referencia:** docs/data/amazon-integration-v3.md.

## Prioridades

P0: necesario para una entrega confiable o para desbloquear su ruta principal. P1: operación y medición. P2: mejoras sustentadas o posteriores a la entrega. P3: expansión opcional.

Las acciones de acceso corresponden al propietario. Los roles restantes son funciones de trabajo, no personas ni equipos que ya se hayan contratado. La cola estructurada es la fuente para actualizar este plan. Una tarea cerrada no cambia automáticamente el estado de sus dependencias ni de sus resultados de negocio.
