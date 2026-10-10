import { measureCell, useReducedMotion, useTick } from '@rockaway/react';
import { Button } from '@rockaway/react/button';
import { Dialog } from '@rockaway/react/dialog';
import { KeyHint } from '@rockaway/react/key-hint';
import { Keymap, KeymapHelp, useKeymap } from '@rockaway/react/keymap';
import { Meter } from '@rockaway/react/meter';
import { Pane, Panes } from '@rockaway/react/panes';
import { Sparkline } from '@rockaway/react/sparkline';
import { Spinner } from '@rockaway/react/spinner';
import { StatusBar, StatusMessage, StatusSegment } from '@rockaway/react/status-bar';
import { Cell, Column, Row, Table, TableBody, TableHeader } from '@rockaway/react/table';
import { TextField } from '@rockaway/react/text-field';
import { type ReactNode, type RefObject, useEffect, useRef, useState } from 'react';
import {
  advance,
  boot,
  cpuTotal,
  formatMem,
  formatTime,
  kill,
  type Machine,
  type Proc,
  type SortColumn,
  type SortDirection,
  sortOrder,
} from './top-data.ts';

/** Under this many cells across, one meter of each, and three columns. */
const NARROW = 60;

/** The columns `<` and `>` step through, in the order they stand. */
const COLUMNS: readonly SortColumn[] = ['pid', 'name', 'cpu', 'mem', 'time', 'state'];

export interface SystemMonitorProps {
  /** The machine to watch; a seeded simulation by default. */
  readonly machine?: Machine;
  /** Rows the whole monitor takes, status bar included. */
  readonly rows?: number;
}

/** How many cells across the element is, as the cell it is set in measures. */
function useCols(ref: RefObject<HTMLElement | null>): number {
  const [cols, setCols] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => setCols(Math.floor(el.clientWidth / measureCell(el).width));
    read();
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return cols;
}

/** The simulation the monitor opens on: seeded, so the server and the browser agree. */
const BOOT = boot();

/**
 * A system monitor (cairn 0151): the cores, memory and load at the top, the
 * processes under them, and the keys in the status bar, all on a tick.
 *
 * Values change in place: the table keeps the order it was sorted in until a
 * sort is asked for again, so no row moves under the cursor. It shows as many
 * processes as fit, the way top does. It reads the machine on the refresh
 * tick: every second, and under reduced motion every five, because current
 * numbers are not motion; only the spinner stops. `p` pauses it, and `r`
 * takes one step.
 *
 * It watches a seeded simulation, so it is a fixture as much as an example;
 * copied in, `machine` and what a kill does are yours.
 */
