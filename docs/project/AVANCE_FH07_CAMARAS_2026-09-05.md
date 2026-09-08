# FlowHome — continuación y segundo corte FH-07

Estado: 5 de septiembre de 2026, verificación de navegador a las 15:14 UTC. [Contrato](FH07_CAMARAS_CONTRATO_2026-09-05.md) · [Evidencia y huellas](FH07B_EVIDENCIA_2026-09-05.json) · [Prompt](PROMPT_MAESTRO.md) · [Plan](PLAN_DE_TRABAJO.md).

## Resultado

Dos perfiles de instalación adicionales, Tapo C120 y Blink Outdoor 4, incorporados y probados localmente. El catálogo tiene **9 modelos documentados y 19 unknown** para instalación. FH-07 sigue parcial, 2/5 global; cinco tareas cerradas y 27 restantes. No hubo publicación, commit, cambio de cuenta ni llamada autenticada a Amazon.

La ejecución anterior terminó con el error de capacidad del modelo y el objetivo registrado quedó bloqueado. Esto no prueba un bloqueo de todo el trabajo del proyecto. A pedido del propietario se creó y se consultó mediante la app un único heartbeat activo: `flowhome-desarrollo-integral-con-juzgado`, continuación cada hora en FLOWHOME.DEV. No existía un heartbeat FlowHome que eliminar; las automatizaciones de otros proyectos se conservaron. No se cambió directamente el registro del objetivo bloqueado ni se consumieron resets. La configuración está comprobada; una activación futura todavía no fue observada.

## Cambios y fuentes

Se añadieron únicamente los campos `installation` de dos productos y una prueba específica. No se cambiaron esquema, lógica compartida ni estilos. El resto de los campos de los 28 productos conserva su huella semántica anterior a este corte, incluidos ASIN, afiliación, precios, ratings y fechas. La clasificación de esfuerzo es una estimación editorial conservadora de colocación/configuración, no una prueba física. Tapo también permite colocación sobre mesa sin montaje.

