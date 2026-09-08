import { appendFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function scheduleSlot(now, timezone, runTime) {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(runTime)) throw new Error('DAILY_RUN_TIME must be HH:mm');
  const formatter = new Intl.DateTimeFormat('en-US', { timeZone: timezone, hourCycle: 'h23', hour: '2-digit', minute: '2-digit', weekday: 'short' });
  const parts = formatter.formatToParts(now);
  const get = (name) => parts.find((part) => part.type === name)?.value;
  const minute = Number(get('hour')) * 60 + Number(get('minute'));
  const [hour, minutes] = runTime.split(':').map(Number);
  const delta = minute - (hour * 60 + minutes);
  return { due: delta >= 0 && delta < 15, weekly: get('weekday') === 'Mon' };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const manual = process.env.GITHUB_EVENT_NAME === 'workflow_dispatch';
  const timezone = process.env.FLOWHOME_TIMEZONE || 'America/Argentina/Buenos_Aires';
  const runTime = process.env.DAILY_RUN_TIME || '10:07';
  const slot = scheduleSlot(new Date(), timezone, runTime);
  const scheduled = process.env.GITHUB_EVENT_NAME === 'schedule';
  if (scheduled) {
    const workflow = await readFile(new URL('../.github/workflows/automation.yml', import.meta.url), 'utf8');
    const [hour, minute] = runTime.split(':').map(Number);
    if (!workflow.includes(`cron: '${minute} ${hour} * * *'`) || !workflow.includes(`timezone: '${timezone}'`)) throw new Error('Schedule mismatch: update workflow cron/timezone and DAILY_RUN_TIME/FLOWHOME_TIMEZONE together.');
  }
  // A delayed scheduled run is still due; never discard it for missing a slot.
  const due = process.env.FLOWHOME_DAILY_KILL_SWITCH !== 'true' && (manual || scheduled || slot.due);
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `due=${due}\nweekly=${slot.weekly}\n`);
  console.log(JSON.stringify({ due, weekly: slot.weekly, publication: 'disabled' }));
}
