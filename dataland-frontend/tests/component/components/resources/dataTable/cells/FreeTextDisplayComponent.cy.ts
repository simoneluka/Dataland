import FreeTextDisplayComponent from '@/components/resources/dataTable/cells/FreeTextDisplayComponent.vue';
import { MLDTDisplayComponentName } from '@/components/resources/dataTable/MultiLayerDataTableCellDisplayer';

const shortTestString = 'Short String';

it('Should entirely display a short string without an expand option', () => {
  cy.mountWithPlugins(FreeTextDisplayComponent, {
    props: {
      content: {
        displayComponentName: MLDTDisplayComponentName.FreeTextDisplayComponent,
        displayValue: shortTestString,
      },
    },
  });

  cy.get('span[data-test=freetext-full]').contains(shortTestString);
  cy.get('button[data-test=freetext-toggle]').should('not.exist');
});

const longText = 'long'.repeat(100);

it('Should initially show the collapsed string but allow expanding for longer texts', () => {
  cy.mountWithPlugins(FreeTextDisplayComponent, {
    props: {
      content: {
        displayComponentName: MLDTDisplayComponentName.FreeTextDisplayComponent,
        displayValue: longText,
      },
    },
  });

  cy.get('span[data-test=freetext-collapsed]').should('exist');

  cy.get('button[data-test=freetext-toggle]').contains('Show more').click();
  cy.get('span[data-test=freetext-full]').should('exist');

  cy.get('button[data-test=freetext-toggle]').contains('Show less').click();
  cy.get('span[data-test=freetext-collapsed]').should('exist');
});
