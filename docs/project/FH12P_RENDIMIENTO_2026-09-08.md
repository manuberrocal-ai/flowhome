# FH12P — presupuesto local de rendimiento y portada

## Resultado

La matriz inicial de cuatro rutas por tres muestras encontró un incumplimiento: mediana LCP de portada 2705,592 ms frente al límite de 2500 ms, pese a rendimiento 96/100. La imagen del showcase, aunque no era el elemento LCP (el título), se solicitaba a 720 px con prioridad alta cuando el diseño móvil limita el arte de producto a 192 px.

Se ajustó únicamente la indicación responsive de portada a 192 px por debajo de 640 px; preload y carrusel comparten el mismo valor. No se cambiaron dimensiones visuales, imágenes, etiquetas, prioridades, tipografías ni contenido. La imagen Echo pasó de 64.826 B a 31.240 B de contenido en la prueba; la transferencia registrada pasó de 65.094 a 31.508 B. No es una medición del peso total de página.

La repetición de portada con tres muestras dio mediana LCP **2407,180 ms**, 298,412 ms menos; rendimiento97, accesibilidad100, buenas prácticas100, SEO100, CLS0 y TBT0. Cumple los presupuestos por mediana del proyecto. La primera muestra posterior fue rendimiento87/TBT301,2775 ms; las otras dos rendimiento97/TBT0. No se descartó esa muestra ni se atribuyó su causa sin traza suficiente. No equivale a rendimiento de campo garantizado.

## Matriz y condiciones

| Ruta | Muestras | Rendimiento / accesibilidad / prácticas / SEO | LCP mediano | CLS / TBT |
|---|---|---|---:|---|
| Portada, antes | 3 | 96 / 100 / 100 / 100 | 2705,592 ms | 0 / 0 ms |
| Amazon Smart Thermostat | 3 iniciales | 98 / 97 / 100 / 100 | 2258,155 ms | 0 / 0 ms |
| Reseña Roborock Q5+ | 3 iniciales | 98 / 100 / 100 / 100 | 2258,476 ms | 0 / 0 ms |
| Comparación de termostatos | 3 iniciales | 99 / 100 / 100 / 100 | 2112,312 ms | 0 / 37,5 ms |
| Portada, después | 3 adicionales | 97 / 100 / 100 / 100 | 2407,180 ms | 0 / 0 ms |

Lighthouse local13.4.1, Brave ejecutable152.1.94.121, perfil móvil simulado, perfiles nuevos por muestra, recursos externos bloqueados y servicios de cuenta/analítica apagados. URL base127.0.0.1:4339. La matriz inicial midió dist de FH12O: huella `97d74885d342bc5ac20c2d9d01729a631211a210e099e0300c59ff2ae29f11b8`, comprobada intacta hasta concluir. Después: `b48f6e1548f944820d761fc1404e19c8d72028a7614ab6046071e7e547684a6f`. Huellas locales, no manifiestos de release.

[Resultados completos y rutas a informes](FH12P_MEDICION_2026-09-08.json). Los informes individuales permanecen en reports/daily/fh12p-lighthouse-20260908 y reports/daily/fh12p-home-after-20260908. Dos ejecuciones iniciales y una posterior dieron aviso EPERM al limpiar el navegador después del informe: los quince informes están completos y se retuvieron con su aviso, según el contrato existente. No se modificaron permisos ni se borraron perfiles ajenos.

El runner ahora admite LIGHTHOUSE_ROUTES con un subconjunto de su matriz fija, rechaza destinos ajenos o repetidos y declara scope targeted/full. Por defecto mantiene cuatro rutas. Esto evita repetir tres rutas intactas por un cambio de portada; la segunda medición no se presenta como cuatro rutas reejecutadas. No cambia presupuestos ni autoriza mediciones remotas.

## Validación y juzgado

968 pruebas generales, 18 dirigidas de contratos/carrusel, lint y tipos correctos (422 archivos, cero errores/advertencias, 18 hints); build88/SEO sin errores/advertencias. Doce escenarios de navegador: cuatro anchos por tres densidades, identidad/caption y preload coherentes, sin overflow; a390 px descarga240/480/720 según densidad1/2/3 y conserva altura192. [Captura móvil inspeccionada](FH12P_HERO_MOVIL_2026-09-08.png). En anchos mayores se conserva la selección previa, incluida la fuente original a densidad3; no se afirma optimización de todas las densidades.

Impeccable orientó la corrección de tamaño declarado sin rediseño; web-perf exigió medición antes/después y límites explícitos. Juzgado propio: producto3/5 local (misma información con menor descarga móvil), técnica3/5 local (presupuesto por medianas y regresiones), datos/editorial3/5 (identidad y limitaciones preservadas), operación2/5 integral (sin CDN/cuentas/usuarios reales).

FH-12 sigue parcial: falta validación del candidato final, entorno online y CWV/INP de campo; INP es null en estas muestras, no TBT renombrado. El candidato FH13G sigue anterior a FH12N/O/P y no se sobrescribió ni publicó. Próximo paso: consolidar la revisión de entrega y un candidato exacto, sin repetir esta matriz salvo cambios que afecten sus rutas o condiciones.
