# FH23I — prueba aislada del despacho de producción

La corrida autorizada34329331617 falló en verify antes de publicar. La prueba de precedencia de dotenv borraba PUBLIC_APP_ENV para probar staging pero heredaba RELEASE_DEPLOY_PRODUCTION=true. El validador rechazó correctamente staging como release; el fallo era el entorno de la prueba, no una razón para retirar la protección.

Cambio mínimo: guardar/restaurar ambas variables en esa prueba, aislar la comprobación de staging y volver a activar explícitamente RELEASE_DEPLOY_PRODUCTION para comprobar el rechazo. La precedencia de PUBLIC_APP_ENV=production se sigue comprobando. No se modifica código de producción, workflow ni gate.

Regresión reproducida antes del cambio:12/13 pruebas de entorno correctas, una falla con el mismo mensaje de CI. Después:13/13. Suite completa bajo PUBLIC_APP_ENV=production, PUBLIC_AUTH_ENABLED=false, PUBLIC_ANALYTICS_ENABLED=false y RELEASE_DEPLOY_PRODUCTION=true:1061/1061. Un ensayo intermedio sólo con el flag de release falló en otras pruebas por faltar el perfil production; no se usa como resultado de la matriz equivalente a CI.

Diff-check, lint, tipos (464 archivos;0 errores,0 warnings,20 hints), build production de88 rutas y SEO (0 errores/avisos) correctos. Se cotejaron los422 archivos generados contra el manifiesto previo: mismos paths, tamaños y hashes. No corresponde repetir inspección visual o Lighthouse para bytes sin cambios. La nueva fuente requiere su propia revisión y corrida protegida antes de publicar; no alterar el manifiesto anterior.

Juzgado del mismo agente: APROBADO LOCAL, técnica3/5; la publicación y smoke reales siguen pendientes. El intento fallido no inició D0 ni cambió producción.
