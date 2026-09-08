# Arquitectura y decisiones V3

Estado local al 2026-09-04; no describe un despliegue nuevo.

## Límites de responsabilidad

| Capa | Entrada y salida | Qué NO demuestra |
|---|---|---|
| Catálogo Astro | 28 perfiles, 15 reviews, 8 guías; genera las rutas existentes | Precio, stock, compatibilidad o ensayo actual por existir en YAML |
| Proyección comercial | Fuente soportada + identidad + fechas válidas → valores visibles; en otro caso “consultar Amazon” | Autenticidad criptográfica o permisos del proveedor |
| Block8 | Evidencia atribuida y permisos del llamador → ingestión/scoring condicionados, claves SHA-256 sin ambigüedad | Adquisición real, permiso otorgado por Amazon o borrado físico de datos persistidos |
| Block9 | Relaciones de compatibilidad y caducidad → avisos/alternativas cuando habilitado | Interoperabilidad de toda combinación de dispositivos |
| Cliente Amazon | OAuth en memoria + cuatro operaciones oficiales limitadas | Acceso API autenticado probado; la sesión Associates encontrada no tiene API habilitada y no se localizaron credenciales utilizables |
| Ejecución diaria | Catálogo + modo autorizado → informes y cola para revisión; publicación deshabilitada | Scheduler remoto activo, persistencia entre runners efímeros o crecimiento SEO |
| Navegador | Compra directa anónima + lista local única + eventos con consentimiento | Inicio de sesión y sincronización real sin la cuenta configurada |

## Flujo operacional

1. Comprobar kill switch, modo de publicación y bloqueo exclusivo.
2. Leer catálogo; calcular huella del código/configuración sin registrar secretos.
3. Reutilizar sólo informes completos del mismo día con TODOS sus archivos de evidencia intactos.
4. Consultar Amazon sólo si la configuración y autorización explícitas existen y no es dry-run. Aislar fallos, cuotas y aplazamientos.
5. Ejecutar controles; almacenar ASIN y metadatos propios para revisión, nunca ofertas históricas improvisadas.
6. Marcar atención ante fallos, anomalías o cambios de código durante la ejecución. Liberar únicamente el bloqueo propio.

## Decisiones deliberadas

- Conservar marca, rutas y arquitectura Astro; no migrar hosting ni añadir otra base de datos sin decisión del propietario.
- Mantener precios manuales heredados como datos internos sin exhibirlos ni usarlos para presupuestos, subtotales, rankings o schema de oferta vigente.
- No conectar el colector a Block8 hasta resolver retención, procedencia y caducidad de extremo a extremo. La ejecución diaria no garantiza por sí sola retirar datos a las 24 horas en HTML estático.
- Generar borradores exclusivamente fuera de las colecciones publicables, sin valoración o autor fabricados. Revisión humana explícita para transferirlos.
- Mantener un solo mercado editorial inglés/US. `hreflang` no aplica sin equivalentes localizados reales.
- Bloquear red externa durante QA visual y Lighthouse para reproducibilidad; documentar que las imágenes reales, identidad y servicios remotos requieren una comprobación separada.
- No activar scheduler, experimentos de producción, publicación o integraciones mediante una autorización de cambios locales.

## Información necesaria para la siguiente fase

Propietario: resolver qué cuenta/tienda tiene API Amazon habilitada y dónde se encuentra su configuración, junto con permisos aplicables; decisión de almacenamiento/hosting y retención; correspondencia exacta ASIN/modelo/bundle; aprobación de publicación; cuenta de prueba para sincronización y atribución. Existen observaciones actuales del panel de afiliación en `credential-location-audit-v3.md` y de GA4/Search Console en `current-measurement-v3.md`. La lectura de sus informes no conecta esos datos al scoring ni mide el efecto comercial de cambios que siguen sin publicar.

Operación, rollback y fuentes están en `../operations/`, `../data/amazon-integration-v3.md` y `../content/claim-ledger-v3.md`.
