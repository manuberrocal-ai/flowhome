# FH13A — ficha de decisión de la entrega editorial A

Fecha: 6 de septiembre de 2026. **NO LISTO PARA PUBLICAR.** Preparación de entrega, no autorización ni publicación.

## Qué entrega se propone

Sitio editorial US en inglés con 28 fichas, 15 reviews, ocho guías, comparativas, quiz, calculadora y guardado anónimo. Conservar marca, rutas y compra directa en Amazon. Sin precios, ratings o disponibilidad comercial no verificados; sin promesas de acceso a cuenta o medición que estén desactivados.

La entrega A no necesita activar Amazon, una cola remota, revisión humana remota ni Supabase para ofrecer guardado anónimo. Estas integraciones pertenecen a B o a una habilitación posterior. Que FH-03 siga parcial por acceso a Supabase no impide preparar A con cuenta apagada; no equivale a cerrar FH-03.

## Estado exacto inspeccionado

- Base Git: 116e04df648d97cae9d4aae03f190e81109937ab. NO identifica los cambios locales ni los bytes de producción.
- Árbol: 170 entradas de cambios seguidos y 83 entradas no seguidas en git status --porcelain (una entrada puede representar una carpeta). No es un recuento de todos los archivos.
- Inventario local: 160 archivos estáticos, SHA-256 del inventario ordenado ada28afb9758dcb799b95bf5d840309c881f0b23cd1517794d0ea381593cc9b2.
- Inventario adjunto: FH13A_INVENTARIO_LOCAL_2026-09-06.json. Solo lectura del dist existente; no se creó ni selló un manifiesto de release.
- release-environment.json declara local, cuenta false, analítica false y proyecto Supabase null.
- Los verificadores reales verifyCheckout y verifyProductionEnvironment rechazan respectivamente el árbol actual y el entorno local. No se relajó ninguno para fabricar un candidato.
- No se inspeccionó otra vez producción ni se usó un despliegue histórico como rollback vigente. Destino de recuperación: NO VERIFICADO.

El inventario permite detectar cambios en este dist; no conserva por sí mismo todos sus bytes, no prueba que derive de un commit limpio y no será autoridad para una publicación futura.

## Condiciones para pedir publicación

| Condición | Evidencia disponible | Falta y responsable |
|---|---|---|
| Contenido y modelos | FH-07 documental y FH-08 local cerrados; desconocidos explícitos | Conservar estos límites al publicar; no tratarlos como pruebas físicas |
| Imágenes | FH09A: 28 recursos decodificados, identidad y permisos no acreditados para el conjunto | Propietario: ubicar permisos por recurso o elegir sustitución por ilustraciones admitidas; no descargar/transformar originales sin permiso |
| Interacción/SEO local | FH12B y FH17E: 134 controles completos; FH17F: build 88 páginas | Repetir por impacto sobre el candidato exacto tras cualquier cambio visual |
| Calidad de código | FH17F: 755 pruebas, lint/tipos/build/diff aprobados | CI del commit final; no atribuir sus resultados a un futuro commit distinto |
| Dependencias | FH23: revisión local y auditoría fechada; lock conservado | Auditoría en CI del candidato; no fusionar actualizaciones diferidas automáticamente |
| Entorno A | Configuración explícita soporta production sin cuenta/analítica | Construir y revisar candidato production; dist actual es local |
| Fuente exacta | Base Git conocida, cambios conservados | Preparar/revisar commit por el proceso del repositorio; no aprobar un SHA base como si contuviera estos cambios |
| Destino y recuperación | Procedimiento Pages preparado | Acceso autorizado: confirmar dominio/proyecto y deployment ID actual y aceptable para recuperar |
| Autorización | Encargo autoriza mejoras/pruebas locales | Propietario aprueba cambios exactos, destino, limitaciones y rollback antes de publicación |
| Verificación externa | Protocolo de smoke previsto | Tras publicación autorizada: URL/SHA real, compra anónima, guardado, rutas, cabeceras; iniciar D0 |

## Orden de ejecución propuesto

1. Resolver imágenes sin ampliar permisos por inferencia. Cambiar a ilustraciones es una decisión visible de producto, todavía no ejecutada.
2. Congelar el alcance A: cuenta y analítica apagadas mientras no exista verificación y aprobación específica. La medición D0 será inicialmente técnica/editorial; no inventar conversiones.
3. Revisar y preparar fuente exacta. Construir production, ejecutar los controles y crear el manifiesto mediante el flujo existente que exige checkout limpio.
4. Con acceso autorizado, inspeccionar destino y recuperación; presentar la solicitud final con SHA e identificadores reales. Esta ficha no es esa solicitud final.
5. Publicar únicamente tras aprobación específica. Mantener notificaciones vacías salvo autorización de envío.
6. Verificar producción y registrar D0. Si falla el registro, inspeccionar antes de reintentar; no hacer rollback automático.

## Juzgado

Valoración propia, no revisores independientes. Producto 3/5: alcance A útil y definido; imágenes pendientes. Técnica 4/5 local: controles e integridad preparados, sin ejecución remota comprobada. Datos/editorial 3/5: contenido revisado con desconocidos, derechos visuales aún abiertos. Operación 2/5: sin versión final, destino/rollback vigente ni aprobación.

La guía verified-task-brief obligó a distinguir el inventario de revisión del manifiesto publicable y a comprobar los verificadores existentes. Criterios externos permanecen NO VERIFICADO.

FH-13 sigue pendiente_aprobacion; ocho tareas hechas y 24 restantes. El tramo anterior FH17F fue progreso: cambió código y obtuvo evidencia de validación. Este tramo prepara la decisión de entrega A, sin repetir pruebas completas ni habilitar servicios.
