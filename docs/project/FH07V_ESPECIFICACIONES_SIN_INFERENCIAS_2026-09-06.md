# FH07V — especificaciones sin valores inventados

APROBADO LOCAL, 6 septiembre 2026. No cierra FH-07 ni autoriza publicación.

## Hallazgo y cambio

El esquema convertía un campo USB ausente en cero. Ahora es opcional: ausencia no significa ningún puerto. El formateador compartido calificaba booleanos, pero presentaba textos y cifras como hechos sin procedencia por campo. Ahora conserva esos valores con `Catalog: … (unverified)`; una fuente general, instalación o señal de compatibilidad no los certifica.

Impacto comprobado en el catálogo actual: Echo Show tiene dos escalares (pantalla y altavoces); Kasa deja de mostrar USB ports: 0. Se conservan YAML, rutas, fuentes documentadas y datos comerciales. Los escalares inválidos siguen omitidos. Falta un contrato de evidencia por afirmación para sustituir estas advertencias por hechos documentados; no se declaran falsos los valores conservados.

## Validación

20 pruebas dirigidas y 709/709 generales, cero fallos/omisiones. Tipos: 248 archivos, cero errores y advertencias, 18 hints previos. Lint/diff aprobados. Build 88 páginas; SEO 88, cero errores/advertencias.

Cuatro escenarios de navegador local: Echo Show y Kasa a 1440/390 px. Texto calificado presente y USB inventado ausente, rutas 200 y sin desbordamiento horizontal. Dos capturas FH07V_ECHO inspeccionadas: escritorio muestra las etiquetas; móvil muestra cabecera e imagen, con etiquetas comprobadas en DOM bajo el pliegue, no una inspección visual completa de esa sección. Recursos remotos bloqueados intencionalmente; los seis errores de consola corresponden a esas imágenes Amazon, con fallback visible. Sin cuentas, compras ni producción.

Auditoría textual de dos HTML: cuatro candidatos de alt en avatares, mismo patrón de cabecera ya revisado en FH07U. No certifica accesibilidad completa.

## Juzgado del mismo agente

Producto 3/5: evita falsas certezas, pero demasiadas advertencias reducen utilidad hasta aportar evidencia. Técnica local 4/5: causa común corregida y probada. Datos/editorial 3/5: incertidumbre explícita; contrato por afirmación pendiente. Operación 2/5: no validación online ni despliegue.

Continuación: identidad estructurada y evidencia por afirmación para 28 productos; generación, bundle, mercado, firmware y bridge/controller diferenciados. Mantener perfiles de instalación 28/28 sin confundirlos con certificaciones físicas. FH-07 parcial 2/5; cinco tareas hechas/27 restantes; objetivo activo y heartbeat pausado.
