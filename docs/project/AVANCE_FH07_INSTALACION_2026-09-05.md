# FH-07 — instalación documentada por modelo

Fecha: 5 septiembre 2026. **Corrección de instalación APROBADA LOCALMENTE, 3/5. FH-07 integral sigue parcial, 2/5.** Cinco tareas completas y 27 restantes. No se publicó, confirmó en Git ni desplegó nada.

## Resultado

El quiz ya no deduce instalación a partir de una categoría. HS200/HS220 y los dos termostatos requieren una preferencia abierta a cableado; si aparecen al ampliar la selección, muestran sus requisitos y que exceden la preferencia elegida. Los casos no documentados se presentan como desconocidos, no como fáciles. Una preferencia de mayor esfuerzo admite dispositivos documentados más sencillos; los candidatos que sí cumplen instalación conservan prioridad al ampliar resultados.

Las 28 fichas muestran una sección de instalación, con requisitos y fuentes para siete modelos o desconocido explícito para los otros 21. Se aclara que la documentación del modelo no verifica la correspondencia del ASIN, el paquete ni la revisión de hardware. Los demás campos YAML se conservaron íntegramente a nivel estructural en 28/28 registros; ninguna fecha comercial o valoración fue renovada.

Se corrigieron además el aviso de filtros ampliados que quedaba oculto por CSS, el resumen que implicaba coincidencia total, la referencia residual a prioridad editorial y los saltos a secciones tapados por la cabecera fija. La guía de revisión de texto exigió explicar las limitaciones junto a cada resultado; Impeccable conservó el diseño e hizo comprobar esos estados en escritorio y móvil.

## Evidencia documental utilizada

Fuentes primarias abiertas y pasajes leídos el 5 septiembre. La clasificación de esfuerzo es una **estimación editorial**, no una medición ni etiqueta concedida por el fabricante. La fecha de publicación de cada página no siempre está disponible; la fecha de consulta no se presenta como fecha del hecho.

