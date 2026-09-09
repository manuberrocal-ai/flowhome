# FH17K — auditoría local de revisores y evidencia

## Implementación y límite de autoridad

Se preparó [borrador013](../../supabase/drafts/013_editorial_provisioning_audit.sql), fuera de migrations: registra insert/update/delete de membresías y metadatos de evidencia, con antes/después, fecha y rol de sesión de base de datos. Estado inicial registrado como baseline, no como aprobación histórica. Cambios idénticos no generan eventos; avances sólo de versión pertenecen al ledger de decisiones y no se duplican como aprovisionamiento.

RLS y revocación de grants impiden leer/escribir la auditoría desde anon/authenticated/service_role; trigger rechaza UPDATE/DELETE del historial. No hay nuevos grants de provisión ni RPC de alta. Sólo el operador con autoridad sobre estas tablas puede seguir aprovisionando. `session_user` identifica una sesión de base, no una persona verificada, y no se usa un actor enviado en el payload para certificar autorización humana. El dueño de la base sigue siendo parte de la frontera confiable: esto no impide que un administrador deshabilite triggers o altere el esquema.

## Pruebas reales locales

En `flowhome_test_fh17i` del contenedor aislado existente se aplicó013 y se ejecutó [la suite SQL](../../supabase/drafts/013_editorial_provisioning_audit.test.sql), primero básica y después ampliada para el consumidor real. Compilación y ambas suites correctas, con ON_ERROR_STOP y rollback de fixtures.

Se verificaron transición activa→revocada con antes/después/rol, no duplicación de actualización idéntica, alta y revocación de evidencia, ausencia de versión en eventos administrativos, borrado de auditoría rechazado, autoinscripción authenticated rechazada, lectura de auditoría denegada y autocertificación de evidencia service_role denegada. La eliminación de una membresía deja evento de retirada.

La segunda suite habilitó la función de decisión sólo dentro de la transacción local de pruebas, registró una decisión con UID sintético y verificó que el avance de versión no fabricara un evento administrativo. Al terminar, rollback restituyó el grant suspendido: has_function_privilege=false. Se conservaron dos decisiones de FH17I y seis baselines (cuatro evidencias, dos revisores); no persistieron usuarios de la suite ni decisiones adicionales.

Diff-check y plan operativo comprobados. No se repitieron build, navegador ni suite JavaScript: no validan estos triggers y el sitio no cambia. Las pruebas no verifican JWT/PostgREST ni una sesión Supabase real.

Se detuvo el contenedor al terminar y se comprobó `exited none {}`. Bases, eventos y baselines conservados; no se eliminaron volúmenes ni se modificó otra base.

## Juzgado y siguientes requisitos

Producto2/5 para revisión: sigue sin recorrido conectado. Técnica3/5 local: registro de provisión y consumidor de decisiones probados juntos. Datos/editorial3/5 local: cambios administrativos trazables sin inventar aprobaciones humanas. Operación2/5: privilegios protegidos y suspensión conservada; alta real de revisor/evidencia requiere identidad, evidencia y autorización específicas.

012/013 siguen como borradores. Falta el procedimiento confiable de alta con referencia de aprobación humana y evidencia revisada, la integración con sesión real y una prueba completa de rehabilitación autorizada. La auditoría añade trazabilidad; no convierte al operador de servicio en revisor ni sustituye una fuente comercial válida. FH-17 permanece parcial, sin cambios remotos ni publicación.
