/**
 * Component metadata (cairn 0047) is true of the component it describes.
 *
 * The metadata is typed, so most mistakes are already type errors: a state
 * that is not a row of the vocabulary, a state on a part the anatomy does not
 * list, a variant value the helper does not declare. This checks what types
 * cannot see — that the component really has what its metadata says, by
 * reading its stylesheets and its source and by rendering it on the server —
 * and that nothing exported from the package goes without metadata.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import { createElement, Fragment, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { type Analysis, analyse, owns, packageRoot, render } from '../scripts/extract.ts';
import { formatKeys, parseKeys } from '../src/components/key-hint.pure.ts';
import * as rockaway from '../src/index.ts';
import { components, metadata, stateVocabulary } from '../src/metadata/index.ts';
import schema from '../src/metadata/meta.schema.json' with { type: 'json' };
import type {
  Accessibility,
  ComponentMeta,
  ElementPart,
  ImportedPart,
  KeyBinding,
  PropMeta,
  Snapshot,
  StateMeta,
  VariantMeta,
} from '../src/metadata/schema.ts';
import type { StateRow } from '../src/metadata/states.ts';

/**
 * Exported like a component, and not one. Each has a reason, so adding one is
 * a decision a reviewer sees.
 */
const NOT_COMPONENTS: Readonly<Record<string, string>> = {
  Screen:
    'The join between the engine and the page, which every framed component is drawn through. It is documented with the grid, not as a component.',
  useTick:
    'A hook: the frame counter that spinners and other stepped motion read. It draws nothing, and is documented with motion.',
  GlyphProvider:
    "Context that hands a theme's glyphs to every component under it. It draws nothing, and is documented with the theme.",
  RouterProvider:
    "React Aria's router context, re-exported beside Link so it is the instance Link reads (0168). It draws nothing, and is documented in Link's notes.",
  Chrome:
    "A painted layer: a buffer's cells as elements, which Screen and List's scrollbar render. Part of the cell renderer, documented with the grid.",
};

/**
 * Each component rendered once, as small as it can be: the evidence for its
 * roles, its focusability and the variant attributes it writes. A component
 * with metadata and no fixture fails below.
 */
const FIXTURES: Readonly<Record<string, (props?: Record<string, unknown>) => ReactElement>> = {
  Badge: (props) => createElement(rockaway.Badge, props, 'passing'),
  Button: (props) => createElement(rockaway.Button, props, 'Publish'),
  Callout: (props) =>
    createElement(rockaway.Callout, props, createElement('p', null, 'Mind the gap.')),
  Divider: (props) => createElement(rockaway.Divider, { label: 'files', cols: 20, ...props }),
  // Both parts of the module: the variant is FieldFrame's, and Fieldset is always a group.
  Fieldset: (props) =>
    createElement(
      Fragment,
      null,
      createElement(rockaway.Fieldset, { legend: 'Notify' }),
      createElement(rockaway.FieldFrame, { label: 'Message', ...props }),
    ),
  Form: (props) => createElement(rockaway.Form, props, createElement(rockaway.Label, null, 'Name')),
  Frame: (props) => createElement(rockaway.Frame, { title: 'tokens', cols: 20, rows: 5, ...props }),
  KeyHint: (props) => createElement(rockaway.KeyHint, { keys: 'mod+s', ...props }, 'save'),
  Keymap: (props) => createElement(rockaway.Keymap, props, createElement(rockaway.KeymapHelp)),
  Link: (props) => createElement(rockaway.Link, { href: '#docs', ...props }, 'docs'),
  Meter: (props) =>
    createElement(rockaway.Meter, { label: 'cpu', value: 42, warning: 70, ...props }),
  ProgressBar: (props) =>
    createElement(rockaway.ProgressBar, { label: 'Installing', value: 62, ...props }),
  Sparkline: (props) =>
    createElement(rockaway.Sparkline, { label: 'Load', values: [1, 3, 2, 4], ...props }),
  Spinner: (props) => createElement(rockaway.Spinner, { label: 'Indexing', ...props }),
  Tree: (props) =>
    createElement(
      rockaway.Tree,
      { 'aria-label': 'files', defaultExpandedKeys: ['src'], ...props },
      createElement(
        rockaway.TreeItem,
        { id: 'src', title: 'src' },
        createElement(rockaway.TreeItem, { id: 'a', title: 'a.ts' }),
      ),
    ),
  // Closed: a popover has no trigger here, and on a server an open one renders nothing anyway.
  OverlayPopover: (props) =>
    createElement(
      rockaway.OverlayLayer,
      null,
      createElement(rockaway.OverlayPopover, { isOpen: false, ...props }, 'inside'),
    ),
  List: (props) =>
    createElement(
      rockaway.List,
      { 'aria-label': 'files', selectionMode: 'single', ...props },
      createElement(rockaway.ListItem, { id: 'a' }, 'a.ts'),
      createElement(rockaway.ListItem, { id: 'b' }, 'b.ts'),
    ),
  Table: (props) =>
    createElement(
      rockaway.Table,
      { 'aria-label': 'files', ...props },
      createElement(
        rockaway.TableHeader,
        null,
        // A column's words are required, and createElement's types cannot see them in its third argument.
        // biome-ignore lint/correctness/noChildrenProp: as above
        createElement(rockaway.Column, { id: 'name', isRowHeader: true, children: 'Name' }),
      ),
      createElement(
        rockaway.TableBody,
        null,
        createElement(rockaway.Row, { id: 'a' }, createElement(rockaway.Cell, null, 'a.ts')),
      ),
    ),
};

