# FH12N — navegación de escritorio y foco

## Hallazgo y cambio

Reproducido sobre la vista local a 1440 px: Escape dejaba visible el desplegable Products y su enlace no exponía aria-expanded. El CSS abría por focus-within sin un estado de cierre. La corrección conserva marca, enlaces, navegación con Enter y apertura con puntero; añade estado sincronizado, aria-controls, Escape con retorno de foco, inert al cerrar y acceso opcional con Flecha abajo. Se retiran roles de menú de aplicación: son enlaces de navegación ordinarios con Tab, no un widget con selección de comandos.

La primera prueba de navegador detectó una carrera entre visibilidad animada y foco. Se retiró el retraso de visibility; permanecen las transiciones de opacidad/transformación y la alternativa de movimiento reducido. Las reglas CSS sin mejora JavaScript conservan acceso por foco/hover. No se modificaron contenido comercial, imágenes ni el comportamiento móvil previo.

## Evidencia

- `scripts/qa/desktop-navigation.cjs`: once escenarios correctos. Seis combinaciones de 1024/1280/1440 y movimiento reducido/normal, cada una con los tres desplegables: Tab, Escape, retorno de foco, exclusión del cerrado, Flecha abajo, hover/salida y Enter hacia Products. Sin overflow en la página de destino; cero pageerrors y respuestas HTTP >=400 durante esos seis flujos.
- Cuatro controles móviles a 320/375/390/768: Tab evita submenú cerrado; Escape cierra el panel y devuelve el foco. Un control a 1440 sin JavaScript permite alcanzar los enlaces del desplegable.
- [Captura con foco visible](FH12N_MENU_ESCRITORIO_2026-09-08.png), inspeccionada después de finalizar la transición: conserva el panel azul oscuro y el contorno de foco. La captura inicial intermedia se reemplazó por el estado estable.
- 962 pruebas generales, lint general y tipos correctos: 418 archivos, 0 errores/advertencias, 18 hints. Tras el último ajuste exclusivamente CSS: build de 88 páginas, SEO 0 errores/advertencias, lint afectado, tres pruebas de cabecera y once escenarios de navegador correctos. No se afirma una segunda suite completa después del ajuste CSS.
- La pestaña de diagnóstico que permanecía abierta durante un build registró dos 404 de imágenes; los flujos nuevos posteriores no los reprodujeron. No se interpreta ese registro anterior como un fallo persistente ni como prueba de rendimiento.

## Alcance y juzgado propio

Impeccable orientó la corrección de estado, foco y movimiento conservando la identidad visual. Producto 8/10: navegación más controlable sin perder rutas. Técnica 8/10: comportamiento real probado, no sólo inspección de etiquetas. Datos/editorial 8/10: contenido e ilustraciones intactos, sin nuevas afirmaciones. Operación 7/10: verificaciones locales, sin lector de pantalla físico, certificación WCAG, datos de campo ni publicación.

La vista local `dist` ahora incluye FH12N. El candidato aislado FH13G se conserva intacto pero **no incluye esta corrección**; debe reconstruirse en una carpeta nueva antes de proponer el release definitivo. FH-12 sigue parcial por comprobación en producción y medición de campo. No se concede acceso ni se activa ninguna integración.
