# FH13P — revisión local actualizada e inventariada

## Identidad y alcance

Checkpoint local `f92d7939bee16b3a3c5d2f12bc3b5edf131441d8`, rama `review/flowhome-local-20260908-fh13p`, padre `b12a60edcb8b8b729c0d1062117cdae3e0ccc0ab`. Árbol `7b89f6aacb17e4db31dd9137d271511ccd8cedc5`,1321 archivos. Veintidós archivos cambian frente al padre: error de consentimiento y sus pruebas, permisos de disponibilidad y sus pruebas, documentación operativa e inventarios históricos antes no incluidos.

Se preparó mediante índice temporal independiente. HEAD y status completo originales se compararon antes/después y conservaron igualdad; índice original sin cambios. No se borraron archivos ni se movió la rama de trabajo. El checkout limpio separado es `C:/AGENTES/Proyectos/flowhome-review-fh13p`. Se reutiliza node_modules mediante junction: no prueba instalación fresca.

No se subió esta rama. La autorización específica sigue correspondiendo a PR12/head5cc6c95; no autoriza sustituirlo por f92d793. Esta revisión incorpora también el código B no conectado; no aplica migraciones ni concede permisos reales.

## Verificación sobre el SHA exacto

-982/982 pruebas generales, lint correcto.
-Tipos429 archivos:0 errores,0 advertencias,18 hints existentes.
-Calidad editorial estructural y enlaces correctos;0 stale y5 unknown. No certifica hechos ni convierte unknown en verificado.
-Build88 con production/auth=false/analytics=false; SEO88 sin errores/advertencias.
-Checkout limpio al finalizar.
-[Inventario de421 archivos](FH13P_CANDIDATO_2026-09-08.json):136720356 bytes; SHA256 de árbol `4a3c6561de284075cb8e984747b06c6f3b76aaeaa7af7cfca0a5290a6021b4e7`. Es inventario de revisión, no manifiesto de release autorizado.

Los archivos generados coinciden byte por byte con dist de la carpeta original, sobre el que FH12Q comprobó31 casos/91HTTP y el error de consentimiento en320px. No se repitió navegador ni Lighthouse sólo por mover los mismos bytes a otro checkout. FH13O conserva134 casos del candidato anterior; no se reasigna esa ejecución al nuevo SHA.

Frente a FH13N hay89 rutas de archivos nuevos/modificados y un nombre de script antiguo retirado del inventario: la modificación del componente y su nombre empaquetado afectan los HTML consumidores. Los candidatos anteriores siguen conservados, no se eliminaron sus archivos. No confundir el hash anterior con el actual.

## Juzgado propio y siguiente acción

Producto3/5 local: error recuperable y recorridos existentes conservados, sin medición de captación. Técnica3/5 local: fuente exacta construida y probada desde checkout limpio; dependencias reutilizadas y CodeQL de este SHA no ejecutado remotamente. Datos/editorial3/5 local: disponibilidad exige derecho propio, sin nuevos datos ni permisos reales. Operación2/5 integral: revisión trazable, pero PR, integración, manifiesto protegido, rollback aprobado y publicación siguen pendientes.

Solicitar aprobación concreta de actualización de la misma PR al SHA elegido antes de cualquier envío. Si se aprueba f92d793, conservar borrador y no fusionar/desplegar; revalidar controles remotos al ejecutar, sin interpretar aprobación de rama como aprobación de release. Mientras tanto, seguir los pendientes independientes de B sin alterar este candidato.
