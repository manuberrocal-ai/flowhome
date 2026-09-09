# FH04G — búsqueda en el control habitual de navegador

## Ficha

Problema: la corrección de búsqueda FH09AP tenía un probe dirigido, pero `/search/` no figuraba en las plantillas del runner habitual. Una regresión podía pasar inadvertida en las comprobaciones posteriores.

Cambio mínimo: incluir búsqueda con siete anchos en los perfiles full/weekly y dos en daily; añadir un contrato ejecutado contra el DOM y los eventos del cliente real. No se cambia el frontend, no se instala una dependencia ni se activa un horario. Superficies: selección de casos, runner de navegador y pruebas del contrato.

Aceptación: comprobar conjunto completo de resultados respecto al dataset, identidades sin duplicados, recuento accesible, búsqueda del último registro, ausencia de coincidencias, restauración de resultados y foco. El runner conserva inspección de desbordamientos, controles, imágenes y errores. Las pruebas unitarias deben rechazar el antiguo límite de 24 y otras alteraciones deliberadas.

## Implementación y límites

`scripts/qa/search-contract.mjs` contiene una función sin dependencias implícitas que el runner serializa hacia su navegador aislado. Recibe documento y constructor de eventos; no importa un DOM ficticio al sitio ni sustituye el cliente de búsqueda. Las fixtures unitarias prueban el detector, mientras la ejecución de navegador comprueba la aplicación compilada.

Se conserva el probe FH09AP para teclado Enter, imágenes por modelo a DPR2 y consulta inicial por URL. Este contrato habitual activa eventos input y click en el navegador; no debe describirse como un ensayo físico de teclado ni como cobertura de todas las consultas. El catálogo actual tiene 28 registros; se compara contra su dataset real en vez de fijar para siempre ese tamaño en el runner.

## Evidencia ejecutada

Diez pruebas dirigidas correctas. Suite general: 1.051/1.051. Se prueban seis mutaciones negativas: límite de 24, identidad repetida, último producto ausente, estado vacío oculto, recuperación rota y ausencia de role=status.

Navegador full sobre la compilación local FH09AP: 142/142 casos, 91/91 comprobaciones HTTP, cero fallos y cero errores de preparación/cierre. Los siete casos nuevos registran 28 productos y ninguna infracción del contrato. Informe y capturas: `C:/AGENTES/Informes/flowhome/fh04g-browser-20260908`. No se atribuye este resultado al candidato FH13R ni a producción. La compilación se conservó sin reconstruir durante ese recorrido.

Lint, build y diff-check correctos; tipos:458 archivos, cero errores, cero warnings y20 hints. Registros en `C:/AGENTES/Informes/flowhome/fh04g-validation-20260908`. La validación de tipos se interrumpió antes de build para evitar reconstruir dist durante el navegador y se completó después; no hubo reconstrucción simultánea con el recorrido.

## Valoración final

APROBADO LOCAL para la cobertura probada. Producto 3/5 local: protege la posibilidad de encontrar todos los productos. Técnica 3/5 local: incorpora la regresión a la verificación habitual. Datos/editorial 3/5 local: compara identidades sin inventar productos ni evidencias físicas. Operación 2/5 integral: no activa CI remoto, publicación o cuentas. Revisión por un solo agente.

Este cambio y FH09AP están en el árbol original, fuera del candidato inmutable FH13R y de la PR12. La aprobación pendiente de FH13R no autoriza subir estos cambios posteriores. No se reconstruye un candidato ni se repite Lighthouse porque el cambio actual sólo afecta QA.
