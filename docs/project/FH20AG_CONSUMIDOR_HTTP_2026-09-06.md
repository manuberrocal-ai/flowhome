# FH20AG — Consumidor HTTP transitorio

Resultado: validación del sobre HTTP y cliente de peticiones conectados al control de vigencia FH20AF, sin importar el grafo en ejecución de navegador y sin conexión a páginas públicas ni endpoint registrado. No se habilitó el candidato, una cuenta ni un despliegue.

## Contrato y evidencia

`delivery-envelope.ts` exige esquema cerrado, contexto exacto, timestamps UTC canónicos y plazo coherente de hasta 60 segundos. Las afirmaciones necesitan condición y procedencia; lo desconocido conserva null/ausencia y no se transforma en incompatibilidad. Rechaza metadatos internos adicionales, etiquetas de evidencia inconsistentes, listas duplicadas/autorreferencias y texto excesivo. Valida estructura, no autenticidad: una respuesta fabricada de estructura correcta no acredita aprobación.

`delivery-client.ts` exige endpoint explícito del mismo origen, HTTPS salvo loopback local, sin credenciales URL/query/hash. Peticiones GET no-store, sin cookies, sin redirecciones, sólo mismo origen. Exige 200, JSON y no-store, limita el cuerpo decodificado a 64 KiB y la operación completa a cinco segundos. Un fallo retira el resultado anterior; una respuesta reemplazada no altera la generación vigente. Sin almacenamiento persistente ni sondeo automático. La integración debe proporcionar un origen confiable, nunca desde datos de un visitante.

El enlace de ciclo de vida retira/aborta ante ocultación, desconexión, pagehide o freeze. Reanudación sólo permite una petición nueva, nunca resucita datos ni inicia una petición por sí sola. Su limpieza elimina escuchas y destruye el cliente. El futuro renderizador debe consultar read y retirar su presentación cuando changed notifique; este módulo no manipula el DOM.

Se consultaron las referencias oficiales de MDN sobre [Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) y [visibilitychange](https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event): la comprobación explícita del estado HTTP y el manejo de cancelación/visibilidad son responsabilidades de la integración, no pruebas de un CDN desplegado.

## Validación observada

Diecinueve pruebas dirigidas aprobadas: siete del controlador, cinco del sobre y siete del cliente. Incluyen respuestas del servidor para 28 productos × cuatro superficies, modificaciones hostiles de contexto/condiciones/plazos, servidor → fetch simulado → validación → vigencia, denegación posterior, respuesta atrasada cuyo fetch ignora aborto, cuerpo bloqueado/oversize, temporizador real de cinco segundos y eventos simulados con EventTarget. No equivalen a una prueba de navegador ni a autenticación real.

Suite completa y lint aprobados. Tipos: 331 archivos, cero errores/advertencias, 18 hints existentes. Build normal: 88 páginas; diff-check aprobado. Verificado el 7 de septiembre de 2026 a las 01:57 UTC.

## Siguiente paso y juzgado

Probar una página aislada con navegador real y transporte HTTP local, comprobar retirada visual/visibilidad/errores, limpieza y ausencia de almacenamiento. Después integrar las superficies sin eludir la barrera estática ni activar datos no aprobados. CDN, autenticación/revocación real, variantes, aprobación editorial e imágenes siguen pendientes.

Evaluación propia 1–5: producto 3 (sin presentación conectada), técnica 4 (cadena y límites ejecutables), datos/editorial 3 (estructura no acredita fuente), operación 2 (sin entorno real). Verified Task Brief separó criterios probados de comportamiento visual NO VERIFICADO. No hubo revisores independientes. FH-20 parcial; ocho hechas/24 restantes.
