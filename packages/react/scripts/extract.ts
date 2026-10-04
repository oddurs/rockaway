/**
 * Reads what a component's metadata must not restate by hand (cairn 0047):
 * its props, from its TypeScript source, and the tokens it consumes, from the
 * stylesheets and painters it uses.
 *
 * Props are read from the syntax, not the type checker. TypeScript 7's
 * compiler API is native and offered only as `unstable`, and a generator built
 * on it would break with the compiler. `isolatedDeclarations` makes the syntax
 * enough: every exported declaration spells its own type, so a props
 * interface says, in its source, exactly what a reader needs. Oxc parses it.
 * The cost is that a type is shown as written (`ButtonVariant`, not its
 * union), and that a props type inherited from a library is named rather than
 * expanded — `inherits` lists those.
 *
 * Tokens are every `var(--rk-*)` read by a rule that selects one of the
 * component's classes, and by the painters it draws with, and every colour
 * its buffer functions give a cell (`border.default`), kept when the
 * custom property is a token: declared by `@rockaway/tokens`, or in the
 * `rk.tokens` layer of `@rockaway/css`. A component's own custom properties
 * (`--rk-button-end`) are not tokens and are left out.
 *
 * What the conformance levels see a component as is read from the attributes
 * its source writes: `data-rk-control`, `data-rk-pane` (0182). The level it
 * holds is read from the workbench's stories (0167): the strictest level of
 * any story that renders it with the conformance check on. Every story's
 * check must pass in CI, so a component in a passing `strict` story has been
 * held to `strict`, and the level cannot claim more than the stories prove.
 *
 * This runs in Node, so the published metadata cannot call it: the generator
 * writes its results to `src/metadata/extracted.ts`, and a test fails if that
 * file is stale.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSync } from 'oxc-parser';
import postcss, { type AtRule, type Node as CssNode, type Rule } from 'postcss';
import type {
  ConformanceLevel,
  ExtractedPart,
  GridMark,
  PropMeta,
} from '../src/metadata/schema.ts';

const require = createRequire(import.meta.url);

export const packageRoot: string = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.join(packageRoot, 'src');
const componentsDir = path.join(sourceRoot, 'components');
const storiesRoot = path.join(packageRoot, '..', '..', 'apps', 'workbench', 'src');
const cssRoot = path.join(path.dirname(require.resolve('@rockaway/css/package.json')), 'src');
const tokensCss = require.resolve('@rockaway/tokens/tokens.css');

/** What the tests also need: the evidence a part or a state is real. */
export interface Analysis extends ExtractedPart {
  /** Every `rk-*` class the component's sources write. */
  readonly classes: readonly string[];
  /** Every selector, in full, of a rule that is the component's own (see `owns`). */
  readonly selectors: readonly string[];
}

interface AstNode {
  readonly type: string;
  readonly start: number;
  readonly end: number;
  readonly [key: string]: unknown;
}

function* walk(node: unknown): Generator<AstNode> {
  if (Array.isArray(node)) {
    for (const child of node) yield* walk(child);
    return;
  }
  if (node === null || typeof node !== 'object') return;
  const ast = node as AstNode;
  if (typeof ast.type === 'string') yield ast;
  for (const value of Object.values(ast)) {
    if (typeof value === 'object') yield* walk(value);
  }
}

interface Parsed {
  readonly file: string;
  readonly source: string;
  readonly body: readonly AstNode[];
  readonly comments: readonly {
    readonly value: string;
    readonly start: number;
    readonly end: number;
  }[];
}

function parse(file: string): Parsed {
  const source = readFileSync(file, 'utf8');
  const result = parseSync(file, source);
  if (result.errors.length > 0) {
    throw new Error(`${file}: ${result.errors.map((error) => error.message).join('; ')}`);
  }
  return {
    file,
    source,
    body: result.program.body as unknown as AstNode[],
    comments: result.comments,
  };
}

const text = (parsed: Parsed, node: { start: number; end: number }): string =>
  parsed.source.slice(node.start, node.end);

/** The declaration a top-level statement makes, exported or not. */
function declarationOf(statement: AstNode): AstNode | undefined {
  if (statement.type === 'ExportNamedDeclaration') {
    return (statement.declaration as AstNode | null) ?? undefined;
  }
  return statement;
}

