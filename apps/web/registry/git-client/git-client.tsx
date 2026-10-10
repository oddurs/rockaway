import { measureCell } from '@rockaway/react';
import { Button } from '@rockaway/react/button';
import { Checkbox } from '@rockaway/react/checkbox';
import { CodeBlock, type CodeLine } from '@rockaway/react/code-block';
import { Dialog } from '@rockaway/react/dialog';
import { Form } from '@rockaway/react/field';
import { KeyHint } from '@rockaway/react/key-hint';
import { Keymap, KeymapHelp, useKeymap } from '@rockaway/react/keymap';
import { Pane, Panes } from '@rockaway/react/panes';
import { StatusBar, StatusMessage, StatusSegment } from '@rockaway/react/status-bar';
import { Cell, Column, Row, Table, TableBody, TableHeader } from '@rockaway/react/table';
import { Tab, TabList, TabPanel, Tabs } from '@rockaway/react/tabs';
import { TextField } from '@rockaway/react/text-field';
import { Tree, TreeItem } from '@rockaway/react/tree';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import {
  type Commit,
  commit,
  dirOf,
  discard,
  type FileChange,
  REPO,
  type Repo,
  roleOf,
  stageOnly,
  toggleStaged,
} from './data.ts';

/** Under this many cells across, one pane at a time, in tabs. */
const NARROW = 60;

export interface GitClientProps {
  /** The repository to show; a fixed one by default. */
  readonly repo?: Repo;
  /** Rows the whole client takes, status bar included. */
  readonly rows?: number;
}

