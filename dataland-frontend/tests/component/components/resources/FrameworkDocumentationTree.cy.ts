import FrameworkDocumentationTree from '@/components/resources/FrameworkDocumentationTree.vue';
import { minimalKeycloakMock } from '@ct/testUtils/Keycloak';

const frameworkSpecification = {
  framework: { id: 'sfdr', ref: 'https://example.com/specifications/frameworks/sfdr' },
  name: 'SFDR',
  businessDefinition: 'Sustainable Finance Disclosure Regulation',
  referencedReportJsonPath: null,
  schema: JSON.stringify({
    general: {
      general: {
        fiscalYearEnd: { id: 'extendedDateFiscalYearEnd', ref: 'https://example.com/dp', aliasExport: 'FYE' },
      },
    },
  }),
};

describe('Component test for FrameworkDocumentationTree', () => {
  it('shows the schema as tree and emits the data point type id of a selected leaf', () => {
    cy.intercept('GET', '**/specifications/frameworks/sfdr', frameworkSpecification);
    const onSelect = cy.stub().as('onSelect');
    cy.mountWithPlugins(FrameworkDocumentationTree, {
      keycloak: minimalKeycloakMock({}),
      props: { frameworkId: 'sfdr', 'onSelect-data-point-type': onSelect },
    });

    cy.get('[data-test="framework-documentation-definition"]').should('contain.text', 'Sustainable Finance');
    cy.get('[data-test="framework-documentation-tree"] .p-tree-node-toggle-button').first().click();
    cy.get('[data-test="framework-documentation-tree"] .p-tree-node-toggle-button').eq(1).click();
    cy.get('[data-test="framework-documentation-tree"]').contains('fiscalYearEnd').click();
    cy.get('@onSelect').should('have.been.calledWith', 'extendedDateFiscalYearEnd', 'FYE');
  });
});