/** A role a part may have without writing it, because its element implies it. */
const IMPLICIT: Readonly<Record<string, RegExp>> = {
  button: /<button[\s>]/,
  link: /<a [^>]*href=/,
};

const FOCUSABLE = /<(?:button|input|select|textarea)[\s>]|<a [^>]*href=|tabindex="0"/;

const analysis = analyse();
const markup = (meta: ComponentMeta, props?: Record<string, unknown>): string => {
  const fixture = FIXTURES[meta.name];
  if (fixture === undefined) throw new Error(`${meta.name} has no fixture in this test.`);
  return renderToStaticMarkup(fixture(props));
};

/** Every attribute a selector reads, `data-*` and `aria-current`. */
function attributesIn(selectors: readonly string[]): string[] {
  return [
    ...new Set(
      selectors.flatMap((s) =>
        [...s.matchAll(/\[((?:data|aria)-[a-z0-9-]+)/g)].map((m) => m[1] ?? ''),
      ),
    ),
  ].sort();
}

/**
 * React Aria's render prop for a state attribute: `[data-focused]` is
 * `isFocused`, `[data-focus-visible]` is `isFocusVisible`.
 */
function renderPropOf(selector: string): string | undefined {
  const name = /^\[data-([a-z-]+)\]$/.exec(selector)?.[1];
  if (name === undefined) return undefined;
  if (name === 'readonly') return 'isReadOnly';
  return `is${name.replace(/(?:^|-)([a-z])/g, (_, ch: string) => ch.toUpperCase())}`;
}

/** Whether a component's source reads the render prop for a state. */
function readsRenderProp(file: string, selector: string): boolean {
  const prop = renderPropOf(selector);
  if (prop === undefined) return false;
  const source = readFileSync(path.join(packageRoot, 'src/components', file), 'utf8');
  return new RegExp(`\\.${prop}\\b`).test(source);
}

const rowOf = (name: string): StateRow | undefined => stateVocabulary.find((r) => r.name === name);

/** What the metadata says that the component does not bear out. Empty when it is true. */
function problems(meta: ComponentMeta, found: Analysis): string[] {
  const out: string[] = [];
  const html = markup(meta);
  const exported = new Set(Object.keys(rockaway));
  const parts = new Set(meta.anatomy.map((part) => part.name));

  // Parts: an import is a component the package exports; an element is a
  // class the component's source writes.
  for (const part of meta.anatomy) {
    if (part.kind === 'import' && !exported.has(part.name)) {
      out.push(`part ${part.name} is not exported from @rockaway/react`);
    }
    if (part.kind === 'element' && !found.classes.includes(part.className)) {
      out.push(`part ${part.name} has class ${part.className}, which ${found.file} never writes`);
    }
    if (part.kind === 'import' && part.role !== undefined) {
      const implicit = IMPLICIT[part.role];
      if (!html.includes(`role="${part.role}"`) && !(implicit?.test(html) ?? false)) {
        out.push(`part ${part.name} has role ${part.role}, which it does not render`);
      }
    }
  }
  if (!meta.anatomy.some((part) => part.kind === 'import' && part.name === meta.name)) {
    out.push(`its anatomy does not list ${meta.name} itself`);
  }

  // Variants: the component writes each value it is said to have.
  for (const variant of meta.variants) {
    for (const { value } of variant.values) {
      if (!markup(meta, { [variant.name]: value }).includes(`${variant.attribute}="${value}"`)) {
        out.push(`variant ${variant.name}="${value}" is not written to ${variant.attribute}`);
      }
    }
  }

  // States: each is drawn, by its own stylesheet or, for the focus ring, by
  // being focusable; and every state its stylesheet draws is named.
  const focusable = FOCUSABLE.test(html);
  for (const state of meta.states) {
    const row = rowOf(state.state);
    if (row === undefined) {
      out.push(`state ${state.state} is not a row of the state vocabulary (0118)`);
      continue;
    }
    if (!parts.has(state.part)) out.push(`state ${state.state} is on ${state.part}, not a part`);
    // A state is drawn by a rule that selects it, or by a mark the component
    // writes from React Aria's render prop for it: List's cursor is a glyph in
    // a reserved cell, not a style.
    const drawn = row.global
      ? focusable
      : found.selectors.some((s) => row.selectors.some((r) => s.includes(r.replace(/\]$/, '')))) ||
        row.selectors.some((r) => readsRenderProp(found.file, r));
    if (!drawn) {
      out.push(
        row.global
          ? `state ${state.state} needs a focusable element, and it renders none`
          : `state ${state.state} is read by no rule in its stylesheets (${row.selectors.join(', ')}), and its source draws nothing from it`,
      );
    }
  }
  const named = new Set(meta.states.flatMap((s) => rowOf(s.state)?.selectors ?? []));
  const variants = new Set(meta.variants.map((v) => v.attribute));
  const states = new Set(stateVocabulary.flatMap((row) => row.selectors));
  for (const attribute of attributesIn(found.selectors)) {
    if (attribute.startsWith('data-rk-') || variants.has(attribute)) continue;
    if (!states.has(`[${attribute}]`)) {
      out.push(
        `its stylesheet reads ${attribute}, which is neither a state nor one of its variants`,
      );
    } else if (!named.has(`[${attribute}]`)) {
      out.push(`its stylesheet draws ${attribute}, and its metadata names no state for it`);
    }
  }
  const focus = ['focus-unframed', 'focus-framed', 'cursor'];
  if (focusable && !meta.states.some((s) => focus.includes(s.state))) {
    out.push(`it is focusable, and names no focus state (${focus.join(', ')})`);
  }

  // Keys are chords KeyHint can draw, so the site can draw them.
  for (const { keys } of meta.accessibility.keyboard) {
    for (const key of keys) {
      const { key: face } = parseKeys(key);
      if (face === '' || (face.length > 1 && formatKeys(key) === face)) {
        out.push(`key ${key} is not a chord KeyHint can draw`);
      }
    }
  }

  // Related components are ones with metadata, so a page can link to them.
  const known = new Set(components.map((c) => c.name));
  for (const name of [
    ...meta.related.map((r) => r.name),
    ...meta.whenNotToUse.flatMap((w) => (w.instead === undefined ? [] : [w.instead])),
  ]) {
    if (!known.has(name)) out.push(`it names ${name}, which has no metadata`);
  }
  return out;
}

