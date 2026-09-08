# FH20H — Verificación del empaquetado aislado

Resultado: el empaquetador real conserva las condiciones documentales al atravesar runtime, adaptador, proyecciones de ficha/comparación/alternativas y serialización JSON del quiz. La prueba predeterminada permanece sin proveedor aunque el flag sea true. No se activó el candidato en Astro ni en producción.

## Contrato y alcance

Solo se añadió test/compatibility-bundled-runtime.test.mjs. Usa la dependencia Vite ya instalada, una entrada virtual de prueba, configFile false, envFile false y write false. Todo el resultado del empaquetado permanece en memoria. El módulo candidato se instala únicamente dentro de ese módulo de prueba; no se escribe en dist, no se lee un almacén de secretos ni se modifica la configuración real.

Dos pruebas nuevas comprueban:

- Runtime predeterminado nulo; los textos documentales de Aeotec no están incluidos en ese bundle.
- Candidato inicialmente inactivo dentro del módulo aislado y después instalado explícitamente para la prueba; ambas condiciones de Aeotec idénticas en tres proyecciones y el quiz serializado.
- Flags false, TRUE, booleano true y vacío no activan el proveedor; caducidad y modelo no revisado no verifican las señales.

Las primeras ejecuciones detectaron una expectativa incorrecta de la prueba: cuando no existe proveedor, los booleanos crudos se conservan como «Catalog: Yes (unverified)», no «Not verified». Es el contrato previo del sitio y no una verificación positiva. Se corrigió la expectativa en ficha y quiz, sin cambiar código de producto ni ocultar esa reserva. Con grafo activo sin evidencia aplicable, el estado sí es «Not verified».

## Evidencia

28 pruebas dirigidas aprobadas, incluidas las dos nuevas; lint del nuevo archivo aprobado y diff-check aprobado. Base anterior: 790 pruebas completas, lint y tipos; build de 88 páginas y ocho comprobaciones visuales descritas en FH20G. No se volvió a ejecutar la suite completa, tipos ni build por este cambio limitado a pruebas/documentación. No se presenta 792 como total ejecutado en una suite completa.

Esto verifica módulos reales empaquetados para servidor y sus proyecciones de datos, no renderizado integral de componentes Astro con proveedor aprobado ni publicación. Los modelos y condiciones siguen sujetos a aprobación, variantes y vigencia.

## Juzgado interno

Producto 4/5; técnica 4/5; datos/editorial 3/5; operación 2/5. Valoraciones internas, no independientes. Mejora concreta: la prueba ya detecta pérdidas en el empaquetado y evita confundir una importación documental con aprobación pública. Persisten 22 modelos sin cobertura documental candidata y las reservas integrales de FH20G.

Verified Task Brief limitó la aceptación a artefactos observables y conservó lo no probado como pendiente. Context7 confirmó el mecanismo de generación en memoria en la [fuente oficial de Vite](https://github.com/vitejs/vite/blob/main/packages/vite/src/node/build.ts) y la [API de módulos virtuales](https://github.com/vitejs/vite/blob/main/docs/guide/api-plugin.md); se siguió el patrón ya existente de pruebas del repositorio, sin agregar dependencias.

Siguiente trabajo autorizado: ampliar cobertura documental por modelo desde fuentes oficiales actuales, sin activar datos ni repetir búsquedas agotadas de credenciales. Ocho tareas hechas, 24 restantes; FH-20 parcial, objetivo activo y heartbeat horario pausado.
