# FH17G — contrato de intención editorial

Se implementó `scripts/lib/review-decision.mjs`, preparador puro de intención, separado del estado de ejecución del trabajo. Vincula job, revisión y digest de evidencia exactos; exige versión esperada entera no negativa y razones codificadas. Rechaza claves adicionales: actorId, role, tokens, precios o notas libres. Resultado inmutable `pending-authenticated-persistence`, publicationAuthorized:false, incluso si job está completed.

Esto **no es autenticación, autorización humana, aprobación guardada ni endpoint**. Job/evidencia deben provenir de una frontera confiable cuando se conecte; hoy son argumentos de contrato. No se integra en una ruta pública ni se escribe SQL. La repetición determinista no demuestra idempotencia durable.

Dos pruebas dirigidas aprobadas, con estados de trabajo, no mutación, revisión/evidencia incorrectas, claves prohibidas, versiones inválidas y rechazo editorial. Lint afectado correcto. No se repitieron build/navegador: ninguna superficie o configuración de artefacto cambia.

Juzgado propio: producto6/10 (frontera de revisión aún no expuesta), técnica7/10 (validación local probada), datos/editorial8/10 (separa intención de autoridad), operación5/10 (persistencia concurrente y sesión real no implementadas). FH-17 parcial.

Siguiente implementación: evento inmutable y control de versión en transacción, derivando actor/rol de servidor autenticado; probar conflicto, repetición y confirmación perdida. No crear usuarios, conceder roles, migrar remoto ni fingir una decisión humana. El candidato editorial A no se altera por este módulo no conectado.
