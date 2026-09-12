# FH23M — revisión del contrato Wrangler Action4

PR7 propone el SHA inmutable `ebbaa1584979971c8614a24965b4405ff95890e0`
de Cloudflare Wrangler Action4.0.0. Se actualizó su base a main y se corrigieron
la etiqueta de versión obsoleta y la prueba que fijaba exclusivamente el SHA3.
No se permite una referencia mutable ni se eliminan verificaciones de seguridad.

## Evidencia primaria

- Release: https://github.com/cloudflare/wrangler-action/releases/tag/v4.0.0
- Acción distribuida: https://github.com/cloudflare/wrangler-action/blob/ebbaa1584979971c8614a24965b4405ff95890e0/action.yml
- Fuente previa a compilación: https://github.com/cloudflare/wrangler-action/commit/a61fbea3226347cc885c6d1b26b3f47b48e6c0f8

El commit distribuido tiene ese padre y GitHub devuelve verificación de firma
positiva. La comparación directa con el pin3 incluye borrado de fuentes y
alta del bundle por empaquetado de release; no se interpreta como desaparición
de funcionalidad. Comparando fuentes con el padre se observan el runtime
node20→node24 y el default Wrangler3.90→4. Las funciones de instalación,
preCommands, comando explícito y análisis de salida no cambian en ese diff.
Se leyeron index.ts, wranglerAction.ts y el contrato action.yml.

FlowHome conserva `wranglerVersion: '4.129.0'`, por lo que el nuevo default4
no elige una versión flotante. Conserva preCommands de verificación, comando
Pages con SHA/clean explícitos, salida deployment-url, preflight, entorno
protegido, manifiesto confiable y desactivación de notificaciones no pedidas.
NPM_CONFIG_SAVE y PACKAGE_LOCK siguen false. El runner ubuntu-latest del
proyecto ya ejecuta otras acciones Node24.

La validación del contrato local/CI no se presenta como una publicación real
con este nuevo wrapper. No se hace un despliegue redundante para probarlo.
La siguiente publicación autorizada deberá mantener el preflight y comprobar
el registro canónico posterior, como siempre. No se afirman auditoría exhaustiva
del bundle ni reproducibilidad de su compilación a partir de estas lecturas.
