/**
 * The monitor's model (cairn 0151): a machine as plain data, and one step of
 * a seeded simulator over it. Pure, and the seed is part of the model, so the
 * first frame is the same on the server and in the browser, the text snapshot
 * is a fixture, and a test can step it and know what it will see.
 */
export type ProcState = 'running' | 'sleeping' | 'idle';

export interface Proc {
  readonly pid: number;
  readonly name: string;
  /** Percent of one core. */
  readonly cpu: number;
  /** Resident memory, in MiB. */
  readonly mem: number;
  /** CPU time, in seconds. */
  readonly time: number;
  readonly state: ProcState;
  /** Where its load sits when nothing is happening to it. */
  readonly base: number;
}

export interface Machine {
  readonly step: number;
  /** The next value of the generator: the model carries its own seed. */
  readonly seed: number;
  /** Each core's use, in percent. */
  readonly cores: readonly number[];
  /** Memory, in GiB. */
  readonly memory: {
    readonly used: number;
    readonly cache: number;
    readonly swap: number;
    readonly total: number;
    readonly swapTotal: number;
  };
  /** The load averages' recent history, oldest first: 1, 5 and 15 minutes. */
  readonly load: readonly [readonly number[], readonly number[], readonly number[]];
  readonly procs: readonly Proc[];
}

/** How many samples of load a sparkline keeps. */
export const HISTORY = 24;

/** mulberry32: one step of a small, seedable generator, as a pure function. */
function next(seed: number): [number, number] {
  const s = (seed + 0x6d2b79f5) >>> 0;
  let t = s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, s];
}

/** A run of draws from a seed: `draw()` is in [0, 1), and `seed` is where it got to. */
function generator(seed: number): { draw: () => number; readonly seed: () => number } {
  let at = seed;
  return {
    draw: () => {
      const [value, after] = next(at);
      at = after;
      return value;
    },
    seed: () => at,
  };
}

const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n));
const round1 = (n: number): number => Math.round(n * 10) / 10;

const NAMES: readonly (readonly [string, number, number])[] = [
  // name, base load (% of a core), memory (MiB)
  ['node', 38, 412],
  ['postgres', 12, 1126],
  ['chrome', 9, 860],
  ['kernel_task', 7, 24],
  ['WindowServer', 6, 310],
  ['nginx', 4, 48],
  ['redis-server', 3, 96],
  ['rockaway-dev', 3, 240],
  ['esbuild', 2, 88],
  ['postgres: wal', 2, 64],
  ['launchd', 1, 18],
  ['sshd', 1, 12],
  ['zsh', 1, 9],
  ['tmux', 1, 14],
  ['vim', 1, 36],
  ['git', 0, 22],
  ['cron', 0, 6],
  ['syslogd', 0, 8],
  ['mds_stores', 2, 140],
  ['coreaudiod', 1, 20],
  ['bluetoothd', 0, 11],
  ['Dock', 0, 64],
  ['Finder', 0, 90],
  ['Terminal', 1, 120],
  ['containerd', 1, 54],
  ['dockerd', 2, 180],
  ['prometheus', 3, 290],
  ['grafana', 1, 160],
  ['vector', 1, 70],
  ['cloudflared', 0, 32],
  ['tailscaled', 0, 40],
  ['ollama', 4, 2048],
  ['python3', 2, 210],
  ['ruby', 0, 80],
  ['java', 5, 1536],
  ['go', 0, 60],
  ['cargo', 0, 140],
  ['rust-analyzer', 3, 620],
  ['tsserver', 2, 480],
  ['biome', 0, 44],
  ['spotlightd', 0, 26],
  ['ntpd', 0, 4],
];