/** The doc comment directly above a node, as plain text. */
function docComment(parsed: Parsed, node: AstNode): string | undefined {
  const comment = parsed.comments.findLast((c) => c.end <= node.start);
  if (!comment?.value.startsWith('*')) return undefined;
  if (parsed.source.slice(comment.end, node.start).trim() !== '') return undefined;
  return comment.value
    .split('\n')
    .map((line) => line.replace(/^\s*\*?\s?/, '').trimEnd())
    .join('\n')
    .replace(/^\*\s*/, '')
    .trim()
    .replace(/\n(?!\n)/g, ' ')
    .replace(/ {2,}/g, ' ');
}

function interfacesOf(parsed: Parsed): Map<string, AstNode> {
  const found = new Map<string, AstNode>();
  for (const statement of parsed.body) {
    const declaration = declarationOf(statement);
    if (declaration?.type === 'TSInterfaceDeclaration') {
      found.set((declaration.id as { name: string }).name, declaration);
    }
  }
  return found;
}

/**
 * Type aliases that are a union of literals (`type Orientation = 'horizontal'
 * | 'vertical'`), so a prop typed by one shows its values rather than a name.
 */
function aliasesOf(parsed: Parsed): Map<string, string> {
  const found = new Map<string, string>();
  for (const statement of parsed.body) {
    const declaration = declarationOf(statement);
    if (declaration?.type !== 'TSTypeAliasDeclaration') continue;
    const type = declaration.typeAnnotation as AstNode;
    const members = type.type === 'TSUnionType' ? (type.types as AstNode[]) : [type];
    if (members.every((member) => member.type === 'TSLiteralType')) {
      found.set((declaration.id as { name: string }).name, text(parsed, type));
    }
  }
  return found;
}

/** A type as written, with literal-union aliases spelled out. */
function typeText(parsed: Parsed, node: AstNode, aliases: Map<string, string>): string {
  if (node.type === 'TSUnionType') {
    return (node.types as AstNode[]).map((member) => typeText(parsed, member, aliases)).join(' | ');
  }
  if (node.type === 'TSTypeReference' && node.typeArguments === null) {
    const name = node.typeName as { type: string; name?: string };
    const alias = name.type === 'Identifier' ? aliases.get(name.name ?? '') : undefined;
    if (alias !== undefined) return alias;
  }
  return text(parsed, node).replace(/\s+/g, ' ');
}

/** Top-level `const NAME = <literal>`, so a default written as a constant reads as its value. */
function constantsOf(parsed: Parsed): Map<string, string> {
  const found = new Map<string, string>();
  for (const statement of parsed.body) {
    const declaration = declarationOf(statement);
    if (declaration?.type !== 'VariableDeclaration') continue;
    for (const declarator of declaration.declarations as AstNode[]) {
      const id = declarator.id as AstNode & { name?: string };
      const init = declarator.init as AstNode | null;
      if (id.type === 'Identifier' && id.name !== undefined && init !== null) {
        found.set(id.name, text(parsed, init));
      }
    }
  }
  return found;
}

/**
 * An interface's members, with those of the interfaces it extends from the
 * same file folded in first. Anything it extends from elsewhere is named.
 */
function membersOf(
  parsed: Parsed,
  declaration: AstNode,
  interfaces: Map<string, AstNode>,
  aliases: Map<string, string>,
): { props: PropMeta[]; inherits: string[] } {
  const props: PropMeta[] = [];
  const inherits: string[] = [];
  for (const heritage of (declaration.extends as AstNode[] | null) ?? []) {
    const expression = heritage.expression as AstNode & { name?: string };
    const local =
      expression.type === 'Identifier' && heritage.typeArguments === null
        ? interfaces.get(expression.name ?? '')
        : undefined;
    if (local) {
      const inner = membersOf(parsed, local, interfaces, aliases);
      props.push(...inner.props);
      inherits.push(...inner.inherits);
    } else {
      inherits.push(text(parsed, heritage).replace(/\s+/g, ' '));
    }
  }
  for (const member of (declaration.body as { body: AstNode[] }).body) {
    if (member.type !== 'TSPropertySignature') continue;
    const key = member.key as AstNode & { name?: string; value?: unknown };
    const name = key.type === 'Identifier' ? (key.name ?? '') : String(key.value);
    const annotation = member.typeAnnotation as { typeAnnotation: AstNode } | null;
    const description = docComment(parsed, member);
    const prop: PropMeta = {
      name,
      type: annotation ? typeText(parsed, annotation.typeAnnotation, aliases) : 'unknown',
      required: member.optional !== true,
      ...(description === undefined ? {} : { description }),
    };
    // A redeclared member is the narrower one: keep the last, in its first place.
    const at = props.findIndex((p) => p.name === name);
    if (at === -1) props.push(prop);
    else props[at] = prop;
  }
  return { props, inherits };
}

