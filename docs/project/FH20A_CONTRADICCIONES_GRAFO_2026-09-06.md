# FH20A — contradicciones antes de conectar el grafo

Fecha: 6 de septiembre de 2026. APROBADO LOCAL; FH-20 parcial.

## Hallazgo y corrección

El proveedor público sigue devolviendo null por diseño. Antes de conectarlo se reprodujo un defecto: bestEdgeFor seleccionaba evidencia positiva aunque hubiese un conflicts vigente para el mismo origen/destino/mercado y ledger exacto. La regresión nueva falló con true cuando correspondía false. Esto no demuestra un fallo visible de producción: no hay proveedor real activado.

surfaceableResultsFrom ahora reutiliza detectEdgeContradictions después de validar identidad, alcance, ledger, confianza y vigencia. Excluye positivos contradictorios y conserva avisos de conflicto/dependencia de nube. También impide recomendar un sustituto frente a incompatibilidad vigente con ese destino. No elige una afirmación por mayor rango para resolver la contradicción.

Una consulta por producto no determina el firmware físico del visitante: se conserva unknown ante condiciones opuestas para ese origen/destino/mercado. Conflictos vencidos o suprimidos no invalidan evidencia positiva vigente. Una fila de otra superficie no autoriza el conflicto en esta.

## Verificación

- Fallo inicial reproducido; 42 pruebas dirigidas aprobadas después del cambio.
- Regresiones de producto, quiz, comparación y alternativas; positivo frente a conflicts, local-only frente a cloud-only y conflictos vencidos/suprimidos.
- 766/766 pruebas completas, cero fallos.
- lint, tipos (275 archivos, cero errores/advertencias, 18 hints), build 88 páginas y diff-check aprobados.
- Sin navegador completo nuevo: proveedor aún null, sin cambios de contenido ni configuración pública.
- Sin fuentes nuevas, instalaciones, credenciales, consultas externas, despliegues o activación.

## Pendiente real y juzgado

El proveedor real NO se implementó aquí. La evidencia de identidad/instalación examinada no se convierte automáticamente en compatibilidad por acción/ecosistema, firmware, puente y variante. Preparar registros por afirmación con fuente, validación documental, alcance, vigencia y ledger por superficie antes de conectarlo. No importar fixtures ni declarar hands-on sin prueba física.

Valoración propia: producto 3/5, técnica 4/5 local, datos/editorial 2/5 y operación 2/5. Falta el conjunto real revisado y la activación aprobada. La guía verified-task-brief separó la corrección comprobada de esa integración todavía ausente.

FH-20 pasa a parcial por preparación verificable, no a hecho. Ocho hechas y 24 restantes. El tramo anterior FH21B fue progreso con monitor e incidente; este también cambió comportamiento verificable.