| Perfil | Requisitos documentados | Fuente primaria consultada el 5 septiembre |
|---|---|---|
| Tapo C120 US | Alimentación externa, app/red, colocación y cable; el adaptador del manual es para interior; tarjeta separada para grabación local y servicio cloud de pago | [Ficha US](https://www.tp-link.com/us/home-networking/cloud-camera/tapo-c120/) y [guía US, revisión 1.3.1](https://static.tp-link.com/upload/manual/2024/202410/20241030/7106511094_Tapo%20C120(US)1.0_QIG_V1.pdf) |
| Blink Outdoor 4 | Sync Module necesario, inclusión según bundle; batería/montaje, cierre del puerto y adaptador apto para exterior; grabación local condicionada al módulo/medio y prestaciones con suscripción | [FAQ oficial US](https://support.blinkforhome.com/en_US/faq-outdoor4/outdoor4-camera-faq) |

El manual Tapo enlazado desde soporte US permite identificar su revisión documental; no prueba la revisión física entregada por el ASIN del catálogo. Se mantiene en ambas fichas la advertencia de que ASIN, bundle y hardware no se cotejaron independientemente con los requisitos.

## Aqara P1: discrepancia abierta, sin migración automática

El catálogo conserva `B09QXPBRM2`. La [ficha técnica US del fabricante](https://www.aqara.com/us/product/motion-sensor-p1/specs/) identifica el sensor como **MS-S02**. En la investigación anterior de este mismo día, el enlace de compra de la [página general](https://www.aqara.com/us/product/motion-sensor-p1/) llevó a `B09QKVMMTB`. En esta continuación, el enlace de compra de **Specs** llevó a `B0B9XZ1D51`; la [ficha comercial de destino](https://www.amazon.com/dp/B0B9XZ1D51) también se identifica como MS-S02, unidad individual.

Conclusión comprobada: los destinos consultados no coinciden con el ASIN guardado y las dos páginas oficiales no aportan un destino único. No está comprobado que el ASIN guardado sea inexistente o un producto distinto; el error de recuperación de esa URL no lo demuestra. La página general dio timeout en la reconsulta; no se usó ese fallo para invalidar la observación anterior.

Una búsqueda en `src`, `scripts`, `data`, `test` y `supabase` encontró el ASIN literal sólo en la ficha; el slug aparece además en una prueba de taxonomía. Los consumidores genéricos de catálogo, compra, guardado, imagen e historial requieren revisión antes de migrar. No se trasladaron precios, ratings, fechas ni parámetros de afiliación de los enlaces del fabricante. El perfil de instalación Aqara continúa unknown hasta resolver el alcance de identidad; priorizar esa decisión documentada y las otras identidades ambiguas en FH-07.

## Evidencia y límites

- 18/18 pruebas dirigidas de instalación y quiz; 653/653 pruebas completas, cero fallos y omitidas.
- Lint aprobado. Tipos: 241 archivos, cero errores/advertencias y 18 indicaciones existentes.
- Build: 88 páginas. SEO: 88 páginas, cero errores/advertencias. Calidad: 15 reviews aprobadas por el control existente; ese control no certifica todos sus hechos.
- 38/38 controles nuevos de navegador: dos fichas y quiz seguridad, 1440/390 px, movimiento reducido, fuentes, límites, metadatos, guardado anónimo por teclado y enlaces directos de afiliación. Sin excepciones del cliente ni desbordamiento horizontal.
- Se inspeccionaron seis capturas. La cantidad de condiciones alarga las tarjetas; no hubo recortes del texto. Evaluar síntesis por campos al completar los requisitos, sin ocultar condiciones materiales.
- Escáner editorial: tres páginas, seis candidatos de alt vacío. Los de las fichas son avatares ocultos con `alt=""` explícito; el avatar compartido del quiz permanece en el mismo estado anónimo. No equivale a comprobar su estado autenticado.
- Diff-check sin errores, 148 advertencias de conversión LF/CRLF existentes. Verificación semántica: 28/28 registros sin alteraciones fuera de instalación.

Red externa bloqueada en el navegador de pruebas; no se certifican fotos remotas, derechos, servicios reales ni dispositivos físicos. No se repitió Lighthouse ni el QA completo de siete tamaños. Los 61 controles/652 pruebas y las huellas de [la primera evidencia FH-07](FH07_EVIDENCIA_2026-09-05.json) siguen siendo históricos: no representan los dos perfiles ni los documentos actualizados de este corte.

## Juzgado del corte

Un único revisor, cuatro perspectivas; no revisión independiente.

| Perspectiva | Valoración | Dictamen y mejora pendiente |
|---|---:|---|
| Producto | 3/5 local | APROBADO LOCAL: requisitos relevantes visibles en ficha y recomendación. Mejorar síntesis sin ocultar montaje, alimentación o extras. |
| Técnica | 3/5 local | APROBADO LOCAL: estructura y consumidores existentes reutilizados, conservación y pruebas. El esquema aún tiene booleanos por defecto que no prueban hechos. |
| Datos/editorial | 2/5 integral | REQUIERE CORRECCIÓN para cerrar FH-07: dos perfiles sustentados no resuelven identidad exacta, roles, firmware y servicios de los 28 productos. |
| Operación | 2/5 integral | Continuación programada y checkpoint conservado; activación futura y publicación real NO VERIFICADAS. No confundir el heartbeat de desarrollo con activar el scheduler comercial FH-19. |

Este corte es **APROBADO LOCAL** en su alcance. La entrega integral permanece **NO LISTA PARA PUBLICAR**. Los campos heredados de suscripción/privacidad/compatibilidad no fueron corregidos aquí: una condición escrita no basta para aprobar esos consumidores.

## Siguiente punto de continuación

1. Retomar FH-07 sin repetir estas pruebas ni la auditoría completa por rutina. Nueve instalaciones documentadas, 19 unknown.
2. Separar hechos verificados de booleanos heredados en los consumidores, especialmente la preferencia de privacidad que hoy recompensa `subscriptionRequired: false` y la inferencia de control local por Matter/Zigbee. Registrar fuentes y alcance por función antes de aprobarlos.
3. Resolver las identidades ambiguas —Aqara P1, Arlo Essential, Govee, Hue/otros bundles— sin mezclar historial entre variantes; completar los restantes requisitos de instalación en lotes pequeños con evidencia.
4. Mantener los bloqueos Amazon/Supabase delimitados. Hay trabajo local ejecutable; la falta de acceso no justifica detener todo el proyecto. Los criterios y dependencias completos siguen en el backlog.