/** How many cells across the element is, as the cell it is set in measures. */
function useCols(ref: React.RefObject<HTMLElement | null>): number {
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

/**
 * A git client (cairn 0151): changes and what is staged in a tree, the diff
 * of the one under the cursor, a commit form, the log, and the keys that do
 * it all in the status bar. Under 60 cells, one pane at a time, in tabs.
 *
 * It runs on a fixed repository, so it is a fixture as much as an example;
 * copied in, `repo` and what committing does are yours.
 */
export function GitClient({ repo: initial = REPO, rows = 28 }: GitClientProps): ReactNode {
  const [repo, setRepo] = useState(initial);
  const [cursor, setCursor] = useState(initial.files[0]?.path ?? '');
  const [summary, setSummary] = useState('');
  const [sign, setSign] = useState(true);
  const [message, setMessage] = useState({ id: 0, text: '' });
  const [asking, setAsking] = useState<'discard' | 'help' | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const cols = useCols(box);
  const narrow = cols > 0 && cols < NARROW;
  // The row a discard removed had focus, and the dialog would hand it back
  // to nothing: once the dialog is gone, focus goes to the file after it.
  const refocus = useRef<string | null>(null);
  useEffect(() => {
    const path = refocus.current;
    if (asking !== null || path === null) return;
    refocus.current = null;
    box.current?.querySelector<HTMLElement>(`[data-key="${CSS.escape(path)}"]`)?.focus();
  }, [asking]);

  const file = repo.files.find((f) => f.path === cursor);
  const staged = repo.files.filter((f) => f.staged);
  const say = (text: string) => setMessage((m) => ({ id: m.id + 1, text }));

  const stage = () => {
    if (!file) return;
    setRepo((r) => toggleStaged(r, file.path));
    say(file.staged ? `Unstaged ${file.path}` : `Staged ${file.path}`);
  };
  const stageTo = (paths: ReadonlySet<string>) => {
    const changed = repo.files.find((f) => f.staged !== paths.has(f.path));
    setRepo((r) => stageOnly(r, paths));
    if (changed) say(changed.staged ? `Unstaged ${changed.path}` : `Staged ${changed.path}`);
  };
  const askDiscard = () => {
    if (!file) return;
    if (file.staged) say(`${file.path} is staged: unstage it to discard it`);
    else setAsking('discard');
  };
  const commitNow = () => {
    if (staged.length === 0) return say('Nothing staged to commit');
    if (summary.trim() === '') return say('Write a summary first');
    const next = commit(repo, summary.trim());
    setRepo(next);
    setSummary('');
    say(`Committed ${next.log[0]?.hash}${sign ? ', signed' : ''}`);
  };

  const body = {
    changes: <Changes files={repo.files} onCursor={setCursor} onStaged={stageTo} />,
    diff: <Diff file={file} />,
    commit: (
      <CommitForm
        summary={summary}
        onSummary={setSummary}
        sign={sign}
        onSign={setSign}
        staged={staged.length}
        onCommit={commitNow}
      />
    ),
    log: <Log log={repo.log} />,
  };

  return (
    <Keymap>
      <Bindings onStage={stage} onDiscard={askDiscard} onHelp={() => setAsking('help')} />
      <div ref={box} className="git-client">
        {narrow ? (
          <Tabs rows={rows - 1}>
            <TabList aria-label="Views">
              <Tab id="files">Files</Tab>
              <Tab id="diff">Diff</Tab>
              <Tab id="log">Log</Tab>
            </TabList>
            <TabPanel id="files">
              {body.changes}
              {body.commit}
            </TabPanel>
            <TabPanel id="diff">{body.diff}</TabPanel>
            <TabPanel id="log">{body.log}</TabPanel>
          </Tabs>
        ) : (
          <Panes direction="column" rows={rows - 1} label="Repository">
            <Pane priority={2}>
              <Panes>
                <Pane size={34} min={24} priority={1}>
                  <Panes direction="column">
                    <Pane title={`${repo.branch} ↑${repo.ahead}`} label="Changes" priority={1}>
                      {body.changes}
                    </Pane>
                    <Pane size={8} title="commit" label="Commit">
                      {body.commit}
                    </Pane>
                  </Panes>
                </Pane>
                <Pane size="1fr" min={30} title={file?.path ?? 'diff'} label="Diff" priority={2}>
                  {body.diff}
                </Pane>
              </Panes>
            </Pane>
            <Pane size={8} title="log" label="Log">
              {body.log}
            </Pane>
          </Panes>
        )}
        <StatusBar label="Status">
          <StatusSegment variant="mode" priority={3}>
            {repo.branch}
          </StatusSegment>
          <StatusSegment
            priority={2}
          >{`↑${repo.ahead} · ${repo.files.length} changed · ${staged.length} staged`}</StatusSegment>
          <StatusMessage id={message.id} duration={2500}>
            {message.text}
          </StatusMessage>
          <StatusSegment align="end" priority={1} label="Keys">
            <KeyHint keys="space">stage</KeyHint> <KeyHint keys="mod+enter">commit</KeyHint>
            <span> </span>
            <KeyHint keys="backspace">discard</KeyHint> <KeyHint keys="?">keys</KeyHint>
          </StatusSegment>
        </StatusBar>
      </div>
      <Dialog
        title={asking === 'help' ? 'Keys' : 'Discard changes?'}
        variant={asking === 'discard' ? 'alert' : 'default'}
        isOpen={asking !== null}
        onOpenChange={(open) => {
          if (!open) setAsking(null);
        }}
        actions={(close) =>
          asking === 'discard' ? (
            <>
              <Button keys="esc" onPress={close}>
                Keep
              </Button>
              <span> </span>
              <Button
                variant="danger"
                onPress={() => {
                  if (file) {
                    const at = repo.files.indexOf(file);
                    const next = repo.files[at + 1] ?? repo.files[at - 1];
                    setRepo((r) => discard(r, file.path));
                    say(`Discarded ${file.path}`);
                    if (next) {
                      setCursor(next.path);
                      refocus.current = next.path;
                    }
                  }
                  close();
                }}
              >
                Discard
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
        ) : (
          <p>The changes to {file?.path} go, and cannot come back.</p>
        )}
      </Dialog>
    </Keymap>
  );
}

/** The app's keys, bound while it is on the page. */
function Bindings({
  onStage,
  onDiscard,
  onHelp,
}: {
  readonly onStage: () => void;
  readonly onDiscard: () => void;
  readonly onHelp: () => void;
}): ReactNode {
  useKeymap([
    { keys: 'space', description: 'Stage or unstage the file', action: onStage },
    // Not `d`: a tree's typeahead takes every letter while it has focus.
    { keys: 'backspace', description: 'Discard the file’s changes', action: onDiscard },
    { keys: '?', description: 'Show these keys', action: onHelp },
  ]);
  return null;
}

/**
 * The changed files by directory. What is staged is the tree's selection, so
 * Space on a file stages it and the check cell says so; the cursor is the
 * row with focus, and the diff follows it.
 */
function Changes({
  files,
  onCursor,
  onStaged,
}: {
  readonly files: readonly FileChange[];
  readonly onCursor: (path: string) => void;
  readonly onStaged: (paths: ReadonlySet<string>) => void;
}): ReactNode {
  const dirs = [...new Set(files.map((f) => dirOf(f.path)))].filter((d) => d !== '');
  const item = (f: FileChange) => (
    <TreeItem
      key={f.path}
      id={f.path}
      title={`${f.change} ${f.path.slice(f.path.lastIndexOf('/') + 1)}`}
      textValue={f.path}
    />
  );
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: it only hears focus bubble up from the tree's rows; the tree is what a person uses.
    <div
      style={{ display: 'contents' }}
      onFocus={(event) => {
        const key = (event.target as HTMLElement).closest('[data-key]')?.getAttribute('data-key');
        if (key && files.some((f) => f.path === key)) onCursor(key);
      }}
    >
      <Tree
        aria-label="Changes"
        selectionMode="multiple"
        selectedKeys={files.filter((f) => f.staged).map((f) => f.path)}
        disabledKeys={dirs}
        disabledBehavior="selection"
        onSelectionChange={(keys) =>
          onStaged(new Set(keys === 'all' ? files.map((f) => f.path) : [...keys].map(String)))
        }
        defaultExpandedKeys={dirs}
      >
        {dirs.map((dir) => (
          <TreeItem key={dir} id={dir} title={`${dir}/`}>
            {files.filter((f) => dirOf(f.path) === dir).map(item)}
          </TreeItem>
        ))}
        {files.filter((f) => dirOf(f.path) === '').map(item)}
      </Tree>
    </div>
  );
}

