# FH04F — cobertura de evidencia antes de éxito o persistencia

## Problema y cambio

evidenceDigests validaba presencia, JSON e integridad de archivos, pero no la cobertura de un Lighthouse declarado passed. Un informe parcial podía quedar registrado como evidencia completa del proceso semanal. FH04E impide heredar selectores reducidos; este cambio controla además la evidencia producida.

verifyFullLighthouseEvidence exige las cuatro rutas fijas en orden, perfil móvil/full, tres muestras únicas por ruta y ausencia de fallos declarados. Lee las doce muestras por nombres locales derivados de las rutas, nunca por rutas arbitrarias del resumen; verifica URL final e indicadores mínimos completos mediante el lector existente. No reemplaza cálculo de puntuaciones ni constituye autorización de release.

Se integra en evidenceDigests: afecta validación previa a persistir, cierre de ejecución y reutilización. Evidencia insuficiente pasa a needs_attention y conserva informes; no se crea un éxito ficticio. No cambia horarios ni activa el ejecutor remoto.

## Verificación

23 pruebas dirigidas iniciales correctas. El verificador aceptó los doce informes reales de C:/AGENTES/Informes/flowhome/fh13r-lighthouse-20260908 sin medir de nuevo. Pruebas negativas: matriz parcial, número incorrecto, ruta faltante/duplicada, muestra duplicada, fallo declarado, archivo ausente y archivo sin métricas.

Prueba integrada adicional: dos ejecuciones semanales con resultado passed y resumen targeted/una muestra deben permanecer needs_attention, con cero llamadas de lectura/escritura a la cola y estado skipped_quality. Es una fixture local del flujo real, no una ejecución remota ni una certificación del proveedor.

Controles finales:1043/1043 pruebas, lint y diff-check correctos; tipos454 archivos/0 errores/0 advertencias/20 hints; build88 correcto; plan32/8 coincide. No se repitieron navegador/Lighthouse: no cambió el frontend y se usan muestras conservadas sólo para probar el lector de evidencia. El candidato ac1ee54 permanece limpio e intacto.

## Juzgado

APROBADO LOCAL para cobertura documental verificable del control. Producto3/5 local, técnica3/5 local, datos/editorial3/5 local y operación2/5 integral. Un único agente. Las puntuaciones siguen siendo responsabilidad del runner; el verificador no autentica informes externos ni prueba resultados de campo. Operación remota y aprobaciones de entrega siguen pendientes.
