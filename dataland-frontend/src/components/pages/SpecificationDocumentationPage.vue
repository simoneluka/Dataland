<template>
  <TheContent class="p-4 text-left" data-test="specification-documentation-page">
    <h1 class="m-0 mb-2">Framework Documentation</h1>
    <p class="mt-0 mb-4">
      Browse the frameworks supported by Dataland and explore the data points they consist of, including their business
      definitions.
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
            <ul class="list-none p-0 m-0" data-test="specification-documentation-table">
              <li v-if="filteredFrameworks.length === 0">No frameworks found.</li>
              <li v-for="framework in filteredFrameworks" :key="framework.framework.id">
                <router-link
                  :to="`/documentation/frameworks/${framework.framework.id}`"
                  class="block py-2 no-underline"
                  :class="{ 'font-bold': framework.framework.id === selectedFrameworkId }"
                  :data-test="`framework-link-${framework.framework.id}`"
                >
                  {{ framework.name }}
                </router-link>
              </li>
            </ul>
          </template>
        </template>
      </Card>

      <FrameworkDocumentationTree
        v-if="selectedFrameworkId"
        class="flex-1"
        :framework-id="selectedFrameworkId"
        @select-data-point-type="onSelectDataPointType"
      />
      <p v-else class="mt-0" data-test="specification-documentation-placeholder">
        Select a framework to see its documentation.
      </p>

      <DataPointTypeDocumentation
        v-if="selectedDataPointTypeId"
        class="w-full lg:w-20rem flex-shrink-0"
        :data-point-type-id="selectedDataPointTypeId"
        :alias-export="selectedAliasExport"
        @select-base-type="selectedBaseTypeId = $event"
      />
      <DataPointBaseTypeDocumentation
        v-if="selectedDataPointTypeId && selectedBaseTypeId"
        class="w-full lg:w-20rem flex-shrink-0"
        :data-point-base-type-id="selectedBaseTypeId"
      />
    </div>
  </TheContent>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import Card from 'primevue/card';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import TheContent from '@/components/generics/TheContent.vue';
import DatalandProgressSpinner from '@/components/general/DatalandProgressSpinner.vue';
import FrameworkDocumentationTree from '@/components/resources/FrameworkDocumentationTree.vue';
import DataPointTypeDocumentation from '@/components/resources/DataPointTypeDocumentation.vue';
import DataPointBaseTypeDocumentation from '@/components/resources/DataPointBaseTypeDocumentation.vue';
import { useListFrameworkSpecificationsQuery } from '@/api-queries/specification-service/specification/useListFrameworkSpecificationsQuery.ts';
import { formatAxiosErrorMessage } from '@/utils/AxiosErrorMessageFormatter.ts';

const route = useRoute();
const searchText = ref('');
const selectedDataPointTypeId = ref<string | undefined>();
const selectedAliasExport = ref<string | undefined>();
const selectedBaseTypeId = ref<string | undefined>();
const { data: frameworks, isPending, isError, error } = useListFrameworkSpecificationsQuery();

const selectedFrameworkId = computed(() => (route.params.frameworkId as string | undefined) || undefined);

const filteredFrameworks = computed(() => {
  const search = searchText.value.trim().toLowerCase();
  return (frameworks.value ?? []).filter(
    (framework) =>
      framework.name.toLowerCase().includes(search) || framework.framework.id.toLowerCase().includes(search)
  );
});

/**
 * Stores the selected data point type and closes the base type panel.
 *
 * @param id id of the selected data point type, undefined if the selection was reset
 * @param aliasExport export alias of the selected field, if any
 */
function onSelectDataPointType(id: string | undefined, aliasExport?: string): void {
  selectedDataPointTypeId.value = id;
  selectedAliasExport.value = aliasExport;
  selectedBaseTypeId.value = undefined;
}
</script>
