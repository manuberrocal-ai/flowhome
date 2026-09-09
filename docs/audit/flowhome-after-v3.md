# FlowHome V3 — resultado de ejecución local

Fecha: 2026-09-04. Rama `improve/flowhome-v3-2026-09-04`, base `17a4ec14dcfcbb537df452273335a44c8881da59`. Cambios sin commit, push ni despliegue; el árbol inicial estaba limpio. La aprobación del usuario abarca implementación y pruebas locales, no activación externa.

## Fuente y alcance recuperados

Se revisó la última tarea **Prompt optimización Flowhome** y su documento V3 completo en el visor (49.369 caracteres): https://chatgpt.com/c/6a9a2e9f-7c10-83e9-84ee-ad2d96df8ead . La descarga del adjunto fue bloqueada; no se afirma tener una exportación literal idéntica. El prompt de julio y `docs/REMAINING_WORK_PROMPTS.md` se trataron como antecedentes. Este documento y el baseline son el registro operativo de los pedidos, no una transcripción palabra por palabra.

Pedidos vigentes: preservar marca/rutas/home; compra y guardado anónimos; integridad comercial; SEO/GEO y contenido atribuible; QA de siete tamaños y rendimiento repetido; cliente oficial Amazon; adquisición y cola diaria seguras, idempotentes y sin autopublicación; informes, revisión y rollback. No se sustituyen resultados comerciales por pruebas de código.

## Resultado implementado

- Precios, descuentos, ratings y stock sólo se muestran con evidencia compatible, íntegra y vigente; los 28 catálogos manuales no se anuncian como ofertas actuales. Shortlist sin cantidades/subtotal; quiz, búsqueda, hero, layouts y schema comparten la regla.
- Corregidos doble normalización del hero, CTA recortado, solapamientos, controles pequeños, carrera de imágenes y sustitución de fotos. El móvil separa imagen y acción. QR local sin servicio externo; pie con contraste legible y logo preservado.
- 15 reviews y 8 guías corregidos, 26 URL documentales en artículos y 28 incluyendo productos, con fuentes/fechas visibles y sin inventar revisión humana. M2, Echo Dot 5, Nest Hub 2 y Blind Tilt corregidos con roles y condiciones de conectividad. Generador limitado a borradores no publicables; calculadora explícitamente ilustrativa.
- Block8: seis brechas de procedencia, permisos, caducidad, historial, variante y clave idempotente cerradas localmente; dos bordes de Block9/10 encontrados en revisión y corregidos. Sin integración comercial activa.
- Cliente Amazon con cuatro operaciones, OAuth en memoria, límites, serialización, reintentos y aplazamiento. Ejecución diaria con bloqueo, kill switch, huella de fuentes, evidencias verificadas por hash y cola manual. Scheduler preparado pero inactivo.
- `fast-uri` transitivo de desarrollo actualizado 3.1.5 → 3.1.7; dos fallos reproducidos antes ya no se reproducen. La auditoría remota posterior agotó su tiempo de espera: no se declara un inventario libre de vulnerabilidades.

## Registro de aceptación

“Local” significa contrato comprobado en el árbol y entorno de prueba, no funcionamiento de un servicio remoto. “Parcial” conserva un requisito no satisfecho; no se asignan puntuaciones arbitrarias de éxito.

