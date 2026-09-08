# FH16G — contrato de petición comercial efímera

## Alcance y aceptación

La ficha de verificación fija: desactivado por defecto, entrada estricta, lector confiable no suministrable por cliente, timeout/cancelación, respuesta y errores no-store, autorización revalidada temporalmente después de adquirir y proyectar, sin reutilización de respuesta previa ni errores privados.

`src/lib/blocks/block8/request-delivery.ts` añade `serveCommerceRequest`. No registra ruta ni función desplegada. Admite GET con exactamente ASIN válido y mercadoUS; no acepta parámetros de aprobación. Requiere enabled===true y lector explícito. El lector futuro debe autenticar permisos/revisión, comprobar revocación y aplicar cuotas del proveedor; este contrato no fabrica esas garantías.

Adquisición limitada a3000ms y cancelable. Tras adquirir, comprueba autorización y ejecuta la proyecciónFH16F; vuelve a comprobar tiempo antes de responder. Un reloj inválido o que retrocede falla cerrado. La respuesta mínima tiene identidad US/USD, hora de servidor, precio/captura/vencimiento y disponibilidad opcional con su propio límite. No incluye objetos de evidencia, IDs internos, rating, descuentos o respuesta cruda de proveedor.

El plazo de respuesta es el menor entre60s desde proyección, autorización y vigencia de precio. Disponibilidad puede vencer antes y omitirse sin eliminar un precio todavía válido. No confundir el plazo corto de transporte con renovación de captura ni con permiso de retención. Cada petición vuelve a llamar al lector; fallo posterior no recupera un éxito previo.

Cabeceras locales de Response: Cache-Control:no-store, CDN-Cache-Control:no-store, tipo JSON y nosniff; sin ETag/304. Toda excepción del lector devuelve503 genérico sin registrar su cuerpo. Estas cabeceras no prueban comportamiento de CDN o servidor desplegado.

## Verificación

-Ocho pruebas nuevas, incluyendo lector detenido que expira realmente a los tres segundos y señal abortada recibida por éste.
-Casos de entrada inválida/defaultoff/método, respuesta mínima, permiso vencido durante adquisición/proyección, error después de éxito, cancelación previa/en curso, límites separados y reloj inválido/retroceso.
-995/995 pruebas generales; lint correcto; tipos433 archivos,0 errores/advertencias,18 hints existentes.
-Build88 y SEO88 sin errores/advertencias; diff-check correcto.
-421 archivos del sitio siguen idénticos al inventarioFH13P, SHA256 `4a3c6561de284075cb8e984747b06c6f3b76aaeaa7af7cfca0a5290a6021b4e7`. No se repite navegador/Lighthouse: no cambia el sitio servido.

Pruebas usan Request/Response y lector sintético aislados; no son una petición a Amazon, una integración HTTP desplegada ni una prueba de derechos reales. El código permanece fuera del checkpointf92d793. Sin push, publicación, registro de endpoint, migración ni servicios activados.

## Juzgado propio y siguiente pendiente

Producto2/5 integral B: contrato acotado y errores sin ofertas viejas, pero no disponible para compradores. Técnica3/5 local: integración de adquisición→proyección→Response con fallos y plazos probados. Datos/editorial2/5 integral: observaciones no renuevan capturas y campos no autorizados siguen omitidos. Operación2/5 integral: faltan lector autenticado/cuotas, cliente transitorio, comprobación HTTP/CDN real y aprobación de activación.

Próximo trabajo local: cliente que valide esta respuesta, descuente latencia con reloj monotónico y retire datos al ocultarse, vencer o recibir error, sin persistencia. No conectar la UI pública ni afirmar eliminación universal en pestañas suspendidas. Lector real, permisos y oferta end-to-end conservan FH-15/FH-18/FH-31. FH-16 sigue parcial.
