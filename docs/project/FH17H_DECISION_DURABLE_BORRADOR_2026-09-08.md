# FH17H — transacción editorial preparada, NO VERIFICADA en PostgreSQL

Estado histórico de preparación. La ejecución local posterior está en [FH17I](FH17I_POSTGRES_DECISIONES_2026-09-08.md): compilación, suite SQL ampliada, concurrencia y reinicio comprobados. No convierte el borrador en migración aprobada ni demuestra autenticación real.

## Alcance y evidencia exigida

Continuación de FH17G, no otra simulación de aprobación en memoria. Se prepararon [DDL y función transaccional](../../supabase/drafts/012_editorial_decisions.sql) y [pruebas SQL](../../supabase/drafts/012_editorial_decisions.test.sql) fuera de `supabase/migrations`. Son borradores, no una migración lista para aplicar. No se otorgaron permisos ni registraron usuarios, evidencia o decisiones en ninguna base.

El diseño deriva actor de `auth.uid()`, comprueba una membresía protegida y exige un registro confiable de evidencia por trabajo/revisión/digest. Bloquea membresía y cabeza de versión, inserta un evento inmutable y avanza la versión en la misma transacción. Una repetición idéntica del mismo actor devuelve la versión guardada; una intención distinta en esa versión es conflicto. Revocación/vencimiento se comprueban nuevamente; decidir no renueva vigencia ni habilita publicación. Tablas sin acceso directo para anon/authenticated/service_role, función únicamente para authenticated y membresías inicialmente vacías.

La identidad de sesión y el aislamiento siguen la [guía oficial de Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security), consultada el 2026-09-08: UID sin sesión es nulo, grants y RLS son controles distintos, y una función definer necesita search_path acotado. El borrador usa search_path vacío y nombres de tablas/funciones propios calificados. Esto presupone la frontera JWT de Supabase; una fixture con claims sintéticos no demuestra autenticación real.

## Estado de validación

- Revisión de código y diff-check sin errores de espacios. Se corrigió un delimitador SQL durante la lectura. Esto NO valida compilación PL/pgSQL.
- Las pruebas preparadas cubren usuario sin membresía, evidencia no registrada, actor inyectado, primera escritura, reintento, conflicto, actor persistido, segunda decisión/versionado, escritura directa de versión denegada, revocación, inmutabilidad y grants. NO EJECUTADAS.
- No se encontraron procesos Docker Desktop/backend activos ni ejecutables psql/postgres en PATH en esta lectura. No se reinició el motor ni se instalaron dependencias. La prueba durable anterior no verifica estos archivos nuevos.
- No se repitieron build, suite JavaScript ni navegador: ninguno ejecuta esta transacción. Los 970 PASS de FH13J no se atribuyen a FH17H.

## Condiciones antes de promover a migración

1. Ejecutar DDL y pruebas en una base local desechable con 006/009/010/011 y Auth compatible; mantener red none y sin puertos publicados en la fixture existente. Corregir compilación y comportamiento antes de integrar.
2. Añadir y ejecutar dos sesiones concurrentes: idénticas → un evento; decisiones distintas en la misma versión → un conflicto. Verificar expiración esperando lock, revocación concurrente y recuperación tras reinicio/confirmación perdida.
3. Completar negativos: UID ausente, usuario revocado/expirado, revisión/digest equivocados, valores null/tipos inválidos, versión máxima, evidencia vencida y escritura directa efectiva denegada. Probar una segunda decisión legítima en versión siguiente.
4. Definir y probar el aprovisionamiento confiable de evidencia/membresías y su trazabilidad, sin otorgar a un job de servicio autoridad de revisor. Hoy sólo el propietario de tablas puede aprovisionar; no existe RPC ni interfaz para eso.
5. Conservar eventos si se retira la función; preparar recuperación probada que no elimine auditoría. No mover el borrador a migrations antes de completar estos controles. Conexión, sesión real y activación remota requieren alcance y autorización propios.

## Juzgado propio

Producto 2/5 para esta etapa: todavía no hay recorrido de revisión utilizable. Técnica 2/5: transacción escrita, compilación/concurrencia no verificadas. Datos/editorial 2/5: identidad y evidencia vinculadas en el diseño, aprovisionamiento aún pendiente. Operación 1/5 para esta nueva pieza: no aplicada ni ensayada. No reduce el valor de pruebas de la cola anterior, pero tampoco las reutiliza como prueba de decisiones. FH-17 sigue parcial; A no se publica ni modifica por este trabajo.
