# FH13J — impedir rutas automáticas paralelas a la entrega protegida

## Causa y cambio

FH13I comprobó en lectura que los despliegues automáticos estaban desactivados. Sin embargo, `release-record.mjs` sólo validaba proyecto, dominio, rama y despliegue canónico: podía aprobar un preflight posterior aunque alguien reactivara las publicaciones automáticas.

Se añadieron comprobaciones estrictas de `source.config.production_deployments_enabled === false` y `preview_deployment_setting === 'none'` al lector compartido. Se rechazan valores ausentes, nulos o de otro tipo, sin interpretar ausencia como permiso. Los campos y sus tipos se contrastaron con el esquema actual del GET de proyecto de Cloudflare. No se cambia la configuración remota.

Ambos consumidores quedan cubiertos: preparación y registro posterior. Si el control cambia después de publicar, el registro falla; la web podría haber cambiado ya y se debe inspeccionar antes de reintentar. No es una transacción remota ni elimina la posibilidad de cambios concurrentes entre lectura y publicación. No se ejecuta rollback automático.

## Verificación

23 pruebas dirigidas de artefacto, registro y flujo de notificaciones aprobadas. La nueva prueba cubre 13 estados inseguros/ausentes; los casos del registro posterior incluyen reactivación de producción y previews. El caso permitido conserva el despliegue antiguo marcado dirty y evita copiar secretos. Todas las llamadas de estas pruebas usan fixtures locales, no cuentas reales.

Controles generales confirmados: 970/970 pruebas, lint correcto, tipos423 archivos sin errores ni advertencias y18 hints existentes, build88 páginas, SEO88 sin errores/advertencias, diff-check y plan32 tareas/8 hechas correctos. No se repiten Lighthouse ni navegador porque no se cambia la interfaz, contenido ni configuración de construcción por este ajuste. FH13H permanece como candidato anterior de revisión de bytes estáticos, no identidad de esta nueva fuente operativa.

## Juzgado propio y pendientes

Producto 3/5 local: no cambia la experiencia ni la atribuye a producción. Técnica 3/5 local: el requisito documental pasa a ser una comprobación ejecutable. Datos/editorial 3/5 local: no altera fuentes comerciales y mantiene metadatos mínimos. Operación 2/5 integral: reduce el riesgo de rutas paralelas, pero siguen pendientes fuente revisada, manifiesto, recuperación aceptada y aprobación concreta. FH-13 no se cierra y no empieza D0.