| Nº | Pedido | Estado y límite |
|---|---|---|
| 1 | Amazon sin login/intercepción | Local: URL directa etiquetada y acción predeterminada conservada |
| 2 | Analítica con consentimiento | Local: aceptación, rechazo y ausencia de decisión; sin transmisión remota probada |
| 3 | Guardado anónimo | Local: persistencia y estado visible sin diálogo de cuenta |
| 4 | Lista única, no checkout | Local: toggle, sin cantidad/subtotal ficticio |
| 5 | Estado de guardado sincronizado | Local: componentes y contratos de sincronización; backend real pendiente |
| 6 | Cuenta sólo para beneficios reales | Parcial: no obliga a comprar/guardar; autenticación/sync real requieren cuenta de prueba |
| 7 | Hero atómico | Local: campos coherentes, alternativa de imagen, CTA accesible |
| 8 | Rutas de comparación | Local: rutas existentes, tabla y contexto; catálogo no equivale a compatibilidad verificada |
| 9 | Overlays no obstructivos | Local: hit-test del CTA y pie/dock tras desplazamiento instantáneo |
| 10 | Slides ocultos no interactivos | Local: un artículo activo, contratos de foco/rotación |
| 11 | Quiz explicable | Local: datos desconocidos no se convierten en precios/presupuestos comprobados |
| 12 | Relacionados pertinentes | Local: selección por identidad/categoría y contexto; sin garantía universal de compatibilidad |
| 13 | No promociones caducadas | Local: ventana estricta, invalidez/calendario/futuro y límite exclusivo probados |
| 14 | No stock inventado | Local: catálogo activo no equivale a disponibilidad |
| 15 | Separar rating de evaluación | Local: rating de cliente sólo con fuente vigente; no nota editorial inventada |
| 16 | UI y schema coherentes | Local: proyección común en consumidores y estructuras |
| 17 | Enlaces de afiliación correctos | Local: identidad, destino y atributos; operación comercial de la cuenta no comprobada |
| 18 | Canonical/robots/sitemap/status | Local: inventario estático y pruebas HTTP; rendimiento de Search Console observado en septiembre, sin auditoría de indexación/CWV en producción |
| 19 | Evitar thin/duplicados/huérfanos | Parcial: controles estructurales y 23 textos revisados; hechos de los 28 modelos aún requieren validación |
| 20 | Hreflang real o N/A | N/A justificado: un mercado/idioma editorial, sin equivalentes localizados |
| 21 | Contenido principal accesible | Local: HTML generado y enlaces inspeccionados sin interacción obligatoria |
| 22 | Siete viewport pairs | Local: 16 plantillas × 7 tamaños, estados funcionales y diez casos de fichas/reviews corregidas |
| 23 | Teclado y movimiento reducido | Local: contratos y navegador; no certificación exhaustiva WCAG con usuarios |
| 24 | Sin errores nuevos de consola/CSP | Local offline; SDK de identidad bloqueado deliberadamente y 404 esperado identificados |
| 25 | Gates de calidad | Ver sección de evidencia; resultados del último ciclo, no de una corrida parcial |
| 26 | Ejecución diaria idempotente | Local: manifiesto, bloqueo y huella; aún no orquestación remota durable |
| 27 | No duplicar reruns | Local: identidad/clave y comprobación de hashes; persistencia entre runners descartados no implementada |
| 28 | Aislar caída de Amazon | Local: simulaciones de respuesta/cuota/timeout; sin llamada autenticada real |
| 29 | Fixture de expiración | Local: antes, en y después del límite; no extiende capturas por aprobación |
| 30 | Schedule/dry-run/lock/logs/kill | Parcial: implementación y pruebas locales; scheduler remoto no activado |
| 31 | Candidatos basados en evidencia | Parcial: puntuación con faltantes explícitos y revisión manual; sin datos reales de demanda, historial permitido o conversión |
| 32 | Sin precios falsos por falta de credenciales | Local: dry-run/no-config no fabrican respuesta comercial |
| 33 | Cambios auditables y reversibles | Local: diff, rama y runbooks; ninguna migración de datos persistidos ejecutada |
| 34 | Evidencia antes/después | Local: baseline, capturas y mediciones; no es una comparación causal de tráfico |
| 35 | Sin despliegue no autorizado | Cumplido: no push, deploy, pagos ni activación de cuentas/scheduler |

## Evidencia de cierre

El ciclo completo terminó en `complete` a las 05:24:11 UTC y su repetición devolvió `reused` sin regenerar evidencia. Huella: `1f3e875439b3cff4fc2909f028900c9afa22bce4d188dbd39acff387905cd163`. Manifiesto y reportes: `reports/daily/2026-09-04/`. Los 7/7 controles pasaron: 597/597 pruebas, lint, tipos, build, SEO, navegador y Lighthouse. Se preservaron 88 páginas; inventario de 83 indexables, profundidad máxima 2, 0 errores y 0 warnings SEO. Navegador: 134/134 casos y 91/91 HTTP, sin errores de setup/cleanup. Incluye diez casos nuevos sobre las tres fichas y dos reviews de conectividad corregidas. Amazon en dry-run, 0 candidatos adquiridos, 28 registros para revisión, 5 ofertas caducadas/futuras/desconocidas, 0 anomalías. No confundir la corrida `needs_attention` anterior con esta aprobación: detectó una expectativa vieja de espaciado, un tipo faltante y cambios del harness durante QA; se corrigieron antes de repetirla. La huella también incluye datos auxiliares y migraciones; su regresión está entre las 597 pruebas.

| Ruta medida | Rendimiento | Accesibilidad | Buenas prácticas | SEO | LCP mediana | CLS mediana | TBT mediana |
|---|---:|---:|---:|---:|---:|---:|---:|
| Home | 97 | 100 | 100 | 100 | 2487 ms | 0 | 0 ms |
| Producto Amazon Thermostat | 98 | 96 | 100 | 100 | 2188 ms | 0,0074 | 0 ms |
| Review Roborock Q5+ | 98 | 100 | 100 | 100 | 2190 ms | 0 | 0 ms |
| Comparación termostatos | 99 | 100 | 100 | 100 | 2113 ms | 0 | 0 ms |

