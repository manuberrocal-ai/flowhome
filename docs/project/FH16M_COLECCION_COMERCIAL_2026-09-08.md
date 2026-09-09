# FH16M — consultas de catálogo acotadas por identidad

## Ficha

Problema: el cliente individual no organiza múltiples productos ni evita duplicar solicitudes cuando un mismo ASIN aparece en varias tarjetas. Cambio mínimo: colección de clientes transitorios por ASIN, sin proveedor nuevo ni campos de catálogo copiados como observaciones. Reutiliza createCommerceClient y su vencimiento/cancelación; no duplica parser, transporte ni política de vigencia.

Aceptación: hasta tres solicitudes activas, deduplicación de identidades, no admitir otro lote simultáneo, retiro/cancelación al dejar de estar permitido, no recuperar valores al reanudar, fallo aislado por producto y resultado global válido sólo si todos los datos siguen vigentes al terminar. Sin consultas por defecto ni almacenamiento persistente.

## Implementación

src/lib/blocks/block8/delivery-collection.ts acepta hasta100 referencias de ASIN y conserva una entrada por identidad. read devuelve observaciones separadas de los datos editoriales, sin heredar precios o claims estáticos. refreshAll limpia el lote anterior y ejecuta tres trabajadores como máximo. invalidación/suspensión/dispose cambian la generación para no continuar la cola. Una nueva acción mientras hay lote activo devuelve false, no inicia más trabajadores.

Si un producto falla, su entrada queda null y las observaciones válidas de otros productos se conservan. refreshAll devuelve false si hubo fallo, cancelación o expiración de alguna entrada antes del final; el consumidor debe leer cada entrada para mostrar el estado parcial. No se promete que la devolución true extienda la vigencia: hay que leer de nuevo inmediatamente antes de presentar o comparar.

Notificaciones agrupadas en microtarea, sin mantener copias adicionales de datos comerciales. Dispose evita notificaciones pendientes y retira valores. La colección debe recibir el binding de ciclo del consumidor; no se conecta automáticamente a una página.

## Evidencia y límites

Cinco pruebas dirigidas correctas: desactivación y validación; identidad repetida y aislamiento de copias; concurrencia/cancelación; recorrido de ocho productos y fallo independiente; expiración antes de finalizar y silencio tras dispose.1015/1015 pruebas generales correctas.

Lint correcto; tipos444 archivos,0 errores/advertencias y18 hints. Build editorial88 con cuenta/analítica desactivadas; SEO88 sin errores/advertencias. Plan derivado32 tareas/8 hechas y diff-check correctos. No se atribuye a esta versión el inventario de un candidato anterior.

No hay consumidor público: la búsqueda de referencias sólo encuentra el módulo y sus pruebas. No se repite navegador por un módulo aún no montado. El límite de tres es por colección en ese navegador: **no implementa cuota por cuenta, coordinación entre pestañas ni rate limiting de servidor**. No certifica derechos de fuente ni acceso Amazon. No se ejecutó el probe de suspensión FH16L sin evidencia nueva.

## Juzgado propio

**APROBADO LOCAL** en el alcance probado. Producto2/5 integral B: prepara estados parciales sin confundir productos. Técnica3/5 local: concurrencia, duplicados, cancelación y vencimiento verificados. Datos/editorial2/5 integral: identidad separada y no herencia de observaciones; permisos reales pendientes. Operación2/5 integral: cuota global, servidor e integración de catálogo pendientes. Es valoración del mismo agente, no revisión independiente.

Siguiente trabajo: montar esta colección en las tarjetas/comparación bajo harness, usando una única colección por contexto y todos los espacios repetidos, sin activar ofertas públicas. FH-16 sigue parcial; la PR/candidatos previos y producción no se modificaron.
