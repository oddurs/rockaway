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
import type { ExtractedPart, PropMeta } from '../src/metadata/schema.ts';

const require = createRequire(import.meta.url);

export const packageRoot: string = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.join(packageRoot, 'src');
const componentsDir = path.join(sourceRoot, 'components');
const cssRoot = path.join(path.dirname(require.resolve('@rockaway/css/package.json')), 'src');
const tokensCss = require.resolve('@rockaway/tokens/tokens.css');

/** What the tests also need: the evidence a part or a state is real. */
export interface Analysis extends ExtractedPart {
  /** Every `rk-*` class the component's sources write. */
  readonly classes: readonly string[];
  /** Every selector, in full, of a rule that selects one of those classes. */
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

function selects(selector: string, className: string): boolean {
  return new RegExp(`\\.${className}(?![a-z0-9-])`).test(selector);
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
    const rules = stylesheets().flatMap((sheet) =>
      sheet.rules.filter((rule) => classes.some((c) => selects(rule.selector, c))),
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
        classes,
        selectors,
      });
    }
  }
  return found;
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
      .map(([name, { file, props, inherits, tokens: consumed }]) => [
        name,
        { file, props, inherits, tokens: consumed },
      ]),
  );
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
