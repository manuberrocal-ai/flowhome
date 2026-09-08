# FH20AF — Control transitorio de vigencia

Resultado local: controlador de vida útil en memoria, sin dependencias ni conexión a páginas públicas. No realiza peticiones ni valida autorización o el contenido JSON: exige un payload previamente validado. El contrato de servidor FH20AE y la barrera estática permanecen sin cambios.

## Criterios y pruebas

Siete pruebas deterministas verifican: descuento del tiempo desde el inicio de petición; vencimiento exacto aunque no se ejecute el temporizador; aborto y rechazo de generaciones anteriores; retirada al comenzar otra petición o fallar la vigente; suspensión explícita y reanudación sin restauración; relojes regresivos/no finitos; límites de plazo; copias contra mutación; imposibilidad de renovar mediante duplicados y temporizadores anticipados.

El controlador combina tiempo monotónico y de pared de forma conservadora: el mayor avance consume la vigencia y una regresión la invalida. La documentación de [performance.now](https://developer.mozilla.org/en-US/docs/Web/API/Performance/now) advierte diferencias de avance durante suspensión entre plataformas. Esto motiva usar ambos relojes; no acredita todavía eventos ni retirada visual en un navegador suspendido.

Suite completa aprobada y siete pruebas nuevas aprobadas; lint aprobado. Tipos: 327 archivos, cero errores y advertencias, 18 hints existentes. Build: 88 páginas. Diff-check aprobado. Verificado el 7 de septiembre de 2026 a las 01:50 UTC. Ningún despliegue, endpoint, cuenta o almacenamiento persistente modificado.

## Pendiente inmediato

Validar versión, contexto, producto y plazos del sobre JSON; acotar transporte/cuerpo/tiempo y origen; conectar visibilidad, pagehide/freeze y offline sin restaurar copias antiguas. Probar servidor → consumidor y luego navegador real antes de conectar las páginas. Este módulo no detecta por sí mismo eventos del navegador ni evita que un consumidor conserve una copia después de read: la integración debe retirar su presentación ante changed y volver a consultar antes de usarla.

## Juzgado

Evaluación propia 1–5: producto 3 (protección aún no visible), técnica 4 (estados y límites probados), datos/editorial 3 (no sustituye aprobación ni variante), operación 2 (sin transporte/UI/CDN reales). La guía Verified Task Brief acotó el éxito a criterios ejecutados; no a una integración completa. FH-20 continúa parcial; ocho tareas hechas y 24 restantes.
