# Puerta editorial V3 — 2026-09-04

**NO LISTO PARA PUBLICAR como verificación integral.** Las correcciones locales no autorizan publicación ni certifican modelos, precios, interoperabilidad o resultados de negocio.

## Correcciones comprobables

- 15 reviews y 8 guías: retirados importes, ratings, adopción y ventajas no sustentados; fuentes y fechas documentales sin inventar autores o revisiones humanas. Registro detallado: `../content/claim-ledger-v3.md`.
- Componentes, tres layouts, búsqueda, quiz, guardados y datos estructurados: los números comerciales pasan por una proyección común de autorización y caducidad. Datos desconocidos no se convierten en cero o descuentos.
- Home: eliminadas frases con apariencia de testimonio y cifras de tiempo no medidas; conservadas marca, estructura, rutas y compra anónima.
- M2: corregida la negación absoluta de Matter junto con su alcance de puente y firmware, no como compatibilidad universal.
- Continuación documental: corregidos los controladores Matter Echo Dot 5/Nest Hub 2 y la radio Bluetooth de Blind Tilt; notas de puente/controlador y reconciliación de las dos reviews. Alcance y evidencia en `catalog-connectivity-followup-v3.md`.
- Calculadora: valores iniciales identificados como ejemplos, períodos de 30 días y 360 días/año; sin garantías. Validación de entradas vacías, negativas, imposibles y ahorro cero.
- Generador: borradores no publicables fuera de Astro, sin precio, autor, fecha de publicación o nota de calidad fabricada; no sobrescribe trabajo existente.

## Auditor determinista y revisión de candidatos

La compilación revisada por `audit_publication_text.py` contiene 95 HTML. Resultado bruto: 177 candidatos `missing-alt`, 0 blockers automáticos, sin otros tipos de candidato. No es una certificación semántica.

La continuación volvió a analizar esos 95 HTML junto con 15 Markdown (110 archivos). Sus 177 candidatos coinciden uno a uno en archivo, localización y regla con los anteriores; no apareció un candidato nuevo. YAML se cubre mediante pruebas propias y revisión semántica, no por ese contador.

Los 177 corresponden exactamente a dos avatares opcionales compartidos por 88 páginas (176) y al avatar de la cuenta (1). La revisión de código y HTML confirma `alt=""` deliberado: el enlace de escritorio tiene `aria-label="Open account"`; el avatar móvil está en un contenedor `aria-hidden` y junto al texto “Profile”; en la cuenta está dentro del estado inicialmente oculto, junto al nombre/correo accesibles. No son 177 imágenes informativas sin alternativa. No se añade texto redundante sólo para silenciar el auditor.

El pase anterior sí detectó 28 repeticiones de nombre en H1/H2 de producto; se cambió la segunda instancia a párrafo. Esos candidatos ya no aparecen. Las 15 fuentes Markdown escaneadas aisladamente daban cero candidatos antes de la revisión manual: por eso el control propio también revisa YAML y la semántica de las afirmaciones.

## Alcance visual y límites

Se inspeccionaron home desktop/mobile, hero móvil, producto móvil, comparación desktop, 404/footer, menú y calculadora. La inspección reveló que dos capturas se tomaban durante animación/desplazamiento; el harness se corrigió para esperar el estado estable y confirmar que alcanza el final del documento. El informe final debe corresponder a ese pase posterior.

La ampliación añade diez casos sobre las tres fichas y dos reviews corregidas, en móvil y escritorio. Sus condiciones se buscan en texto renderizado y se desplazan al área visible para capturarlas; no basta con comprobar el YAML. Se inspeccionaron además las tres capturas móviles y la review de Echo en escritorio.

Imágenes externas bloqueadas durante las pruebas: las capturas muestran ilustraciones de categoría con alternativas/captions de sustitución, no una aprobación de las fotos remotas. El QR local carga sin servicio externo; no se probó su lectura con un teléfono físico. Inicio de sesión y sincronización de cuenta no fueron comprobados con una cuenta real.

Pendientes de publicación: resolver correspondencia de los 28 modelos/ASIN, firmware/servicios e integración comercial autorizada; comprobar servicios remotos y caducidad en la arquitectura desplegada; aprobación humana de afirmaciones sensibles y autorización del propietario.