Son 3 muestras completas por ruta, 12 en total; hubo 2 avisos de limpieza posterior del navegador en Windows, conservados en el informe, sin informes faltantes. Cumple los presupuestos locales 90/95/95/95, LCP ≤2500 ms, CLS ≤0,1 y TBT ≤200 ms. El baseline ya tenía rendimiento 97/98/98/98 y LCP 2414/2265/2265/2190 ms; no se presenta ruido de medición como una gran mejora. La home conserva su puntuación, pero su LCP quedó a sólo 13 ms del límite; conviene volver a medir en el entorno publicado antes de atribuir una mejora. El CLS del producto subió desde 0 pero sigue bajo el presupuesto. Red externa bloqueada, laboratorio local, INP no medido: no son CWV de usuarios reales.

La comprobación habitual `git diff --check` pasó con avisos del entorno LF/CRLF, sin errores de espacios. No se cambió la configuración Git. La repetición final de tipos comprobó 229 archivos: 0 errores, 0 warnings y 18 hints. Esos hints son sugerencias, incluidas APIs de validación antiguas y scripts JSON implícitamente inline; no impiden compilar.

## Pendientes que impiden declarar TODO completado

1. Resolver la discrepancia de acceso Amazon: el usuario confirma tener API, pero la sesión autenticada de `flowhome-20` muestra acceso no habilitado tanto en Creators API como en la sección anterior. No se localizaron credenciales utilizables en el proyecto/OpenCode revisados. Confirmar si existe otra cuenta/tienda aprobada o un almacén específico; no enviar secretos por chat. Después comprobar permisos de uso/retención y contrato real, caducidad/borrado/serving de extremo a extremo antes de ofertas públicas. Ver `credential-location-audit-v3.md`.
2. Decisión y aprobación del almacenamiento/orquestación durable; integración con Block8 y cola revisada. El workflow no persiste estado entre runners efímeros descartados.
3. Correspondencia modelo/ASIN/bundle, firmware/servicios y revisión de afirmaciones sensibles de 28 productos. Las fuentes de artículos no validan cada booleano del catálogo.
4. Cuenta autorizada para autenticación y sincronización; comprobación de servicios/imágenes remotos y eventual lectura física del QR. Una comprobación HEAD posterior dio 28/28 respuestas 200 de tipo imagen; no valida identidad, permisos, decodificación ni rendimiento online. Govee declara 1,62 MB. Ver `remote-service-checks-v3.md`.
5. Medición comparable posterior a publicación, Bing actual, CWV de campo y atribución. Ya se leyeron GA4/Search Console de FlowHome: para 7 agosto–3 septiembre, 14 sesiones GA4; consultas con 443 impresiones/0 clics y páginas con 628 impresiones/0 clics (desgloses diferentes, no se suman). El panel Amazon muestra 17 clics en su ventana de 30 días; el resumen mensual actualizado el 2 de septiembre, 1 clic/0 pedidos/$0,00. Se preservan los registros de julio. No son efectos de cambios aún no publicados; ver `current-measurement-v3.md` y el informe de acceso.
6. Repetir el inventario de vulnerabilidades cuando responda el servicio remoto. El tercer intento acotado devolvió `FETCH_ERROR`, salida 1 y ningún inventario utilizable. No se realizó auditoría integral de seguridad.
7. Revisión y aprobación explícita del propietario para push, publicación y activación del scheduler. No se ejecutaron esas acciones.

Puerta editorial: **NO LISTO PARA PUBLICAR como verificación integral**, conforme al registro de afirmaciones y la skill de revisión de copy. Las skills de contrato verificable, interfaz, copy y corrección de hallazgos hicieron explícitas estas pruebas, condiciones y límites. Los resultados locales no sustituyen esas aprobaciones.

Documentos de continuidad: baseline/arquitectura/informe Block8/seguridad/copy en esta carpeta; fuentes y temas en `../content/`; cliente/scoring en `../data/`; instalación, operación y rollback en `../operations/`.

Comprobaciones finales de lectura: Bing necesita inicio de sesión del propietario; se entregó la pantalla sin elegir proveedor ni conceder permisos. Las cabeceras de las imágenes y el nuevo fallo de auditoría están registrados en `remote-service-checks-v3.md`. Estos diagnósticos no alteraron la huella del ciclo local ni cerraron la discrepancia de acceso Amazon. La continuación de la integración real requiere identificar la cuenta aprobada o la entrada de credenciales existente; no se da por completado el objetivo global.
