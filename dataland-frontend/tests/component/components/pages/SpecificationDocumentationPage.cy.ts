import SpecificationDocumentationPage from '@/components/pages/SpecificationDocumentationPage.vue';
import DataPointDocumentationLink from '@/components/resources/DataPointDocumentationLink.vue';
import { minimalKeycloakMock } from '@ct/testUtils/Keycloak';
import { defineComponent, h, type VNode } from 'vue';
import { createMemoryHistory, createRouter, RouterView } from 'vue-router';

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

  it('shows a placeholder card until a framework is selected', () => {
    cy.intercept('GET', '**/specifications/frameworks', frameworks);
    cy.mountWithPlugins(SpecificationDocumentationPage, { keycloak: minimalKeycloakMock({}) });
    cy.get('[data-test="specification-documentation-placeholder"]')
      .should('be.visible')
      .and('contain.text', 'Select a framework to see its documentation.');
    cy.get('[data-test="specification-documentation-table"] [aria-selected="true"]').should('not.exist');
  });

  it('opens the exact data point from its info link and keeps long text and JSON inside separate cards', () => {
    const longId = 'extendedDateFiscalYearEnd'.repeat(8);
    const path = 'general.fiscalYearEnd';
    const dataPointType = {
      dataPointType: { id: longId, ref: `https://example.com/data-point-types/${longId}` },
      name: 'Fiscal Year End',
      businessDefinition: 'The last day of the fiscal year.',
      dataPointBaseType: { id: 'extendedDate', ref: 'https://example.com/extendedDate' },
      usedBy: [frameworks[0].framework],
      calculationRules: [],
    };
    const jsonCard = '[data-test="data-point-raw-json-card"]';
    const detailCard = '[data-test="data-point-type-documentation"]';
    cy.viewport(1100, 900);
    cy.intercept('GET', '**/specifications/frameworks', frameworks);
    cy.intercept('GET', '**/specifications/frameworks/sfdr', {
      ...frameworks[0],
      schema: JSON.stringify({ general: { fiscalYearEnd: dataPointType.dataPointType } }),
    });
    cy.intercept('GET', `**/data-point-types/${longId}`, dataPointType);

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/',
          component: defineComponent({
            render(): VNode {
              return h(DataPointDocumentationLink, { frameworkId: 'sfdr', path, label: 'Fiscal Year End' });
            },
          }),
        },
        {
          path: '/documentation/frameworks/:frameworkId',
          name: 'Framework Documentation Details',
          component: SpecificationDocumentationPage,
        },
      ],
    });
    cy.mountWithPlugins(
      defineComponent({
        render(): VNode {
          return h(RouterView);
        },
      }),
      { router, keycloak: minimalKeycloakMock({}) }
    );
    cy.get('[data-test="data-point-documentation-link"]').click();
    cy.get('[role="treeitem"][aria-checked="true"]').should('contain.text', 'fiscalYearEnd');
    cy.get(detailCard).should('contain.text', longId).next().should('match', jsonCard);
    cy.get(jsonCard).should('have.length', 1);
    cy.get('[data-test="raw-json"]').should(($json) => {
      expect(JSON.parse($json.text())).to.deep.equal(dataPointType);
    });
    cy.get(`${detailCard} [data-test="data-point-type-documentation-name"] + p, [data-test="raw-json"]`).should(
      ($blocks) => {
        expect($blocks).to.have.length(2);
        for (const block of $blocks) expect(block.scrollWidth).to.be.at.most(block.clientWidth);
      }
    );
    cy.get('[role="treeitem"][aria-checked="true"]').contains('fiscalYearEnd').click();
    cy.get(jsonCard).should('not.exist');
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
