<template>
  <TheContent class="p-4 text-left" data-test="specification-documentation-page">
    <h1 class="m-0 mb-2">Framework Documentation</h1>
    <p class="mt-0 mb-4">
      Browse the frameworks supported by Dataland and explore the data points they consist of, including their business
      definitions.
    </p>

    <div v-if="isPending" class="flex justify-content-center py-6">
      <DatalandProgressSpinner />
    </div>
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
          class="w-full md:w-20rem"
        />
      </IconField>

      <DataTable :value="filteredFrameworks" data-test="specification-documentation-table">
        <template #empty>No frameworks found.</template>
        <Column header="NAME" field="name" :sortable="true" />
        <Column header="ID" field="framework.id" :sortable="true" />
      </DataTable>
    </template>
  </TheContent>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import TheContent from '@/components/generics/TheContent.vue';
import DatalandProgressSpinner from '@/components/general/DatalandProgressSpinner.vue';
import { useListFrameworkSpecificationsQuery } from '@/api-queries/specification-service/specification/useListFrameworkSpecificationsQuery.ts';
import { formatAxiosErrorMessage } from '@/utils/AxiosErrorMessageFormatter.ts';

const searchText = ref('');
const { data: frameworks, isPending, isError, error } = useListFrameworkSpecificationsQuery();

const filteredFrameworks = computed(() => {
  const search = searchText.value.trim().toLowerCase();
  return (frameworks.value ?? []).filter(
    (framework) =>
      framework.name.toLowerCase().includes(search) || framework.framework.id.toLowerCase().includes(search)
  );
});
</script>
