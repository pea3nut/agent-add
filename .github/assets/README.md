# README installation demo

`install-demo.gif` is a recording of the opening README command, run with
agent-add 1.3.1 in a fresh temporary project in Bash. It shows the real host
picker (Down, Down, Up, Enter), six successful writes to Claude Code, and
a final `ls -al` listing of every installed file, including the PDF skill's
supporting files. The recording uses `find . -type f -exec ls -al {} +` to
include files in nested directories in one view.

The editable terminal recording is `install-demo.cast` (asciicast v2).
The animation pauses on the complete command at the start and on the
installed files at the end, and loops automatically.

Regenerate the GIF with [agg 1.9.0](https://github.com/asciinema/agg):

```bash
agg --font-family 'DejaVu Sans Mono' --font-size 18 --line-height 1.25 \
  --theme github-dark --fps-cap 15 --last-frame-duration 5 \
  .github/assets/install-demo.cast .github/assets/install-demo.gif
```

To refresh the demo, record the opening README command in a clean project
with a 108-column, 34-row terminal using asciinema. Keep the command visible
before executing it, navigate the host picker to Claude Code, and inspect
the resulting files with the listing command above. Replace the cast
and regenerate the GIF. Keep these media files here so they are excluded
from the published npm package.
