---
name: dataland-visual-check
description: Visually check a running Dataland page in a browser via the Playwright MCP and the ui-reviewer agent
compatibility: opencode
---

## What I do

- Guide a visual check of layout and formatting on a running local Dataland frontend.

## Prerequisites

- Local stack or dev server is running and reachable from the browser.
- Enable the MCP on demand: `/mcp` (or `Ctrl+P`) and switch `playwright` on. Verify with `opencode mcp list`.
- A display must exist (`echo $DISPLAY`, e.g. `:99` via Xvfb).
- The user prepares a local `data_reader` browser session before enabling the MCP.
- Local base URL: `https://local-dev.dataland.com`. Unauthenticated requests are redirected to the Keycloak login.

## Login

- Ask the user to run `bash developer-tools/playwrightLogin.sh` from the repository root if a session is unavailable. The script reads the password directly from the environment, verifies that Keycloak restores the session in a new context, and saves it in `~/.cache/dataland-playwright/reader.json`.
- Restart the Playwright MCP after renewing the session. Stop if the page still asks for login. Do not read the session file, enter credentials, or inspect network requests containing tokens.

## Workflow

The user gives only the requirements for the page, never a URL. Derive the page yourself.

1. Determine the page: from the requirements and the files changed in the current work (`git status`/`git diff`), find the component and its route in `dataland-frontend/src/router/`. Build the URL from the local base URL (from `environments/.env.dev` or the running dev server) plus the route path. Fill route params with sensible existing values; if none can be derived, ask the user once.
2. Call `@ui-reviewer` with the derived URL and the requirements as a checklist. It opens the page with the prepared session, takes screenshots at desktop and narrow width, and returns per requirement: met / not met, with evidence.
3. Apply fixes in the main thread for every unmet requirement (PrimeVue defaults first, scoped styling only if needed).
4. Repeat steps 2-3 within the user's iteration limit (at most 3 by default). Stop early once all requirements are met.
5. Report: final status per requirement, what changed per iteration, and anything still open at the iteration limit.
6. Remind the user to switch the MCP off again (`/mcp`).

## Check list for master-detail pages

- Text stays inside its box: long words, ids and JSON wrap (`overflow-wrap: anywhere`); flex children that hold such text need `min-width: 0`.
- Framework Documentation shows a single Raw JSON card, only for the selected data point and directly below its detail card. Check both cards for overflow.
- Follow the info link next to a documented dataset field and verify that the exact field is selected on arrival.
- Selection uses themed PrimeVue components (`Listbox`, `Tree`), not plain links.

## Troubleshooting

- Console 404s for Keycloak theme `favicon-16x16.png`/`favicon-32x32.png` on the login page are known and harmless.
- `Connection closed`: check that the local Playwright package is cached and the session has been prepared. The pinned MCP starts offline.
- Blank page / `ERR_CONNECTION_RESET` on `/build/clients/...`: the Vite dev server dropped requests after a file change. Reload once, wait for a `data-test` element (not placeholder text).
- The version is pinned in `opencode.jsonc` and `developer-tools/playwrightLogin.sh`; update both together.
- Fallback without MCP: the Cypress screenshot spec described in `dataland-frontend/AGENTS.md`.
- `.playwright-mcp/` holds local snapshots and is git-ignored.
