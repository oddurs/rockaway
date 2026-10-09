/**
 * The landing page's product shots (cairn 0108), as data both halves read:
 * the server renders the shots from it, and the page's script fits their
 * status bars from it, as the shell does its own (src/lib/shell.ts).
 */

/** The git client's status bar, in order: `StatusSegment` gives each its priority and side. */
export const GIT_STATUS = [
  { name: 'mode', priority: 4 },
  { name: 'branch', priority: 3 },
  { name: 'keys', priority: 1, align: 'end' },
  { name: 'changes', priority: 2, align: 'end' },
] as const;

/** The deploys table, as the shot shows it: real rows for a real component. */
export const DEPLOYS = [
  { id: 'api', service: 'api', status: 'live', age: '2m' },
  { id: 'web', service: 'web', status: 'live', age: '5m' },
  { id: 'worker', service: 'worker', status: 'failed', age: '1h' },
  { id: 'docs', service: 'docs', status: 'building', age: 'now' },
] as const;
