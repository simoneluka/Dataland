<template>
  <TheContent class="p-4 text-left" data-test="specification-documentation-page">
    <h1 class="m-0 mb-2">Framework Documentation</h1>
    <p class="mt-0 mb-4">
      Browse the frameworks supported by Dataland and explore the data points they consist of, including their business
      definitions. The info icon next to a documented dataset field opens the matching data point here.
    </p>

    <div class="flex flex-column lg:flex-row gap-4 align-items-start">
      <Card class="w-full lg:w-18rem flex-shrink-0" data-test="specification-documentation-selection">
        <template #title>Frameworks</template>
        <template #content>
          <div v-if="isPending" class="flex justify-content-center py-4"><DatalandProgressSpinner /></div>
          <Message v-else-if="isError" severity="error" data-test="specification-documentation-error">
            Failed to load the framework documentation. {{ error ? formatAxiosErrorMessage(error) : '' }}
          </Message>
          <template v-else>
            <IconField class="mb-3">
              <InputIcon class="pi pi-search" />
              <InputText
                v-model="searchText"
                placeholder="Search frameworks"
                data-test="specification-documentation-search"
                class="w-full"
              />
            </IconField>
            <Listbox
              :model-value="selectedFrameworkId"
              :options="filteredFrameworks"
              option-label="name"
              option-value="framework.id"
              empty-message="No frameworks found."
              scroll-height="auto"
              class="w-full"
              data-test="specification-documentation-table"
              @update:model-value="onSelectFramework"
            />
          </template>
        </template>
      </Card>

      <FrameworkDocumentationTree
        v-if="selectedFrameworkId"
        class="flex-1"
        :framework-id="selectedFrameworkId"
        :selected-path="selectedDataPoint ? selectedDataPointPath : undefined"
        @select-data-point-type="onSelectDataPointType"
      />
      <Card v-else class="w-full flex-1" data-test="specification-documentation-placeholder">
        <template #content>Select a framework to see its documentation.</template>
      </Card>

      <aside v-if="selectedDataPoint" class="flex flex-column gap-3 w-full lg:w-20rem flex-shrink-0">
        <DataPointTypeDocumentation
          :data-point-type-id="selectedDataPoint.id"
          :alias-export="selectedDataPoint.aliasExport"
          @select-base-type="selectedBaseTypeId = $event"
        />
        <DataPointBaseTypeDocumentation v-if="selectedBaseTypeId" :data-point-base-type-id="selectedBaseTypeId" />
      </aside>
    </div>
  </TheContent>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Card from 'primevue/card';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Listbox from 'primevue/listbox';
import Message from 'primevue/message';
import TheContent from '@/components/generics/TheContent.vue';
import DatalandProgressSpinner from '@/components/general/DatalandProgressSpinner.vue';
import FrameworkDocumentationTree from '@/components/resources/FrameworkDocumentationTree.vue';
import DataPointTypeDocumentation from '@/components/resources/DataPointTypeDocumentation.vue';
import DataPointBaseTypeDocumentation from '@/components/resources/DataPointBaseTypeDocumentation.vue';
import { useListFrameworkSpecificationsQuery } from '@/api-queries/specification-service/specification/useListFrameworkSpecificationsQuery.ts';
import { formatAxiosErrorMessage } from '@/utils/AxiosErrorMessageFormatter.ts';
import { useFrameworkDocumentationFields } from '@/utils/useFrameworkDocumentationFields.ts';

const route = useRoute();
const router = useRouter();
const searchText = ref('');
const selectedBaseTypeId = ref<string | undefined>();
const { data: frameworks, isPending, isError, error } = useListFrameworkSpecificationsQuery();

const selectedFrameworkId = computed(() => (route.params.frameworkId as string | undefined) || undefined);
const selectedDataPointPath = computed(() =>
  typeof route.query.dataPoint === 'string' ? route.query.dataPoint : undefined
);
const documentationFields = useFrameworkDocumentationFields(() => selectedFrameworkId.value);
const selectedDataPoint = computed(() => documentationFields.value.byPath.get(selectedDataPointPath.value ?? ''));

watch([selectedFrameworkId, selectedDataPointPath], () => {
  selectedBaseTypeId.value = undefined;
});

const filteredFrameworks = computed(() => {
  const search = searchText.value.trim().toLowerCase();
  return (frameworks.value ?? []).filter(
    (framework) =>
      framework.name.toLowerCase().includes(search) || framework.framework.id.toLowerCase().includes(search)
  );
});

/**
 * Navigates to the documentation of the selected framework.
 *
 * @param frameworkId id of the selected framework, null if the selection was cleared
 */
async function onSelectFramework(frameworkId: string | null): Promise<void> {
  if (frameworkId) await router.push(`/documentation/frameworks/${frameworkId}`);
}

/**
 * Navigates to the selected schema field so that its documentation can be linked directly.
 *
 * @param _id id of the selected data point type
 * @param _aliasExport export alias of the selected field
 * @param path schema path of the selected field, undefined when deselected
 */
async function onSelectDataPointType(_id: string | undefined, _aliasExport?: string, path?: string): Promise<void> {
  await router.push({
    name: 'Framework Documentation Details',
    params: { frameworkId: selectedFrameworkId.value },
    query: { dataPoint: path },
  });
}
</script>
