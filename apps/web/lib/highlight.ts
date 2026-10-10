/**
 * Code highlighting in the ANSI 16 (cairn 0144).
 *
 * Shiki tokenises at build time, so no highlighter ships to the reader. Its
 * theme is not a palette: each TextMate scope maps to a role in the system's
 * `syntax.*` tokens, and the transformer below turns what Shiki writes into a
 * class per role, `rk-syntax-keyword`, that `@rockaway/css` colours. The page
 * carries no colour of its own, so the theme switcher and the mode recolour
 * code like everything else.
 */

import { type SyntaxRole, syntaxRoles } from '@rockaway/tokens';
import type { Element, ElementContent } from 'hast';
import type { ShikiTransformer, ThemeRegistration } from 'shiki';

type Theme = ThemeRegistration;
type Transformer = ShikiTransformer;

/** How terminal editors colour code, by TextMate scope. The most specific scope wins. */
export const scopes: Readonly<Record<Exclude<SyntaxRole, 'plain'>, readonly string[]>> = {
  comment: ['comment', 'punctuation.definition.comment'],
  keyword: [
    'keyword',
    'storage.type',
    'storage.modifier',
    'keyword.operator.new',
    'keyword.operator.expression',
    'variable.language',
  ],
  string: ['string', 'punctuation.definition.string', 'string.template'],
  constant: [
    'constant.numeric',
    'constant.language',
    'constant.other',
    'support.constant',
    'keyword.other.unit',
  ],
  function: ['entity.name.function', 'support.function', 'variable.function'],
  type: [
    'entity.name.type',
    'entity.name.class',
    'entity.other.inherited-class',
    'support.type',
    'support.class',
    'entity.name.tag',
  ],
  attribute: [
    'entity.other.attribute-name',
    'support.type.property-name',
    'meta.object-literal.key',
  ],
  regexp: ['string.regexp', 'constant.character.escape'],
  inserted: ['markup.inserted'],
  deleted: ['markup.deleted'],
  error: ['invalid', 'invalid.illegal'],
};

/**
 * Scopes that would otherwise inherit a colour they should not have: an
 * operator is punctuation, not a keyword. TextMate gives a token the most
 * specific scope that matches it, so `keyword.operator.new` above is still a
 * keyword and `punctuation.definition.string` still a string.
 */
const plain: readonly string[] = ['keyword.operator', 'punctuation', 'meta.brace'];

/** A role, written where a colour goes, so the transformer can read it back. */
const colour = (role: SyntaxRole): string => `var(--rk-syntax-${role})`;

export const ansiTheme: Theme = {
  name: 'rockaway-ansi',
  type: 'dark',
  colors: { 'editor.foreground': colour('plain'), 'editor.background': 'transparent' },
  tokenColors: [
    { scope: [...plain], settings: { foreground: colour('plain') } },
    ...Object.entries(scopes).map(([role, scope]) => ({
      scope: [...scope],
      settings: { foreground: colour(role as SyntaxRole) },
    })),
  ],
};

const roleIn = (style: unknown): SyntaxRole | undefined => {
  const match = typeof style === 'string' ? /--rk-syntax-([a-z]+)/.exec(style) : null;
  const role = match?.[1] as SyntaxRole | undefined;
  return role && syntaxRoles.includes(role) ? role : undefined;
};

/**
 * Shiki's inline styles become classes: `rk-syntax-<role>` for a token with a
 * role, nothing at all for plain text, which takes the block's colour. The
 * block itself keeps only its language.
 */
export const roleClasses: Transformer = {
  name: 'rockaway:syntax-roles',
  pre(node: Element) {
    const language = node.properties.dataLanguage;
    node.properties = {
      tabIndex: 0,
      ...(language === undefined ? {} : { dataLanguage: language }),
    };
  },
  span(node: Element) {
    const role = roleIn(node.properties.style);
    node.properties = role && role !== 'plain' ? { className: [`rk-syntax-${role}`] } : {};
  },
  // Once every line is done, Astro's own transformer included.
  code(node: Element) {
    unwrap(node);
  },
};

/**
 * A span with nothing on it says nothing: keep its text, lose the element.
 * Astro also sets a diff's `+` and `-` apart with `user-select: none`, which
 * would make a copied diff lose them; they are the diff, so they stay text.
 */
function unwrap(node: Element): void {
  node.children = node.children.flatMap((child): ElementContent[] => {
    if (child.type !== 'element' || child.tagName !== 'span') return [child];
    unwrap(child);
    const { style, ...rest } = child.properties;
    const hidden = typeof style === 'string' && style.includes('user-select');
    return Object.keys(rest).length === 0 && (style === undefined || hidden)
      ? child.children
      : [child];
  });
}
