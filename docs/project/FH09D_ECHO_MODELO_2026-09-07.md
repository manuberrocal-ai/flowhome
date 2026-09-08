# FH09D — ilustración específica del Echo Dot 5

El Echo Dot 5 sin reloj deja de mostrar el altavoz cilíndrico genérico. Se integra una ilustración original: silueta esférica, tejido charcoal, base aplanada y aro azul inferior. Se comparó visualmente con la [referencia de Amazon para Echo Dot](https://digprjsurvey.amazon.com/csad/help/node/T9vK1qIZkTSG7LX8JT) y su imagen enlazada; Amazon reutiliza esa imagen también para la generación 4, por lo que la comparación acredita la forma exterior común, no distingue internamente generaciones. No es fotografía oficial, prueba física, certificación de accesorios, paquete ASIN ni tolerancia dimensional.

**Cobertura: 1/28 modelos con ilustración específica revisada; 27 pendientes. Cero fotografías oficiales habilitadas.** No confundir esta mejora con cierre de FH-09 ni con fidelidad certificada del catálogo completo.

## Archivos y procedencia

- Original: `public/images/product-art/models-v1/echo-dot-5th-gen.png`, 1.884.904 bytes, SHA256 `7b36785817e252f0563efeac31debe522fc4678325a5236b6147a25ba53fa0e8`.
- Entrega web: `public/images/product-art/models-v1/echo-dot-5th-gen.webp`, 1.255.620 bytes, conversión lossless con sharp 0.35.3, igualdad RGBA comprobada. Sigue siendo pesado para una miniatura; variantes responsivas pendientes.
- Herramienta: generación integrada `image_gen`, no CLI ni descarga de fotografía ajena. Original recibido: `C:/Users/manub/.codex/generated_images/01a06a65-7181-7690-82b0-02a4494be038/exec-b66d42bb-60f5-471d-9687-6e56db389bbd.png`; conservado y copiado al proyecto.
- La captura de la referencia se conserva solo en `reports/echo-manufacturer-reference.png`, fuera de los activos publicados. No se incorporó su fotografía a la web ni se usó como archivo de entrada de generación.

## Integración

Registro explícito por slug/ASIN/categoría coherentes; una ruta de imagen almacenada por sí sola no activa un modelo. Se mantiene el fallback genérico y no se presenta arte generado como foto real. Cartas, ficha, review, búsqueda, guardado, carrusel y metadatos sociales emplean etiquetas coherentes. Los datos estructurados mantienen ImageObject con descripción de ilustración.

Se corrigieron dos defectos encontrados al integrar: el pie del hero quedaba recortado en escritorio por la altura completa del enlace de foto; y la recuperación de una imagen fallida podía restaurar el pie de otro producto tras rotar. La recuperación ahora solo restaura el pie original al recargar exactamente aquella fuente.

## Verificación

- Verificación final: 912 pruebas completas aprobadas, incluyendo control de píxeles del nuevo modelo. Diff check aprobado.
- Lint y tipos aprobados, cero errores/advertencias, 18 hints. Build88 y SEO sin errores/advertencias.
- Diez escenarios de navegador390/1440: portada, ficha, review, búsqueda y catálogo, con imagen/alt/pie correctos y sin overflow. Comprobación geométrica del pie del hero, ida/vuelta del carrusel, imagen/pie en lista guardada y prueba aislada de fallo de carga seguida de rotación aprobadas.
- `scripts/qa/model-illustration-browser.cjs`, capturas `FH09D-echo-390.png` y `FH09D-echo-1440.png`.
- Una corrida inicial completa reportó un fallo sin conservar el nombre en la salida resumida; la repetición completa pasó911 sin cambio intermedio. No se atribuye ese fallo a una causa demostrada ni se declara corregido por inferencia.
- El proceso anterior de preview no estaba disponible y 4339 rechazaba conexión. Se restableció preview local sobre el build actual. No se publicó, envió ni activó proveedor alguno.

## Juzgado de etapa

Producto **3/5**: corrige la forma de un destacado, catálogo completo aún pendiente. Técnica **4/5 local**: identidad y etiquetas sincronizadas, fallos de imagen probados; faltan miniaturas más livianas. Datos/editorial **3/5 en este modelo**: ilustración original explícita y revisión externa de silueta; sin comprobación física del paquete. Operación **2/5**: activos y procedencia guardados, sin entrega exacta ni publicación aprobada.

Siguiente: Govee H617C (tira, no bombilla) y después los demás modelos. Verificar la referencia visual específica antes de generar; si no alcanza, conservar el pendiente explícito y avanzar otra pieza. No volver a considerar genérico equivalente a modelo.

## Prompt final utilizado

Use case: product-mockup. Asset type: square editorial product illustration for FlowHome, an existing smart-home research catalog. Create an ORIGINAL clearly hand-painted watercolor/pencil illustration of ONE Amazon Echo Dot 5th generation smart speaker, standard model WITHOUT CLOCK, in charcoal. This is a model-specific illustration, not an official product photo. White clean background, centered whole device filling about 70% of the square, subtle grounding shadow only, front view at device mid-height so top controls and rear connections are not visible. Important physical invariant: compact nearly spherical fabric-covered body, 100mm wide and 89mm high, smoothly rounded dome, a slightly flattened circular foot; fine charcoal woven fabric, small dark plastic lower base. Thin cyan/blue light ring at the very BOTTOM of the device, just above the tabletop. No upper light ring. No cylindrical speaker shape, no puck shape, no flat top, no screen, no clock or digits, no microphone/sound-wave logo on front, no text, no invented ports, no cables or power adapter, no extra objects. Preserve precise spherical silhouette while making rendering unmistakably an illustration with restrained pencil edgework and watercolor texture. No decorative abstract blob behind it, no panel border, no advertising slogans, no photorealism.