/** Defaults written where the component destructures its props: `{ rows = 8 }`. */
function defaultsOf(
  parsed: Parsed,
  fn: AstNode,
  constants: Map<string, string>,
): Map<string, string> {
  const found = new Map<string, string>();
  const [first] = fn.params as AstNode[];
  if (first?.type !== 'ObjectPattern') return found;
  for (const property of first.properties as AstNode[]) {
    if (property.type !== 'Property') continue;
    const value = property.value as AstNode;
    const key = property.key as { name?: string };
    if (value.type !== 'AssignmentPattern' || key.name === undefined) continue;
    const right = value.right as AstNode & { name?: string };
    const written = text(parsed, right);
    found.set(
      key.name,
      right.type === 'Identifier' ? (constants.get(right.name ?? '') ?? written) : written,
    );
  }
  return found;
}

/** The props type a component function takes: `ListProps<T>` names `ListProps`. */
function propsTypeOf(fn: AstNode): string | undefined {
  const [first] = fn.params as AstNode[];
  const annotation = (first?.typeAnnotation as { typeAnnotation: AstNode } | null)?.typeAnnotation;
  if (annotation?.type !== 'TSTypeReference') return undefined;
  const name = annotation.typeName as { type: string; name?: string };
  return name.type === 'Identifier' ? name.name : undefined;
}

/** The local modules a file imports, other than other components. */
function localImports(parsed: Parsed): string[] {
  const found: string[] = [];
  for (const statement of parsed.body) {
    if (statement.type !== 'ImportDeclaration') continue;
    const from = (statement.source as { value: string }).value;
    if (!from.startsWith('.')) continue;
    const resolved = path.resolve(path.dirname(parsed.file), from);
    // A component it composes is its own entry, with its own tokens.
    if (path.dirname(resolved) === componentsDir) continue;
    found.push(resolved);
  }
  return found;
}

/** The component file and every non-component module it reaches. */
function sourcesOf(file: string): Parsed[] {
  const seen = new Map<string, Parsed>();
  const visit = (next: string): void => {
    if (seen.has(next)) return;
    const parsed = parse(next);
    seen.set(next, parsed);
    for (const imported of localImports(parsed)) visit(imported);
  };
  visit(file);
  return [...seen.values()];
}

/** Every string a module writes: literals, and the fixed parts of template strings. */
function stringsOf(parsed: Parsed): string[] {
  const found: string[] = [];
  for (const node of walk(parsed.body)) {
    if (node.type === 'Literal' && typeof node.value === 'string') found.push(node.value);
    if (node.type === 'TemplateElement') {
      found.push((node.value as { cooked: string | null }).cooked ?? '');
    }
    if (node.type === 'JSXText') found.push(String(node.value));
  }
  return found;
}

const VAR = /var\(\s*(--rk-[a-z0-9-]+)/g;

/**
 * A colour a buffer function gives a cell, as the engine names it
 * (`border.default`), which a painter turns into `var(--rk-border-default)`.
 */
const STYLE_TOKEN = /^(?:fg|bg|border)(?:\.[a-z0-9-]+)+$/;
const CLASS = /^rk-[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface Stylesheet {
  readonly file: string;
  readonly rules: readonly { readonly selector: string; readonly vars: readonly string[] }[];
}

/**
 * Each selector a rule applies to, in full, nesting included. A selector list
 * is split: `.a, .rk-button[data-pressed]` is two selectors, and only one of
 * them is Button's.
 */
function selectorsOf(rule: Rule): string[] {
  const parents: string[] = [];
  for (let node: CssNode | undefined = rule.parent; node; node = node.parent) {
    if (node.type === 'rule') parents.unshift((node as Rule).selector);
  }
  return rule.selectors.map((one) => [...parents, one].join(' ').replace(/\s+/g, ' '));
}

function cssFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return cssFiles(full);
    return entry.name.endsWith('.css') ? [full] : [];
  });
}

