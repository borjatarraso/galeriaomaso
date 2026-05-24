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