const byName = (name: string): ComponentMeta => {
  const meta = components.find((c) => c.name === name);
  if (meta === undefined) throw new Error(`No metadata for ${name}`);
  return meta;
};
const analysed = (name: string): Analysis => {
  const found = analysis.get(name);
  if (found === undefined) throw new Error(`${name} is not an exported component`);
  return found;
};
const snapshots = (meta: ComponentMeta): string =>
  meta.snapshots.map((s) => `── ${s.title}\n${s.text}`).join('\n');

describe('every component has metadata', () => {
  test('every component exported from @rockaway/react is described, as itself or as a part', () => {
    const parts = new Set(
      components.flatMap((c) => c.anatomy.filter((p) => p.kind === 'import').map((p) => p.name)),
    );
    const undescribed = Object.entries(rockaway)
      .filter(([name, value]) => /^[A-Z]/.test(name) && typeof value === 'function')
      .map(([name]) => name)
      .filter((name) => !parts.has(name) && !(name in NOT_COMPONENTS));
    expect(undescribed).toEqual([]);
  });

  test('every component in src/components is exported and described', () => {
    const roots = new Set(components.map((c) => c.name));
    const parts = new Set(components.flatMap((c) => c.anatomy.map((p) => p.name)));
    for (const name of analysis.keys()) {
      expect(Object.keys(rockaway), name).toContain(name);
      expect(parts.has(name) || roots.has(name), `${name} has no metadata`).toBe(true);
    }
  });

  test('the extracted props and tokens are up to date', () => {
    const written = readFileSync(path.join(packageRoot, 'src/metadata/extracted.ts'), 'utf8');
    // Regenerate with `pnpm --filter @rockaway/react metadata`.
    expect(written).toBe(render());
  });
});

