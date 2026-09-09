# FH20N — termostatos documentales

Fecha local: 6 de septiembre de 2026. Revisión de fuentes: 7 de septiembre, 00:08:56 UTC.
Resultado: dos modelos añadidos al candidato documental; activación pública no aprobada.

## Alcance y evidencia

ecobee Premium conserva cinco relaciones con requisitos explícitos. La [página oficial US de ecobee](https://www.ecobee.com/en-us/smart-thermostats/smart-thermostat-premium/) respalda conectividad e integraciones; se separan Siri con HomePod, Alexa incorporada e integración SmartThings de la función de hub. No se importaron promesas de ahorro o salud.

Amazon conserva únicamente la relación Alexa documentada en su [guía oficial](https://m.media-amazon.com/images/G/01/kindle/journeys/MmE1OWJhOGQt/Smart_Thermostat_Online_Hello_Guide.pdf). La nota de ausencia de micrófono se comprobó visualmente en el recorte legible de Getting to Know; no se afirma lectura visual de todo el PDF. La guía consultada no estableció banda de red: ese campo sigue pendiente.

Ninguna relación prueba instalación HVAC, unidad física, variante de vendedor, cuenta, firmware o funcionamiento en una vivienda. Bluetooth sin señal documental no significa ausencia de Bluetooth. Los 28 YAML no se modificaron en este incremento.

## Verificación

- 22 pruebas dirigidas aprobadas y suite completa de 807 pruebas sin fallos.
- Lint aprobado; tipos: 298 archivos, cero errores, cero advertencias, 18 hints existentes.
- Build estático: 88 páginas. Diff-check aprobado.
- Inventario de lectura: 15 candidatos de 28 modelos, 13 sin candidato, 48 relaciones y 192 ubicaciones resueltas; cero errores contables.
- El reloj del test Aeotec estaba anterior a la revisión nueva. Se ajustó a 00:10 UTC sin debilitar el rechazo de evidencia futura.
- Prueba de independencia: ecobee conserva SmartThings al retirar todas las relaciones de Aeotec.
- No hubo nuevo render visual del sitio: el proveedor público continúa nulo. La compilación no acredita una integración pública aprobada.
- El quiz sigue sin usar SmartThings como filtro genérico: documentar una integración no prueba funciones o accesorios concretos.

## Juzgado del incremento

Valoración propia, no revisión independiente. Escala 1–5 limitada a este incremento, no al proyecto completo.

| Dimensión | Valoración | Mejora o límite |
|---|---|---|
| Producto | 4/5 | Roles de voz separados; falta comprobar funciones por configuración real. |
| Técnica | 4/5 | Gates y pruebas aprobados; integración de servidor aprobada pendiente. |
| Datos/editorial | 3/5 | Fuentes oficiales y condiciones conservadas; faltan campos y variantes exactas. |
| Operación | 2/5 | Inventario reproducible; sin aprobación ni activación pública. |

## Continuidad

Auditoría editorial automática: cero blockers y un candidato major por la regla placeholder en el párrafo de Amazon. Revisión semántica: «todo el PDF» describe el límite de inspección, no una instrucción TODO ni texto provisional. Se conserva la limitación; no hay cambio editorial justificado por ese hallazgo.

FH-20 permanece parcial. Recuento global: ocho tareas hechas y 24 restantes.
Siguiente trabajo independiente: robots aspiradores y sus relaciones documentales, manteniendo separados modelo, base y funciones de asistentes.
Imágenes/derechos de A, accesos reales y aprobaciones de producción siguen pendientes; no bloquean este trabajo local.
Objetivo activo y heartbeat horario pausado. NO LISTO PARA PUBLICAR.
