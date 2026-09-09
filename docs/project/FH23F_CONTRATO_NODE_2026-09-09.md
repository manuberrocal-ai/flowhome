# FH23F — contrato de Node coherente con el lockfile

## Hallazgo y corrección

FH13U/5f22986 queda preservado como candidato anterior. Su manifiesto admitía Node desde22.12.0, pero el lockfile exige mínimos superiores: Lighthouse/Undici22.19 y el analizador/plugin de Astro22.22.3 o24.16.0, entre otros. Esto podía admitir instalaciones con advertencias de motor y una plataforma no compatible.

Se cambia únicamente engines.node en package.json y la raíz del lockfile a `^22.22.3 || ^24.16.0 || >=26.3.0`. No cambian versiones, integridad ni resolución de dependencias. README recomienda el Node24.16.0 realmente probado y npm ci para reproducir el lockfile. No se instala Node ni se cambia configuración remota.

La prueba nueva compara el rango completo con cada requisito aplicable del lockfile para Windows x64 y Linux x64. Excluye únicamente dependencias opcionales de otras plataformas; no excluye fallos arbitrarios. El binario opcional Sharp de Windows ia32 exige Node20: esa plataforma se documenta como no cubierta, no como compatible por la prueba. Se verifican fronteras admitidas y rechazadas. Esta compatibilidad declarada no acredita ejecutar una matriz de versiones ni Linux.

## Evidencia y límites

Antes de corregir el manifiesto fallaron ambos casos de regresión. Con el rango corregido y la selección explícita de plataformas pasan2/2. La suite general posterior pasa1061/1061. Registros de controles en C:/AGENTES/Informes/flowhome/fh23f-runtime-20260909; lint, tipos464/0errores/0advertencias/20hints, build88, SEO y diff-check correctos. El primer build usa perfil local. Se reconstruyó después el perfil production/auth=false/analytics=false y sus422 archivos coinciden exactamente con FH13U: SHA256 del inventario4bf61998eee891cfa345e4a60b36dc411877c122306cbc8011bddba0267e6840. No se confunden los dos perfiles.

No hay cambios de diseño, productos, rutas, imágenes, servicios ni reglas remotas. FH13U conserva sus doce muestras Lighthouse y142 casos de navegador con el alcance del código probado; no se reejecutan por este cambio de metadatos. La comprobación de bytes del build production se registra por separado antes de asociar esa evidencia al nuevo candidato.

Juzgado: producto3/5 preservado; técnica3/5 local, contrato de instalación más preciso; datos/editorial3/5 sin cambios; operación2/5, sin envío ni publicación. Siguen pendientes CI de la nueva revisión, autorización específica y criterios externos del backlog. FH-23 permanece parcial.