let sheets: readonly Stylesheet[] | undefined;
let tokenNames: ReadonlySet<string> | undefined;

/** Every rule in `@rockaway/css`, with the custom properties its declarations read. */
function stylesheets(): readonly Stylesheet[] {
  sheets ??= cssFiles(cssRoot)
    .sort()
    .map((file) => {
      const rules: { selector: string; vars: string[] }[] = [];
      postcss.parse(readFileSync(file, 'utf8'), { from: file }).walkRules((rule) => {
        const vars: string[] = [];
        rule.each((child) => {
          if (child.type === 'decl')
            vars.push(...[...child.value.matchAll(VAR)].map((m) => m[1] ?? ''));
        });
        for (const selector of selectorsOf(rule)) rules.push({ selector, vars });
      });
      return { file: path.relative(cssRoot, file), rules };
    });
  return sheets;
}

function inTokensLayer(node: CssNode): boolean {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (parent.type === 'atrule' && (parent as AtRule).name === 'layer') {
      return (parent as AtRule).params.trim() === 'rk.tokens';
    }
  }
  return false;
}

/** The custom properties that are tokens: the tokens package's, and the `rk.tokens` layer's. */
function tokens(): ReadonlySet<string> {
  if (tokenNames) return tokenNames;
  const names = new Set<string>();
  postcss.parse(readFileSync(tokensCss, 'utf8')).walk((node) => {
    if (node.type === 'decl' && node.prop.startsWith('--rk-')) names.add(node.prop);
    if (node.type === 'atrule' && node.name === 'property') names.add(node.params.trim());
  });
  for (const file of cssFiles(cssRoot)) {
    postcss.parse(readFileSync(file, 'utf8')).walkDecls((decl) => {
      if (decl.prop.startsWith('--rk-') && inTokensLayer(decl)) names.add(decl.prop);
    });
  }
  tokenNames = names;
  return names;
}

/**
 * The data attributes a module writes: a JSX `data-*` prop, `el.dataset.rkShape`
 * and a `'data-*'` string. The painters write their hooks this way
 * (`data-rk-painted`, `data-rk-shape`), and the stylesheets select them.
 */
