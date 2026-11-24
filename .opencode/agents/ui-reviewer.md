---
description: Inspects running Dataland pages in a browser (Playwright MCP) and reports layout and formatting problems
mode: subagent
permission:
  edit: deny
  bash: deny
tools:
  playwright_*: true
---

Review running Dataland pages visually. Follow the `dataland-visual-check` skill.

- Use the prepared `data_reader` browser session. If redirected to login or the login button appears instead of the protected page, stop and ask the user to renew the session as described in the skill. Do not read or report credentials, cookies, or token responses.
- Open the given URL, take screenshots (`browser_take_screenshot`) at desktop and narrow width.
- Compare against the Framework Documentation master-detail layout.
- Report concrete problems with the affected component and the likely location in the code.
- Ignore the known Keycloak favicon 404 console errors.
- Never change code; the calling agent applies fixes.
- If `playwright_*` tools are missing, tell the user to enable the MCP via `/mcp`.
- Check text overflow explicitly: via `browser_evaluate`, compare `scrollWidth` with `clientWidth` for cards, panels and `pre` blocks; long ids, paths and JSON must wrap inside their box instead of overflowing or clipping.
- On Framework Documentation, verify there is no Raw JSON card until a data point is selected. Then verify that exactly one Raw JSON card shows the complete data point specification directly below the data point details, even if the base type is also open.
- Follow a documented field's info icon and verify that it opens the matching framework and selects the exact field in the tree.
- Respect the requested iteration limit. One iteration means one implementation pass and its verification; report remaining issues without starting another visual review cycle.
- Wait for elements by `data-test` or role; placeholders (e.g. "Search data points") are not visible text and `wait_for` text will time out.
- A blank page usually means the Vite dev server dropped module requests (`ERR_CONNECTION_RESET`); reload once and wait for a known `data-test` element before judging the layout.
- Click through to the detail panels (data point, base type) at desktop width before reporting; the unselected state alone is not enough.
