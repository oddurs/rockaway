'use client';

/**
 * Home's live parts (cairn 0108), each loaded as it nears the view: the
 * three product shots and what the ten lines draw. The server renders them
 * all, so the page is whole in its first frame; their script waits.
 */
import { deferred } from './Deferred.tsx';

export const GitClientShot = deferred(() => import('./Shots.tsx').then((m) => m.GitClient));
export const SettingsShot = deferred(() => import('./Shots.tsx').then((m) => m.Settings));
export const DeploysShot = deferred(() => import('./Shots.tsx').then((m) => m.Deploys));
export const HelloScreen = deferred(() => import('./Hello.tsx').then((m) => m.Hello));
export const InstallScreen = deferred(() => import('./Hello.tsx').then((m) => m.Install));