function attributesOf(parsed: Parsed): string[] {
  const found = new Set<string>();
  for (const node of walk(parsed.body)) {
    if (node.type === 'JSXAttribute') {
      const name = node.name as { type: string; name?: string };
      if (name.type === 'JSXIdentifier' && name.name?.startsWith('data-')) found.add(name.name);
    }
    if (node.type === 'MemberExpression' && node.computed === false) {
      const object = node.object as AstNode & { property?: { name?: string } };
      const property = node.property as { name?: string };
      if (
        object.type === 'MemberExpression' &&
        object.property?.name === 'dataset' &&
        property.name
      ) {
        found.add(`data-${property.name.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`)}`);
      }
    }
    if (
      node.type === 'Literal' &&
      typeof node.value === 'string' &&
      /^data-[a-z0-9-]+$/.test(node.value)
    ) {
      found.add(node.value);
    }
  }
  return [...found];
}

/**
 * Whether a rule is the component's own (0192). A selector says whose it is by
 * its hooks: the `rk-*` classes and the `data-rk-*` attributes in it, which
 * rockaway's own code writes. It is the component's when it has at least one
 * hook and the component writes every one of them. So `.rk-frame-box >
 * .rk-frame` is not Divider's, though Divider writes `rk-frame`, and
 * `[data-rk-painted] [data-rk-shape]` is the painted components', though it
 * names no class. React Aria's state attributes and the variants are not
 * hooks: they say when a rule applies, not whose it is.
 */
export function owns(
  selector: string,
  hooks: { readonly classes: ReadonlySet<string>; readonly attributes: ReadonlySet<string> },
): boolean {
  const classes = [...selector.matchAll(/\.(rk-[a-z0-9]+(?:-[a-z0-9]+)*)/g)].map((m) => m[1] ?? '');
  const attributes = [...selector.matchAll(/\[(data-rk-[a-z0-9-]+)/g)].map((m) => m[1] ?? '');
  if (classes.length + attributes.length === 0) return false;
  return (
    classes.every((c) => hooks.classes.has(c)) && attributes.every((a) => hooks.attributes.has(a))
  );
}

/** Every exported component in `src/components`, read from its source and its stylesheets. */
export function analyse(): Map<string, Analysis> {
  const found = new Map<string, Analysis>();
  const files = readdirSync(componentsDir)
    .filter((name) => name.endsWith('.tsx'))
    .sort();
  // Aliases are shared: Button's `platform` is typed by KeyHint's `Platform`.
  const aliases = new Map(
    files.flatMap((name) => [...aliasesOf(parse(path.join(componentsDir, name)))]),
  );
  for (const name of files) {
    const file = path.join(componentsDir, name);
    const sources = sourcesOf(file);
    const [own] = sources;
    if (!own) continue;

    const strings = sources.flatMap(stringsOf);
    const classes = [
      ...new Set(strings.flatMap((s) => s.split(/\s+/)).filter((s) => CLASS.test(s))),
    ].sort();
    const hooks = {
      classes: new Set(classes),
      attributes: new Set(sources.flatMap(attributesOf)),
    };
    const rules = stylesheets().flatMap((sheet) =>
      sheet.rules.filter((rule) => owns(rule.selector, hooks)),
    );
    const known = tokens();
    const read = [
      ...rules.flatMap((rule) => rule.vars),
      ...strings.flatMap((s) => [...s.matchAll(VAR)].map((m) => m[1] ?? '')),
      ...strings.filter((s) => STYLE_TOKEN.test(s)).map((s) => `--rk-${s.replaceAll('.', '-')}`),
    ];
    const consumed = [...new Set(read.filter((v) => known.has(v)))].sort();
    const selectors = [...new Set(rules.map((rule) => rule.selector))];

    const interfaces = interfacesOf(own);
    const constants = constantsOf(own);
    for (const statement of own.body) {
      if (statement.type !== 'ExportNamedDeclaration') continue;
      const fn = statement.declaration as AstNode | null;
      if (fn?.type !== 'FunctionDeclaration') continue;
      const exported = (fn.id as { name: string }).name;
      if (!/^[A-Z]/.test(exported)) continue;
      const propsType = propsTypeOf(fn);
      const declaration = propsType === undefined ? undefined : interfaces.get(propsType);
      const members = declaration
        ? membersOf(own, declaration, interfaces, aliases)
        : { props: [], inherits: propsType === undefined ? [] : [propsType] };
      const defaults = defaultsOf(own, fn, constants);
      found.set(exported, {
        file: name,
        props: members.props.map((prop) => {
          const value = defaults.get(prop.name);
          return value === undefined ? prop : { ...prop, default: value };
        }),
        inherits: members.inherits,
        tokens: consumed,
        marks: marksOf(hooks.attributes),
        classes,
        selectors,
      });
    }
  }
  const held = levelsFromStories(new Set(found.keys()));
  for (const [name, part] of found) {
    const level = held.get(name);
    if (level !== undefined) found.set(name, { ...part, level });
  }
  return found;
}

/** What the conformance levels see a component as, by the attributes it writes (0182). */
function marksOf(attributes: ReadonlySet<string>): GridMark[] {
  return (['control', 'pane'] as const).filter((mark) => attributes.has(`data-rk-${mark}`));
}

const LEVELS: readonly ConformanceLevel[] = ['loose', 'standard', 'strict'];

/** A property of an object literal, by name. */
function property(object: AstNode | undefined, name: string): AstNode | undefined {
  if (object?.type !== 'ObjectExpression') return undefined;
  for (const prop of object.properties as AstNode[]) {
    if (prop.type !== 'Property') continue;
    const key = prop.key as { name?: string; value?: unknown };
    if (key.name === name || key.value === name) return prop.value as AstNode;
  }
  return undefined;
}

/** An initialiser with its `satisfies` or `as` taken off. */
function bare(node: AstNode | undefined): AstNode | undefined {
  let at = node;
  while (at && (at.type === 'TSSatisfiesExpression' || at.type === 'TSAsExpression')) {
    at = at.expression as AstNode;
  }
  return at;
}

/** A story's (or a meta's) settings for the conformance check. */
function conformanceOf(object: AstNode | undefined): {
  readonly level?: ConformanceLevel;
  readonly off?: boolean;
} {
  const level = property(property(object, 'globals'), 'conformance') as
    | { value?: unknown }
    | undefined;
  const check = property(property(object, 'parameters'), 'conformance') as
    | { value?: unknown }
    | undefined;
  return {
    ...(LEVELS.includes(level?.value as ConformanceLevel)
      ? { level: level?.value as ConformanceLevel }
      : {}),
    ...(typeof check?.value === 'boolean' ? { off: check.value === false } : {}),
  };
}

/**
 * The components a piece of a story file renders, by their JSX names,
 * following a component the file defines itself (`<RealPage />`) into its body.
 */
function rendered(
  node: AstNode | undefined,
  components: ReadonlySet<string>,
  locals: ReadonlyMap<string, AstNode> = new Map(),
  seen: Set<string> = new Set(),
): Set<string> {
  const found = new Set<string>();
  for (const at of walk(node)) {
    if (at.type !== 'JSXOpeningElement') continue;
    const name = (at.name as { type: string; name?: string }).name;
    if (name === undefined) continue;
    if (components.has(name)) found.add(name);
    const local = locals.get(name);
    if (local !== undefined && !seen.has(name)) {
      seen.add(name);
      for (const inner of rendered(local, components, locals, seen)) found.add(inner);
    }
  }
  return found;
}

/** The functions a story file defines at its top level, by name: its own wrappers. */
function localFunctions(parsed: Parsed): Map<string, AstNode> {
  const found = new Map<string, AstNode>();
  for (const statement of parsed.body) {
    const declaration =
      statement.type === 'ExportNamedDeclaration'
        ? (statement.declaration as AstNode | null)
        : statement;
    if (declaration?.type === 'FunctionDeclaration') {
      const name = (declaration.id as { name?: string } | null)?.name;
      if (name !== undefined) found.set(name, declaration);
    }
    if (declaration?.type === 'VariableDeclaration') {
      for (const d of declaration.declarations as AstNode[]) {
        const init = d.init as AstNode | undefined;
        const name = (d.id as { name?: string }).name;
        if (
          name !== undefined &&
          (init?.type === 'ArrowFunctionExpression' || init?.type === 'FunctionExpression')
        ) {
          found.set(name, init);
        }
      }
    }
  }
  return found;
}

function storyFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return storyFiles(full);
      return entry.name.endsWith('.stories.tsx') ? [full] : [];
    })
    .sort();
}

/**
 * The strictest level each component is rendered at, with the conformance
 * check on, in any story in the workbench (0167). A story that turns the
 * check off proves nothing, and is skipped. A story with no render of its own
 * renders its meta's, or its meta's component.
 */
export function levelsFromStories(
  components: ReadonlySet<string>,
  root: string = storiesRoot,
): Map<string, ConformanceLevel> {
  const held = new Map<string, ConformanceLevel>();
  for (const file of storyFiles(root)) {
    const parsed = parse(file);
    const declarators = parsed.body.flatMap((statement) => {
      const declaration =
        statement.type === 'ExportNamedDeclaration'
          ? (statement.declaration as AstNode | null)
          : statement;
      if (declaration?.type !== 'VariableDeclaration') return [];
      return (declaration.declarations as AstNode[]).map((d) => ({
        exported: statement.type === 'ExportNamedDeclaration',
        name: (d.id as { name?: string }).name,
        init: bare(d.init as AstNode | undefined),
      }));
    });
    const meta = declarators.find((d) => !d.exported && d.name === 'meta')?.init;
    const metaCheck = conformanceOf(meta);
    const metaComponent = (property(meta, 'component') as { name?: string } | undefined)?.name;
    const locals = localFunctions(parsed);
    const metaRenders = rendered(property(meta, 'render'), components, locals);
    for (const story of declarators) {
      if (!story.exported || story.init?.type !== 'ObjectExpression') continue;
      const own = conformanceOf(story.init);
      if (own.off ?? metaCheck.off ?? false) continue;
      const level = own.level ?? metaCheck.level ?? 'standard';
      let shown = rendered(story.init, components, locals);
      if (shown.size === 0) shown = metaRenders;
      if (shown.size === 0 && metaComponent !== undefined) {
        shown = components.has(metaComponent)
          ? new Set([metaComponent])
          : rendered(locals.get(metaComponent), components, locals);
      }
      for (const name of shown) {
        const before = held.get(name);
        if (before === undefined || LEVELS.indexOf(level) > LEVELS.indexOf(before)) {
          held.set(name, level);
        }
      }
    }
  }
  return held;
}

/**
 * The tokens the focus ring reads. It is drawn by `@rockaway/css` for every
 * focusable element (0118's `focus-unframed`), so it is in no component's
 * stylesheet, and a component that has the state consumes these as well.
 */
export function focusRingTokens(): string[] {
  const known = tokens();
  const read = stylesheets().flatMap((sheet) =>
    sheet.rules.filter((rule) => rule.selector === ':focus-visible').flatMap((rule) => rule.vars),
  );
  return [...new Set(read.filter((v) => known.has(v)))].sort();
}

/** The part of the analysis that is published, in a stable order. */
export function extract(): Record<string, ExtractedPart> {
  return Object.fromEntries(
    [...analyse()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, { file, props, inherits, tokens: consumed, marks, level }]) => [
        name,
        {
          file,
          props,
          inherits,
          tokens: consumed,
          marks,
          ...(level === undefined ? {} : { level }),
        },
      ]),
  );
}

/**
 * Every `*.meta.ts` beside a component, with the metadata it exports: the
 * registry `src/metadata/components.ts` is written from this, so no one adds
 * a line to a shared list by hand.
 */
export function metaFiles(): { readonly file: string; readonly name: string }[] {
  return readdirSync(componentsDir)
    .filter((file) => file.endsWith('.meta.ts'))
    .sort()
    .map((file) => {
      const parsed = parse(path.join(componentsDir, file));
      const names = parsed.body.flatMap((statement) => {
        if (statement.type !== 'ExportNamedDeclaration') return [];
        const declaration = statement.declaration as AstNode | null;
        if (declaration?.type !== 'VariableDeclaration') return [];
        return (declaration.declarations as AstNode[])
          .map((d) => (d.id as { name?: string }).name ?? '')
          .filter((name) => /Meta$/.test(name));
      });
      if (names.length !== 1) {
        throw new Error(`${file} must export exactly one \`…Meta\`, and exports ${names.length}.`);
      }
      return { file: file.replace(/\.meta\.ts$/, ''), name: names[0] ?? '' };
    });
}

