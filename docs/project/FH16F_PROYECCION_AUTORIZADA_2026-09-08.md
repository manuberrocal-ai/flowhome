# FH16F — evidencia de servidor a proyección comercial

## Alcance y contrato

Se añade `src/lib/blocks/block8/public-projection.ts`, sin endpoint, proveedor, credenciales ni almacenamiento. Une los validadores de Block8 con `getCommerceData` para el futuro consumidor de servidor. No acepta objetos de una petición como autorización: el llamador deberá cargar oferta revisada y evidencia vigente desde una integración confiable. Los marcadores approved/source no autentican por sí solos y el helper no implementa esa autenticación.

La proyección exige oferta activa/revisada, snapshot coherente, precio permitido, identidad ASIN exacta de la variante US/USD y enlace canónico Amazon con tagflowhome-20. Rechaza evidencia ausente, revocada, incoherente o vencida. No devuelve IDs privados de permisos ni el registro original. No modifica las entradas.

Precio y disponibilidad conservan capturas/límites independientes. El precio puede seguir visible si sólo falta o vence el permiso de disponibilidad; la disponibilidad se omite. El plazo de la oferta y del permiso padre también limita la proyección. No se infieren precio anterior, descuento, cupones, rating o cantidad de valoraciones: esos campos no se envían a la proyección común. La barrera de compilación estática permanece intacta.

## Verificación

-987/987 pruebas generales; lint correcto.
-Tipos431 archivos,0 errores/advertencias y18 hints existentes.
-Build88 y SEO88,0 errores/advertencias; diff-check correcto.
-Cinco pruebas nuevas comprueban positivo sintético, permiso independiente, revisión/identidad/enlace/frescura, límites exclusivos por campo, ausencia de mutación/IDs internos y barrera estática. Esta última prueba activa el indicador en ejecución aislada; la prueba de bundler existente de commerce-data también sigue pasando, sin afirmar un nuevo bundle de endpoint.
-El primer positivo falló porque el ASIN compartido de fixture tenía11 caracteres. Se usó una identidad sintética de10 caracteres propia de esta prueba; no se debilitó la validación ni se cambió el catálogo.
-Los421 archivos de dist coinciden exactamente con FH13P: SHA256 `4a3c6561de284075cb8e984747b06c6f3b76aaeaa7af7cfca0a5290a6021b4e7`. No se repitió navegador/Lighthouse porque no cambió ningún archivo servido.

No hay consumidores de este helper fuera de las pruebas. Es una unión local de contratos, no transporte conectado ni evidencia de permisos reales. No hubo push, migración, activación o publicación. El código fuente nuevo está fuera del checkpointf92d793 aunque los bytes estáticos coincidan.

## Juzgado propio y continuación

Producto2/5 integral B: prepara datos independientes y honestos, aún sin ofertas vivas. Técnica3/5 local: evidencia y proyección comparten validadores y pruebas, sin duplicar el filtro visual. Datos/editorial2/5 integral: precio/disponibilidad tienen controles, rating/otros campos y permisos reales permanecen pendientes. Operación2/5 integral: falta lector confiable con identidad/revocación, petición con timeout/cuota/no-store y cliente transitorio con retirada.

Siguiente paso: conectar este helper sólo a un contrato de servidor desactivado por defecto que obtenga datos desde un lector confiable, compruebe tiempo después de adquirirlos y no reutilice respuestas ante fallo. La activación y oferta real conservan FH-15/FH-18/FH-31; no usar fixtures para habilitar publicación ni declarar FH-16 terminado.