export function SystemMonitor({
  machine: initial = BOOT,
  rows = 36,
}: SystemMonitorProps): ReactNode {
  const [machine, setMachine] = useState(initial);
  const [paused, setPaused] = useState(false);
  const [sort, setSort] = useState<{ column: SortColumn; direction: SortDirection }>({
    column: 'cpu',
    direction: 'descending',
  });
  const [order, setOrder] = useState(() => sortOrder(initial.procs, 'cpu', 'descending'));
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set());
  const [cursor, setCursor] = useState<number | null>(null);
  const [asking, setAsking] = useState<'kill' | 'details' | 'help' | null>(null);
  const [message, setMessage] = useState({ id: 0, text: '' });
  const box = useRef<HTMLDivElement>(null);
  const filterBox = useRef<HTMLDivElement>(null);
  const cols = useCols(box);
  const narrow = cols > 0 && cols < NARROW;
  const reduced = useReducedMotion();
  const say = (text: string) => setMessage((m) => ({ id: m.id + 1, text }));

  // A step on each refresh: data, not motion, so it keeps coming, slower,
  // under reduced motion.
  const frame = useTick('refresh');
  useEffect(() => {
    if (!paused && frame > 0) setMachine(advance);
  }, [frame, paused]);

  const resort = (column: SortColumn, direction: SortDirection) => {
    setSort({ column, direction });
    setOrder(sortOrder(machine.procs, column, direction));
  };

  const byPid = new Map(machine.procs.map((p) => [p.pid, p]));
  const needle = filter.trim().toLowerCase();
  const listed = order
    .map((pid) => byPid.get(pid))
    .filter((p): p is Proc => p !== undefined)
    .filter(
      (p) =>
        needle === '' || p.name.toLowerCase().includes(needle) || String(p.pid).startsWith(needle),
    );
  // As many as fit, as top shows them: the rows, less the status bar, the
  // panes over the table and their rule, the filter, and the table's frame and header.
  const top = (narrow ? 3 : machine.cores.length) + 1;
  const room = Math.max(1, rows - 1 - top - 8);
  const shown = listed.slice(0, room);
  const current = cursor === null ? undefined : byPid.get(cursor);
  const targets =
    selected.size > 0 ? machine.procs.filter((p) => selected.has(p.pid)) : current ? [current] : [];

  const askKill = () => {
    if (targets.length === 0) return say('Nothing to kill: move to a process, or select some');
    setAsking('kill');
  };
  const stepSort = (by: 1 | -1) => {
    const at = COLUMNS.indexOf(sort.column);
    const column = COLUMNS[(at + by + COLUMNS.length) % COLUMNS.length] ?? 'cpu';
    resort(column, column === 'name' || column === 'pid' ? 'ascending' : 'descending');
  };

  // A kill took the rows with focus away: once the dialog is gone, focus goes to the first row left.
  const refocus = useRef(false);
  useEffect(() => {
    if (asking !== null || !refocus.current) return;
    refocus.current = false;
    box.current?.querySelector<HTMLElement>('[role="row"][data-key]')?.focus();
  }, [asking]);

  const bindings = (
    <Bindings
      onKill={askKill}
      onFilter={() => filterBox.current?.querySelector('input')?.focus()}
      onSort={() => {
        resort(sort.column, sort.direction);
        say(`Sorted by ${sort.column}`);
      }}
      onPrev={() => stepSort(-1)}
      onNext={() => stepSort(1)}
      onPause={() => {
        setPaused((p) => !p);
        say(paused ? 'Live' : 'Paused');
      }}
      onStep={() => setMachine(advance)}
      onHelp={() => setAsking('help')}
    />
  );

  const meters = narrow ? (
    <>
      <Meter
        label="cpu "
        value={cpuTotal(machine)}
        warning={70}
        danger={90}
        cols={Math.max(8, cols - 15)}
        valueLabel={pct(cpuTotal(machine))}
      />
      <Meter
        label="used"
        aria-label="Memory used"
        value={machine.memory.used}
        maxValue={machine.memory.total}
        warning={machine.memory.total * 0.75}
        danger={machine.memory.total * 0.9}
        cols={Math.max(8, cols - 16)}
        valueLabel={gib(machine.memory.used)}
      />
      <Load label=" 1m" values={machine.load[0]} cols={Math.max(8, cols - 15)} />
    </>
  ) : null;

  const third = Math.floor((cols - 4) / 3);
  const processes = (
    <>
      <div ref={filterBox} style={{ display: 'contents' }}>
        <TextField
          label="Filter"
          cols={narrow ? Math.max(10, cols - 14) : 24}
          value={filter}
          onChange={setFilter}
        />
      </div>
      <Processes
        procs={shown}
        narrow={narrow}
        sort={sort}
        onSort={resort}
        selected={selected}
        onSelected={setSelected}
        onCursor={setCursor}
        onDetails={(pid) => {
          setCursor(pid);
          setAsking('details');
        }}
      />
    </>
  );

  return (
    <Keymap>
      {bindings}
      <div ref={box} className="system-monitor">
        {narrow ? (
          <Panes direction="column" rows={rows - 1} label="System">
            <Pane size={top} title="system" label="System">
              {meters}
            </Pane>
            <Pane title="processes" label="Processes">
              {processes}
            </Pane>
          </Panes>
        ) : (
          <Panes direction="column" rows={rows - 1} label="System">
            <Pane size={top}>
              <Panes>
                <Pane title="cpu" label="CPU">
                  {machine.cores.map((c, i) => (
                    <Meter
                      // biome-ignore lint/suspicious/noArrayIndexKey: a core is its index.
                      key={i}
                      label={String(i).padStart(2)}
                      aria-label={`Core ${i}`}
                      value={c}
                      warning={70}
                      danger={90}
                      cols={Math.max(8, third - 13)}
                      valueLabel={pct(c)}
                    />
                  ))}
                </Pane>
                <Pane title="memory" label="Memory">
                  <Meter
                    label="used"
                    aria-label="Memory used"
                    value={machine.memory.used}
                    maxValue={machine.memory.total}
                    warning={machine.memory.total * 0.75}
                    danger={machine.memory.total * 0.9}
                    cols={Math.max(8, third - 18)}
                    valueLabel={gib(machine.memory.used, machine.memory.total)}
                  />
                  <Meter
                    label="buff"
                    aria-label="Buffers and cache"
                    value={machine.memory.cache}
                    maxValue={machine.memory.total}
                    tone="neutral"
                    cols={Math.max(8, third - 18)}
                    valueLabel={gib(machine.memory.cache, machine.memory.total)}
                  />
                  <Meter
                    label="swap"
                    aria-label="Swap used"
                    value={machine.memory.swap}
                    maxValue={machine.memory.swapTotal}
                    warning={machine.memory.swapTotal * 0.5}
                    danger={machine.memory.swapTotal * 0.8}
                    cols={Math.max(8, third - 18)}
                    valueLabel={gib(machine.memory.swap, machine.memory.swapTotal)}
                  />
                </Pane>
                <Pane title="load" label="Load">
                  <Load label=" 1m" values={machine.load[0]} cols={Math.max(8, third - 13)} />
                  <Load label=" 5m" values={machine.load[1]} cols={Math.max(8, third - 13)} />
                  <Load label="15m" values={machine.load[2]} cols={Math.max(8, third - 13)} />
                </Pane>
              </Panes>
            </Pane>
            <Pane title="processes" label="Processes">
              {processes}
            </Pane>
          </Panes>
        )}
        <StatusBar label="Status">
          <StatusSegment variant="mode" priority={4}>
            {paused ? 'paused' : <Spinner label={`live · every ${reduced ? 5 : 1}s`} />}
          </StatusSegment>
          <StatusSegment
            priority={3}
          >{`${listed.length} of ${machine.procs.length} · sort ${sort.column} ${sort.direction === 'ascending' ? '▲' : '▼'}`}</StatusSegment>
          <StatusMessage id={message.id} duration={2500}>
            {message.text}
          </StatusMessage>
          <StatusSegment align="end" priority={1} label="Keys">
            <KeyHint keys="enter">details</KeyHint> <KeyHint keys="k">kill</KeyHint>
            <span> </span>
            <KeyHint keys="/">filter</KeyHint> <KeyHint keys="s">sort</KeyHint>
            <span> </span>
            <KeyHint keys="p">{paused ? 'live' : 'pause'}</KeyHint> <KeyHint keys="?">keys</KeyHint>
          </StatusSegment>
        </StatusBar>
      </div>
      <Dialog
        title={
          asking === 'help'
            ? 'Keys'
            : asking === 'details'
              ? (current?.name ?? 'Process')
              : `Kill ${targets.length === 1 ? targets[0]?.name : `${targets.length} processes`}?`
        }
        variant={asking === 'kill' ? 'alert' : 'default'}
        isOpen={asking !== null}
        onOpenChange={(open) => {
          if (!open) setAsking(null);
        }}
        actions={(close) =>
          asking === 'kill' ? (
            <>
              <Button keys="esc" onPress={close}>
                Keep
              </Button>
              <span> </span>
              <Button
                variant="danger"
                onPress={() => {
                  const pids = new Set(targets.map((p) => p.pid));
                  setMachine((m) => kill(m, pids));
                  setSelected(new Set());
                  setCursor(null);
                  say(`Killed ${targets.map((p) => p.pid).join(', ')}`);
                  refocus.current = true;
                  close();
                }}
              >
                Kill
              </Button>
            </>
          ) : (
            <Button keys="esc" onPress={close}>
              Close
            </Button>
          )
        }
      >
        {asking === 'help' ? (
          <KeymapHelp />
        ) : asking === 'details' && current ? (
          <Details proc={current} />
        ) : (
          <p>
            {targets.map((p) => `${p.pid} ${p.name}`).join(', ')} will stop, and lose what it has
            not saved.
          </p>
        )}
      </Dialog>
    </Keymap>
  );
}

