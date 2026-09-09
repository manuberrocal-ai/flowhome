# FH16U — revalidación de autoridad después de reservar cuota

## Ficha

Problema: el lector de FH16R comprueba autoridad al entrar y después de adquirir, pero una reserva de cuota puede esperar por un bloqueo compartido. Una revocación durante esa espera todavía permitía contactar al proveedor, aunque posteriormente se descartara el resultado.

Cambio mínimo: reautorizar inmediatamente después de la reserva y antes de adquirir. Misma cuenta/revisión/ASIN/mercado, fechas válidas, reloj no regresivo y señal no cancelada son obligatorios. Se conserva el vencimiento mínimo de los permisos inicial y actualizado; una ampliación posterior no extiende la autorización del intento. No se devuelve cuota ante revocación o error. La comprobación final después de adquirir permanece activa.

Superficies: src/lib/blocks/block8/gated-reader.ts y sus pruebas. No se registra endpoint, modifica base de datos, instala proveedor ni toca la fuente del candidato FH13R. Aceptación: revocación/cambio de cuenta/revisión/vencimiento durante reserva implica cero adquisiciones, permiso reducido limita la entrega y cancelación impide contacto.

## Evidencia y alcance

13 pruebas dirigidas aprobadas, incluidas tres nuevas: revocación durante reserva, reducción de vencimiento y cancelación durante reautorización. La prueba de revocación durante adquisición conserva cobertura independiente de la comprobación final. La prueba de integración exige el orden authorize/reserve/authorize/acquire/authorize y mantiene la proyección HTTP real del módulo con dependencias sintéticas.

No es autorización autenticada real. Hay una ventana inevitable entre comprobar y enviar: eliminarla exige coordinación con la autoridad/proveedor, no más lecturas locales. Este cambio cierra la espera conocida de la reserva, no promete revocación instantánea ni una transacción distribuida. La comprobación adicional comparte el plazo exterior de3 segundos; un backend lento puede reducir disponibilidad y consumir cuota sin adquisición, de forma conservadora. Faltan autoridad por cuenta, credenciales revisadas, política transaccional real, presupuesto aprobado e integración autorizada.

Controles generales finales:1036/1036 pruebas, lint y diff-check correctos (advertencias CRLF preexistentes); tipos452 archivos,0 errores/0 advertencias/18 hints; build88 y SEO88 sin errores/advertencias. No extrapolados desde FH13R. No se repitió navegador/Lighthouse por esta modificación de un módulo de servidor no montado. FH13R sigue limpio y preservado.

## Juzgado propio

APROBADO LOCAL para el comportamiento dirigido probado; producto2/5 B integral, técnica3/5 local, datos/editorial2/5 y operación2/5. Evaluación de un único agente. La revisión editorial A queda preservada en ac1ee54; este cambio B posterior no justifica reconstruir rutinariamente ese candidato ni enviarlo sin aprobación. No hubo consultas Amazon, grants, push o despliegue.
