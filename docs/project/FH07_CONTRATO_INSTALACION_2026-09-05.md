# FH-07 — contrato de instalación por modelo

Fecha: 5 septiembre 2026. Avance de FH-07, no sustitución de su aceptación integral.

## Problema y evidencia

El quiz asigna instalación por categoría: `smart-lighting` incluye HS200/HS220 como plug-and-play y `smart-thermostat` como light setup. Las fichas US de Kasa exigen cableado/neutro; el manual de Amazon Smart Thermostat y ecobee Premium requieren comprobar HVAC/cableado. El aviso de filtros relajados conserva además la clase `hidden` aunque se quite el atributo `hidden`.

## Cambio autorizado

Agregar requisitos documentales de instalación a los modelos contrastados, con identidad de modelo, mercado objetivo US, fuentes y fecha separadas de los datos comerciales. Un resolver compartido devuelve desconocido ante ausencia, identidad distinta o evidencia mal formada. Quiz y ficha usan ese resolver; no se infiere dificultad desde la categoría. La valoración de dificultad es editorial, no una certificación del fabricante, y las opciones expresan el máximo trabajo aceptado. Un fallback se declara y conserva primero los candidatos con instalación ajustada a la preferencia.

Ámbito: colección de productos, módulo de instalación, quiz, ficha, pruebas y documentación. Sin nuevas dependencias, publicación, acceso de cuenta ni búsqueda de secretos. Se conservan precios/fechas, ASIN y otras afirmaciones existentes: su revisión sigue pendiente.

## Aceptación observable

- HS200/HS220 y los dos termostatos no cumplen una preferencia de instalación sin cableado.
- Sólo requisitos documentales válidos del mismo modelo permiten estimar instalación. Ausencias, variantes diferentes, fuentes inválidas y fechas futuras no producen un match.
- La ficha muestra requisitos, fuente/fecha y límite de ASIN/bundle; los 28 perfiles muestran requisitos o desconocido explícito.
- El quiz no oculta el fallback, no lo describe como cumplimiento total y explica requisitos/desconocidos por resultado. Comprar/guardar anónimamente se conserva.
- Pruebas dirigidas de lógica, catálogo real y límites; controles generales del proyecto; render 1440/390 y flujo de teclado, zoom, selección/guardado y avisos. Máximo dos rondas visuales salvo evidencia nueva.

## Juzgado y condición de parada

Un único revisor evaluará producto, técnica, datos/editorial y operación con evidencia, no revisores independientes inventados. Esta entrega sólo puede aprobar la corrección local de instalación; FH-07 completa exige 28 identidades y hechos, firmware, roles y suscripciones sustentados o desconocido explícito en sus consumidores. No cerrar por este subconjunto. Ante dos correcciones fallidas del mismo problema sin evidencia nueva, registrar causa y pasar a trabajo independiente.
