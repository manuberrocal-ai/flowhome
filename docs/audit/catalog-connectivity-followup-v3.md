# FlowHome V3 — ampliación documental de conectividad

Fecha: 2026-09-04. Continuación local del objetivo, sin acceso API, publicación ni cambios de cuenta. El ciclo previo produjo evidencia válida; esta ampliación corrige tres contradicciones que podían resolverse sin credenciales.

## Correcciones y evidencia

| Ficha | Antes | Corrección documental | Límite |
|---|---|---|---|
| Echo Dot 5th Gen | `matter: false` | `true`; rol de controlador Alexa y requisito de router Thread separado. [Amazon](https://developer.amazon.com/docs/alexaplus/smarthome/matter-support.html). | No equivale a accesorio universal; no emparejamiento real comprobado. |
| Google Nest Hub 2nd Gen | `matter: false` | `true`; controlador Wi-Fi/Thread, router de borde integrado, requisitos de software/red. [Google](https://support.google.com/googlehome/answer/12391458?hl=en). | Tipos y funciones varían; no se verificó una instalación ni todos los servicios. |
| SwitchBot Blind Tilt | `wifi: true` | `false` para la unidad Bluetooth. Condiciones visibles de hub para control remoto y de bridge para Matter/Apple Home. [SwitchBot US](https://us.switch-bot.com/products/switchbot-hub-2), [configuración Alexa](https://support.switch-bot.com/hc/en-us/articles/13918769034519-SwitchBot-Blind-Tilt-Alexa-Setup-Guide), [matriz Matter](https://support.switch-bot.com/hc/en-us/articles/38979658026519-SwitchBot-Device-Matter-Compatibility). | La conectividad del hub no se atribuye al dispositivo; contenido del paquete y acciones concretas pendientes. |

Se reconciliaron las dos reviews existentes con estas condiciones. Se conservaron rutas, marca, valores comerciales históricos y fechas de precio/rating. Sólo `dateUpdated` de las tres fichas refleja esta corrección; las fechas editoriales y la ausencia de revisión humana permanecen intactas. Las fuentes documentales del contenido pasan a 26 URL distintas en artículos y 28 incluyendo productos.

## Verificación

Tres regresiones fallaron antes del cambio, reproduciendo datos incorrectos y ausencia de condiciones en reviews. Después pasaron las tres y una cuarta comprueba cobertura de las cinco rutas en móvil/desktop. La suite dirigida que incluye especificaciones, quiz, comparaciones y copy pasó 29/29 antes de incorporar la cuarta prueba de cobertura. La revisión visual posterior detectó que los indicadores Matter/Apple Home de Blind Tilt todavía negaban el camino mediante bridge documentado en la nota: se alinearon a `true` y se añadieron aserciones de coherencia en especificaciones y texto renderizado. Estos indicadores incluyen el camino condicionado, no una radio nativa ni un hub incluido.

El navegador incorpora diez casos adicionales: cada una de las tres fichas y las dos reviews a 390 y 1440 píxeles. Comprueba que los términos documentales estén en el texto renderizado, desplaza la condición al área visible, exige que quepa y captura el resultado. También aplica los controles compartidos de errores, imágenes, desbordamiento y acciones.

El auditor determinista recorrió 110 archivos (15 Markdown y 95 HTML), con los mismos 177 candidatos `missing-alt` de avatares decorativos ya evaluados en `publication-copy-v3.md`; no detectó otros candidatos. No sustituye la auditoría semántica y no entiende el YAML, por lo que las regresiones específicas leen también las fichas originales.

El ciclo completo final terminó a las 05:24:11 UTC: 597/597 pruebas, 134/134 casos de navegador, lint/tipos/build/SEO/Lighthouse aprobados. La repetición devolvió `reused`. Huella: `1f3e875439b3cff4fc2909f028900c9afa22bce4d188dbd39acff387905cd163`. Resultados completos en `flowhome-after-v3.md` y el manifiesto diario vigente. La evidencia anterior de 593 pruebas/124 casos corresponde a la revisión previa, no a esta ampliación.

## Lo que sigue sin probarse

La documentación del modelo no valida por sí sola el ASIN, la variante, el contenido de un paquete ni una unidad instalada. Tampoco valida precios, disponibilidad, historial, servicios contratados o todos los booleanos del catálogo. Los 28 perfiles conservan revisión pendiente de esos aspectos; no se declara completo el catálogo ni se autoriza publicación.

La skill `publication-copy-auditor` exigió reconciliar la ficha, la review y la superficie renderizada; `verified-task-brief` mantuvo separados el hecho documental, la regresión de software y la prueba física no realizada.