describe('the metadata is data', () => {
  test('it survives JSON unchanged', () => {
    expect(JSON.parse(JSON.stringify(metadata))).toEqual(metadata);
  });

  test('it validates against meta.schema.json', () => {
    const validate = new Ajv2020({ allErrors: true }).compile(schema);
    validate(JSON.parse(JSON.stringify(metadata)));
    expect(validate.errors ?? []).toEqual([]);
  });

  test('the schema refuses what the types refuse', () => {
    const validate = new Ajv2020({ allErrors: true }).compile(schema);
    const [first] = metadata.components;
    const broken = {
      ...metadata,
      components: [{ ...first, states: [{ ...first?.states[0], state: 'wobbly' }], extra: true }],
    };
    expect(validate(JSON.parse(JSON.stringify(broken)))).toBe(false);
  });

  test('the vocabulary is 0118, row for row', () => {
    expect(stateVocabulary.map((row) => row.name)).toEqual(schema.$defs.stateName.enum);
  });
});

describe.each(components.map((meta) => [meta.name, meta] as const))('%s', (name, meta) => {
  test('says nothing the component does not bear out', () => {
    expect(problems(meta, analysed(name))).toEqual([]);
  });

  test('reads its variants from its helper, not from a list of its own', () => {
    for (const variant of meta.variants) {
      const prop = meta.anatomy
        .filter((part): part is ImportedPart => part.kind === 'import')
        .flatMap((part) => part.props)
        .find((p) => p.name === variant.name);
      expect(prop?.type).toBe(variant.values.map(({ value }) => `'${value}'`).join(' | '));
    }
  });
});

describe('the checks fail when the metadata is wrong', () => {
  const button = byName('Button');
  const found = analysed('Button');

  test('a part the component does not have', () => {
    const anatomy = [
      ...button.anatomy,
      {
        kind: 'element',
        name: 'spinner',
        className: 'rk-button-spinner',
        chrome: true,
        description: 'Not drawn.',
      } satisfies ElementPart,
      {
        kind: 'import',
        name: 'ButtonGroup',
        description: 'Not exported.',
        props: [],
        inherits: [],
      } satisfies ImportedPart,
    ];
    expect(problems({ ...button, anatomy }, found)).toEqual([
      'part spinner has class rk-button-spinner, which button.tsx never writes',
      'part ButtonGroup is not exported from @rockaway/react',
    ]);
  });

  test('a variant value the component does not have', () => {
    const [variant] = button.variants;
    if (variant === undefined) throw new Error('Button has variants');
    const loud: VariantMeta = {
      ...variant,
      values: [...variant.values, { value: 'loud', description: 'Not declared.' }],
    };
    expect(problems({ ...button, variants: [loud, ...button.variants.slice(1)] }, found)).toEqual([
      'variant variant="loud" is not written to data-variant',
    ]);
  });

  test('a state the component does not draw, and one it draws but does not name', () => {
    const invalid = { ...button.states[0], state: 'invalid' } as StateMeta;
    const states = [...button.states.filter((s) => s.state !== 'pressed'), invalid];
    expect(problems({ ...button, states }, found)).toEqual([
      'state invalid is read by no rule in its stylesheets ([data-invalid]), and its source draws nothing from it',
      'its stylesheet draws data-pressed, and its metadata names no state for it',
    ]);
  });

  test('a focus ring on a component that cannot take focus', () => {
    const frame = byName('Frame');
    const focus = { ...button.states[0], state: 'focus-unframed', part: 'Frame' } as StateMeta;
    expect(problems({ ...frame, states: [focus] }, analysed('Frame'))).toEqual([
      'state focus-unframed needs a focusable element, and it renders none',
    ]);
  });

  test('a key KeyHint cannot draw, and a related component with no metadata', () => {
    const accessibility: Accessibility = {
      ...button.accessibility,
      keyboard: [{ keys: ['return'], action: 'Not a key KeyHint knows.' }],
    };
    const related = [{ name: 'Tooltip', why: 'Not written yet.' }];
    expect(problems({ ...button, accessibility, related }, found)).toEqual([
      'key return is not a chord KeyHint can draw',
      'it names Tooltip, which has no metadata',
    ]);
  });
});

