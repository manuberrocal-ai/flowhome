# FH20I — Tres modelos Kasa documentados

Resultado: candidato ampliado a nueve de 28 modelos, 28 relaciones y 112 ubicaciones propuestas. Tres pruebas nuevas verifican las señales y sus límites. No se activó el proveedor público ni se publicaron cambios.

## Evidencia y decisión editorial

Revisión documental del 6 de septiembre de 2026, a las 23:47:23 UTC. Las páginas no ofrecen una fecha inequívoca de revisión del contenido; la fecha registrada es de consulta, no de actualización del fabricante.

- [Kasa EP10 US](https://www.kasasmart.com/us/products/smart-plugs/kasa-smart-plug-mini-ep10): Wi-Fi de 2,4 GHz, Alexa y Google Assistant. El catálogo identifica EP10/EP10P2. La página HS103 abierta inicialmente fue descartada para este modelo. No se resolvió la discrepancia histórica sobre medición energética ni se inspeccionó el paquete del vendedor.
- [Kasa HS220 US](https://www.kasasmart.com/us/products/smart-switches/kasa-smart-wi-fi-light-switch-dimmer-hs220): Wi-Fi de 2,4 GHz y control por voz, incluida regulación de iluminación compatible. Se conserva la necesidad de comprobar tipo de regulación e instalación.
- [Kasa HS200 US](https://www.kasasmart.com/us/products/smart-switches/kasa-smart-wi-fi-light-switch-hs200): Wi-Fi de 2,4 GHz y encendido/apagado por voz. No se transfirió la función de dimmer del HS220.

No se agregan Matter, Thread, Zigbee, Apple Home, SmartThings, Bluetooth, compatibilidad universal, funcionamiento completamente offline ni una garantía de seguridad de cualquier carga. Las afirmaciones comerciales de instalación fácil o uso con cualquier aparato no se trasladan como garantías. Alexa y Google conservan límites de configuración y funciones; voz no equivale a todas las funciones de una aplicación o automatización.

## Implementación

documentary-kasa.ts reutiliza el constructor existente. Cada modelo aporta tres relaciones con fuente propia; cada relación tiene cuatro ubicaciones exactas de revisión. El total es 17 nodos, nueve productos, 28 relaciones y 112 entradas de ledger. Identidad de vendedor, hardware y firmware siguen sin asignarse. Evidencia research-verified, confianza media y aprobación pendiente; caducidad editorial a 30 días, no promesa del fabricante. El vencimiento global conservador continúa siendo el del primer candidato Tapo.

No se modificaron los 28 archivos del catálogo, el runtime predeterminado, dependencias o diseño. Importar el candidato no lo instala en el sitio.

## Verificación

25 pruebas dirigidas aprobadas, seguidas de la suite completa de 795 pruebas aprobadas. Lint completo y build estático de 88 páginas aprobados; diff-check aprobado. La invocación inicial de tipos usó una ruta de ejecutable inexistente, sin ejecutar análisis; se corrigió usando el comando del proyecto: 288 archivos, cero errores y advertencias, 18 hints. Auditoría determinista del informe: un archivo, cero hallazgos; no sustituye la revisión de las afirmaciones ni verifica páginas activadas.

Las pruebas nuevas comprueban las tres señales de cada modelo en cuatro superficies, condiciones conservadas por el adaptador, exclusión de protocolos no documentados, diferencias de roles y fuentes, vencimiento, mercado, ubicación exacta, evidencia disputada y aislamiento entre lecturas. La prueba de empaquetado de FH20H volvió a pasar.

Sin nueva inspección visual: este candidato no está activado en la compilación pública. El transporte visual general se revisó en FH20G; no se considera verificado el renderizado Astro de estas condiciones Kasa activadas ni la variante física del vendedor.

## Juzgado interno y siguiente etapa

Producto 4/5: tres modelos más documentados, con diferencias funcionales explícitas. Técnica 4/5: integración local y reservas cubiertas. Datos/editorial 3/5: nueve de 28 modelos, sin variantes ni aprobación. Operación 2/5: sin integración externa aprobada o publicación. Son valoraciones internas orientativas, no revisores independientes.

Verified Task Brief exigió evidencia por modelo y distinguió consulta de vigencia del fabricante. Publication Copy Auditor impidió heredar la identidad HS103, capacidades del dimmer y promesas universales. Estado de publicación: NO LISTO PARA PUBLICAR.

Siguiente pendiente seguro: los 19 modelos restantes y sus reservas de identidad, priorizando categorías todavía sin candidato. FH-20 sigue parcial; ocho tareas hechas, 24 restantes. Objetivo activo y heartbeat horario pausado.
