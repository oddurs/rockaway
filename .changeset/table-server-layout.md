---
'@rockaway/react': patch
---

`Table` now draws its real columns, its rules and its title on the server and in the first paint, before any script runs. It used to learn its columns only from React Aria's collection after mounting, so a page with no script showed a frame with no columns and no room for its title. It reads the columns and the rows from the elements it is given (static rows, or a body of `items` rendered by a function), in the same shape it measures them in later, so nothing moves when the page hydrates.
