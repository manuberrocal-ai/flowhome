# FH04E — cobertura Lighthouse independiente de la consola

## Ficha y corrección

Problema comprobado en qualityCommandEnvironment: copiaba todas las variables del proceso y dejaba LIGHTHOUSE_ROUTES/LIGHTHOUSE_RUNS intactas. El lector Lighthouse admite esas opciones para diagnósticos puntuales. Si quedaban configuradas en la consola, una revisión semanal podía terminar correctamente con una sola ruta/muestra, incumpliendo la cobertura del proceso coordinado.

Se eliminan ambas opciones sólo del entorno hijo generado por qualityCommandEnvironment. El runner recupera sus valores normales de cuatro rutas y tres muestras. No se modifica el entorno del llamador ni se elimina la posibilidad de ejecutar diagnósticos manuales dirigidos. No cambia la decisión daily/full/weekly ni se agrega Lighthouse a las corridas diarias.

Aceptación: los tres perfiles coordinados no heredan reducción de cobertura; los parsers reales del runner resuelven4 rutas/3 muestras; configuración pública e informe aislado permanecen; llamada directa manual sigue disponible.

## Verificación

24 pruebas dirigidas de plan de calidad y revisión diaria correctas en el primer pase. Se añadió comprobación explícita contra parseLighthouseRoutes/parseLighthouseRuns del runner real. Controles finales:1039/1039 pruebas, lint y diff-check correctos; tipos452 archivos/0 errores/0 advertencias/20 hints; build88 correcto. Se conserva el conteo observado de hints, no se reemplaza por18 de pasadas anteriores. Plan32/8 coincidente.

No se ejecutó revisión semanal real ni se activó una automatización. No se repite Lighthouse porque el cambio gobierna selección de cobertura y no la interfaz o rendimiento; la matriz FH13R permanece como evidencia de ese candidato, no de una ejecución semanal remota.

## Juzgado propio

APROBADO LOCAL para aislamiento de cobertura. Producto3/5 local (evidencia de entrega menos ambigua), técnica3/5 local, datos/editorial3/5 local y operación2/5 integral. Un solo agente. No sustituye la validación remota de controles/protecciones ni comprueba todas las configuraciones posibles del ejecutor. FH-04 continúa parcial. Candidato editorial ac1ee54 preservado, sin push ni despliegue.
