# FH20R — evidencia previa de Arlo y eufy

Revisión local: 6 de septiembre de 2026; UTC: 7 de septiembre.
Resultado: requisitos documentales resueltos para la próxima implementación. No se añadieron relaciones ni se activó el proveedor.

## Arlo: HD segunda generación

La [ficha oficial](https://kb.arlo.com/000063761/Arlo-Essential-Outdoor-2nd-Generation-Spec-Sheet), actualizada el 16 de julio de 2026, identifica VMC2050 como HD y VMC3050 como 2K; ambos usan 2,4 GHz. No se debe sustituir el modelo del catálogo por la tercera generación ni trasladar resolución 2K.

La [matriz de asistentes](https://kb.arlo.com/000062278/What-smart-home-and-voice-assistant-systems-can-I-use-with-my-Arlo-devices) nombra Essential Outdoor de segunda generación en Alexa, Apple Home, Google Home y SmartThings.

La [guía Apple Home](https://kb.arlo.com/000063184), actualizada el 23 de abril de 2026, exige SmartHub/Base Station VMB5000, VMB4540, VMB4500 o VMB4000 y excluye esta integración si la cámara está conectada directamente al router. El acceso desde fuera de la red requiere además Apple Home Hub. Estas condiciones deben acompañar la futura relación; no basta la matriz genérica.

Propuesta siguiente: cinco relaciones (Wi-Fi, Alexa, Google, Apple y SmartThings) a nivel de modelo, sin prometer funciones de plan, grabación o accesorios universales. Paquete y número de cámaras siguen sin verificar.

## eufy: familia T8400, sufijo pendiente

La [tabla oficial de cámaras interiores](https://service.eufy.com/article-description/Differences-Between-eufy-Indoor-Cams) distingue columnas por PN: T8400 es Indoor Cam 2K fija, no T8410 pan-and-tilt ni T8401 1080p. Su columna indica 2,4 GHz, Alexa, Google Assistant y HomeKit; resolución de HomeKit 1080p.

La URL comercial US /products/t8400 devolvió error al abrirla. Las páginas europeas encontradas no se usaron como prueba de una variante US. El artículo enlazado HomeKit on eufy Devices no proporcionó coincidencia C120; no se utilizó para resolver el sufijo del catálogo.

Propuesta siguiente: cuatro relaciones de familia T8400 con el límite T8400X/T84001W1 explícito y HomeKit a 1080p. Antes de incorporarlas, revisar requisitos de emparejamiento en la fuente específica; no certificar hardware por compartir nombre C120.

## Juzgado y continuidad

Valoración propia 1–5 del avance: producto 4 (condición de hub resuelta); técnica 2 (implementación pendiente); datos/editorial 3 (fuentes primarias, sufijo sin resolver); operación 2 (sin cuentas ni aprobación pública). Mejoras siguientes: incorporar condiciones, probar aislamiento por modelo y actualizar inventario.

Validación realizada: lectura de fuentes originales, encabezados y columnas, generación HD/2K y requisitos Apple Home. No hubo pruebas nuevas de código porque este incremento solo registra investigación. Sigue vigente la validación FH20Q: 813 pruebas, 21/28 modelos candidatos, 68 relaciones y 272 ubicaciones; no equivale a validar las relaciones propuestas aquí.

FH-20 parcial; ocho tareas hechas y 24 restantes. Objetivo activo; heartbeat horario pausado. No listo para publicar.
