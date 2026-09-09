# FH12K — estados de páginas auxiliares

Preferencias pedía iniciar sesión aunque el cliente de cuenta estaba desactivado. Ahora muestra disponibilidad real, oculta la explicación de envíos en la versión sin cuenta y no revela el enlace de acceso ni el formulario cuando falta el cliente. Se conserva el manejo previo de enlaces de baja; no se activó servicio alguno.

## Verificación

`scripts/qa/utility-page-states.cjs`: cuenta, preferencias, lista vacía, búsqueda con consulta sin coincidencia prevista y ruta explícita /404/, en 390/1440. Encabezado y noindex/nofollow presentes, sin desbordamiento. La comprobación de búsqueda sólo cubre estructura, no certifica su mensaje de cero resultados. /404/ explícita devolvió200 en preview: no prueba respuesta HTTP404 de una ruta inexistente.

Preferencias: aviso de indisponibilidad observado; enlace de acceso y formulario no visibles. Lista dañada en contexto aislado: dato original conservado hasta restablecimiento explícito por teclado, después estado vacío. Doce escenarios posteriores correctos.

Siete pruebas de cliente/UI lifecycle aprobadas, build88, SEO0/0 y lint correctos. No prueba de proveedor, envío, login real ni activación. Inventario de entrega actualizado sigue pendiente; no presentar el inventario histórico como candidato actual.

## Juzgado propio

- Producto 8/10: elimina una ruta imposible en preferencias; falta revisión integral de mensajes y avisos.
- Técnica 8/10: diferencia ausencia de cliente de sesión cerrada; conserva recuperación local.
- Datos/editorial 8/10: estado honesto, sin prometer servicio disponible; bajas reales no verificadas.
- Operación 7/10: entorno local, integraciones externas y entrega pendientes.

Siguiente: inventario actual y criterios de candidato editorial. FH-12 parcial, sin publicación ni cierre integral.
