---
"@rockaway/react": minor
"@rockaway/css": minor
"@rockaway/tokens": minor
---

Add `Breadcrumbs` (0319): where a page sits, as a path on one row. Each level is a Link, drawn through the app's own link component. The theme's new `separator` mark goes between levels, with a cell of air either side, and the current page comes last: bold and not a link. A path longer than `maxItems` folds its middle into the theme's ellipsis, a one-cell button that opens a Menu of the hidden levels. `breadcrumbsBuffer` draws one as text, and `foldPath` does the folding.