describe('what is extracted', () => {
  test("a rule is credited only when every hook in it is the component's (0192)", () => {
    const frame = {
      classes: new Set(['rk-screen', 'rk-frame', 'rk-content', 'rk-frame-box']),
      attributes: new Set(['data-rk-painted', 'data-rk-shape']),
    };
    const divider = {
      classes: new Set(['rk-screen', 'rk-frame', 'rk-divider']),
      attributes: frame.attributes,
    };
    // Another component's class in the selector: not this one's rule.
    expect(owns('.rk-callout > .rk-content', frame)).toBe(false);
    expect(owns('.rk-frame-box > .rk-frame', divider)).toBe(false);
    expect(owns('.rk-frame-box > .rk-frame', frame)).toBe(true);
    // The painter's hooks name no class, and are the painted component's.
    expect(owns('[data-rk-painted="rule"]', frame)).toBe(true);
    expect(owns('[data-rk-painted] [data-rk-shape="box-0110"]', frame)).toBe(true);
    // A state or a variant says when a rule applies, not whose it is.
    expect(owns('.rk-frame[data-hovered]', frame)).toBe(true);
    expect(owns('[data-hovered]', frame)).toBe(false);
    expect(owns(':focus-visible', frame)).toBe(false);
  });

  test("a painted component lists its stroke tokens, and not a neighbour's ground", () => {
    const { tokens } = byName('Frame');
    expect(tokens).toContain('--rk-stroke-glyph-light');
    expect(tokens).toContain('--rk-stroke-rule-light');
    // `.rk-callout > .rk-content` is Callout's, though Frame writes rk-content.
    expect(tokens).not.toContain('--rk-bg-surface');
  });

  test('tokens come from the stylesheets and the focus ring, and a local property is not one', () => {
    const { tokens } = byName('Button');
    expect(tokens).toContain('--rk-border-control');
    expect(tokens).toContain('--rk-border-focus');
    expect(tokens).not.toContain('--rk-button-end');
  });

  test('props come from the source, with their doc comments and defaults', () => {
    const list = byName('List').anatomy.find((p): p is ImportedPart => p.name === 'List');
    expect(list?.props.find((p) => p.name === 'rows')).toEqual({
      name: 'rows',
      type: 'number',
      required: false,
      default: '8',
      description: 'How many rows the viewport shows. The list is exactly this tall.',
    } satisfies PropMeta);
    expect(list?.inherits).toEqual(["Omit<ListBoxProps<T>, 'className' | 'style'>"]);
  });
});

