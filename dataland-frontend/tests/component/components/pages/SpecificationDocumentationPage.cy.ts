import SpecificationDocumentationPage from '@/components/pages/SpecificationDocumentationPage.vue';
import { minimalKeycloakMock } from '@ct/testUtils/Keycloak';

const frameworks = [
  { framework: { id: 'sfdr', ref: 'https://example.com/specifications/frameworks/sfdr' }, name: 'SFDR' },
  { framework: { id: 'lksg', ref: 'https://example.com/specifications/frameworks/lksg' }, name: 'LkSG' },
];

describe('Component test for SpecificationDocumentationPage', () => {
  it('lists the frameworks and filters them by the search text', () => {
    cy.intercept('GET', '**/specifications/frameworks', frameworks).as('listFrameworks');
    cy.mountWithPlugins(SpecificationDocumentationPage, { keycloak: minimalKeycloakMock({}) });
    cy.wait('@listFrameworks');

    cy.get('[data-test="specification-documentation-table"]')
      .should('contain.text', 'SFDR')
      .and('contain.text', 'LkSG');
    cy.get('[data-test="specification-documentation-search"]').type('lks');
    cy.get('[data-test="specification-documentation-table"]').should('contain.text', 'LkSG');
    cy.get('[data-test="specification-documentation-table"]').should('not.contain.text', 'SFDR');
    cy.get('[data-test="specification-documentation-search"]').clear().type('does-not-exist');
    cy.get('[data-test="specification-documentation-table"]').should('contain.text', 'No frameworks found.');
  });

  it('shows an error message if the frameworks cannot be loaded', () => {
    cy.intercept('GET', '**/specifications/frameworks', {
      statusCode: 500,
      body: {
        errors: [
          { errorType: 'internal-server-error', summary: 'Internal server error', message: 'Something went wrong' },
        ],
      },
    });
    cy.mountWithPlugins(SpecificationDocumentationPage, { keycloak: minimalKeycloakMock({}) });
    cy.get('[data-test="specification-documentation-error"]')
      .should('be.visible')
      .and('contain.text', 'Internal server error');
  });
});
