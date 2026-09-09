# FH07Q — eufy C120 y Arlo: instalación documentada
Fecha: 2026-09-05. Dictamen: APROBADO LOCAL para este cambio; FH-07 sigue parcial, 2/5 integral. No es aprobación de publicación ni prueba física.

## Resultado y límites
- eufy C120: requisitos de la familia fija T8400, alimentación interior 5 V / 1 A, Wi-Fi 2.4 GHz, cuenta/configuración antes del montaje y microSD hasta 128 GB no incluida. La ficha usa T8400X / T84001W1; hardware y firmware no inspeccionados. Almacenamiento local no demuestra operación sin nube.
- Arlo: modelo delimitado a Essential Outdoor HD Camera (2nd Generation). Carga interior con cable USB-C, batería integrada, señal y detección después del montaje. La ficha consultada contradice una cámara en el título con tres en los bullets: no se certifica cantidad ni accesorios.
- Clasificación editorial light-setup en ambos; no garantiza dificultad. ASIN, enlaces afiliados y valores/fechas comerciales conservados. Catálogo: 23 instalaciones documentadas y cinco desconocidas.
- La prueba Ring conserva la elegibilidad avanzada, pero ya no exige un lugar entre cuatro resultados: elegibilidad no garantiza ranking.

## Fuentes consultadas durante la implementación
- eufy: https://service.eufy.com/article-description/Differences-Between-eufy-Indoor-Cams
- eufy: https://service.eufy.com/article-description/Setting-Up-Your-eufy-Indoor-Cam-in-eufy-App
- Identidad eufy: https://www.amazon.com/dp/B08571VZ3Q
- Arlo US: https://us.arlo.com/pages/arlo-essential-outdoor-support-page
- Manual Arlo: https://downloads.arlo.com/files/QSG/UM_VMC2050_VMC3050_VMC2052_VMC3052_EN.pdf
- Identidad Arlo: https://www.amazon.com/dp/B0DVNSQSD7

Las fichas Amazon se consultaron mediante contenido indexado (eufy, unas tres semanas; Arlo, unos ocho meses), no como comprobación comercial actual. El título de metadatos del PDF Arlo era incorrecto; su portada y contenido identifican Essential Outdoor Camera 2nd Generation. Requisitos de páginas impresas 8–15. El manual eufy no fue leído: se usaron los dos artículos oficiales indicados.

## Verificación
En el pase de implementación: 18/18 pruebas dirigidas, 700/700 generales; tipos en 247 archivos sin errores ni warnings, con 18 hints existentes; lint, diff-check y build de 88 páginas aprobados. No se repitieron esos controles sin cambios de código en este cierre.
En el cierre: SEO sobre 88 páginas, cero errores y warnings. Auditor editorial sobre dos HTML: cuatro candidatos missing-alt revisados; son los dos avatares ocultos por página, alt vacío y enlaces con nombre Open account/Profile, comprobados en navegador. No son fotos de producto sin descripción.
Navegador local: diez escenarios aprobados, dos fichas y tres preferencias de instalación del quiz de seguridad en 1440 y 390 px. Verificados fuentes, foco, ausencia de desbordamiento horizontal, límites de lista y advertencias específicas en candidatos guiados/avanzados. Cuatro capturas inspeccionadas; en móvil el contenido continúa por debajo del pliegue. Sin llamadas externas autorizadas por el helper: imágenes remotas bloqueadas, sustituto representativo visible. No se probó compra ni API Amazon.
El primer intento del helper falló por buscar un atributo en vez de la clase del avatar; corregido el selector de QA, sin modificar el sitio.

## Juzgado de este bloque
Evaluación del mismo agente, no revisores independientes.
- Producto 3/5: requisitos útiles en ficha y quiz; falta validar unidad y experiencia real.
- Técnica 4/5 local: controles y consumidores aprobados; no certifica producción.
- Datos/editorial 3/5: fuentes y contradicciones explícitas; paquete Arlo y sufijo eufy siguen inciertos.
- Operación 2/5: artefacto local, sin despliegue ni prueba de cuentas/API.

## Continuación
Resolver los cinco perfiles restantes: Aeotec hub, Aqara P1, Echo Show 8 tercera generación, Govee strip y Philips Hue starter kit. Después continuar todos los criterios de FH-07 y la entrega editorial A, sin confundir perfiles completos con catálogo íntegramente validado. Objetivo activo; sin automatización horaria.
