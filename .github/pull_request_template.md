## What and why

<!-- What changes, and why. Which cairn item does it close? `Closes cairn 00NN` -->

## Checklist

- [ ] `pnpm check` passes
- [ ] A changeset, if a published package changed. It begins `Breaking:` if something public is removed or renamed ([docs/public-api.md](../docs/public-api.md))
- [ ] Any `API.md` diff is intended (`pnpm api:write` rewrites them)
- [ ] The cairn item's criteria are ticked, and it is closed

## For a component: the ten rules

<!-- From the end of docs/concept.md. Delete this section if the PR adds or changes no component. -->

- [ ] 1. Sized in cells, drawn by the frame engine; no box characters written by hand
- [ ] 2. Both painters render it identically, measured in cells
- [ ] 3. Chrome is `aria-hidden`; the accessible name never contains a glyph
- [ ] 4. Behaviour comes from React Aria; no hand-rolled focus or keyboard logic
- [ ] 5. Styled from `data-*` state and semantic tokens only
- [ ] 6. Ships a text snapshot
- [ ] 7. Conforms at `strict`, or declares its exception with a reason
- [ ] 8. Operable by keyboard alone, and usable with a finger at touch density
- [ ] 9. State reads without colour: an attribute or a mark carries it too
- [ ] 10. axe passes in light, dark and forced colours