/** The generated registry, as it is written to disk. */
export function renderRegistry(): string {
  const files = metaFiles();
  return `/**
 * Generated by \`pnpm --filter @rockaway/react metadata\` from the \`*.meta.ts\`
 * files in src/components (scripts/extract.ts). Do not edit: add a component's
 * \`.meta.ts\` and regenerate. On a merge conflict, take either side and
 * regenerate. A test fails when this is stale.
 */
${files.map(({ file, name }) => `import { ${name} } from '../components/${file}.meta.ts';`).join('\n')}
import type { ComponentMetaInput } from './schema.ts';

/** Every component's metadata, by the file it is written in. */
export const registry: readonly { readonly file: string; readonly meta: ComponentMetaInput }[] = [
${files.map(({ file, name }) => `  { file: '${file}', meta: ${name} },`).join('\n')}
];
`;
}

/** The generated module, as it is written to disk. */
export function render(): string {
  return `/**
 * Generated by \`pnpm --filter @rockaway/react metadata\` from the components'
 * TypeScript source and the stylesheets they use (scripts/extract.ts). Do not
 * edit: change the source, then regenerate. A test fails when this is stale.
 */
import type { ExtractedPart } from './schema.ts';

export const extracted: { readonly [component: string]: ExtractedPart } = ${JSON.stringify(extract(), null, 2)};

/** The tokens the focus ring reads, for a component with the \`focus-unframed\` state. */
export const focusRingTokens: readonly string[] = ${JSON.stringify(focusRingTokens(), null, 2)};
`;
}
