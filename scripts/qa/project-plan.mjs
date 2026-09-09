import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

export function renderProjectPlan(backlog) {
  assert.equal(backlog.schema_version, 1);
  assert.ok(Array.isArray(backlog.tasks) && backlog.tasks.length > 0);
  const ids = new Set(backlog.tasks.map(task => task.id));
  assert.equal(ids.size, backlog.tasks.length, 'Duplicate task identity');
  for (const task of backlog.tasks) {
    assert.match(task.id, /^FH-\d{2}$/);
    assert.ok(Object.hasOwn(backlog.status_definitions, task.status), 'Unknown status');
    assert.ok(task.depends_on.every(id => ids.has(id) && id !== task.id), 'Unknown or self dependency');
    for (const key of ['title', 'acceptance', 'priority', 'owner_role', 'execution']) assert.ok(typeof task[key] === 'string' && task[key].trim());
  }
  const cell = text => text.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
  const done = backlog.tasks.filter(task => task.status === 'hecho').length;
  const lines = [
    '# FlowHome — plan de trabajo priorizado', '',
    'Vista derivada de [BACKLOG.json](BACKLOG.json). Estados y criterios se editan allí; este plan no mantiene una segunda versión manual.', '',
    `${backlog.tasks.length} tareas: ${done} hechas en su alcance y ${backlog.tasks.length - done} parciales, pendientes, bloqueadas o diferidas. Hecho no significa publicado ni operación real.`, '',
    'Dirección y siguiente acción: [prompt maestro](PROMPT_MAESTRO.md). Valoración y límites: [juzgado integral](JUZGADO_INTEGRAL.md). [Plan anterior preservado](PLAN_DE_TRABAJO_HISTORICO_FH00B_2026-09-08.md).', '',
    '## Estados y dependencias', '',
    '| ID | Prioridad | Trabajo | Estado | Depende de |',
    '|---|---|---|---|---|',
    ...backlog.tasks.map(task => `| ${task.id} | ${task.priority} | ${cell(task.title)} | ${task.status} | ${task.depends_on.join(', ') || '—'} |`), '',
    'Las dependencias ordenan el cierre, no obligan a esperar cuando existe preparación local independiente. Los roles son funciones, no personas ya asignadas. Las evidencias fechadas de cada tarea se conservan en su registro del backlog.', '',
    '## Criterios de cierre', '',
  ];
  for (const task of backlog.tasks) lines.push(
    `### ${task.id} — ${task.title}`, '',
    `Estado: ${task.status}. Responsabilidad: ${task.owner_role}. Ejecución: ${task.execution}.`, '',
    task.acceptance, '',
  );
  return `${lines.join('\n').trimEnd()}\n`;
}

export function verifyProjectPlan(backlog, plan) {
  assert.equal(plan.replace(/\r\n/g, '\n').trimEnd(), renderProjectPlan(backlog).trimEnd(), 'Plan differs from authoritative backlog');
  return { matches: true, tasks: backlog.tasks.length, done: backlog.tasks.filter(task => task.status === 'hecho').length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const backlog = JSON.parse(readFileSync(path.join(root, 'docs/project/BACKLOG.json'), 'utf8'));
  if (process.argv[2] === '--render') process.stdout.write(renderProjectPlan(backlog));
  else console.log(JSON.stringify(verifyProjectPlan(backlog, readFileSync(path.join(root, 'docs/project/PLAN_DE_TRABAJO.md'), 'utf8'))));
}
