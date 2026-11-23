---
name: dataland-cypress-component-tests
description: Use when writing or debugging Cypress component tests (.cy.ts) for Dataland Vue components that load data through TanStack Query; covers mounting, API fixtures, error states, and targeted runs.
compatibility: opencode
---

# Dataland Cypress component tests

## Set up the test

1. Read `dataland-frontend/AGENTS.md` and the nearest existing specs under `dataland-frontend/tests/component/`. In `components/resources/`, the specs for `FrameworkDocumentationTree`, `DataPointTypeDocumentation`, and `DataPointBaseTypeDocumentation` show how to test API-backed components.
2. Keep the real query hook in the test. Register `cy.intercept()` before mounting, then use `cy.mountWithPlugins()` with `minimalKeycloakMock({})` from `@ct/testUtils/Keycloak` as needed. The mount helper creates a fresh `QueryClient`; check its options if the component also needs routing or other app services.
3. Check the method, path, and response model in the generated client (or the service OpenAPI spec). Check the frontend client configuration for any base-path prefix. For example, the specification client uses `/data-point-types/{id}` and `/data-point-base-types/{id}`; `**/data-point-types/extendedDateFiscalYearEnd` matches the specific request even if it has a service prefix.

## Test observable behavior

- For success, return a contract-shaped fixture with the fields the component renders. Assert the visible result using existing `data-test` selectors. If a click emits an event, assert its payload with a stub; the data-point type spec checks that clicking the base-type link emits the base-type ID.
- For failure, mock the error response shape the component consumes. The documentation components use `formatAxiosErrorMessage`, which reads `response.data.errors[0]`. A `500` with `body: {}` threw a `TypeError` during rendering before the error message could appear. Use the actual error envelope and assert the rendered message:

  ```ts
  cy.intercept('GET', '**/data-point-base-types/broken', {
    statusCode: 500,
    body: { errors: [{ summary: 'Server error', message: 'Something went wrong' }] },
  });
  // Mount the component with dataPointBaseTypeId: 'broken'.
  cy.get('[data-test="base-type-documentation-error"]', { timeout: 15000 })
    .should('be.visible')
    .and('contain.text', 'Server error');
  ```

- If a failure-state assertion times out, check whether the request matched and whether rendering threw before increasing the timeout. In these specs, TanStack Query retries delayed the final error state by about seven seconds. Keep any longer assertion timeout scoped to that state; avoid fixed waits.

## Run and diagnose

From `dataland-frontend`, start with the affected spec:

```bash
npx cypress run --component --spec tests/component/components/resources/DataPointBaseTypeDocumentation.cy.ts
```

- To run multiple specs, pass a quoted, comma-separated list to `--spec`. To debug interactively on a machine with a display, use `npx cypress open --component`.
- Run scoped Prettier and ESLint checks and follow the package guidance for the relevant Cypress TypeScript compilation checks.
- If a headless run stalls, rerun one spec and keep the live output or capture the full run log. Check whether Cypress reached `Running:` and inspect the first error before extending the process timeout. Piping through `tail` can hide progress until the process exits, and `pkill -f` can also match the shell running the command.
- If `node` or `npx` is unavailable, check Node.js installation and PATH in that terminal. If generated client imports are missing, use the repository's client generation workflow before debugging the spec.
