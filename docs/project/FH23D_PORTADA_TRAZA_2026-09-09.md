# FH23D — diagnóstico de portada

Trabajo local sobre d86d95b en `C:/AGENTES/Proyectos/flowhome-fix-dependencies-20260909`; no publicado y sin modificar el puerto4339.

## Evidencia y criterio

La matriz FH23C incumplió rendimiento/TBT de portada. Una carga diagnóstica posterior guardó traza y tráfico reales de Lighthouse: `C:/AGENTES/Informes/flowhome/fh23d-home-trace-20260909/home.json`, `home-0.trace.json` y `home-0.devtoolslog.json`. Perfil móvil simulado, Brave, tráfico externo bloqueado, build production sin servicios. Una sola carga diagnóstica, no sustituye una mediana ni aporta INP de campo.

Resultado diagnóstico87, TBT312,6915ms. En la traza, el hilo principal del renderer19296/18132 ejecuta una tarea de186,532ms: Layout134,845ms sobre898 objetos y UpdateLayoutTree47,863ms sobre667 elementos; evaluación del módulo1,801ms. El nombre BaseLayout en el informe no prueba que su función JavaScript consuma toda la tarea. Se conserva la evidencia sin atribuirla a cambios de bytes: HTML y script coincidían con FH13S.

Aceptación: reducir el trabajo inicial y cumplir los límites existentes sin retirar tarjetas, cambiar contenido, bloquear foco ni romper desplazamiento. Impeccable optimize conserva el diseño; web-perf exige medición antes/después. No se regeneran imágenes ni se añaden etiquetas IA.

## Prueba descartada y ajuste en curso

La primera prueba aplicó content-visibility:auto a la sección Featured completa. Tres muestras: rendimiento87, LCP2354,223ms, CLS0, TBT325ms; accesibilidad/prácticas/SEO100. Sigue incumpliendo; evidencia `C:/AGENTES/Informes/flowhome/fh23d-home-trial-20260909`. Dos avisos de limpieza de Lighthouse conservados.

Inspección con navegador propio: a390px la sección empieza en1762px y mide4996px; sigue renderizada por estar cerca del viewport. Sus ocho tarjetas ocupan entre548 y565px y las últimas comienzan después de6000px. A1440px las tarjetas miden603px. Se cerró únicamente la sesión fh23d y su preview propio.

La segunda prueba sustituyó esa regla por contención de cada tarjeta de Featured, con reserva36rem, sin alterar el DOM y con impresión visible. Resultado de tres muestras:90/100, LCP2424,245ms, CLS0 y TBT256,8775ms, todavía sobre el límite. Evidencia `C:/AGENTES/Informes/flowhome/fh23d-home-cards-20260909`; dos advertencias de limpieza. La geometría observada también identificó la sección Review notes, de1543px de alto, más allá de6800px: seguía haciendo trabajo inicial pese a estar lejos de pantalla.

La corrección final añade esa sección independiente a la misma estrategia, con reserva96rem en móvil y40rem desde1024px. Tres muestras posteriores:97/100, LCP2417,610ms, CLS0 y TBT0; accesibilidad/prácticas/SEO100, INP no disponible. Cero incumplimientos y una advertencia posterior de limpieza conservada. Evidencia `C:/AGENTES/Informes/flowhome/fh23d-home-regions-20260909`. Es una matriz dirigida de portada, no una nueva matriz completa de release.

Verificación propia mediante Playwright:320/375/390/768/1024/1280/1440, ocho tarjetas por tamaño accesibles al foco y al scroll, reseñas visibles y estables al volver, sin overflow e impresión visible. Capturas reviews-390.png y reviews-1440.png inspeccionadas en la carpeta de traza. No se ocultó ni eliminó contenido del HTML. Para capturas de página completa debe recorrerse la página primero: el antecedente P2 de capturas sin renderizar fuera de pantalla no se borra ni se confunde con contenido inaccesible al visitante. No se garantiza una captura inicial de toda la página sin ese recorrido.

El primer control general rechazó content-visibility:auto mediante una prohibición textual de C14. Se acotó al contrato esencial: no diferir hero, no usar hidden/data-reveal, impresión visible; un test adicional fija las regiones permitidas. Esto cambia una restricción de implementación, no el presupuesto ni el requisito de acceso al contenido. Se conserva el fallo previo en test.log. Control final:1059 pruebas, lint, tipos463/0errores/0advertencias/20hints, build88, SEO y diff-check correctos. La matriz general del navegador está en curso, sesión94540, evidencia prevista `C:/AGENTES/Informes/flowhome/fh23d-browser-20260909`.

Impeccable detectó una advertencia gray-on-color en el título existente de línea61 (slate950 sobre blue50); está fuera de la regla cambiada y no se cambia el color por un aviso estilístico. Lighthouse accesibilidad100 y revisión visual se conservan como evidencias acotadas, no certificación.

La matriz general de navegador terminó:142/142 y91HTTP, cero errores de preparación/limpieza y cero listeners restantes en su puerto. Fuente consolidada en `e79ac6f04baa0bd2a53c57424344af28938bf09b`, hijo de d86d95b, con checkout limpio. No se ha enviado este commit. Los archivos de código y pruebas son index.astro, acceptance-20-criteria.test.mjs y home-render-regions.test.mjs.

Juzgado: APROBADO LOCAL para la optimización; producto3/5 preservado y técnica3/5 por mejora medida con acceso al contenido comprobado; datos/editorial3/5 sin cambios; operación2/5, sin aprobación de release. La corrección de dependencias/procesos ya verificada conserva su alcance propio. Falta paquete exacto, matriz completa de entrega y revisión remota. La matriz completa se ejecuta por separado en `C:/AGENTES/Informes/flowhome/fh13u-lighthouse-20260909`; no atribuirle todavía un resultado.

Seguimiento de ejecución: el intento fh13u no dejó informe final y ya no tenía proceso activo. Se conserva sin atribuirle resultados. La matriz completa se retomó en una carpeta separada, C:/AGENTES/Informes/flowhome/fh13u-lighthouse-20260909-resume; no se sobrescribieron las pruebas dirigidas.
