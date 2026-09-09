# FH23K — revisión de setup-node7

PR5 mantiene el contrato del entorno seleccionado: Node24 en calidad/entrega y22 en tendencias, caché npm y lock explícito donde ya existían. El SHA820762786026740c76f36085b0efc47a31fe5020 es la versión7.0.0 oficial, cuyo action.yml ejecuta node24 y conserva los inputs usados. Las notas oficiales describen migración ESM y ajustes de caché; no exige credenciales npm para este proyecto.

La primera CI con ese action instaló dependencias y ejecutó la suite; falló sólo la expectativa de SHA antiguo en baseline-roadmap.test.mjs. Después de revisar el action y sus consumidores, se actualiza esa expectativa al nuevo SHA exacto. No se reemplaza por un patrón permisivo, no se omiten audit/lint/tipos/build ni se cambia el gate de publicación. El action ya figuraba en automation.yml antes de esta propuesta.

Pruebas dirigidas: cinco de baseline y una de pins correctas. Suite general1061/1061; diff-check y lint correctos; tipos464 archivos con0 errores/0 warnings/20 hints; build production de88 rutas correcto. La aprobación definitiva depende de controles remotos sobre el cambio completo; no implica que se haya ejecutado otra publicación ni un proceso de tendencias.

Fuente primaria: https://github.com/actions/setup-node/releases/tag/v7.0.0 y action.yml del SHA indicado, consultados2026-09-09. Juzgado del mismo agente: APROBADO LOCAL para el cambio acotado; no revisión independiente ni auditoría exhaustiva del proveedor.