/** A file's diff: added and removed lines in the theme's inserted and deleted colours. */
function Diff({ file }: { readonly file: FileChange | undefined }): ReactNode {
  if (!file) return <p>Nothing changed.</p>;
  const tokens: CodeLine[] = file.diff
    .split('\n')
    .map((line) => [{ text: line, role: roleOf(line) }]);
  return <CodeBlock code={file.diff} tokens={tokens} lang="diff" label={`Diff of ${file.path}`} />;
}

/** The summary, signing, and the button: `mod+enter` from anywhere in the form. */
function CommitForm({
  summary,
  onSummary,
  sign,
  onSign,
  staged,
  onCommit,
}: {
  readonly summary: string;
  readonly onSummary: (s: string) => void;
  readonly sign: boolean;
  readonly onSign: (s: boolean) => void;
  readonly staged: number;
  readonly onCommit: () => void;
}): ReactNode {
  const button = useRef<HTMLButtonElement>(null);
  useKeymap([{ keys: 'mod+enter', description: 'Commit', action: onCommit, target: button }]);
  return (
    <Form
      onSubmit={(event) => {
        event.preventDefault();
        onCommit();
      }}
    >
      <TextField label="Summary" cols={22} value={summary} onChange={onSummary} />
      <Checkbox isSelected={sign} onChange={onSign}>
        Sign
      </Checkbox>
      <Button ref={button} type="submit" variant="fill" isDisabled={staged === 0}>
        {`Commit ${staged}`}
      </Button>
    </Form>
  );
}

/** The log, newest first. */
function Log({ log }: { readonly log: readonly Commit[] }): ReactNode {
  return (
    <Table aria-label="Log">
      <TableHeader>
        <Column id="hash" isRowHeader width={7}>
          Commit
        </Column>
        <Column id="summary" width="1fr">
          Summary
        </Column>
        <Column id="author">Author</Column>
        <Column id="age" align="end">
          Age
        </Column>
      </TableHeader>
      <TableBody>
        {log.map((c) => (
          <Row key={c.hash} id={c.hash}>
            <Cell>{c.hash}</Cell>
            <Cell>{c.summary}</Cell>
            <Cell>{c.author}</Cell>
            <Cell>{c.age}</Cell>
          </Row>
        ))}
      </TableBody>
    </Table>
  );
}
