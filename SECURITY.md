# Política de seguridad

## Reportar una vulnerabilidad

No publiques vulnerabilidades, credenciales, datos personales ni pruebas de concepto explotables en un issue público.

Usa **Report a vulnerability** en la pestaña Security del repositorio para abrir un GitHub Security Advisory privado. Incluye:

- componente y versión o commit afectado;
- impacto observado o potencial;
- pasos mínimos de reproducción;
- precondiciones y permisos necesarios;
- mitigación sugerida, si existe.

El propietario confirmará recepción, evaluará severidad y coordinará divulgación y corrección. No se promete un plazo fijo hasta definir capacidad de mantenimiento.

## Alcance prioritario

- autenticación, autorización y políticas RLS de Supabase;
- exposición de secretos, tokens o datos personales;
- inyección o renderizado inseguro de contenido externo;
- redirecciones, enlaces de afiliación o automatizaciones manipulables;
- configuración y despliegue de Cloudflare Pages;
- dependencias y flujos de GitHub Actions.

## Prácticas de investigación

No accedas a datos de terceros, no interrumpas el servicio y no realices pruebas destructivas. Usa datos propios o de prueba y detente al demostrar el impacto mínimo necesario.
