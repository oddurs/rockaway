'use client';

/** The shell's toolbar, made live when the browser is idle or the reader reaches for it. */
import { deferred } from '../Deferred.tsx';

export const ToolbarPart = deferred(
  () => import('./ShellToolbar.tsx').then((module) => module.ShellToolbar),
  'idle',
);
