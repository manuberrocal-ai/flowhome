# FH23B — dependencias y preparación de CI

## Estado y alcance

Corrección local sobre `1651f6a44e0ed69565a4fd57c32be5d072586b0b`, en `C:/AGENTES/Proyectos/flowhome-fix-dependencies-20260909`, con instalación independiente de dependencias. No modifica las dependencias del proyecto original ni la vista del puerto 4339. No se ha enviado este nuevo parche, fusionado una PR ni desplegado.

Parche consolidado en el commit local `88d085d9903a0b36a21bf1f7de03789de51ec80e`: seis archivos, checkout limpio después del commit. Incluye package.json/package-lock.json, dos pruebas de regresión, batched-deploy.yml y el runbook de release. El índice del proyecto original conserva SHA256 `EC5CB33BB21AF35877F1D19606247884D9E4C21793FDB78AC980E0EFF910CC7D`. Los documentos operativos se actualizan en el proyecto original y no forman parte de ese commit de código.

La autorización de FH13T ya permitió enviar FH13S a [PR12](https://github.com/manuberrocal-ai/flowhome/pull/12). La solicitud antigua de autorización para ese envío está superada. No equivale a autorización de esta nueva revisión ni de publicación.

## Problema, aceptación y cambio mínimo

El [Quality Check de FH13S](https://github.com/manuberrocal-ai/flowhome/actions/runs/34316536853) instaló correctamente, pero se detuvo en la auditoría de dependencias: una alerta crítica y tres altas. Las pruebas posteriores de ese trabajo remoto no llegaron a ejecutarse.

Se actualizan dependencias existentes, sin añadir dependencias directas: Astro 7.1.6 → 7.2.8, Sharp 0.35.3 → 0.35.4, js-yaml 4.3.1 → 4.3.2 y SVGO 4.0.2 → 4.1.0, más sus transitivas necesarias. La aceptación exige auditoría utilizable sin estas alertas, regresiones de parser/saneamiento corregidas y conservación de build, contenido y recorridos.

La reproducción previa mostró que js-yaml aceptaba fusiones vacías por encima del presupuesto y que removeScripts de SVGO conservaba variantes de enlaces peligrosos. Los nuevos ensayos rechazan esos casos, incluidas variantes, y preservan YAML y enlaces HTTPS legítimos. El sitio es estático; no se acreditó una explotación remota ni un endpoint público de imágenes vulnerable. La actualización nativa no equivale a haber ejecutado el exploit AVIF en Linux.

Se siguió la habilidad fix-finding con investigación y revisión independientes de dos agentes internos, sólo de lectura. No son una certificación externa. La segunda revisión no encontró bypass o regresión concreta.

## Verificaciones de dependencias terminadas

- Instalación limpia en esta carpeta: correcta. Auditoría de producción: cero vulnerabilidades notificadas.
- Suite: 1054/1054; lint correcto; tipos: 459 archivos, cero errores/advertencias y 20 hints.
- Build production, autenticación y analytics desactivados: correcto. SEO: 88 páginas, cero errores/advertencias. Calidad y diff-check correctos.
- Navegador: 142/142 casos y 91/91 respuestas HTTP; cero errores de preparación o limpieza. Corresponde al build de dependencias, no a una publicación.
- Evidencia: `C:/AGENTES/Informes/flowhome/fh23b-dependencies-20260909` y `C:/AGENTES/Informes/flowhome/fh23b-browser-20260909/report.json`.
- Node probado: 24.16.0 en Windows. Compatibilidad con todas las versiones antiguas declaradas, exploit nativo Linux y Lighthouse del nuevo candidato: no verificados. No reutilizar las huellas ni métricas de FH13S para este build.

## Siguiente defecto de CI

[Batched Deploy](https://github.com/manuberrocal-ai/flowhome/actions/runs/34316532056) terminó fallido sin jobs. La API no entregó un mensaje de validación preciso. Sí se comprobó un defecto de definición: cuatro valores `runner.temp` aparecen en `jobs.<id>.env`, donde ese contexto no está permitido según la [referencia oficial](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#context-availability). Esto es evidencia de un defecto local compatible con el fallo remoto, no una captura del diagnóstico de GitHub.

Se trasladan esas rutas a un primer paso de cada job y se exportan a los pasos siguientes mediante GITHUB_ENV. Conserva destinos separados, SHA, hashes, condiciones manuales, aprobación de production y orden de controles. Dos pruebas nuevas comprueban ubicación y propagación declarada; 26 pruebas dirigidas de release/workflow pasan. Controles generales posteriores:1056 pruebas, lint, tipos, build y diff-check correctos; registros workflow-*.log en la carpeta de evidencia. No se dispara el flujo de despliegue para probarlo. La aceptación por el evaluador remoto de GitHub sigue sin verificarse.

El [trabajo CodeQL Analyze de FH13S](https://github.com/manuberrocal-ai/flowhome/actions/runs/34316536860) terminó correctamente. No se interpreta como ausencia de todas las alertas ni como aprobación del parche nuevo.

Lectura posterior del [control CodeQL](https://github.com/manuberrocal-ai/flowhome/runs/102354081549): terminó fallido con18 anotaciones de severidad alta según el escáner. Incluye una nueva ubicación en `test/consent-banner-errors.test.mjs:8` respecto de las17 anotaciones históricas revisadas sobre5cc6c95. No se transfiere automáticamente aquella clasificación a este resultado: falta cotejar revisiones y clasificar la anotación adicional. No se descartaron alertas ni se modificaron reglas remotas.

## Juzgado

Producto 3/5: preserva recorridos verificados; no mide captación real. Técnica 3/5 local, workflow pendiente de ejecución remota. Datos/editorial 3/5: no altera catálogo ni inventa fotos, ofertas o resultados. Operación 2/5 integral: corrige preparación, pero faltan revisión remota del parche, candidato exacto, aprobación de release y comprobación online. Dictamen: APROBADO LOCAL para el parche; no aprobado en entorno real. FH-23 reabierto como parcial por alertas nuevas, sin invalidar su cierre histórico de septiembre 6.

Próximo paso: consolidar una revisión exacta y sus evidencias; después cerrar revisión externa y cadena de entrega autorizada. No repetir búsquedas de credenciales agotadas ni crear automatizaciones horarias.

## FH23C — regresión de proceso descubierta en la medición

La primera matriz Lighthouse terminó con `Preview exited with 0`, sin medir rutas. Se conserva en `C:/AGENTES/Informes/flowhome/fh23b-lighthouse-20260909/summary.json`. Astro 7.2.8 detectó el agente y desacopló el servidor del proceso que QA creía controlar. Se verificó el proceso22312 y su comando dentro de esta carpeta: era el servidor del navegador anterior en54345. Se detuvo únicamente ese servidor mediante la CLI del mismo proyecto. Por tanto, el anterior contador cleanupErrors=0 no demostraba limpieza real; los142 resultados funcionales permanecen, pero no se acredita cierre del servidor con ese reporte.

La [documentación oficial de Astro](https://github.com/withastro/docs/blob/main/src/content/docs/en/guides/build-with-ai.mdx), consultada mediante Context7 y contrastada con el código instalado, permite `ASTRO_PREVIEW_BACKGROUND=0`. Se añade un entorno común para los procesos de preview de navegador y Lighthouse, conservando otras variables y sin modificar el entorno del propietario. Dos pruebas nuevas de regresión pasan junto con tres pruebas de integridad de evidencia Lighthouse. Este cambio quedó consolidado como `d86d95b3a6f7640c598d79babe50d1c1de033f7b`, hijo de88d085d, con checkout limpio; tampoco fue enviado.

La nueva medición terminó, sesión51096, evidencia `C:/AGENTES/Informes/flowhome/fh23c-lighthouse-20260909`. Doce muestras completas, siete advertencias de limpieza conservadas y dos incumplimientos en portada: rendimiento mediano84 y TBT392,5875ms. LCP2423,019ms/CLS0 y accesibilidad/buenas prácticas/SEO100. Producto98/LCP2268,155/TBT40,5; reseña98/LCP2266,168/TBT0; comparación99/LCP2113,024/TBT0. INP no disponible en todas. El proceso de preview21548 y el listener4321 ya no estaban presentes tras terminar.

El reporte de portada muestra una tarea larga asociada al script compartido BaseLayout y predominio de trabajo de estilos/layout; no demuestra por sí solo qué función causa el retraso ni permite atribuirlo a Astro. Debe investigarse antes de declarar listo el candidato. No se rebajan presupuestos ni se repite sólo buscando una muestra favorable.

La matriz de navegador con la corrección de proceso terminó:142/142,91HTTP y cero errores de preparación/limpieza, evidencia `C:/AGENTES/Informes/flowhome/fh23c-browser-20260909`. Verificación posterior real: cero listeners en56301 y `astro preview status` informa que no queda servidor. Controles generales posteriores:1058/1058, lint, tipos, build y diff-check correctos (registros preview-*.log). El último build de controles es local, sin servicios; la matriz Lighthouse y navegador corresponde al build production previo, no intercambiar inventarios. No afecta ni detiene la vista del propietario en4339. El dictamen de entrega pasa a REQUIERE CORRECCIÓN por rendimiento de portada, sin invalidar el arreglo local de dependencias.

El HTML de portada coincide con FH13S (SHA256 `F536950FBD697220E20716E4084D42E3868F3D06AEAE938EA046B1433F7F4349`), al igual que el script BaseLayout señalado (SHA256 `3F7DBFFE6C0BA9D967589AA36E26972F355AFE760216FA6A26EBCFDA69AAD094`). No hay evidencia para culpar una modificación de esos bytes. Siguiente diagnóstico: capturar traza de una carga de portada y discriminar trabajo propio, simulación y condiciones de ejecución antes de modificar interfaz o repetir una matriz completa.

Seguimiento: [FH23D](FH23D_PORTADA_TRAZA_2026-09-09.md) documenta la traza, corrección y pruebas posteriores de portada; [FH23E](FH23E_CODEQL_ADICIONAL_2026-09-09.md) completa el análisis estático de la alerta adicional43. Las observaciones anteriores conservan su fecha y no describen la fuente final e79ac6f.
