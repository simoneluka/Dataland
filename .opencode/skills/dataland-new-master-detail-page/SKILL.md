---
name: dataland-new-master-detail-page
description: Use when adding a Dataland frontend page with a selection panel and detail content, based on the Framework Documentation page layout (Card selection list, flexible main area, detail panels, themed selection color, tab entry, route, tests).
compatibility: opencode
---

# Create a Dataland master-detail page

Use this workflow when creating a page with a selectable list or tree and content that depends on the current selection.

## Inputs

Identify before implementing:

- Page name and purpose
- Route and whether the page needs a tab in `DatasetsTabMenu.vue`
- Access requirements (public or authenticated)
- Selectable items and how selection works
- Content shown per selection
- Data source, if the page loads backend data

If any of these affect the implementation and are unclear, ask the user instead of assuming.

## Inspect first

1. Read `dataland-frontend/AGENTS.md` and the nearest relevant component tests under `dataland-frontend/tests/component/`.
2. Use `src/components/pages/SpecificationDocumentationPage.vue` as the layout reference.
3. Search `src/api-queries/` for an existing TanStack Query hook that fits. If none fits and a hook must be created or changed, read `src/api-queries/AGENTS.md` first and follow it. Never call API clients from the page or its components.

## Implement the page

1. Create the page under `src/components/pages/` with `<script setup lang="ts">`.
2. Use `TheContent` (`class="p-4 text-left"`) with an `h1` and a short description.
3. Follow the reference layout: a flex container (`flex flex-column lg:flex-row gap-4 align-items-start`) with a selection `Card` on the left (`w-full lg:w-18rem flex-shrink-0`), the main content in a flexible area (`flex-1`), and optional detail panels on the right (`w-full lg:w-20rem flex-shrink-0`).
4. Put panels in `src/components/resources/` and emit selection events upward, as `FrameworkDocumentationTree` does.
5. Adapt panels and interactions to the requested function. Do not copy framework-specific components or data models unless relevant.
6. Handle loading (`DatalandProgressSpinner`), error (`Message severity="error"` with `formatAxiosErrorMessage`), empty and unselected states.
7. Add stable `data-test` attributes to testable elements.
8. Use PrimeVue components and default styling.

## Selection styling

Selection colors are configured centrally in `src/assets/theme/dataland-theme.ts` (`DatalandPreset`, `components.tree`): `selectedBackground: '{primary.color}'`, `selectedColor: '{primary.contrast.color}'`, and the same contrast color for `nodeIcon`.

- Reuse the existing configuration when the page uses a PrimeVue `Tree`.
- If the page uses another PrimeVue component, check whether its selected state is already themed. Only if not, add the equivalent tokens to the preset with the same primary and contrast color values.
- Never implement selection colors as page-specific scoped CSS.

## Navigation

1. Add a tab entry in `src/components/general/DatasetsTabMenu.vue` if the page belongs in the tab menu (`id`, `label`, `route`, `isVisible`).
2. Add the route (and a detail route if selection is part of the URL) in `src/router/index.ts` with `meta.initialTabId` and `requiresAuthentication`.
3. Update `tests/component/components/general/DatasetsTabMenu.cy.ts`.

## Documentation impact

Check whether the new page changes user-facing behavior that existing documentation describes. Search for the relevant existing documentation and update it. If it is unclear where documentation belongs or whether it is needed, ask the user instead of creating a new documentation location.

## Tests and verification

1. Add component tests for the page and its panels covering selection and relevant loading, error and empty states.
2. For API-backed components, follow the `dataland-cypress-component-tests` skill.
3. Run the frontend checks required by `dataland-frontend/AGENTS.md` and the focused Cypress specs for the changed files.

## Do not

- Introduce new UI libraries or `@ts-nocheck`.
- Use scoped CSS for selection colors.
- Copy legacy components that call API clients directly.
