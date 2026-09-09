# FH13AA — favicon PNG transparente

Pedido del propietario: utilizar PNG, sin marco blanco.

Se reutiliza sin editar `public/images/flowhome-favicon.png`, el símbolo original
navy/azul/teal. BaseLayout y el manifiesto dejan de seleccionar el SVG con placa
blanca. El manifiesto declara las dimensiones reales (790 × 716), no los tamaños
incorrectos sugeridos por otros nombres de archivo existentes. No se regenera la
marca ni se instala una dependencia. El icono Apple touch conserva su contrato
separado, opaco y cuadrado; no es el favicon de pestaña.

Verificación local: 1.061 pruebas aprobadas; lint y diff-check correctos;
464 archivos comprobados por Astro, cero errores/advertencias y 20 hints previos;
build de 88 páginas y SEO sin errores ni advertencias. La nueva regresión verifica
PNG, alfa, fondo transparente, ausencia de píxeles blancos opacos y referencias
coherentes en HTML/manifiesto. Imagen de 85.118 bytes, sin modificación binaria.

Revisión visual del archivo original y representación en navegador a 16, 32 y
96 píxeles sobre fondos claro y oscuro: sin placa ni marco blanco. El trazo navy
tiene menor contraste sobre fondo oscuro; se conserva el color canónico, sin
introducir un borde blanco para compensarlo. Evidencia local:
`C:/AGENTES/Informes/flowhome/favicon-png-light-dark.png`.

El control local de despliegue informa que las credenciales Cloudflare no están
en este entorno; la publicación usa el workflow protegido y sus secretos, no
credenciales copiadas al equipo. Este registro documenta la validación local;
la confirmación de publicación se registra separadamente después del despliegue.
