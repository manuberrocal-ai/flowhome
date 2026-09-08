# FH16D — brecha concreta antes del transporte comercial

## Hallazgo y alcance

Revisión estática de los consumidores existentes, sin llamadas Amazon, cambios de permisos, instalación, despliegue ni nuevos datos de catálogo. La propuesta FH16A ya define transporte efímero y retirada; no se crea una segunda arquitectura.

La siguiente implementación no debe empezar por registrar un endpoint: necesita reconciliar la evidencia por campo. `SourcePermission` en `src/lib/blocks/block8/evidence.ts` tiene `currentPriceAllowed` y `maxAgeMs`. `isOfferPromotable` en `freshness.ts` también consulta `sourcePermissionFor` para la captura de disponibilidad, usando ese mismo permiso de precio. `CommerceProduct` y `getCommerceData` en `src/lib/commerce-data.ts` manejan precio, disponibilidad y rating con fechas independientes, pero no reciben autorización confiable por campo. Su marcador de fuente no es autenticación, como ya advierte el código.

No se declara una exposición pública actual: la barrera estática sigue activa, el proveedor comercial no está conectado y estos contratos no constituyen una autorización real. El hallazgo cambia el orden del trabajo local: cerrar permisos por campo antes de conectar transporte o presentar observaciones.

## Mapeo para la implementación

| Campo de presentación | Evidencia actual | Contrato que falta |
|---|---|---|
| Precio | Snapshot enlazado, identidad variante/comerciante/mercado/moneda, permiso de precio y captura | Resolución de identidad catálogo→ASIN/modelo/paquete desde integración confiable; autorización vigente al responder |
| Disponibilidad | Estado y captura propios; promoción exige stock fresco | Permiso explícito de disponibilidad y TTL propio: no heredar `currentPriceAllowed` |
| Rating y cantidad | Proyección con fuente/fecha/límite independientes | Observación enlazada y permiso propios; ausencia no se completa con autorización de precio |
| Descuento/promoción | Proyección relaciona precio, precio anterior y stock | Derechos y evidencia de cada dato usado; no inferir permiso de precio anterior/historial a partir de precio corriente |
| Identidad/enlace | Block8 usa variante; UI usa ASIN/enlace de producto | Correspondencia confiable de la variante exacta, sin aceptar identidad o aprobación del navegador |

## Siguiente implementación local delimitada

Extender primero el contrato de evidencia sin conceder permisos implícitos a registros antiguos. Un permiso ausente, ambiguo, revocado o vencido omite el campo afectado. Mantener el precio utilizable cuando esté autorizado y fallen campos independientes; una promoción sí exige todos sus datos. No modificar registros reales ni migrar permisos por defecto.

Aceptación del cambio: pruebas negativas de permiso sólo de precio frente a disponibilidad/rating, permisos con vencimientos distintos y revocación; rechazo de ambiguos y futuros; control en ingestión, promoción y proyección de servidor. Conservar las pruebas de fuente manual y la barrera estática. El tope central de24h es una restricción interna existente, no una nueva comprobación de políticas vigentes de Amazon.

Después: adaptador de petición que obtenga evidencia de servidor, vuelva a comprobar tiempo/permisos tras adquirirla y entregue sólo campos autorizados con fecha límite efectiva. Reutilizar patrones de timeout/no-store del contrato de compatibilidad sólo después de adaptar identidad y permisos; su grafo y autorización no sirven como prueba comercial. Cliente transitorio, cuotas y prueba de retirada siguen pendientes; no activarlos con fixtures.

## Juzgado propio y verificación

Producto2/5 integral para comercio conectado: A sigue útil, B no ofrece datos vivos. Técnica2/5 integral: hay validadores y barrera, pero la unión entre permisos y proyección está incompleta. Datos/editorial2/5 integral: no generalizar derechos de precio a otros campos. Operación2/5 integral: credenciales/permisos reales y aprobación siguen pendientes; existe trabajo local ejecutable sobre este contrato.

Evidencia: lectura de `evidence.ts`, `freshness.ts`, `domain.ts`, `commerce-data.ts`, consumidores de tarjetas/comparación y FH16A/B/C. No se ejecutaron pruebas ni build porque no se modificó código. Este informe no cierra FH-16 ni constituye auditoría de seguridad o permiso de uso de datos.
