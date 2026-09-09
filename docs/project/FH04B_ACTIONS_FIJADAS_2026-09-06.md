# FH04B — Actions fijadas y acceso remoto
Fecha: 2026-09-06. FH-04 parcial. Trabajo local, sin ejecutar workflows, publicar ni modificar reglas remotas.

## Resultado
Se sustituyeron 18 referencias variables por commits completos en quality.yml, quality-check.yml, batched-deploy.yml y trends-monitor.yml. Se conservaron las versiones principales elegidas anteriormente, entradas, eventos, permisos y controles de despliegue. Las referencias previamente fijadas de automation, CodeQL y Wrangler no se cambiaron.
Una nueva regresión analiza YAML de todos los workflows y exige commits de 40 caracteres en todas las acciones externas; las acciones locales permanecen locales.

## Procedencia verificada
Resolución pública de etiquetas con git ls-remote y lectura del action.yml en cada commit oficial, el 2026-09-06:
| Referencia anterior | Commit fijado |
|---|---|
| actions/checkout@v7 | 3d3c42e5aac5ba805825da76410c181273ba90b1 |
| actions/setup-node@v6 | 249970729cb0ef3589644e2896645e5dc5ba9c38 |
| actions/checkout@v5 | fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09 |
| actions/setup-node@v5 | a0853c24544627f65ddf259abe73b1d18a591444 |
| actions/upload-artifact@v7 | 043fb46d1a93c77aae656e7c1c64a875d1fc6a0a |
| actions/download-artifact@v8 | 3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c |

La [guía oficial de uso seguro](https://docs.github.com/en/actions/reference/security/secure-use) recomienda commits completos para inmovilizar las referencias. Fijar una referencia no certifica que todo el código de esa acción sea seguro.
Metadatos consultados en https://raw.githubusercontent.com/<organización>/<repositorio>/<commit>/action.yml.
Comprobación adicional de ocho referencias distintas de checkout/setup-node/upload-artifact/download-artifact, aplicadas en 22 pasos: todos los parámetros configurados existen en inputs; no se detectaron nombres desconocidos. Siete referencias declaran runtime node24; upload-artifact v4 previamente fijado declara node20. Los jobs siguen usando runners hospedados Ubuntu; el Node instalado para el proyecto es independiente del runtime interno de la acción.
No se ejecutaron las acciones ni se verificaron sus servicios remotos. La comprobación de parámetros no prueba resultados de subida, descarga, cache o despliegue.

## Acceso a protecciones
Las consultas de lectura a branches/main/protection y rulesets devolvieron HTTP 401, Bad credentials. No puede inferirse que la rama esté protegida o desprotegida. Se necesita renovar la autenticación de GitHub de esta sesión para comprobarlo; no pegar tokens en el chat. No se buscaron secretos ni se cambiaron credenciales.
Esta dependencia no bloquea la consolidación local del runner diario ni QA por impacto. No repetir consultas idénticas hasta que cambie el acceso.

## Validación y juzgado
- Suite final 729/729, cero omitidas. Incluye contratos de despliegue protegido y nueva regresión de referencias.
- Lint y diff-check aprobados. Tipos: 260 archivos, cero errores/advertencias, 18 hints existentes.
- No nueva compilación/QA visual: sólo referencias y pruebas, sin cambio de código del sitio. Última compilación/SEO válida: FH04A, 88 páginas.
- Producto 4/5: no cambia la experiencia ni activa operaciones.
- Técnica 4/5: referencias reproducibles y parámetros comprobados; ejecución remota pendiente.
- Datos/evidencia 4/5: procedencia oficial por commit, sin equiparar metadatos a ejecución o revisión completa de seguridad.
- Operación 3/5: permisos y pasos conservados localmente; acceso de GitHub inválido impide validar reglas efectivas.
Valoraciones del mismo agente sobre este cambio; no son revisores independientes.

## Próximo
FH-04 parcial: consolidar validaciones compartidas con el runner diario y QA por impacto sin builds idénticos repetidos, manteniendo evidencia y controles obligatorios. Acceso remoto, derechos/imágenes, producción y campo siguen pendientes según backlog.
Siete tareas hechas/25 restantes. Objetivo ACTIVO, heartbeat PAUSADO. Ningún push, deploy, envío, pago o cambio remoto.
