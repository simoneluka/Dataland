/**
 * Developer helper (not part of the regular test suite, therefore not located in tests/e2e/specs):
 * Logs in as the reader user and takes a screenshot of each path listed in the env variable SCREENSHOT_PATHS
 * (comma separated, e.g. "/companies,/portfolios"). Screenshots are written to cypress/screenshots.
 * Run via: SCREENSHOT_PATHS="/companies" npx cypress run --spec tests/e2e/devtools/PageScreenshots.ts
 */
import { loginWithCredentials } from '@e2e/utils/Auth';
import { getReaderPw, reader_name } from '@e2e/utils/Cypress';

describe('Page screenshots', () => {
  it('takes a screenshot of every configured path as reader', () => {
    cy.env(['SCREENSHOT_PATHS']).then((vars) => {
      const rawPaths = (vars as Record<string, unknown>)['SCREENSHOT_PATHS'];
      if (typeof rawPaths !== 'string' || rawPaths.trim() === '') {
        throw new Error('Env variable SCREENSHOT_PATHS is not set.');
      }
      getReaderPw().then((password) => {
        // Own login flow instead of ensureLoggedIn: it asserts a redirect URL which is not needed for screenshots.
        cy.visit('/');
        cy.get("[data-test='login-dataland-button']", { timeout: 60000 }).click();
        loginWithCredentials(reader_name, password);
        cy.wait(8000); // eslint-disable-line cypress/no-unnecessary-waiting
      });
      rawPaths.split(',').forEach((path, index) => {
        const trimmedPath = path.trim();
        cy.visit(trimmedPath);
        cy.get('body').should('be.visible');
        cy.wait(3000); // eslint-disable-line cypress/no-unnecessary-waiting
        cy.screenshot(`${index}_${trimmedPath.replace(/[^a-zA-Z0-9]+/g, '_')}`, { capture: 'viewport' });
      });
    });
  });
});
