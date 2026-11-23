import DataPointTypeDocumentation from '@/components/resources/DataPointTypeDocumentation.vue';
import { minimalKeycloakMock } from '@ct/testUtils/Keycloak';

const dataPointType = {
  dataPointType: { id: 'extendedDateFiscalYearEnd', ref: 'https://example.com/dp' },
  name: 'Fiscal Year End',
  businessDefinition: 'The end of the fiscal year',
  dataPointBaseType: { id: 'extendedDate', ref: 'https://example.com/base' },
  usedBy: [{ id: 'sfdr', ref: 'https://example.com/sfdr' }],
  constraints: null,
  calculationRules: [],
};

describe('Component test for DataPointTypeDocumentation', () => {
  it('shows the data point type and emits the base type id on click', () => {
    cy.intercept('GET', '**/data-point-types/extendedDateFiscalYearEnd', dataPointType);
    const onSelect = cy.stub().as('onSelect');
    cy.mountWithPlugins(DataPointTypeDocumentation, {
      keycloak: minimalKeycloakMock({}),
      props: { dataPointTypeId: 'extendedDateFiscalYearEnd', aliasExport: 'FYE', 'onSelect-base-type': onSelect },
    });

    cy.get('[data-test="data-point-type-documentation-name"]').should('contain.text', 'Fiscal Year End');
    cy.get('[data-test="data-point-type-documentation-definition"]').should('contain.text', 'end of the fiscal year');
    cy.get('[data-test="data-point-type-documentation-alias"]').should('contain.text', 'FYE');
    cy.get('[data-test="data-point-type-documentation-base-type"]').click();
    cy.get('@onSelect').should('have.been.calledWith', 'extendedDate');
  });

  it('shows an error message if loading fails', () => {
    cy.intercept('GET', '**/data-point-types/broken', { statusCode: 500, body: {} });
    cy.mountWithPlugins(DataPointTypeDocumentation, {
      keycloak: minimalKeycloakMock({}),
      props: { dataPointTypeId: 'broken' },
    });
    cy.get('[data-test="data-point-type-documentation-error"]', { timeout: 15000 }).should('be.visible');
  });
});
