import PortfolioComparisonPage from '@/components/pages/PortfolioComparisonPage.vue';
import { QaStatus, type SfdrData } from '@clients/backend';
import { minimalKeycloakMock } from '@ct/testUtils/Keycloak';
import { defineComponent, h, type VNode } from 'vue';
import type { DataAndMetaInformation } from '@/api-models/DataAndMetaInformation';

const portfolioId = 'c6a81528-97a3-47f9-81b1-e1eff0481e07';
const firstCompanyId = 'f89162af-1d7c-40c6-8e7c-7ccf107685bb';
const secondCompanyId = '8a0c3f40-c94a-403b-9140-29a1ec085760';
const missingCompanyId = 'eb67ef8f-b050-4aff-9907-fd5203556dcb';
const longCompanyName = 'UninterruptedCompanyName'.repeat(6);
const revenueRow = 'tr[data-cell-label="Total Revenue"]';
const fiscalYearRow = 'tr[data-cell-label="Fiscal year end"]';
const differencesCheckbox = '#comparison-differences';

/** Builds an active SFDR response for the given company and period. */
function dataset(companyId: string, reportingPeriod: string, revenue: number): DataAndMetaInformation<SfdrData> {
  return {
    metaInfo: {
      dataId: `${companyId}-${reportingPeriod}`,
      companyId,
      dataType: 'sfdr',
      reportingPeriod,
      uploadTime: 1,
      currentlyActive: true,
      qaStatus: QaStatus.Accepted,
    },
    data: {
      general: { company: { fiscalYearEnd: { value: `${reportingPeriod}-12-31` } } },
      financial: { financial: { totalRevenueInEUR: { value: revenue } } },
    },
  };
}

describe('Portfolio comparison', () => {
  beforeEach(() => {
    const framework = { framework: { id: 'sfdr', ref: '/specifications/frameworks/sfdr' }, name: 'SFDR' };
    cy.intercept('GET', `**/users/portfolios/${portfolioId}/enriched-portfolio`, {
      portfolioId,
      portfolioName: 'Demo portfolio',
      entries: [
        { companyId: firstCompanyId, companyName: 'First company', availableReportingPeriods: { sfdr: '2023, 2024' } },
        { companyId: secondCompanyId, companyName: longCompanyName, availableReportingPeriods: { sfdr: '2024' } },
        { companyId: missingCompanyId, companyName: 'No data company', availableReportingPeriods: { sfdr: '2024' } },
      ],
    });
    cy.intercept('GET', '**/specifications/frameworks', [framework]);
    cy.intercept('GET', '**/specifications/frameworks/sfdr', {
      ...framework,
      schema: JSON.stringify({
        general: {
          company: {
            fiscalYearEnd: {
              id: 'extendedDateFiscalYearEnd',
              ref: '/specifications/data-point-types/extendedDateFiscalYearEnd',
            },
          },
        },
        financial: {
          financial: {
            totalRevenueInEUR: {
              id: 'extendedDecimalTotalRevenueInEUR',
              ref: '/specifications/data-point-types/extendedDecimalTotalRevenueInEUR',
            },
          },
        },
      }),
    });
    cy.intercept('GET', `**/data/sfdr/companies/${firstCompanyId}`, [
      dataset(firstCompanyId, '2023', 250),
      dataset(firstCompanyId, '2024', 100),
    ]);
    cy.intercept('GET', `**/data/sfdr/companies/${secondCompanyId}`, [dataset(secondCompanyId, '2024', 900)]);
    cy.intercept('GET', `**/data/sfdr/companies/${missingCompanyId}`, { statusCode: 404 });

    cy.mountWithPlugins(
      defineComponent({
        render(): VNode {
          return h(PortfolioComparisonPage, { portfolioId, isSharedPortfolio: false });
        },
      }),
      { keycloak: minimalKeycloakMock({}) }
    );
  });

  it('marks comparable extrema, keeps missing companies visible, and filters equal values', () => {
    cy.get('#comparison-period').should('contain.text', '2024');
    cy.get(`thead a[href="/companies/${firstCompanyId}"]`).should('have.text', 'First company');
    cy.contains('thead th', 'No data company').should('contain.text', 'No dataset');
    cy.get(`${revenueRow} [data-dataset-index="0"]`).should('contain.text', '100 EUR').and('contain.text', 'Min');
    cy.get(`${revenueRow} [data-dataset-index="1"]`).should('contain.text', '900 EUR').and('contain.text', 'Max');
    cy.get(`${revenueRow} [data-dataset-index="2"]`).should('contain.text', '—');
    cy.get(fiscalYearRow).should('be.visible');

    cy.get(differencesCheckbox).check();
    cy.get(fiscalYearRow).should('not.exist');
    cy.get(revenueRow).should('be.visible');

    cy.get('#comparison-period').click();
    cy.contains('[role="option"]', '2023').click();
    cy.contains('No comparable scalar differences').should('be.visible');
    cy.get(differencesCheckbox).uncheck();
    cy.get(revenueRow).should('contain.text', '250 EUR');
    cy.get(`${revenueRow} .comparison-extremum`).should('not.exist');
  });

  it('wraps long company names and keeps KPI labels pinned during narrow table scrolling', () => {
    cy.viewport(390, 844);
    cy.get(`thead a[href="/companies/${secondCompanyId}"]`).should(($link) => {
      const cell = $link[0].closest('th');
      expect(cell?.scrollWidth).to.equal(cell?.clientWidth);
      expect($link.text()).to.equal(longCompanyName);
    });
    cy.get(revenueRow).should('be.visible');
    cy.get('.comparison-table .p-datatable-wrapper').should(($wrapper) => {
      expect($wrapper[0].scrollWidth).to.be.greaterThan($wrapper[0].clientWidth);
    });
    cy.get('.comparison-table .p-datatable-wrapper').scrollTo('right');
    cy.get(`${revenueRow} [data-row-header]`).should(($cell) => {
      const cell = $cell[0];
      const wrapper = cell.closest('.p-datatable-wrapper');
      expect(wrapper?.scrollLeft).to.be.greaterThan(0);
      expect(cell.getBoundingClientRect().left).to.be.closeTo(wrapper?.getBoundingClientRect().left ?? 0, 1);
      expect(cell.ownerDocument.documentElement.scrollWidth).to.equal(cell.ownerDocument.documentElement.clientWidth);
    });
  });
});
