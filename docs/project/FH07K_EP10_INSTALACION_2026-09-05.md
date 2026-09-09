# FH07K — instalación EP10 y conflicto de medición

Fecha: 2026-09-05. Contrato: completar requisitos EP10 US sin afirmar hardware/firmware del paquete; mantener ASIN, rutas y comercio. Corregir el dictamen de energía de FH07J ante nueva evidencia contradictoria.

## Evidencia

- [Manual EP10 US, REV1.1.0, 2024](https://static.tp-link.com/upload/manual/2024/202407/20240718/1910013747_EP10%28US%29_UG_V1.pdf): instalación con Kasa/TP-Link ID en página impresa 4; restricciones en 30–31. Página 10 mezcla «energy consumption» con «runtime». No basta para afirmar medición eléctrica.
- [Ficha técnica EP10 US V1](https://static.tp-link.com/2020/202011/20201124/EP10%28US%291.0_Datasheet.pdf): Wi-Fi 2,4 GHz, alimentación 100–120 V y límites por tipo de carga. Distingue paquetes de una/dos/tres/cuatro unidades.
- [Soporte EP10 US](https://www.tp-link.com/us/support/download/ep10/): variantes V1/V1.60/V1.80; elegir manual por etiqueta, no asumir revisión del ASIN.
- [Soporte TP-Link, 2022](https://community.tp-link.com/en/smart-home/threads/topic/588562): niega medición EP10. Conflicto con redacción del manual posterior; FH07J queda superado respecto de la certeza negativa.

## Cambio y aceptación

Agregar perfil de instalación plug-and-play (estimación editorial, no prueba física). Mantener restricciones de uso/carga y versión. Energía ausente en YAML y opcional sin default false en esquema; consumidores deben mostrar «Not verified», no «No». Reseña debe explicar ambas fuentes sin elegir una por conveniencia. Pruebas: fuente/modelo, ausencia conservada, instalación/quiz y comercio intacto; build y navegador ficha/reseña/quiz. No modificar grafo ni habilitar integración alguna.

Juzgado inicial, mismo agente: producto 2/5, técnica 2/5, datos/editorial 2/5, operación 2/5. REQUIERE VALIDACIÓN LOCAL. FH-07 permanece parcial.

## Verificación y recuperación

APROBADO LOCAL. 691/691 pruebas, 0 omitidas; tipos 246 archivos, 0 errores/advertencias, 18 hints. Lint/diff-check aprobados; build 88 páginas y SEO 0 errores/advertencias. El nuevo perfil cambia correctamente las selecciones de confort/energía; se actualizó la expectativa del catálogo real, manteniendo pruebas de datos ausentes y sin inferencia por categoría.

Navegador local aislado: ficha, reseña y quiz energético, cada uno en 1440/390 px, HTTP 200 y sin desbordamiento. Campo energético realmente renderizado como «Not verified» después del esquema Astro; requisitos y conflicto visibles. Quiz: dos resultados para energía con instalación sencilla, incluyendo EP10; sin aviso falso de instalación desconocida. Se inspeccionaron las seis capturas. Primer intento falló por selector de tabla: la ficha usa lista; corregido el selector sin cambiar la interfaz.

Auditor editorial de tres archivos: cuatro candidatos de alt vacío corresponden a los avatares ocultos de las dos páginas, ya comprobados en FH07J; este bloque no cambia el header. No verifica fotos remotas, servicios de cuenta ni funcionamiento físico. La revisión visual es local, no una aprobación de publicación.

Juzgado final del mismo agente: producto 3/5 (criterios de instalación útiles), técnica 3/5 (ausencia conservada hasta HTML), datos/editorial 3/5 (contradicción expuesta, no resuelta artificialmente), operación 3/5 (cambio local reversible). FH-07 integral sigue parcial 2/5. Instalación: 15 documentadas/13 unknown. Cinco tareas hechas y 27 restantes.

Recuperación: revertir únicamente las modificaciones FH07K de esquema, YAML, reseña y pruebas si fuera necesario; no restaurar el árbol completo ni reintroducir la afirmación energética sin resolver la contradicción. Datos comerciales y otros 27 YAML no editados. Sin publicación, API, cuenta ni grafo activados.

Siguiente pendiente: identidad y requisitos de los dispositivos de limpieza (Roomba j7+ y Roborock Q5+), todavía sin perfil de instalación. No repetir la investigación EP10 salvo nueva evidencia específica sobre medición/hardware.
