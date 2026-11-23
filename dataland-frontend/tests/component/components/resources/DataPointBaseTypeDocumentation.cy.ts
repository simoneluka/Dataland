import DataPointBaseTypeDocumentation from '@/components/resources/DataPointBaseTypeDocumentation.vue';
import { minimalKeycloakMock } from '@ct/testUtils/Keycloak';

const baseType = {
  dataPointBaseType: { id: 'extendedDate', ref: 'https://example.com/base' },
  name: 'Extended Date',
  businessDefinition: 'A date with quality information',
  validatedBy: 'org.example.DateValidator',
  example: { value: '2024-01-01' },
  usedBy: [{ id: 'extendedDateFiscalYearEnd', ref: 'https://example.com/dp' }],
};

describe('Component test for DataPointBaseTypeDocumentation', () => {
  it('shows the base type', () => {
    cy.intercept('GET', '**/data-point-base-types/extendedDate', baseType);
    cy.mountWithPlugins(DataPointBaseTypeDocumentation, {
      keycloak: minimalKeycloakMock({}),
      props: { dataPointBaseTypeId: 'extendedDate' },
    });
    cy.get('[data-test="base-type-documentation-name"]').should('contain.text', 'Extended Date');
    cy.get('[data-test="base-type-documentation-definition"]').should('contain.text', 'quality information');
  });

  it('shows an error message if loading fails', () => {
    cy.intercept('GET', '**/data-point-base-types/broken', {
      statusCode: 500,
      body: { errors: [{ summary: 'Server error', message: 'Something went wrong' }] },
    });
    cy.mountWithPlugins(DataPointBaseTypeDocumentation, {
      keycloak: minimalKeycloakMock({}),
      props: { dataPointBaseTypeId: 'broken' },
    });
    cy.get('[data-test="base-type-documentation-error"]', { timeout: 15000 })
      .should('be.visible')
      .and('contain.text', 'Server error');
  });
});