| Modelo del catálogo | Requisitos utilizados y alcance | Fuente |
|---|---|---|
| HS200 | Interruptor empotrado, proceso de cableado, neutro. Estimación: instalación avanzada | [Ficha Kasa US](https://www.kasasmart.com/us/products/smart-switches/kasa-smart-wi-fi-light-switch-hs200) |
| HS220 | Dimmer empotrado, neutro, tipo de dimming y cargas. Estimación: instalación avanzada | [Ficha Kasa US](https://www.kasasmart.com/us/products/smart-switches/kasa-smart-wi-fi-light-switch-dimmer-hs220) |
| Amazon Smart Thermostat | HVAC compatible de 24 V, C-wire/adaptador, precauciones eléctricas, app y Wi-Fi. No sistemas de línea o milivoltios | [Manual US, página 1](https://m.media-amazon.com/images/G/01/kindle/journeys/MmE1OWJhOGQt/Smart_Thermostat_Online_Hello_Guide.pdf) |
| ecobee Smart Thermostat Premium | 24 VAC, comprobador de compatibilidad, C-wire/PEK. No se declara que el bundle Amazon incluya accesorios | [Ficha US, powering methods y compatibility](https://www.ecobee.com/en-us/smart-thermostats/smart-thermostat-premium/) |
| Echo Dot 5th Gen | Adaptador de corriente, app Alexa, cuenta e internet Wi-Fi. Estimación: alimentación y app, no ausencia de configuración | [Guía del modelo](https://digprjsurvey.amazon.com/csad/help/node/TdLI5SX5VhnxC6x6Ct) |
| Google Nest Hub 2nd Gen | Alimentación de toma de pared, app Google Home, cuenta, teléfono/tablet compatible e internet Wi-Fi | [Especificaciones, sección 2nd gen](https://support.google.com/googlehome/answer/7072284?hl=en), [configuración de pantallas](https://support.google.com/googlehome/answer/7029485?hl=en) |
| August Wi-Fi Smart Lock | Montaje interior sobre cerrojo monocilíndrico compatible; baterías, app y Wi-Fi. Estimación: montaje ligero condicionado al cerrojo | [Requisitos e instalación](https://august.com/products/august-wifi-smart-lock) |

La página comercial de SwitchBot Blind Tilt también se consultó, pero incluía contenido relacionado de otros productos en la extracción y no aportó por sí sola los requisitos exactos necesarios. No se usó para aprobar un perfil de instalación. No se trasladaron precios, reseñas de clientes, tiempos promocionales ni afirmaciones de «fácil» a los datos publicados.

## Verificación y límites

- Contrato previo: [criterios y alcance](FH07_CONTRATO_INSTALACION_2026-09-05.md).
- Ocho pruebas nuevas: identidad/ausencia, fuente/fecha mal formada o futura, mercado, niveles, cuatro modelos cableados, catálogo real, conservación de candidatos documentados y las 15 combinaciones objetivo/instalación. Las pruebas generales de quiz usan evidencia sintética explícita, fuera del catálogo.
- **652/652 pruebas completas finales**, sin fallos ni omitidas; 40 dirigidas después del ajuste visual. Lint aprobado. Tipos: 241 archivos, cero errores/advertencias y 18 hints preexistentes. Se evitó añadir otro uso de validación de URL obsoleta.
- Build: **88 páginas**. Auditoría SEO final: cero errores y advertencias. Control de calidad de las 15 reviews aprobado; no equivale a verificar sus hechos.
- **61/61 controles de navegador finales**, incluyendo respuestas por teclado, selección con y sin ampliación, aviso visible, 28 páginas HTTP 200 con fuentes/desconocidos, título/H1/canonical, guardado anónimo, enlaces directos y recuperación del estado URL. Sin excepciones de cliente ni desbordamiento en los estados comprobados. Aviso: contraste 14,47:1; enlaces de fuentes: altura 44 px.
- Dos rondas visuales conjuntas 1440/390: la primera detectó cabecera superpuesta al título del ancla; la segunda confirmó la corrección. Reflow adicional a 720 CSS px, equivalente al ancho de escritorio a 200%, **no prueba de zoom nativo ni dispositivo real**. Una ejecución inicial del auxiliar de navegador falló porque `URL` no existe fuera del contexto de página; se corrigió el auxiliar, no la aplicación.
- Analizador de texto final: 29 páginas, 58 candidatos `missing-alt`. Corresponden a dos avatares ocultos por página con `alt=""` explícito: 56 comprobados en las 28 fichas y el mismo componente en quiz. No son fotos de producto sin alternativa; el estado de cuenta autenticada permanece fuera de esta prueba.
- Detector de diseño: cuatro avisos heurísticos existentes en clases del quiz, no un informe limpio ni una auditoría WCAG completa. No se rediseñaron esos estilos. No se repitió Lighthouse ni la matriz completa de siete tamaños; no se añadieron imágenes ni dependencias.

El navegador usó preview local, movimiento reducido y solicitudes externas bloqueadas: no prueba disponibilidad de fotos remotas, analítica, login o publicación. Las fuentes se consultaron por separado. No hay comprobación física del cableado del comprador. Ver [navegador y límites](FH07_NAVEGADOR_2026-09-05.json), [inventario y preservación 28/28](FH07_CATALOGO_INSTALACION_2026-09-05.json) y [huellas y resultados](FH07_EVIDENCIA_2026-09-05.json).

## Juzgado de este avance

Un solo revisor, cuatro perspectivas; no revisión independiente.

| Perspectiva | Dictamen | Evidencia y condición restante |
|---|---|---|
| Producto | APROBADO LOCAL, 3/5 | Selección sin falsa facilidad, límites visibles, fuentes alcanzables y guardado funcional. Faltan observación pública y requisitos de 21 modelos |
| Técnica | APROBADO LOCAL, 3/5 | Resolver compartido, desconocido ante ausencia/identidad distinta, pruebas y render. La validación de formato no certifica la verdad de una fuente |
| Datos/editorial | FH-07 REQUIERE CORRECCIÓN, 2/5 | Siete perfiles de instalación sustentados; persisten identidad exacta, bundles, generación, firmware, roles y suscripciones de los 28 |
| Operación | APROBADO LOCAL para este cambio, 3/5 | Evidencia fechada y reversible, sin nuevas plataformas ni secretos. No hay despliegue, cuenta real ni proceso sostenido de revisión documental |

No se promedian los dictámenes. **NO LISTO PARA PUBLICAR la entrega A integral.** Este avance no cierra FH-07 ni acredita los booleanos de compatibilidad/suscripción que siguen en el catálogo y otros consumidores.

## Siguiente trabajo de FH-07

Completar instalación de los 21 modelos restantes con documentación exacta; priorizar variantes ambiguas de Kasa Plug, Govee, Hue, Meross, Arlo y Ring sin confundir generaciones. En paralelo lógico, pero con un solo cambio principal en curso, tratar los campos de suscripción/compatibilidad que convierten datos ausentes en `false`: la presencia de un campo después de aplicar valores por defecto no acredita su verificación. Separar funciones básicas, grabación/servicios de pago, roles controller/bridge y firmware. Conservar unknown en todos sus consumidores, no sólo en un informe.

La comprobación independiente ASIN→modelo/bundle sigue pendiente. No repetir búsqueda agotada de credenciales ni login Supabase sin una nueva pista. Las cuentas bloqueadas no impiden continuar documentación y correcciones locales.
