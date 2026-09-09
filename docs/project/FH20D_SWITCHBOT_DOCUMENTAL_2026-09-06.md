# FH20D — Hub 2 y Blind Tilt en el candidato documental

Resultado: cobertura ampliada de uno a tres modelos del catálogo, ocho relaciones y 32 registros por superficie. FH-20 sigue parcial. Proveedor público sin grafo; sin publicación, instalación ni acceso a cuentas.

## Evidencia y decisiones

Fuentes primarias consultadas el 6 de septiembre de 2026 a las 23:16 UTC. La fecha de consulta no se presenta como fecha de publicación o de prueba física.

| Fuente | Uso acotado |
|---|---|
| [Configuración Hub 2](https://support.switch-bot.com/hc/en-us/articles/17784047699479-How-to-Set-up-SwitchBot-Hub-2) | Red de 2,4 GHz y configuración por app. El artículo indica actualización de octubre de 2023; no se presume que sus mínimos históricos certifiquen cualquier firmware actual. |
| [Compatibilidad Matter de SwitchBot](https://support.switch-bot.com/hc/en-us/articles/38979658026519-SwitchBot-Device-Matter-Compatibility) | Hub 2 como puente y Blind Tilt mediante puente. Se conserva el requisito del controlador de la plataforma y el emparejamiento en la app. |
| [Hub 2 con Apple Home](https://support.switch-bot.com/hc/en-us/articles/35214812208023-SwitchBot-Hub-2-Matter-Setup-iOS) | Pasarela y lecturas de temperatura/humedad; requisitos de equipo Apple, app, firmware y red. No acredita todos los accesorios. |
| [Acciones de dispositivos secundarios](https://support.switch-bot.com/hc/en-us/articles/13282638111127-Which-SwitchBot-Devices-Can-Be-Added-to-Apple-Home-As-Sub-devices-via-Matter) | Apertura/cierre de Blind Tilt; dirección de cierre dependiente de configuración y firmware. Se exige consultar capacidad del puente. No se infiere elevación de la persiana. |
| [Página estadounidense de Hub 2](https://us.switch-bot.com/pages/switchbot-hub-2) | Corroboración del modelo y la integración mediante puente en el mercado objetivo. La publicidad conserva texto prospectivo; no se usa sola para afirmar funciones disponibles. |

Hub 2 añade Wi-Fi, Matter y Apple Home. Blind Tilt añade Matter y Apple Home por la ruta condicionada del puente. No se completan automáticamente Alexa, Google Home, SmartThings, Bluetooth, Zigbee o Thread a partir de un logo, del nombre del fabricante o de capacidades del hub. Ausencia de arista significa no verificado en este candidato, no incompatibilidad.

La ruta citada admite puentes compatibles alternativos. No se añadió una dependencia que afirmara que Hub 2 es el único puente posible. Las relaciones describen soporte documental condicionado, no que el usuario ya tenga instalado el equipo o firmware requerido. ASIN, paquete y revisión física siguen sin corresponderse de manera independiente.

## Implementación y pruebas

Datos SwitchBot aislados en `documentary-switchbot.ts`; el proveedor de revisión combina nodos compartidos sin duplicarlos y conserva intacto el lote Tapo. Objetos nuevos en cada lectura, fuentes por relación, revisión pendiente y dueño sin asignar. Caducidad editorial de 30 días, no garantía del fabricante; `reviewDueAt` del conjunto mantiene la fecha más temprana del lote Tapo y `latestReviewAt` identifica la ampliación.

- 13 pruebas documentales dirigidas, cinco nuevas.
- Suite completa: 779 aprobadas, salida cero.
- Lint aprobado; tipos: 279 archivos, cero errores/advertencias, 18 hints previos.
- Compilación: 88 páginas; diff-check aprobado.
- Verificadas identidades únicas, cuatro ubicaciones exactas por relación, conservación de condiciones, aislamiento entre modelos, expiración, ámbito y disputa. Blind Tilt no hereda Wi-Fi del hub. El proveedor por defecto continúa null incluso con la bandera habilitada.
- No se repitió una inspección visual: no se cambiaron componentes ni se activaron estos datos. La presentación del candidato completo y su integración servidor con un proveedor aprobado permanecen NO VERIFICADAS.

## Juzgado interno del avance

| Dimensión | Valoración | Mejora / límite |
|---|---|---|
| Producto | 3/5 | Dos modelos adicionales con requisitos explícitos; 25 modelos aún sin cobertura del candidato. |
| Técnica | 4/5 | Pruebas de aislamiento y degradación; integración aprobada aún pendiente. |
| Datos/editorial | 3/5 | Fuentes primarias y funciones acotadas; no certifica la variante vendida ni una instalación física. |
| Operación | 2/5 | Revisión y caducidad registradas; responsable y activación no aprobados. |

Valoración propia de Codex, no revisión independiente. La guía verified-task-brief se usó para exigir fuentes y pruebas por función, manteniendo como no verificados los requisitos externos.

Ocho tareas generales hechas y 24 restantes. Próximo trabajo ejecutable: continuar con otros modelos y con la prueba integral de un proveedor exclusivamente de revisión, sin alterar producción. Los bloqueos de imágenes, cuentas y aprobación siguen separados del trabajo local.