describe('the snapshots, as the site draws them', () => {
  test('Button', () => {
    expect(snapshots(byName('Button'))).toMatchInlineSnapshot(`
      "── Variants
      default [ Publish ]
      fill    [ Publish ]
      danger  [!Publish ]
      ── Without delimiters
      default Publish
      danger  [!Discard ]
      ── With a shortcut
      [ Save Ctrl+S ]
      [ Save ⌘S ]"
    `);
  });

  test('Divider', () => {
    expect(snapshots(byName('Divider'))).toMatchInlineSnapshot(`
      "── Open and joined
      ╶──────────────────╴
      ├──────────────────┤
      ── Every border set
      ├──────────────────┤
      ╠══════════════════╣
      ┣━━━━━━━━━━━━━━━━━━┫
      +------------------+
      ── Labelled
      ╶─ files ──────────╴
      ╶───── files ──────╴
      ╶────────── files ─╴
      ├ files ───────────┤
      ├───── files ──────┤
      ├─────────── files ┤
      ╶─ a label far… ───╴
      ── Vertical
      ╷ ┬
      │ │
      │ │
      │ │
      ╵ ┴
      ── Under an ASCII theme
      -- a label far~ ----"
    `);
  });

  test('Fieldset', () => {
    expect(snapshots(byName('Fieldset'))).toMatchInlineSnapshot(`
      "── Every state
      ┌ Notify ──────────────┐
      │                      │
      └──────────────────────┘
      ┌ Notify* ─────────────┐
      │                      │
      └──────────────────────┘
      ┏ Notify ━━━━━━━━━━━━━━┓
      ┃                      ┃
      ┗━━━━━━━━━━━━━━━━━━━━━━┛
      ┏ Notify ━━━━━━━━━━━━━━┓
      ┃                      ┃
      ┗━━━━━━━━━━━━━━━━━━━━━━┛"
    `);
  });

  test('Form', () => {
    expect(snapshots(byName('Form'))).toMatchInlineSnapshot(`
      "── A form of mixed fields
      Name         [Ada Lovelace        ]

      Email*       [ada@                ]
                   Where the receipts go.
                   ✗ Enter an email address.

      Repository   [rockaway            ]

                   [✓] Sign commits

                   ┌ Notify* ────────────────────────────────────────┐
                   │ ● always  ○ never                               │
                   └─────────────────────────────────────────────────┘

                   [ Save ]
      ── Under 60 cells
      Name
      [Ada Lovelace        ]

      Email*
      [ada@                ]
      Where the receipts go.
      ✗ Enter an email address.

      Repository
      [rockaway            ]

      [✓] Sign commits

      ┌ Notify* ─────────────────────────────┐
      │ ● always  ○ never                    │
      └──────────────────────────────────────┘

      [ Save ]"
    `);
  });

  test('Frame', () => {
    expect(snapshots(byName('Frame'))).toMatchInlineSnapshot(`
      "── A titled frame with a divider
      ┌ tokens ──────────────────┐
      │                          │
      │                          │
      │                          │
      ├──────────────────────────┤
      │                          │
      └──────────────────────────┘
      ── Every border set
      ┌ single ──┐
      │          │
      └──────────┘
      ╔ double ══╗
      ║          ║
      ╚══════════╝
      ┏ heavy ━━━┓
      ┃          ┃
      ┗━━━━━━━━━━┛
      ╭ rounded ─╮
      │          │
      ╰──────────╯
      + ascii ---+
      |          |
      +----------+
      ── Titles
      ┌ start ───────────┐
      ┌───── center ─────┐
      ┌───────────── end ┐
      ┌ a title far to… ─┐
      ── Dividers in a lighter set
      ┏ heavy ━━━━━┓
      ┃            ┃
      ┠────────────┨
      ┃            ┃
      ┗━━━━━━━━━━━━┛
      ╔ double ════╗
      ║            ║
      ╟────────────╢
      ║            ║
      ╚════════════╝
      ── Under an ASCII theme
      + a title fa~ -+
      |              |
      +--------------+
      |              |
      +--------------+"
    `);
  });

  test('KeyHint', () => {
    expect(snapshots(byName('KeyHint'))).toMatchInlineSnapshot(`
      "── One chord, each keyboard
      ⌘S save
      Ctrl+S save
      ^S save
      ── A status bar
      ↑ move  Enter open  Esc close  Ctrl+Shift+K delete
      ── Under an ASCII theme
      Cmd+S save
      Shift+Up select
      S-Up select"
    `);
  });

  test('Table', () => {
    expect(snapshots(byName('Table'))).toMatchInlineSnapshot(`
      "── Three column kinds
      ┌ files ───────┬────────┬──────────────────┐
      │ Name        ▴│   Size │ Modified         │
      ├──────────────┼────────┼──────────────────┤
      │ LICENSE      │   1071 │ 2026-07-04       │
      │▸README.md    │    340 │ 2026-09-12       │
      │ package.json │     88 │ 2026-08-30       │
      │ src/index.ts │   1204 │ 2026-10-01       │
      └──────────────┴────────┴──────────────────┘
      ── Multi-select
      ┌───────────────┬────────┬─────────────────┐
      │  Name        ▴│   Size │ Modified        │
      ├───────────────┼────────┼─────────────────┤
      │  LICENSE      │   1071 │ 2026-07-04      │
      │▸✓README.md    │    340 │ 2026-09-12      │
      │  package.json │     88 │ 2026-08-30      │
      │ ✓src/index.ts │   1204 │ 2026-10-01      │
      └───────────────┴────────┴─────────────────┘
      ── Empty
      ┌──────┬────────┬──────────────────────────┐
      │ Name▴│   Size │ Modified                 │
      ├──────┴────────┴──────────────────────────┤
      │ Nothing here.                            │
      └──────────────────────────────────────────┘"
      `);
  });

  test('Keymap', () => {
    expect(snapshots(byName('Keymap'))).toMatchInlineSnapshot(`
      "── Help, on any keyboard but Apple’s
      Ctrl+K  Open the palette
      /       Search
      G H     Go home
      J       Next row
      K       Previous row
      ?       Show this help
      ── Help, on an Apple keyboard
      ⌘K   Open the palette
      /    Search
      G H  Go home
      J    Next row
      K    Previous row
      ?    Show this help"
    `);
  });

  test('Link', () => {
    expect(snapshots(byName('Link'))).toMatchInlineSnapshot(`
      "── In place, current, and opening a new tab
      rest      docs
      current  ▸docs
      new tab   docs↗"
    `);
  });

  test('List', () => {
    expect(snapshots(byName('List'))).toMatchInlineSnapshot(`
      "── Single select
      ▸src/index.ts    █
       src/buffer.ts   █
       src/junction.ts █
       src/layout.ts   █
       README.md       █
      ── Multi-select
        src/index.ts   █
       ✓src/buffer.ts  █
      ▸✓src/junction.ts█
        src/layout.ts  █
        README.md      █
      ── Scrolled
       line 8 of a ░
       line 9 of a ░
       line 10 of a░
       line 11 of a█
      ── Empty
       Nothing here.   █
                       █
                       █"
    `);
  });
});

