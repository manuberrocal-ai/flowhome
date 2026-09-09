# FH-07 — prioridades del quiz sin inferencias indebidas

Fecha: 5 septiembre de 2026. Activación automática recibida a las 16:07:20 UTC. El checkpoint anterior de cámaras ya está aprobado localmente; no se repite su investigación.

- Problema reproducible: el ranking premia privacidad por `subscriptionRequired=false`, control local por Matter/Zigbee y facilidad por app/Wi-Fi, sin evidencia de esos beneficios por modelo/función. Comprobar presencia de un campo tras defaults tampoco acredita su procedencia.
- Cambio mínimo: quitar esas tres bonificaciones y afirmaciones; mostrar antes de elegir y en resultados que esas preferencias no cambian el orden por falta de evaluación. Conservar sus IDs/URLs, las cinco preguntas, el ranking comercial autorizado y las preferencias de objetivo, instalación, presupuesto y ecosistema.
- Superficies: función de ranking/explicaciones, payload y textos del quiz, pruebas y documentación vigente. No cambiar catálogo, precios, fechas, diseños, dependencias, cuentas, ASIN ni publicación.
- Aceptación: flags true/false/ausentes/inválidos no alteran el orden para las tres prioridades; avisos explícitos incluso sin flags; URL previa sobrevive; resultados muestran límite con y sin relajación; fuentes de instalación y condiciones de servicios no desaparecen; guardado anónimo y compra directa intactos.
- Verificación: pruebas negativas antes del cambio, catálogo real en matriz de respuestas, pruebas dirigidas/completas y controles del proyecto; navegador 1440/390 y reflujo 720 CSS px con teclado/movimiento reducido. Una ronda visual y sólo una confirmación adicional si surge un defecto. No repetir Lighthouse por este cambio acotado.
- Límites: no se certifica privacidad/control local/facilidad de ningún dispositivo. El esquema y los chips/filtros de ecosistema siguen requiriendo evidencia; nueve instalaciones documentadas, 19 unknown. FH-07 global no se cierra por corregir estas prioridades.
- Juzgado: producto, técnica, datos/editorial y operación por un único revisor; separar aprobación local de operación real. No activar el scheduler comercial FH-19.
