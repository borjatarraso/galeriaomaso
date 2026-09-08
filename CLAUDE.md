# galeriaomaso — project-local rules

## Local preview server

- **Always serve on port `5253`.** This is the project's assigned port in
  the Lynx Factory ledger (`project_details.json`). Every website project
  has a unique port so two local previews can run side-by-side without
  fighting for the same socket.
- **Never use port `8765`.** It collides with `enriquetahueso` (the other
  active website session) — that exact collision is why this file exists.
- The canonical preview command is:

  ```sh
  python3 -m http.server 5253 --bind 127.0.0.1 --directory public
  ```

  (Drop `--directory public` if the asset you're previewing lives at the
  repo root.)

- If you need to stop a previous instance, target the same port:

  ```sh
  pkill -f "python3 -m http.server 5253"
  ```

- Need an additional port for a one-off (e.g. side-by-side A/B)? Pick
  anything in `5200-5249` that isn't already bound — but the default,
  long-running preview is always `5253`.

<!-- LYNX-EP-NOTE:BEGIN -->

## Entry-point card — keep it current

This project carries `index.ep.md` (and `index.ep.html`), the standard card
that answers what this is, where to look first, and how to run it. Every
project in `~/claude/` has one in the same shape, so jumping between them
does not mean re-learning where to look.

**When work here changes any of the following, refresh the card:**

- what the project is or does (title, one-line purpose, description)
- the file someone should open first
- the command that starts it
- the top-level layout or where the documentation lives

Refresh it with:

```bash
python3 ~/claude/lynx_factory/web/tools/gen_ep_index.py --only <this-project>
```

That regenerates from this repo's own README/CLAUDE.md plus the Lynx Factory
ledger — it does not invent anything, so fixing the card usually means fixing
the README first. The README's ownership footer is refreshed by the same
command.

To hand-write a card and stop it being regenerated, set `ep_locked: true` in
its front matter.

<!-- LYNX-EP-NOTE:END -->