const pct = (n: number): string => `${String(Math.round(n)).padStart(3)}%`;

const gib = (n: number, of?: number): string =>
  of === undefined ? `${n.toFixed(1)}G` : `${n.toFixed(1)}/${of}G`.padStart(9);

/** A load average: its history as a sparkline, and where it is now. */
function Load({
  label,
  values,
  cols,
}: {
  readonly label: string;
  readonly values: readonly number[];
  readonly cols: number;
}): ReactNode {
  const now = values.at(-1) ?? 0;
  return (
    <p className="system-monitor-load">
      {label}
      <span> </span>
      <Sparkline
        kind="bars"
        values={values}
        cols={cols}
        label={`Load, ${label.trim()}, over the last ${values.length} seconds`}
      />
      <span> </span>
      {now.toFixed(2).padStart(5)}
    </p>
  );
}

/** The app's keys, bound while it is on the page. */
function Bindings(actions: {
  readonly onKill: () => void;
  readonly onFilter: () => void;
  readonly onSort: () => void;
  readonly onPrev: () => void;
  readonly onNext: () => void;
  readonly onPause: () => void;
  readonly onStep: () => void;
  readonly onHelp: () => void;
}): ReactNode {
  // Rows are found by pid, so a letter never moves the table's cursor and
  // reaches these instead.
  useKeymap([
    { keys: 'k', description: 'Kill the process, or the selected ones', action: actions.onKill },
    { keys: '/', description: 'Filter by name or pid', action: actions.onFilter },
    { keys: 's', description: 'Sort again, by the values now', action: actions.onSort },
    { keys: '<', description: 'Sort by the column before', action: actions.onPrev },
    { keys: '>', description: 'Sort by the column after', action: actions.onNext },
    { keys: 'p', description: 'Pause, or go live', action: actions.onPause },
    { keys: 'r', description: 'Take one step', action: actions.onStep },
    { keys: '?', description: 'Show these keys', action: actions.onHelp },
  ]);
  return null;
}

