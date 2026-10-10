/**
 * The visually hidden pattern: an element clipped to nothing, still in the
 * accessibility tree and the tab order, and seen by no one.
 *
 * React Aria's `VisuallyHidden` writes it on the native inputs of a checkbox
 * or a radio, and a skip link wears it until it has focus. Both the target
 * check and the text screenshot have to read it as hidden, and they read it
 * the same way, here.
 */
export function visuallyHidden(style: CSSStyleDeclaration): boolean {
  return style.clipPath.startsWith('inset(50%') || style.clip === 'rect(0px, 0px, 0px, 0px)';
}
