# FH20M — Inventario reproducible de compatibilidad

Resultado: nuevo control de lectura que reconcilia catálogo, grafo candidato y resolución por superficie. Sustituye el recuento manual como comprobación operativa, sin modificar datos ni activar el proveedor.

## Uso y contrato

Desde la raíz del proyecto, ejecutar `node scripts/qa/compatibility-coverage.mjs`. Imprime JSON en salida estándar; no escribe archivos, no accede a cuentas o red y no instala el candidato en runtime. Su función exportada permite fecha y datos explícitos para pruebas. La lectura de catálogo selecciona únicamente slug, categoría y modelo; no exporta precios, credenciales ni todo el YAML.

El informe distingue relaciones históricas candidatas de señales que resuelven con evidencia actual. «Unknown» no significa incompatible. Tener alguna señal documentada no certifica todos los campos, la variante comercial, funcionamiento físico ni aprobación pública. Los recuentos declarados del proveedor se conservan, pero ahora se comprueban automáticamente contra los datos.

Detecta identificadores duplicados, modelos fuera del catálogo, ubicaciones de ledger faltantes y desajustes de recuento declarado. Un error estructural produce salida 1. No sustituye validación semántica de fuentes ni pretende ser un validador exhaustivo de cualquier grafo malformado.

## Resultado observado

Ejecución real: 2026-09-07T00:06:17.601Z, todavía 6 de septiembre en Buenos Aires. 28 modelos de catálogo; 13 candidatos; 15 sin candidato; 42 relaciones; 168 ubicaciones propuestas y 168 señales por ubicación resueltas. Cero errores estructurales detectados. Proveedor público no aprobado.

El archivo FH20M_COBERTURA.json en la carpeta de entrega contiene el detalle de los 28 modelos, campos por superficie, fuentes, próximos vencimientos y pendientes. Es una instantánea fechada, no un monitor ni una aprobación.

Categorías sin candidato: apertura de garaje, robots aspiradores, pantallas, altavoces, termostatos y videoporteros. Esto ordena la siguiente investigación, pero no convierte en completas las categorías que ya tienen al menos un candidato.

## Verificación

Cuatro pruebas nuevas aprobadas: conciliación con catálogo real; vencimiento sin borrar cobertura histórica; eliminación/disputa por ubicación; recuentos declarados incorrectos, duplicados y modelos huérfanos. Suite completa: 805 pruebas aprobadas. Lint completo y dirigido, tipos (296 archivos, cero errores/advertencias, 18 hints), build de 88 páginas y diff-check aprobados.

## Juzgado interno

Producto 4/5: pendientes explícitos por modelo y campo. Técnica 4/5: control reproducible y probado; no reemplaza el análisis de fuentes. Datos/editorial 3/5: 13/28 modelos, sin ampliar cobertura en este ciclo. Operación 3/5 para este control local de inventario; operación integral continúa 2/5 por accesos y aprobaciones. Valoraciones internas orientativas, no revisión independiente.

Verified Task Brief exigió separar cobertura, vigencia y aprobación; la mejora evita confundir un recuento creciente con proyecto terminado. Sin cambios de UI, dependencias, datos documentales o producción.

Siguiente: empezar una categoría todavía sin candidato, con termostatos como prioridad. FH-20 parcial; ocho tareas hechas, 24 restantes. Objetivo activo, heartbeat horario pausado.
