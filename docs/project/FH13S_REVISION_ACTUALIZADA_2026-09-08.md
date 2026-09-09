# FH13S — candidato local posterior a la mejora de búsqueda

## Ficha y alcance

FH09AP modificó la experiencia editorial y FH04G amplió su cobertura habitual. FH13R no contiene esos cambios, por lo que se conserva intacto y se prepara un nuevo candidato local revisable, sin enviar ni modificar la PR12.

SHA: `1651f6a44e0ed69565a4fd57c32be5d072586b0b`. Árbol: `a3226140067e5420acae1f69ace86d1941f63a30`. Padre: `ac1ee54cd6930717f5151edebc89f8cc0e8df9d8`. Referencia local: `review/flowhome-local-20260908-fh13s`. Checkout detached del mismo SHA: `C:/AGENTES/Proyectos/flowhome-review-fh13s`.

1.390 archivos versionados y 29 archivos nuevos/modificados respecto a FH13R. Aplicación: búsqueda FH09AP y revalidación comercial FH16U, esta última no montada en la entrega estática. QA: controles de cobertura Lighthouse FH04E/F, búsqueda FH04G y pruebas de cancelación FH16V. El resto son pruebas dirigidas y evidencia documental. No cambian modelos, precios, permisos ni configuración remota.

Se usó un índice temporal independiente para incluir los archivos locales que todavía no están versionados en el checkout original. HEAD original `116e04df648d97cae9d4aae03f190e81109937ab` e índice SHA256 `EC5CB33BB21AF35877F1D19606247884D9E4C21793FDB78AC980E0EFF910CC7D` permanecen iguales. Ningún add/commit se realizó sobre el índice original.

Las dependencias existentes se comparten mediante una junction node_modules: no acredita instalación fresca. No eliminar recursivamente esa junction ni confundirla con dependencias independientes.

## Verificación y límites de autoridad

1.051/1.051 pruebas del candidato correctas. Calidad estructural de las 15 reseñas correcta; enlaces:0 stale/5 unknown, sin acreditar disponibilidad comercial. Registros en `C:/AGENTES/Informes/flowhome/fh13s-validation-20260908`.

Los142 casos de FH04G fueron ejecutados sobre el árbol original en perfil local, **no sobre este candidato production**. No se reutilizan como prueba equivalente ni se cambian los hashes históricos de FH13R. La medición propia de FH13S se registra al terminar.

Navegador propio FH13S completado:142/142 casos,91/91 HTTP y cero errores de preparación/cierre. Informe y141 capturas en `C:/AGENTES/Informes/flowhome/fh13s-browser-20260908`. El checkout permaneció limpio. Medición Lighthouse propia iniciada por separado en `C:/AGENTES/Informes/flowhome/fh13s-lighthouse-20260908`; no se aprueba rendimiento antes de leer su resultado completo.

Lint/tipos/build/diff-check correctos. Tipos:458 archivos,0 errores/0 warnings/20 hints. SEO:88 páginas,0 errores/0 advertencias. [Inventario local](FH13S_CANDIDATO_2026-09-08.json) verificado contra dist:422 archivos,136.797.241 bytes, SHA256 `8d3e75b6c2becdb7a8fd60fa9722215908f7c69624349bac85de2aedb9851d93`. Perfil production, auth=false, analytics=false, supabaseProjectRef=null. Publishable=false: no es un manifiesto de release autorizado.

FH13S no está autorizado para push, PR, fusión o publicación. La pregunta pendiente sobre FH13R nombra otro SHA y no autoriza este nuevo candidato. Antes de entregar se requiere revisión externa, aprobación concreta y cadena protegida con destino y recuperación comprobados.

## Rendimiento propio y juzgado final

Lighthouse completo:4 rutas×3 muestras, cero incumplimientos y tres avisos de limpieza después de informes completos (producto muestra3; reseña muestras1/3). No se borraron ni se ocultaron esos resultados. Medianas rendimiento:home96, producto98, reseña98, comparativa99; accesibilidad/buenas prácticas/SEO100 en las cuatro. LCP:2420,799/2262,630/2263,019/2113,044 ms respectivamente. CLS0; TBT0 excepto producto3,343 ms. INP=null. Las doce muestras pasaron el lector de cobertura completa. No son mediciones de usuarios ni prueba online. La portada mantiene sólo unos79 ms de margen frente al límite LCP.

Se inspeccionó la captura search-320 del candidato: contenido y controles legibles, sin desbordamiento; no es inspección humana exhaustiva de141 capturas. Navegador/preview propios finalizaron y checkout limpio verificado.

APROBADO LOCAL para preservación, identidad, compilación, navegador y rendimiento del candidato. Producto3/5 local, técnica3/5 local, datos/editorial3/5 local, operación2/5 integral. Un solo agente. FH-13 continúa pendiente de revisión y aprobación externas/cadena de entrega; no se activan servicios, horarios ni producción.
