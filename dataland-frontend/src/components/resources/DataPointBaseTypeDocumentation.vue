<template>
  <Card class="doc-card w-full" data-test="base-type-documentation">
    <template #title>Base type</template>
    <template #content>
      <div v-if="isPending" class="flex justify-content-center py-4"><DatalandProgressSpinner /></div>
      <Message v-else-if="isError" severity="error" data-test="base-type-documentation-error">
        Failed to load the base type. {{ error ? formatAxiosErrorMessage(error) : '' }}
      </Message>
      <template v-else-if="baseType">
        <h3 class="mt-0 mb-1" data-test="base-type-documentation-name">{{ baseType.name }}</h3>
        <p class="mt-0 text-color-secondary">ID: {{ baseType.dataPointBaseType.id }}</p>
        <p data-test="base-type-documentation-definition">{{ baseType.businessDefinition }}</p>
        <p>
          Validated by: <code>{{ baseType.validatedBy }}</code>
        </p>
        <p class="mb-1">Example:</p>
        <pre class="example-json mt-0 surface-ground p-2 border-round">{{
          JSON.stringify(baseType.example, null, 2)
        }}</pre>
        <p class="mb-1">Used by data point types:</p>
        <ul class="mt-0 pl-4">
          <li v-for="usage in baseType.usedBy" :key="usage.id">{{ usage.id }}</li>
        </ul>
      </template>
    </template>
  </Card>
</template>

<script setup lang="ts">
import Card from 'primevue/card';
import Message from 'primevue/message';
import DatalandProgressSpinner from '@/components/general/DatalandProgressSpinner.vue';
import { useGetDataPointBaseTypeSpecificationQuery } from '@/api-queries/specification-service/specification/useGetDataPointBaseTypeSpecificationQuery.ts';
import { formatAxiosErrorMessage } from '@/utils/AxiosErrorMessageFormatter.ts';

const props = defineProps<{ dataPointBaseTypeId: string }>();
const {
  data: baseType,
  isPending,
  isError,
  error,
} = useGetDataPointBaseTypeSpecificationQuery({ dataPointBaseTypeId: () => props.dataPointBaseTypeId });
</script>

<style scoped>
.doc-card {
  min-width: 0;
  overflow-wrap: anywhere;
}

.example-json {
  white-space: pre-wrap;
}
</style>
