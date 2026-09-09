# FH13U — revisión local de dependencias, QA y portada

## Resultado y alcance

Fuente de código e79ac6f04baa0bd2a53c57424344af28938bf09b, posterior al envío autorizado FH13S/1651f6a. Incluye actualización de dependencias, corrección de contexto del workflow, cierre controlado del servidor de pruebas y reducción del layout inicial de portada. La documentación operativa posterior se integra por separado; su commit no cambia los bytes públicos probados.

Carpeta aislada: C:/AGENTES/Proyectos/flowhome-fix-dependencies-20260909. Instalación propia, sin junction. No se modificó la vista del propietario en4339 ni su índice original. No es un manifiesto de GitHub Actions, una aprobación ni una publicación.

## Evidencia

- 1059/1059 pruebas generales; lint y tipos correctos; build88 y SEO sin errores. Registros final-*.log en C:/AGENTES/Informes/flowhome/fh23d-home-trace-20260909.
- 142/142 casos de navegador y91HTTP, cero errores de preparación/limpieza: C:/AGENTES/Informes/flowhome/fh23d-browser-20260909/report.json.
- Siete tamaños con foco, desplazamiento e impresión comprobados; no se retiró contenido. Para capturas completas recorrer primero la página por el renderizado diferido fuera de pantalla.
- Auditoría de dependencias de producción sin vulnerabilidades en la instalación aislada. Node24.16.0 probado; no se certifican todos los Node admitidos por el manifiesto.
- Inventario local422 archivos: C:/AGENTES/Informes/flowhome/FH13U_LOCAL_INVENTORY_2026-09-09.json. Árbol SHA256 4bf61998eee891cfa345e4a60b36dc411877c122306cbc8011bddba0267e6840. Perfil production/auth=false/analytics=false. publishable=false.

La matriz final terminó: cuatro rutas por tres muestras, cero incumplimientos. Medianas rendimiento97/98/98/99; accesibilidad, buenas prácticas y SEO100. LCP2272,012/2265,291/2264,933/2114,676ms; TBT0/11,5/10/6ms; CLS0 e INP no disponible. Seis avisos de limpieza posteriores a informes completos conservados; servidor4321 sin listener al finalizar. Dos muestras individuales de TBT exceden200ms (portada218 y producto271,88), sin superar las medianas del criterio existente. No es evidencia de campo. Informe en C:/AGENTES/Informes/flowhome/fh13u-lighthouse-20260909-resume/summary.json. El intento anterior sin informe no se considera una prueba completa. No se mezclan sus resultados ni se sobrescriben los ensayos fallidos anteriores.

## Revisión y límites

[FH23B](FH23B_DEPENDENCIAS_Y_WORKFLOW_2026-09-09.md) conserva investigación y cambios de dependencias/proceso; [FH23D](FH23D_PORTADA_TRAZA_2026-09-09.md), traza y revisión visual; [FH23E](FH23E_CODEQL_ADICIONAL_2026-09-09.md), análisis estático de la alerta43. CodeQL remoto no se ha descartado ni silenciado. Las comprobaciones locales no sustituyen CI del nuevo commit.

Juzgado: producto3/5 y técnica3/5 local; datos/editorial3/5 documental, sin nueva verificación física de productos; operación2/5 integral. No se añadieron etiquetas IA ni se regeneraron imágenes en esta corrección. No se certifica fidelidad fotográfica de las ilustraciones existentes.

La nueva revisión aún no se ha enviado. Su subida requiere confirmar el SHA documental final y destino PR12, sin merge, despliegue ni activación de servicios. Siguen pendientes revisión remota, aprobación de publicación, recuperación real y datos/cuentas de B; los accesos agotados no se vuelven a buscar sin indicios nuevos.
