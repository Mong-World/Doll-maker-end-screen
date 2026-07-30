# The Doll Maker — Ending Screen

## Required asset files

Place these in the `assets` folder:

- `ending_leftbehind.png`
- `ending_escaped.png`
- `ending_truefriendship.png`
- `bonus_wallpaper.png`
- `letter_icon.png`
- `fonts/dollmakerfont.otf`

## Ending task mapping

- `exit solo` → `LEFT BEHIND`
- `exit stitch` → `ESCAPED`
- `pendant ending` → `TRUE FRIENDSHIP`

## Letter tasks

- `letter1`
- `letter2`
- `letter3`
- `letter4`
- `letter5`
- `letter6`

## Testing in a browser

Use query parameters:

- `?ending=exit%20solo&letters=3`
- `?ending=exit%20stitch&letters=6`
- `?ending=pendant%20ending&letters=6`

Example:

`https://YOUR-SITE.example/?ending=exit%20stitch&letters=6`

## Sending data from Portals

The page accepts a message like:

```js
iframeWindow.postMessage({
  ending: "exit stitch",
  letters: 6
}, "*");
```

It also accepts task data:

```js
iframeWindow.postMessage({
  tasks: {
    "exit stitch": "Completed",
    "letter1": "Completed",
    "letter2": "Completed"
  }
}, "*");
```

Main Menu and Credits are intentionally disabled for now. Shop displays “Coming Soon.”
