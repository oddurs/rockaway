---
'@rockaway/react': minor
---

Draw a frame's lines in `border.default` and its title in `fg.default`, so the structure recedes behind what the frame holds. The colour is carried by each cell of the buffer, so it is the same on a page and in ANSI. `Divider` and a frame's `dividers` draw in it too. Until now every line was the text colour. Every frame looks different with the same props, so before 1.0 this is a minor (decision 0172).

Add `dividerBorder` to `Frame` and `frameBuffer`, the set its dividers draw with: the frame's own unless given, so a heavy frame can hold light dividers, and the junction table draws the tee (`┠──┨`). A frame drawn in the `ascii` set now ends a truncated title in ASCII (`~`) whatever the theme, and a divider row that is not a whole number is dropped like one off the frame.

`Screen` now counts a measured box exactly: a container 40 characters wide is 40 cells, where it came out as 39 because the measured cell is rounded to the layout unit.