// The JSON Schema and the types describe one shape. Each line fails to
// compile when a property is in one and not the other.
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Defs = (typeof schema)['$defs'];
type Keys<K extends keyof Defs> = Defs[K] extends { properties: infer P } ? keyof P : never;
type ItemKeys<T> = T extends readonly (infer I)[] ? keyof I : never;
type Nested<K extends keyof Defs, P extends string> = Defs[K] extends {
  properties: { [Q in P]: { items: { properties: infer I } } };
}
  ? keyof I
  : never;

const schemaMatchesTypes: readonly true[] = [
  true satisfies Same<keyof typeof metadata, Keys<'document'>>,
  true satisfies Same<keyof StateRow, Keys<'stateRow'>>,
  true satisfies Same<keyof ComponentMeta, Keys<'component'>>,
  true satisfies Same<ItemKeys<ComponentMeta['whenNotToUse']>, Nested<'component', 'whenNotToUse'>>,
  true satisfies Same<ItemKeys<ComponentMeta['related']>, Nested<'component', 'related'>>,
  true satisfies Same<keyof ImportedPart, Keys<'importedPart'>>,
  true satisfies Same<keyof ElementPart, Keys<'elementPart'>>,
  true satisfies Same<keyof PropMeta, Keys<'prop'>>,
  true satisfies Same<keyof VariantMeta, Keys<'variant'>>,
  true satisfies Same<ItemKeys<VariantMeta['values']>, Nested<'variant', 'values'>>,
  true satisfies Same<keyof StateMeta, Keys<'state'>>,
  true satisfies Same<keyof Accessibility, Keys<'accessibility'>>,
  true satisfies Same<keyof KeyBinding, Keys<'keyBinding'>>,
  true satisfies Same<keyof Snapshot, Keys<'snapshot'>>,
];
test('the schema and the types agree', () => {
  expect(schemaMatchesTypes.every(Boolean)).toBe(true);
});
