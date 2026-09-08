# Corrección acotada de dependencia — 2026-09-04

Resultado: `fast-uri` pasó de 3.1.5 a 3.1.7 en el lockfile existente. Es una dependencia transitiva de desarrollo, no una nueva dependencia de producción. No se demostró explotación de FlowHome público ni se realizó un escaneo integral de seguridad.

## Evidencia inicial y alcance

`npm audit --json` informó una dependencia vulnerable de severidad agregada alta y cuatro avisos: GHSA-5jgf-p345-68v8, GHSA-f65p-4m7j-42xc, GHSA-fph4-wmhf-6fwf y GHSA-jqff-g426-hqxp. La cadena inspeccionada fue `@astrojs/check → @astrojs/language-server → volar-service-yaml → yaml-language-server → ajv → fast-uri`. No se encontró uso directo en `src` o `scripts`.

Dos reproducciones puras, sin solicitudes de red, mostraron que la resolución de una referencia con hostname internacional no lo canonicalizaba y que la normalización decodificaba dos veces un hostname porcentualmente codificado. Una referencia relativa normal sirvió como control. Resultado previo: 2 fallos / 1 aprobación en `test/dependency-uri-security.test.mjs`.

## Cambio y verificación posterior

Actualización compatible con el rango transitivo ya autorizado; únicamente cambió la entrada de fast-uri en `package-lock.json` (versión, URL e integridad). No se ejecutaron scripts de instalación de esa actualización. Se verificaron mantenimiento y licencia BSD-3-Clause en el repositorio oficial.

Resultado posterior: 3/3 pruebas aprobadas. Los dos disparadores anteriores no se reprodujeron; rutas relativas, hosts ASCII y puerto HTTPS normal conservan su significado. Se revisaron por separado el código corregido y sus consumidores de validación YAML.

La skill de corrección de hallazgos solicitaba una revisión independiente. Se intentó abrir un revisor separado, pero el sistema rechazó la creación por límite de agentes. Se aplicó su alternativa explícita: investigación y verificación separadas por el mismo agente. Esto reduce la independencia del resultado y no se presenta como doble revisión.

**Límite pendiente:** dos intentos posteriores de `npm audit` agotaron el tiempo de espera del registro. No existe un resultado posterior de “cero vulnerabilidades”. Repetir la auditoría cuando el servicio responda y evaluar cualquier aviso nuevo. El bloqueo de red no invalida las reproducciones locales, pero impide certificar el inventario completo actualizado.

Último reintento, 05:30 UTC: consulta acotada a 15 segundos y sin reintentos automáticos; salida 1, sin metadatos de inventario utilizables. El registro confirmó `FETCH_ERROR`; no se afirma un código HTTP o causa más precisa. Una fila vacía del resumen fue un artefacto de enumerar un valor nulo, no un hallazgo. Este tercer intento tampoco es una auditoría aprobada. Detalle en `remote-service-checks-v3.md`.

Fuentes primarias: [release 3.1.6](https://github.com/fastify/fast-uri/releases/tag/v3.1.6), [release 3.1.7](https://github.com/fastify/fast-uri/releases/tag/v3.1.7), [aviso de doble decodificación](https://github.com/fastify/fast-uri/security/advisories/GHSA-fph4-wmhf-6fwf). La segunda release incluye correcciones adicionales de autoridad/puerto y corchetes; nuestras dos reproducciones no deben interpretarse como pruebas exhaustivas de todas ellas.