/** The processes, in the order they were sorted, their values changing in place. */
function Processes({
  procs,
  narrow,
  sort,
  onSort,
  selected,
  onSelected,
  onCursor,
  onDetails,
}: {
  readonly procs: readonly Proc[];
  readonly narrow: boolean;
  readonly sort: { readonly column: SortColumn; readonly direction: SortDirection };
  readonly onSort: (column: SortColumn, direction: SortDirection) => void;
  readonly selected: ReadonlySet<number>;
  readonly onSelected: (pids: ReadonlySet<number>) => void;
  readonly onCursor: (pid: number) => void;
  readonly onDetails: (pid: number) => void;
}): ReactNode {
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: it only hears focus bubble up from the table's rows; the table is what a person uses.
    <div
      style={{ display: 'contents' }}
      onFocus={(event) => {
        const row = (event.target as HTMLElement).closest('[role="row"][data-key]');
        const pid = Number(row?.getAttribute('data-key'));
        if (Number.isInteger(pid) && pid > 0) onCursor(pid);
      }}
    >
      <Table
        aria-label="Processes"
        selectionMode="multiple"
        selectedKeys={[...selected].filter((pid) => procs.some((p) => p.pid === pid))}
        onSelectionChange={(keys) =>
          onSelected(new Set(keys === 'all' ? procs.map((p) => p.pid) : [...keys].map(Number)))
        }
        sortDescriptor={{ column: sort.column, direction: sort.direction }}
        onSortChange={({ column, direction }) => onSort(column as SortColumn, direction)}
        onRowAction={(key) => onDetails(Number(key))}
      >
        <TableHeader>
          <Column id="pid" isRowHeader align="end" width={6} allowsSorting>
            PID
          </Column>
          <Column id="name" width={narrow ? '1fr' : 16} allowsSorting>
            NAME
          </Column>
          <Column id="cpu" align="end" width={5} allowsSorting>
            CPU%
          </Column>
          {narrow ? null : (
            <>
              <Column id="mem" align="end" width={5} allowsSorting>
                MEM
              </Column>
              <Column id="time" align="end" width={9} allowsSorting>
                TIME
              </Column>
              <Column id="state" width="1fr" allowsSorting>
                STATE
              </Column>
            </>
          )}
        </TableHeader>
        <TableBody>
          {procs.map((p) => (
            // The row is found by its pid, typed: a letter is left for the keymap.
            <Row key={p.pid} id={p.pid} textValue={String(p.pid)}>
              <Cell>{String(p.pid)}</Cell>
              <Cell>{p.name}</Cell>
              <Cell>{p.cpu.toFixed(1)}</Cell>
              {narrow ? null : (
                <>
                  <Cell>{formatMem(p.mem)}</Cell>
                  <Cell>{formatTime(p.time)}</Cell>
                  <Cell>{p.state}</Cell>
                </>
              )}
            </Row>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/** Everything about one process: under 60 cells, the columns the table has no room for. */
function Details({ proc }: { readonly proc: Proc }): ReactNode {
  const rows: readonly (readonly [string, string])[] = [
    ['PID', String(proc.pid)],
    ['CPU', `${proc.cpu.toFixed(1)}%`],
    ['Memory', formatMem(proc.mem)],
    ['Time', formatTime(proc.time)],
    ['State', proc.state],
  ];
  return (
    <p>
      {rows.map(([term, value], i) => (
        <span key={term}>
          {i > 0 ? <br /> : null}
          {`${term}: ${value}`}
        </span>
      ))}
    </p>
  );
}
