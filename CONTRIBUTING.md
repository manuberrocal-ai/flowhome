# Contribuir a FlowHome

## Antes de empezar

- Abre o referencia un issue para cambios grandes, nuevos flujos de datos o decisiones difíciles de revertir.
- No incluyas secretos ni datos personales en commits, capturas o fixtures.
- Conserva el alcance del pull request pequeño y describe cualquier migración, cambio de contenido o efecto operativo.

## Preparación y controles

```bash
npm install
npm run diff-check
npm run lint
npm run typecheck
npm test
npm run build
```

Ejecuta además los controles de contenido, enlaces, SEO, navegador o Lighthouse cuando el cambio los afecte.

## Pull requests

- Explica problema, solución y riesgos.
- Incluye evidencia de pruebas y capturas para cambios visuales.
- Señala variables, migraciones, secretos, tareas posteriores y plan de rollback.
- No mezcles refactors no relacionados.
- No despliegues ni publiques índices como parte de la validación del PR.
