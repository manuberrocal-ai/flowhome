# Ruleset recomendado para `main`

Configurar desde GitHub después de integrar los archivos del kit:

- impedir borrado y actualización forzada de `main`;
- exigir pull request antes de fusionar;
- exigir al menos una aprobación y resolver conversaciones;
- descartar aprobaciones obsoletas cuando cambie el código;
- exigir que la rama esté actualizada antes de fusionar;
- exigir los checks reales de lint, tipos, pruebas y build una vez que sus nombres sean estables;
- bloquear fusión si hay conflictos;
- limitar excepciones al propietario y usarlas solo para incidentes documentados;
- exigir revisión de `CODEOWNERS` para `supabase/`, `.github/` y `scripts/deploy/` si existe más de un mantenedor.

Activar también Dependabot alerts, dependency graph, secret scanning, push protection y code scanning cuando estén disponibles para el repositorio.
