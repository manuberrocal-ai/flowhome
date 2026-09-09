# FlowHome — instalación documentada de dos hubs

Estado: 5 septiembre de 2026, navegador 17:34 UTC. [Contrato](FH07_HUBS_CONTRATO_2026-09-05.md) · [Evidencia y huellas](FH07D_EVIDENCIA_2026-09-05.json) · [Navegador](FH07D_NAVEGADOR_2026-09-05.json).

## Resultado

APROBADO LOCAL para Aqara Hub M2 y SwitchBot Hub 2. Once instalaciones documentadas, 17 unknown; FH-07 integral sigue parcial, 2/5. Cinco tareas cerradas y 27 restantes. Sólo se añadieron campos de instalación de dos productos y una prueba; no se cambiaron lógica, esquema, estilos, ASIN, precios, ratings ni fechas comerciales. No se publicó.

La [corrección anterior de prioridades](AVANCE_FH07_PRIORIDADES_2026-09-05.md) está terminada localmente: no volver a registrarla como pendiente. La actualización presente conserva esa lógica.

## Evidencia de fabricante y alcance

- Aqara: la [ficha US](https://www.aqara.com/us/product/hub-m2/specs/) identifica HM2-G01. El [manual enlazado por el centro de soporte US](https://cdn.shopify.com/s/files/1/0710/9220/7830/files/smart_hub_m2_manual.pdf?v=1723627820) documenta energía USB, adaptador separado, configuración por app/red, conexión LAN opcional y ubicación interior. El PDF antiguo dio timeout; se recuperó el enlace actual desde soporte. Su título identifica una revisión documental V7 de septiembre de 2020, no la revisión física vendida hoy.
- SwitchBot: [configuración](https://support.switch-bot.com/hc/en-us/articles/17784047699479-How-to-Set-up-SwitchBot-Hub-2), [alimentación y cable específico](https://support.switch-bot.com/hc/en-us/articles/13506998775575-What-Should-I-Do-if-Hub-Mini-Hub-2-Does-Not-Start-Up-After-Power-On) y [ubicación del sensor](https://support.switch-bot.com/hc/en-us/articles/9747052703895-What-should-I-do-if-Hub2-s-temperature-and-humidity-data-are-wrong). Los artículos muestran fechas editoriales de marzo/octubre de 2023 y se consultaron hoy; no se usaron para afirmar firmware instalado actual.

La estimación «Power and app setup» describe la puesta en marcha básica, no facilidad probada, compatibilidad de todos los accesorios ni integración Matter completa. Las fichas mantienen el límite de ASIN/paquete/hardware no cotejado. No se reprodujo la referencia antigua del manual a hubs Apple ni su texto ambiguo de seguridad Wi-Fi como recomendación actual.

Los hubs no pertenecen a las categorías de los cinco objetivos actuales del quiz. Incorporar evidencia no cambia ese alcance; la prueba nueva verifica que no aparezcan indebidamente como candidatos.

## Validación

26/26 pruebas dirigidas; 661/661 completas, cero fallos y omitidas. La nueva prueba de perfiles falló antes del cambio (9 aprobadas, una fallida) y pasó después. Lint aprobado. Tipos: 242 archivos, cero errores/advertencias y 18 indicaciones existentes. Build: 88 páginas. SEO: 88 páginas sin errores/advertencias. Control existente de 15 reviews aprobado, sin certificar sus hechos.

38/38 controles de navegador y cuatro capturas inspeccionadas, escritorio/móvil 1440/390 px: requisitos, fuentes fechadas, límites, metadatos, afiliación, foco por teclado, títulos libres de cabecera fija y ausencia de desbordamiento/excepciones. Una ronda visual, sin microajustes. Cuatro candidatos del escáner editorial comprobados como avatares ocultos con alt vacío explícito.

28/28 registros conservan su huella semántica fuera de instalación respecto al corte de cámaras. Diez huellas de fuente/build guardadas. Diff-check sin errores, 148 avisos LF/CRLF existentes. No se repitieron Lighthouse ni QA completo de release; red externa bloqueada en navegador, cuentas y hardware físicos no verificados.

## Juzgado

Un mismo revisor, cuatro perspectivas; no aprobación independiente.

| Perspectiva | Valoración | Dictamen y mejora pendiente |
|---|---:|---|
| Producto | 3/5 local | Requisitos y piezas importantes visibles. Completar el resto sin ocultar condiciones materiales. |
| Técnica | 3/5 local | Estructura reutilizada y preservación comprobada. No ampliar objetivos del quiz por un dato nuevo. |
| Datos/editorial | 2/5 integral | Dos perfiles sustentados; identidad exacta, roles, firmware, servicios y otros 17 perfiles siguen pendientes. |
| Operación | 2/5 integral | Checkpoint actualizado y heartbeat existente; no demuestra operación comercial ni publicación. |

Entrega integral: **NO LISTA PARA PUBLICAR**. Continuar con identidades inequívocas y requisitos pendientes, o con un consumidor de compatibilidad sin evidencia si ofrece mayor impacto. Mantener bloqueos Amazon/Supabase acotados y no repetir búsquedas sin nueva pista.
