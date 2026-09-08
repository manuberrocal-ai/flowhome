# FH07H — características y compatibilidad en las 28 fichas

**APROBADO LOCAL, 5 septiembre 2026.** Las fichas distinguen registros del catálogo, información ausente y señales respaldadas por el adaptador. No se verificaron nuevas características reales ni se publicó el sitio. FH-07 sigue parcial, 2/5 integral.

## Resultado

- El hero y las especificaciones usan el producto preparado para la superficie exacta, no el catálogo crudo previo al adaptador.
- Las siete filas de conectividad/plataformas muestran `Catalog: Yes/No (unverified)` o `Not verified`. Una señal respaldada se limita al campo y exige revisar condiciones. Se retiró “Matter ready” y las etiquetas “compatible”, que sugerían conclusiones más amplias.
- Las otras funciones booleanas conservan incertidumbre aunque haya evidencia de compatibilidad. Valores malformados no se convierten en hechos textuales.
- Comparaciones y fichas comparten el formato; no se duplican filas de compatibilidad en las especificaciones. Las etiquetas del hero son neutrales y no llevan checks de aprobación.
- Se conservan condiciones por modelo, fuentes, instalación, límites de servicios y comercio. Los 28 YAML son idénticos en bytes al cierre FH07E.

## Evidencia

[Contrato](FH07_FICHAS_CONTRATO_2026-09-05.md), [validación y hashes](FH07H_EVIDENCIA_2026-09-05.json), [navegador](FH07H_NAVEGADOR_2026-09-05.json).

72 pruebas dirigidas y **677/677 completas**. Tipos: 244 archivos, cero errores/advertencias y 18 sugerencias. Lint, diff-check y build aprobados; SEO: 88 páginas, cero errores/advertencias. La primera suite completa detectó una aserción antigua que exigía los flags crudos; se sustituyó por el contrato del consumidor preparado y se repitió la suite completa.

**544 controles de navegador:** 507 de la matriz de 28 fichas a 1440/390 px y un caso de reflujo con zoom CSS al 200 %; 37 adicionales para revisar los 56 candidatos de texto y la continuidad de las ocho comparaciones. El primer resultado detallado no se guardó íntegro: su salida quedó truncada en la conversación; el registro conserva un resumen del script fail-fast que terminó con código 0. El suplemento sí conserva todos sus resultados.

Una ronda visual conjunta, con dos recortes complementarios de etiquetas móviles: diez capturas inspeccionadas, sin correcciones posteriores de código. Contraste medido de las etiquetas: 9,45:1. El detector de diseño no produjo candidatos. El analizador de texto señaló dos avatares anónimos ocultos con alt vacío por página; se comprobaron los 56 en navegador. Esto no valida el estado autenticado.

## Juzgado del bloque

Un único revisor desde cuatro perspectivas; las notas valoran este cambio local, no todo el catálogo.

| Perspectiva | Nota | Dictamen y límite |
|---|---:|---|
| Producto | 3/5 | Reduce afirmaciones engañosas antes de comprar; legibilidad local comprobada. No demuestra interoperabilidad doméstica. |
| Técnica | 3/5 | Formato compartido, entradas preparadas, casos negativos y regresiones verificados. No se instala un proveedor real. |
| Datos/editorial | 3/5 | Incertidumbre y alcance explícitos; fuentes y bytes conservados. Identidad exacta y afirmaciones escalares siguen pendientes. |
| Operación | 3/5 | Cambio local rastreable con hashes, pruebas y condiciones de recuperación. No hay validación de producción. |

Recuperación: revertir únicamente el bloque de cambios identificado por estos ocho archivos de código/pruebas, preservando FH07F/G y el resto del trabajo local. No usar una restauración global desde HEAD: perdería trabajo previo. Antes de cualquier entrega, preparar el artefacto exacto y su rollback con FH-02.

## Continuación

El objetivo persistente figura **activo**; el heartbeat horario permanece pausado por pedido del propietario. No se necesita otro `/goal resume` mientras la app mantenga ese estado.

Cinco tareas hechas y 27 restantes. Instalación: 14 documentadas y 14 unknown. Siguiente: el quiz y otros consumidores todavía usan flags crudos para seleccionar y describir compatibilidad; después, identidad/roles/firmware y evidencia de los restantes perfiles. Amazon y Supabase sólo bloquean sus integraciones dependientes. La entrega A sigue **NO LISTA PARA PUBLICAR**.
