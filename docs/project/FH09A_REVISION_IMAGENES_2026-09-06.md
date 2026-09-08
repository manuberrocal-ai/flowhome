# FH09A — imágenes reales, decodificación y etiquetas

## Resultado

FH-09 PARCIAL. Comprobadas 28 fichas en navegador local con recursos reales: 27 imágenes remotas y una ilustración local (Hue) decodifican correctamente en la observación del 6 de septiembre de 2026. Es evidencia nueva frente al antiguo HEAD 28/28, no una comprobación de licencias, modelo exacto, producción o rendimiento de campo.

El turno anterior fue progreso: cierre editorial FH-08 con inventario y validación. Siete tareas hechas/25 restantes; objetivo ACTIVO, heartbeat PAUSADO.

## Hallazgo y cambio mínimo

La función de presentación trataba cualquier URL distinta de un placeholder como “Product photo” y usaba el nombre del producto como alt sin matiz. No hay evidencia de identidad o permiso asociada a ese criterio. Ahora muestra “Catalog image — exact model and package not verified”; el alt conserva el nombre como contexto y explicita el mismo límite. La ilustración representativa conserva su etiqueta. URLs, recursos, datos comerciales, selección de productos, fallback y geometría no se sustituyeron.

Govee carga una imagen de 3000×3000 desde un archivo llamado 617F.png, mientras el modelo documentado es H617C. El nombre del archivo es una discrepancia para investigar, NO prueba suficiente de que la imagen represente otro modelo. El tamaño previo de 1,62 MB procede del HEAD de septiembre 4; no se presenta como una medición nueva de bytes transferidos. La imagen muestra paquete y tira, pero no permite certificar variante ni contenido actual del vendedor.

No se encontraron permisos por imagen en la estructura de catálogo o función de selección revisadas. Se pidió al propietario la ubicación de autorizaciones/licencias mediante una pregunta no bloqueante; acceso general a API no se convirtió en licencia de cada URL. No se afirma que todas las imágenes sean ilícitas: su permiso permanece sin verificar.

## Evidencia

FH09A_IMAGENES_2026-09-06.json registra las 28 observaciones finales: URL efectiva, dimensiones naturales, alt, leyenda, decodificación y hora. Cuatro ayudantes de siete fichas en work/fh09a-images-0.js a -3.js hacen reproducible el diagnóstico.

Se guardaron capturas de navegador de las 28 imágenes, no copias originales descargadas ni transformaciones para producción. Inspección visual explícita en este bloque: Govee, Aeotec, Arlo, Aqara M2 y Q5+. No se afirma cotejo visual exacto de las restantes 23 ni de etiquetas físicas no legibles.

## Validación local del cambio

- 13 pruebas dirigidas de etiquetas/fallback; 722/722 de la suite, cero omitidas.
- Tipos: 254 archivos, cero errores/advertencias y 18 sugerencias existentes; lint y diff-check aprobados.
- Build de 88 páginas a las 17:55:37; SEO 88 páginas, cero errores/advertencias.
- Navegador posterior al cambio: 28/28 decodificadas, 27 leyendas de catálogo no verificado y una representativa. Solicitudes de imágenes reales habilitadas; sin iniciar sesión ni pulsar enlaces comerciales.
- Dos escenarios Govee adicionales a 1440/390, leyenda y ausencia de desbordamiento; dos capturas inspeccionadas. Un selector inicial encontró imagen principal y lateral; acotado a la primera leyenda. No fue un fallo de la app.
- No se ejecutó Lighthouse ni se midió INP/CWV real. Las dimensiones y la decodificación no sustituyen esa medición.

## Juzgado y siguiente trabajo

Una revisión, cuatro perspectivas: producto 3/5 (aviso honesto, foto exacta todavía no acreditada), técnica 4/5 local (decodificación y fallback), datos/editorial 2/5 (permisos/variantes pendientes), operación 2/5 (sin producción).

NO LISTO PARA PUBLICAR como conjunto. Siguiente seguro: medir la plantilla con recursos reales y evaluar una alternativa admitida para Govee. Mantener abierta la identificación/permisos de imágenes, esperar respuesta concreta del propietario y avanzar con FH-12 si ese permiso no llega; no bloquear todo el proyecto ni volver a buscar credenciales agotadas.
