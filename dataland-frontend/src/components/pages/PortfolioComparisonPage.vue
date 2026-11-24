<template>
  <TheContent>
    <section class="portfolio-comparison flex flex-column gap-4" aria-labelledby="portfolio-comparison-title">
      <header class="text-left">
        <RouterLink :to="backRoute" class="inline-flex align-items-center gap-2 mb-3">
          <i class="pi pi-arrow-left" aria-hidden="true" /> Back to portfolios
        </RouterLink>
        <h1 id="portfolio-comparison-title" class="m-0">Compare companies</h1>
        <p v-if="portfolio" class="mt-2 mb-0 text-color-secondary">
          {{ portfolio.portfolioName }} · {{ companies.length }} companies
        </p>
      </header>

      <div v-if="portfolioQuery.isPending.value" role="status" class="flex align-items-center gap-2">
        <DatalandProgressSpinner /> Loading portfolio…
      </div>
      <Message v-else-if="portfolioQuery.isError.value" severity="error" :closable="false">
        Could not load this portfolio. Check that you have access and try again.
      </Message>
      <Message v-else-if="!frameworkOptions.length" severity="info" :closable="false">
        None of the companies in this portfolio has a comparable dataset.
      </Message>
      <template v-else>
        <div class="comparison-controls flex flex-wrap gap-3 align-items-end">
          <div class="flex flex-column gap-2">
            <label for="comparison-framework" class="font-medium">Framework</label>
            <Select
              v-model="selectedFramework"
              input-id="comparison-framework"
              :options="frameworkOptions"
              option-label="label"
              option-value="identifier"
            />
          </div>
          <div class="flex flex-column gap-2">
            <label for="comparison-period" class="font-medium">Reporting period</label>
            <Select v-model="selectedPeriod" input-id="comparison-period" :options="periodOptions" />
          </div>
          <div class="flex align-items-center gap-2 py-2">
            <Checkbox
              v-model="showDifferencesOnly"
              input-id="comparison-differences"
              :disabled="!canCompareValues"
              binary
            />
            <label for="comparison-differences">Only show differences in comparable values</label>
          </div>
        </div>
        <p v-if="canCompareValues" class="m-0 text-left text-color-secondary">
          Min and Max mark the lowest and highest comparable values in a row. Missing values are excluded.
        </p>
        <p v-else class="m-0 text-left text-color-secondary">
          Difference filtering and Min/Max require the framework specification. You can still browse the values below.
        </p>
        <p class="comparison-scroll-hint m-0 text-sm text-left text-color-secondary">
          Scroll the table horizontally to see more companies. KPI labels stay visible.
        </p>
        <!-- @vue-generic {object} -->
        <MultiLayerDataTable
          v-if="configuration && selectedPeriod"
          :config="configuration"
          :data-and-meta-info="comparison.datasets"
          :comparison-columns="comparison.columns"
          :documentation-fields="documentationFields"
          :show-differences-only="canCompareValues && showDifferencesOnly"
          :ariaLabel="`Company comparison: ${selectedDefinition?.label}, ${selectedPeriod}`"
          :in-review-mode="false"
          hide-empty-fields
        />
      </template>
    </section>
  </TheContent>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import Checkbox from 'primevue/checkbox';
import Message from 'primevue/message';
import Select from 'primevue/select';
import { DataTypeEnum } from '@clients/backend';
import TheContent from '@/components/generics/TheContent.vue';
import DatalandProgressSpinner from '@/components/general/DatalandProgressSpinner.vue';
import MultiLayerDataTable from '@/components/resources/dataTable/MultiLayerDataTable.vue';
import { useGetEnrichedPortfolioQuery } from '@/api-queries/user-service/portfolio/useGetEnrichedPortfolioQuery';
import { usePortfolioComparisonDatasets } from '@/components/resources/portfolio/usePortfolioComparisonDatasets';
import { getFrontendFrameworkDefinition } from '@/frameworks/FrontendFrameworkRegistry';
import { useFrameworkDocumentationFields } from '@/utils/useFrameworkDocumentationFields';

const props = defineProps<{ portfolioId: string; isSharedPortfolio: boolean }>();
const backRoute = computed(() => ({
  name: props.isSharedPortfolio ? 'Shared Portfolio Overview' : 'Portfolio Overview',
}));
const portfolioQuery = useGetEnrichedPortfolioQuery(computed(() => props.portfolioId));
const portfolio = portfolioQuery.data;
const companies = computed(() => portfolio.value?.entries ?? []);

const periodsByFramework = computed(() => {
  const periods = new Map<string, Set<string>>();
  for (const company of companies.value) {
    for (const [framework, rawPeriods] of Object.entries(company.availableReportingPeriods)) {
      const available = periods.get(framework) ?? new Set<string>();
      for (const period of rawPeriods
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean))
        available.add(period);
      if (available.size) periods.set(framework, available);
    }
  }
  return periods;
});
const frameworkOptions = computed(() =>
  [...periodsByFramework.value.keys()]
    .map(getFrontendFrameworkDefinition)
    .filter((definition) => definition !== undefined)
    .sort((a, b) => a.label.localeCompare(b.label))
);
const selectedFramework = ref<DataTypeEnum>();
const selectedPeriod = ref<string>();
const showDifferencesOnly = ref(false);
const selectedDefinition = computed(() =>
  frameworkOptions.value.find((option) => option.identifier === selectedFramework.value)
);
const configuration = computed(() => selectedDefinition.value?.getFrameworkViewConfiguration().configuration);
const periodOptions = computed(() =>
  [...(periodsByFramework.value.get(selectedFramework.value ?? '') ?? [])].sort((a, b) =>
    b.localeCompare(a, undefined, { numeric: true })
  )
);

watch(
  frameworkOptions,
  (options) => {
    if (options.some((option) => option.identifier === selectedFramework.value)) return;
    selectedFramework.value = (options.find((option) => option.identifier === DataTypeEnum.Sfdr) ?? options[0])
      ?.identifier;
  },
  { immediate: true }
);
watch(
  periodOptions,
  (options) => {
    if (!options.includes(selectedPeriod.value ?? '')) selectedPeriod.value = options[0];
  },
  { immediate: true }
);

const framework = computed(() => selectedDefinition.value?.identifier);
const comparison = usePortfolioComparisonDatasets(
  companies,
  framework,
  computed(() => selectedPeriod.value)
);
const documentationFields = useFrameworkDocumentationFields(() => framework.value);
const canCompareValues = computed(() => documentationFields.value.byPath.size > 0);
</script>

<style scoped>
.portfolio-comparison {
  min-width: 0;
  overflow-wrap: anywhere;
  padding-inline: clamp(0.75rem, 3vw, 1.5rem);
}

.comparison-controls > div {
  max-width: 100%;
}

@media (min-width: 64rem) {
  .comparison-scroll-hint {
    display: none;
  }
}
</style>
