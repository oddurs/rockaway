---
'@rockaway/react': minor
'@rockaway/css': minor
---

Add `Switch`, an on/off setting that takes effect at once: `[●──] Wrap lines` off, `[──●] Wrap lines` on. The thumb moves from the first cell of a three-cell track to the last and the track goes reverse video, so the two states differ without colour; pressing reverses the track (an on track back), read-only draws the thumb without the track or its ground, and disabled dims, all in the same cells. The track's line is drawn by the cell renderer, rendered on the server as well as the client, and `painter` chooses its stroke. Built on React Aria's `SwitchField`, it is a field: it lines up in a `Form`'s control column and takes a `description`. It takes no `isRequired`, `isInvalid` or `validate`, because a setting already applied has nothing to validate. `switchBuffer` draws any state as text.
