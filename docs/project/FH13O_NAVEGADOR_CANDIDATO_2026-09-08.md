# FH13O — navegador sobre el candidato limpio FH13N

## Ficha

Problema: la matriz amplia anterior correspondía a dist original; FH13N sólo tenía equivalencia de bytes y prueba breve heredada, no su propia ejecución amplia. Cambio mínimo: ejecutar el runner de navegador existente desde el checkout limpio exacto, sin reconstruir ni editar el candidato. Aceptación: identidad e inventario preservados, matriz completa sin fallos y aislamiento de servicios/navegador del usuario. Validador: runner existente, informe JSON, hashes antes/después y estado Git.

## Identidad y evidencia

- Fuente: `b12a60edcb8b8b729c0d1062117cdae3e0ccc0ab`, en `C:/AGENTES/Proyectos/flowhome-review-fh13n`.
- Los421 archivos de dist coinciden por tamaño/SHA256 con inventarioFH13M antes de iniciar; se verificaron nuevamente sus hashes después. El checkout termina limpio. No se ejecutó build ni instalación nueva.
- Ejecución UTC: `2026-09-08T21:16:26.302Z` a `2026-09-08T21:17:54.431Z`.
- Resultado:134/134 casosPASS;91/91 comprobacionesHTTP;0 errores de preparación y0 de limpieza.
- Informe: `C:/AGENTES/Informes/flowhome/fh13o-browser/report.json`, SHA256 `d1dd307e12096a2645ae5ceae32ec866ae9c8ddc9fab2fd35636a2c17da87cc8`.
- Capturas:133 PNG en esa carpeta; el caso adicional de experimentos es un harness aislado, no una página publicada.

## Cobertura real y límites

El perfil full recorre16 plantillas en siete anchos:320,375,390,768,1024,1280,1440. Añade diez casos de contenido documental en cinco rutas, menú móvil, movimiento reducido, acciones de portada, lista anónima, CTA Amazon, calculadora y contratos locales de consentimiento/experimentos.

Comprueba desbordamientos visibles, controles button/role=button menores de44px, imágenes rotas visibles, JSON-LD, errores de consola, geometría de portada/lista y contratos explícitos. No equivale a auditoría completa de accesibilidad, todos los enlaces táctiles, todas las interacciones por teclado, navegación real de compra ni transmisión real de analítica. Las solicitudes externas del navegador están bloqueadas y los clics comerciales interceptados: no hubo compras ni eventos de producción.

Inspección visual directa de tres capturas: portada1440, catálogo390 y ficha320. No se observaron recortes en esas vistas. No se afirma revisión visual manual de133 capturas ni fidelidad fotográfica de ilustraciones. No se repitió Lighthouse: esta etapa cierra una cobertura de navegador faltante, no una medición de rendimiento.

Se creó preview propio en puerto64295 y navegador headless con perfil temporal propio. El runner terminó con limpieza sin errores; el preview del usuario en4339 seguía escuchando después. No se usó su perfil ni se modificó la PR.

## Juzgado propio

Producto3/5 local: recorridos principales y tamaños ahora comprobados sobre el candidato exacto; captación y conversión no medidas. Técnica3/5 local:134 casos y91HTTP verdes, hashes y checkout preservados; dependencias reutilizadas, no instalación reproducida. Datos/editorial3/5 documental: textos de límites presentes en los casos elegidos, sin certificar pruebas físicas o paquetes. Operación2/5 integral: candidato mejor verificado, pero revisión remota, aprobación de entrega y comprobación online siguen pendientes.

FH-12/FH-13 no se cierran globalmente. PR12 conserva5cc6c95 y no incluye b12a60e. No confundir esta evidencia con aprobación de envío, fusión, despliegue ni inicioD0.
