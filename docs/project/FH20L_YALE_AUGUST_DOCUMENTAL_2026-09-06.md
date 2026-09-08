# FH20L — Yale y August documentales

Resultado: candidato ampliado a 13/28 modelos, 42 relaciones y 168 ubicaciones propuestas. No se activó el proveedor, se publicaron cambios ni se operó ninguna cerradura.

## Fuentes y decisiones

Revisión iniciada el 6 de septiembre de 2026 a las 23:59:35 UTC; fecha de consulta, no fecha demostrada de actualización del fabricante.

- [Yale Assure Lock 2 Wi-Fi touchscreen US](https://shopyalehome.com/products/yale-assure-lock-2-touchscreen-with-wi-fi): fuente de la familia estándar YRD420-WF1, con acabado predeterminado distinto al del catálogo. No se reemplaza el acabado 619 ni se declara inspeccionado el módulo. Se conservan reservas sobre funciones y requisitos actuales de Apple; no se importa una lista histórica de hubs como compatibilidad actual garantizada.
- [August Wi-Fi Smart Lock](https://august.com/products/august-wifi-smart-lock): fuente del modelo con Wi-Fi integrado y tabla de integraciones. La página contiene un requisito de red actualizado; no se traslada automáticamente una banda a la revisión del vendedor. HomeKit no se convierte en Home Key ni en una propiedad del Smart Lock sin Wi-Fi integrado.

Las FAQ oficiales aparecieron en búsqueda, pero su apertura y una consulta HTTP no permitieron leer el artículo completo. Se registran como pistas, no como fundamento único de señales nuevas. No se incorporan Bluetooth ni SmartThings por esos fragmentos; permanecen pendientes de evidencia legible y específica. Los resultados de búsqueda contaminados por consultas ajenas se descartaron.

## Implementación

documentary-yale-august.ts añade cuatro relaciones por modelo: Wi-Fi, Alexa, Google y Apple. Conservan configuración, funciones y reservas de identidad. Se reutiliza el constructor documental y la identidad canónica e:apple-home. La primera ejecución detectó e:apple, que habría creado un nodo adicional y señales sin resolver; se corrigió antes de aprobar las pruebas. No se modificó el contrato del resolver para acomodar el error.

Total: 21 nodos, 13 productos, 42 relaciones y 168 entradas de ledger. Identidades de vendedor y firmware siguen sin asignarse; revisión pendiente y confianza media. No hay catálogo, diseño, dependencias ni runtime predeterminado nuevos. El plazo editorial sigue siendo 30 días por fuente y el vencimiento global conservador anterior permanece intacto.

## Verificación y reservas

17 pruebas dirigidas aprobadas tras la corrección. Dos pruebas nuevas cubren cuatro superficies, condiciones exactas, rechazo de protocolos no documentados, modelo ajeno, región, ubicación, desactivación, vencimiento y disputa; lecturas aisladas. La prueba del empaquetador real pasó de nuevo. Suite completa: 801 pruebas aprobadas; lint, tipos (294 archivos, cero errores/advertencias, 18 hints), build de 88 páginas y diff-check aprobados.

Sin prueba física, cuenta conectada o nueva revisión visual con estas condiciones activadas. No se valida apertura por voz, adecuación de puertas, variantes exactas, Home Key ni publicación. Una prueba de proyección de datos no sustituye esos controles.

La auditoría determinista del informe devolvió cero bloqueantes y dos candidatos promocionales: «compatibilidad actual garantizada» aparece negada, y «no como fundamento único» explica una limitación de fuente. Se revisaron en contexto; no son garantías ni promociones nuevas. El informe no se declara libre de hallazgos automáticos.

## Juzgado interno

Producto 4/5: las tres cerraduras del catálogo ya tienen candidatos, no aprobación pública. Técnica 4/5: error de identidad detectado y corregido por regresiones. Datos/editorial 3/5: cobertura 13/28, campos y variantes pendientes. Operación 2/5: sin activación ni integración externa. Valoraciones internas orientativas, no revisores independientes.

Verified Task Brief exigió fuentes legibles y específicas; Publication Copy Auditor mantuvo diferencias entre módulos, modelos y Home Key. NO LISTO PARA PUBLICAR.

Siguiente: los 15 modelos aún sin candidato, y reservas de campos ya documentados. FH-20 parcial; ocho tareas hechas, 24 restantes. Objetivo activo y heartbeat horario pausado.
