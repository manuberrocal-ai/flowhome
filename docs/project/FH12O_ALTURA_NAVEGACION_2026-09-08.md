# FH12O — menús accesibles en ventanas de poca altura

Reproducción previa: Products terminaba a 718 px en una ventana de 600 px; el panel móvil a 702 px en una de 390 px, ambos con overflow visible. La cabecera fija podía dejar destinos fuera del área visible.

Se limita la altura de ambos paneles con `calc(100dvh - 5rem)` y se permite desplazamiento vertical interno, sin propagación del exceso al documento. Se conservan tamaño de texto, enlaces, colores y controles; no se reduce contenido para que quepa. Impeccable orientó esta corrección de adaptabilidad y foco.

## Evidencia posterior

- `scripts/qa/navigation-height.cjs`: seis escenarios, 86 pasos de foco comprobados. Escritorio 1024×300, 1280×600, 1440×500; móvil 320×480 y 844×390; escritorio 1024×360 sin JavaScript. En cada paso, el destino de Tab está dentro del panel y de la ventana; último destino alcanzado, scroll interno efectivo y Escape con retorno de foco cuando hay JavaScript.
- Límites inferiores observados: 286,6/586,6/486,6/468/378/346,6 px respectivamente, todos dentro de su ventana. Scroll interno positivo en los seis casos.
- Once escenarios de `desktop-navigation.cjs` repetidos sin regresiones: tres desplegables en tres anchos y dos preferencias de movimiento, cuatro controles móviles y uno sin JavaScript.
- 963 pruebas generales correctas, cuatro pruebas de cabecera incluidas; lint y diff-check correctos. Tipos: 419 archivos, cero errores/advertencias, 18 hints. Build88 y SEO: 88 páginas, cero errores/advertencias.
- [Captura estable, último enlace Hubs enfocado](FH12O_MENU_BAJO_2026-09-08.png), inspeccionada. La primera captura sobre la pestaña de diagnóstico reutilizada no alcanzó su estado esperado y agotó la espera; la captura final usa un contexto nuevo y verifica explícitamente apertura y destino antes de guardar. Las pruebas funcionales también usan contextos nuevos.

## Juzgado propio y límites

Producto 8/10: los destinos largos siguen accesibles sin achicar texto. Técnica 8/10: geometría y recorrido real verificados, incluyendo comportamiento sin scripts en escritorio. Datos/editorial 8/10: contenido y productos intactos. Operación 7/10: evidencia local, no certificación WCAG ni validación con lector de pantalla físico.

1024×300 representa una ventana de contenido pequeña, no una prueba del control de zoom físico del navegador. Sin prueba de dispositivos móviles físicos ni datos de campo. FH-12 sigue parcial. `dist` incluye FH12N y FH12O; el candidato FH13G permanece intacto pero anterior a ambos cambios. Consolidar una nueva carpeta candidata al finalizar la revisión de fuente. Sin publicación ni activación externa.
