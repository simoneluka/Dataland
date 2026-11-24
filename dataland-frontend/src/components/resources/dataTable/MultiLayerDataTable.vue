<template>
  <div class="p-datatable p-component" :class="{ 'comparison-table': comparisonColumns }">
    <div class="p-datatable-wrapper overflow-auto" :tabindex="comparisonColumns ? 0 : undefined">
      <table
        class="p-datatable-table"
        :aria-label="ariaLabel"
        :style="comparisonColumns ? { minWidth: `${14 + 11 * comparisonColumns.length}rem` } : undefined"
      >
        <thead class="p-datatable-thead">
          <tr class="border-bottom-table">
            <th class="horizontal-headers-size" scope="col">
              <div class="p-column-header-content">
                <span class="p-column-title">KPIs</span>
              </div>
            </th>
            <template v-if="comparisonColumns">
              <th
                v-for="(column, idx) in comparisonColumns"
                :key="column.companyId"
                :data-dataset-index="idx"
                :data-status="column.status"
                scope="col"
              >
                <RouterLink
                  class="comparison-company-link"
                  :to="{ name: 'Company Cockpit', params: { companyId: column.companyId } }"
                >
                  {{ column.companyName }}
                </RouterLink>
                <span v-if="column.status !== 'available'" class="comparison-status">
                  {{ comparisonStatusLabels[column.status] }}
                </span>
              </th>
            </template>
            <th
              v-else
              v-for="(singleDataAndMetaInfo, idx) in dataAndMetaInfo"
              :key="idx"
              class="horizontal-headers-size"
              :data-dataset-index="idx"
              scope="col"
            >
              <div class="p-column-header-content">
                <span class="p-column-title" style="display: flex; align-items: center">
                  {{ singleDataAndMetaInfo.metaInfo.reportingPeriod }}
                </span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody class="p-datatable-tbody">
          <tr
            v-if="!comparisonColumns"
            v-show="
              !hideEmptyFields ||
              dataAndMetaInfo.some((singleDataAndMetaInfo) => singleDataAndMetaInfo.metaInfo.uploadTime != null)
            "
          >
            <td class="headers-bg pl-4 vertical-align-top header-column-width">
              <span class="table-left-label">Publication date of the dataset on Dataland</span>
              <em
                class="material-icons info-icon"
                aria-hidden="true"
                v-tooltip.top="{
                  value: 'Timestamp of data upload',
                }"
                >info</em
              >
            </td>
            <td v-for="(singleDataAndMetaInfo, idx) in dataAndMetaInfo" :key="idx" class="vertical-align-top">
              <span class="table-left-label" style="display: flex; align-items: center">
                {{ convertUnixTimeInMsToDateString(singleDataAndMetaInfo.metaInfo.uploadTime) }}
              </span>
            </td>
          </tr>
          <tr v-if="!comparisonColumns" v-show="!hideEmptyFields || hasPublicationDate()">
            <td class="headers-bg pl-4 vertical-align-top header-column-width" data-row-header="true">
              <span class="table-left-label">Publication date of most recent report</span>
              <em
                class="material-icons info-icon"
                aria-hidden="true"
                v-tooltip.top="{
                  value: 'Date when the latest version of the report was published',
                }"
                >info</em
              >
            </td>
            <td v-for="(singleDataAndMetaInfo, idx) in dataAndMetaInfo" :key="idx" class="vertical-align-top">
              <i
                v-if="!hasPublicationDate() && inReviewMode"
                class="pi pi-eye-slash pr-1 text-red-500"
                aria-hidden="true"
                data-test="hidden-icon"
              />
              <span class="table-left-label" style="display: flex; align-items: center">
                {{ latestDate(singleDataAndMetaInfo) }}
              </span>
            </td>
          </tr>
          <MultiLayerDataTableBody
            :dataAndMetaInfo="dataAndMetaInfo"
            :inReviewMode="inReviewMode"
            :config="config"
            :isTopLevel="true"
            :isVisible="true"
            :documentation-fields="documentationFields"
            :comparison-rows="comparisonRows"
          />
          <tr v-if="comparisonStatus">
            <td :colspan="(comparisonColumns?.length ?? 0) + 1">
              <span role="status">{{ comparisonStatus }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.p-datatable-table {
  border-spacing: 0;
  border-collapse: collapse;
}
</style>

<script setup lang="ts" generic="T">
import { type MLDTConfig } from '@/components/resources/dataTable/MultiLayerDataTableConfiguration';
import MultiLayerDataTableBody from '@/components/resources/dataTable/MultiLayerDataTableBody.vue';
import { type DataAndMetaInformation } from '@/api-models/DataAndMetaInformation';
import Tooltip from 'primevue/tooltip';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import type { DocumentationFields } from '@/utils/useFrameworkDocumentationFields.ts';
import {
  buildComparisonRows,
  type ComparisonColumn,
} from '@/components/resources/dataTable/MultiLayerDataTableComparison';
import { convertUnixTimeInMsToDateString, dateStringFormatter } from '@/utils/DataFormatUtils';
import {
  type CompanyReport,
  DataTypeEnum,
  type EutaxonomyFinancialsData,
  type EutaxonomyNonFinancialsData,
  type SfdrData,
  type NuclearAndGasData,
} from '@clients/backend';

const vTooltip = Tooltip;

/**
 *  Checks if at least one singleDataAndMetaInfo has a publication date.
 *  @returns boolean - true if at least one publicationDate exists, false otherwise.
 */
function hasPublicationDate(): boolean {
  return props.dataAndMetaInfo.some((singleDataAndMetaInfo) => {
    // Check for existing publication date
    let referencedReports;

    switch (singleDataAndMetaInfo.metaInfo.dataType) {
      case DataTypeEnum.Sfdr:
        referencedReports = (singleDataAndMetaInfo.data as SfdrData).general?.general?.referencedReports;
        break;
      case DataTypeEnum.EutaxonomyFinancials:
        referencedReports = (singleDataAndMetaInfo.data as EutaxonomyFinancialsData).general?.general
          ?.referencedReports;
        break;
      case DataTypeEnum.EutaxonomyNonFinancials:
        referencedReports = (singleDataAndMetaInfo.data as EutaxonomyNonFinancialsData).general?.referencedReports;
        break;
      case DataTypeEnum.NuclearAndGas:
        referencedReports = (singleDataAndMetaInfo.data as NuclearAndGasData).general?.general?.referencedReports;
        break;
      default:
        referencedReports = null;
        break;
    }
    // Check if there is at least one valid publicationDate
    return (
      referencedReports &&
      Object.keys(referencedReports).length > 0 &&
      Object.values(referencedReports).some((companyReport) => companyReport?.publicationDate != null)
    );
  });
}

/**
 * Extracts the publication date of the most recent report given DataAndMetaInformation.
 * @param singleDataAndMetaInfo the DataAndMetaInformation of a framework.
 * @returns publication date as string.
 */
function latestDate(singleDataAndMetaInfo: DataAndMetaInformation<T>): string {
  let latestDate = null;
  let referencedReports;
  switch (singleDataAndMetaInfo.metaInfo.dataType) {
    case DataTypeEnum.Sfdr:
      referencedReports = (singleDataAndMetaInfo.data as SfdrData).general?.general?.referencedReports;
      break;
    case DataTypeEnum.EutaxonomyFinancials:
      referencedReports = (singleDataAndMetaInfo.data as EutaxonomyFinancialsData).general?.general?.referencedReports;
      break;
    case DataTypeEnum.EutaxonomyNonFinancials:
      referencedReports = (singleDataAndMetaInfo.data as EutaxonomyNonFinancialsData).general?.referencedReports;
      break;
    case DataTypeEnum.NuclearAndGas:
      referencedReports = (singleDataAndMetaInfo.data as NuclearAndGasData).general?.general?.referencedReports;
      break;
    default:
      referencedReports = null;
      break;
  }
  if (referencedReports) {
    for (const key in referencedReports) {
      const companyReport: CompanyReport | undefined = referencedReports[key];
      const publicationDate = companyReport?.publicationDate;
      if (publicationDate && (!latestDate || publicationDate > latestDate)) {
        latestDate = publicationDate;
      }
    }
  }
  return latestDate ? dateStringFormatter(latestDate) : '';
}

const props = defineProps<{
  config: MLDTConfig<T>;
  dataAndMetaInfo: Array<DataAndMetaInformation<T>>;
  ariaLabel: string;
  inReviewMode: boolean;
  hideEmptyFields: boolean;
  /** In comparison mode the schema paths also identify raw values for comparison. */
  documentationFields?: DocumentationFields;
  /** One column per dataset, in selection order, including placeholders. */
  comparisonColumns?: readonly ComparisonColumn[];
  showDifferencesOnly?: boolean;
}>();

const comparisonStatusLabels: Record<Exclude<ComparisonColumn['status'], 'available'>, string> = {
  loading: 'Loading…',
  missing: 'No dataset',
  error: 'Could not load dataset',
};

const comparison = computed(() =>
  props.comparisonColumns
    ? buildComparisonRows<T>(props.config, props.dataAndMetaInfo, props.comparisonColumns, {
        differencesOnly: props.showDifferencesOnly ?? false,
        hideEmptyFields: props.hideEmptyFields,
        documentationFields: props.documentationFields,
      })
    : undefined
);
const comparisonRows = computed(() => comparison.value?.rows);

const comparisonStatus = computed(() => {
  const columns = props.comparisonColumns;
  const result = comparison.value;
  if (!columns || !result) return undefined;
  if (columns.some(({ status }) => status === 'loading')) return 'Loading company datasets…';
  if (!result.hasData) return 'No KPI data to show for the selected framework and reporting period.';
  if (props.showDifferencesOnly && result.rows.size === 0) {
    return 'No comparable scalar differences in the available datasets.';
  }
  return undefined;
});
</script>
<style scoped>
.info-icon {
  cursor: help;
}

.border-bottom-table {
  border-bottom: 1px solid var(--table-border);
}

.comparison-table {
  min-width: 0;
  max-width: 100%;
}

.comparison-table .p-datatable-table {
  width: 100%;
  table-layout: fixed;
  overflow-wrap: anywhere;
}

.comparison-table th {
  vertical-align: top;
  white-space: normal;
}

.comparison-table thead th:first-child,
.comparison-table :deep([data-row-header='true']) {
  position: sticky;
  inset-inline-start: 0;
  z-index: 1;
  background: var(--p-datatable-header-cell-background, var(--p-content-background, white));
  border-inline-end: 1px solid var(--table-border);
}

.comparison-table thead th:first-child {
  width: clamp(8rem, 36vw, 14rem);
}

.comparison-company-link {
  text-decoration: underline;
}

.comparison-status {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  font-weight: normal;
}
</style>