/** The machine as it is when the monitor opens. */
export function boot(seed = 0x5eed): Machine {
  const rng = generator(seed);
  const procs = NAMES.map(([name, base, mem], i): Proc => {
    const cpu = round1(clamp(base + (rng.draw() - 0.5) * base, 0, 100));
    return {
      pid: 4100 + i * 37 + Math.floor(rng.draw() * 30),
      name,
      cpu,
      mem,
      time: Math.floor(rng.draw() * (base + 1) * 3600),
      state: stateOf(cpu),
      base,
    };
  });
  const cores = [62, 23, 99, 41];
  const one: number[] = [];
  const five: number[] = [];
  const fifteen: number[] = [];
  let l1 = 2.1;
  let l5 = 1.9;
  let l15 = 1.6;
  for (let i = 0; i < HISTORY; i++) {
    l1 = clamp(l1 + (rng.draw() - 0.48) * 0.6, 0.2, 4);
    l5 += (l1 - l5) * 0.2;
    l15 += (l5 - l15) * 0.07;
    one.push(round2(l1));
    five.push(round2(l5));
    fifteen.push(round2(l15));
  }
  return {
    step: 0,
    seed: rng.seed(),
    cores,
    memory: { used: 11.2, cache: 3.1, swap: 0.1, total: 16, swapTotal: 2 },
    load: [one, five, fifteen],
    procs,
  };
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

function stateOf(cpu: number): ProcState {
  if (cpu >= 5) return 'running';
  return cpu > 0.4 ? 'sleeping' : 'idle';
}

const push = (series: readonly number[], value: number): number[] => [
  ...series.slice(1 - HISTORY),
  round2(value),
];

/** One tick: every value moves a little, in place. Nothing is added or taken away. */
export function advance(m: Machine): Machine {
  const rng = generator(m.seed);
  const cores = m.cores.map((c, i) =>
    Math.round(clamp(c + (rng.draw() - (i === 2 ? 0.35 : 0.5)) * 24, 2, 100)),
  );
  const procs = m.procs.map((p): Proc => {
    const cpu = round1(
      clamp(p.cpu + (p.base - p.cpu) * 0.3 + (rng.draw() - 0.5) * (p.base + 1), 0, 100),
    );
    return { ...p, cpu, time: p.time + Math.round(cpu / 100), state: stateOf(cpu) };
  });
  const used = round1(clamp(m.memory.used + (rng.draw() - 0.5) * 0.4, 9, 14.5));
  const cache = round1(clamp(m.memory.cache + (rng.draw() - 0.5) * 0.2, 2, 4));
  const busy = cores.reduce((a, b) => a + b, 0) / 100;
  const [one, five, fifteen] = m.load;
  const l1 = (one.at(-1) ?? 0) * 0.7 + busy * 0.3 * (0.5 + rng.draw());
  const l5 = (five.at(-1) ?? 0) + (l1 - (five.at(-1) ?? 0)) * 0.2;
  const l15 = (fifteen.at(-1) ?? 0) + (l5 - (fifteen.at(-1) ?? 0)) * 0.07;
  return {
    step: m.step + 1,
    seed: rng.seed(),
    cores,
    memory: { ...m.memory, used, cache },
    load: [push(one, l1), push(five, l5), push(fifteen, l15)],
    procs,
  };
}

/** Kill processes: they are gone at once, which a real one is not, quite. */
export function kill(m: Machine, pids: ReadonlySet<number>): Machine {
  return { ...m, procs: m.procs.filter((p) => !pids.has(p.pid)) };
}

export type SortColumn = 'pid' | 'name' | 'cpu' | 'mem' | 'time' | 'state';
export type SortDirection = 'ascending' | 'descending';

/**
 * The order of the processes, as pids, sorted now. The table keeps this order
 * as the values change under it, so no row moves while it is read; a sort is
 * a thing asked for, not a thing that happens.
 */
export function sortOrder(
  procs: readonly Proc[],
  column: SortColumn,
  direction: SortDirection,
): number[] {
  const sign = direction === 'ascending' ? 1 : -1;
  return [...procs]
    .sort((a, b) => {
      const x = a[column];
      const y = b[column];
      const by =
        typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y));
      return sign * by || a.pid - b.pid;
    })
    .map((p) => p.pid);
}

/** Memory as top writes it: `412M`, `1.1G`. */
export function formatMem(mib: number): string {
  return mib < 1024 ? `${Math.round(mib)}M` : `${(mib / 1024).toFixed(1)}G`;
}

/** CPU time as `h:mm:ss`. */
export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** The average of the cores, for the one meter a narrow screen has room for. */
export function cpuTotal(m: Machine): number {
  return Math.round(m.cores.reduce((a, b) => a + b, 0) / m.cores.length);
}
