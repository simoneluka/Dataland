import DocumentDownloadLink from '@/components/resources/frameworkDataSearch/DocumentDownloadLink.vue';
import DataPointDataTable from '@/components/general/DataPointDataTable.vue';
import { minimalKeycloakMock } from '@ct/testUtils/Keycloak';
import { DataTypeEnum } from '@clients/backend';
import axios, { type AxiosAdapter, type AxiosProgressEvent } from 'axios';

describe('check that the document link component works and is displayed correctly for a logged in user', function (): void {
  it('Check that there are no icons before and after triggering a download', function (): void {
    cy.intercept('GET', '**/documents/dummyFileReference', {
      statusCode: 200,
      headers: { 'content-type': 'application/pdf' },
      body: 'Test document',
    }).as('downloadComplete');
    cy.mountWithPlugins(DocumentDownloadLink, {
      keycloak: minimalKeycloakMock({}),

      props: {
        documentDownloadInfo: {
          downloadName: 'Test',
          fileReference: 'dummyFileReference',
          dataType: DataTypeEnum.Lksg,
        },
      },
    });
    cy.get('[data-test="download-link-Test"]').should('be.visible');
    validateNoIcons();
    cy.get('[data-test="download-icon"]').should('not.exist');
    cy.get('[data-test="download-link-Test"]').click();
    cy.wait('@downloadComplete');
    cy.get('[data-test="report-Test-link"]')
      .should('have.attr', 'href')
      .and('match', /^blob:/);
    validateNoIcons();
    cy.get('[data-test="download-icon"]').should('not.exist');
  });

  it('Shows download progress and restores the download icon after completion', function (): void {
    // Hold the response so each progress state can be checked before the download finishes.
    const response = Promise.withResolvers<void>();
    let reportProgress: ((event: AxiosProgressEvent) => void) | undefined;
    const adapter: AxiosAdapter = async (config) => {
      reportProgress = config.onDownloadProgress;
      reportProgress?.({ loaded: 50, total: 100, bytes: 50, lengthComputable: true });
      await response.promise;
      return {
        config,
        data: new ArrayBuffer(100),
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/pdf' },
      };
    };
    cy.stub(axios.defaults, 'adapter').value(adapter);
    cy.mountWithPlugins(DocumentDownloadLink, {
      keycloak: minimalKeycloakMock({
        authenticated: true,
      }),

      props: {
        documentDownloadInfo: {
          downloadName: 'Test',
          fileReference: 'dummyFileReference',
          dataType: DataTypeEnum.Lksg,
        },
        showIcon: true,
      },
    });
    cy.get('[data-test="download-icon"]').should('be.visible');
    validateNoIcons();
    cy.get('[data-test="download-link-Test"]').click();
    cy.get('[data-test="spinner-icon"]').should('be.visible');
    cy.get('[data-test="percentage-text"]').should('be.visible').and('contain.text', '(50%)');
    cy.get('[data-test="download-icon"]').should('not.exist');

    cy.then(() => {
      reportProgress?.({ loaded: 100, total: 100, bytes: 50, lengthComputable: true });
    });
    validateNoIcons();
    cy.get('[data-test="download-icon"]').should('not.exist');
    cy.then(() => {
      response.resolve();
    });
    cy.get('[data-test="report-Test-link"]')
      .should('have.attr', 'href')
      .and('match', /^blob:/);
    cy.get('[data-test="download-icon"]').should('be.visible');
    validateNoIcons();
  });

  it('Check that document download link behaves as expected for a non logged in user', function (): void {
    cy.mountWithPlugins(DocumentDownloadLink, {
      keycloak: minimalKeycloakMock({
        authenticated: false,
      }),

      props: {
        documentDownloadInfo: {
          downloadName: 'Test',
          fileReference: 'dummyFileReference',
        },
      },
    });
    cy.get('[data-test="download-text-Test"]').should('be.visible').and('have.text', 'Test');
    cy.get('[data-test="download-link-Test"]').should('not.exist');
    cy.get('[data-test="download-icon"]').should('not.exist');
    validateNoIcons();
  });

  it('Check that the label does not display "page" when page number is null', function (): void {
    cy.mountWithPlugins(DataPointDataTable, {
      keycloak: minimalKeycloakMock({
        authenticated: true,
      }),
      global: {
        provide: {
          dialogRef: {
            data: {
              dataPointDisplay: {
                value: 'Some Value',
                quality: 'Some quality',
                dataSource: {
                  fileName: 'FileName',
                  fileReference: 'dummyFileReference',
                  page: null,
                },
                comment: 'Some comment',
              },
              dataId: '12345',
              dataType: DataTypeEnum.EutaxonomyFinancials,
            },
          },
        },
      },
    });
    cy.get('[data-test="download-link-FileName"]').should('contain.text', 'FileName');
    cy.contains('th', /^Pages?$/).should('not.exist');
  });

  it('Check that long document names are truncated with ellipsis', function (): void {
    const longName = 'ThisIsAVeryLongDocumentNameThatShouldBeTruncatedAndNotFullyVisibleInTheButton';
    cy.mountWithPlugins(DocumentDownloadLink, {
      keycloak: minimalKeycloakMock({ authenticated: true }),
      props: {
        documentDownloadInfo: {
          downloadName: longName,
          fileReference: 'dummyFileReference',
        },
      },
    }).then(() => {
      const selector = '[data-test="Report-Download-' + longName + '"]';
      cy.get(selector).should('exist').invoke('css', 'text-overflow').should('eq', 'ellipsis');
      cy.get(selector).invoke('attr', 'title').should('eq', longName);
      cy.get(selector).then(($el) => {
        const el = $el[0];
        expect(el.scrollWidth).to.be.greaterThan(el.clientWidth);
      });
    });
  });
});

/**
 * Checks that neither the progress spinner nor its percentage is shown.
 */
function validateNoIcons(): void {
  cy.get('[data-test="spinner-icon"]').should('not.exist');
  cy.get('[data-test="percentage-text"]').should('not.exist');
}
