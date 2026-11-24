<template>
  <div class="doc-card flex flex-column gap-3">
    <Card data-test="data-point-type-documentation">
      <template #title>Data point</template>
      <template #content>
        <div v-if="isPending" class="flex justify-content-center py-4"><DatalandProgressSpinner /></div>
        <Message v-else-if="isError" severity="error" data-test="data-point-type-documentation-error">
          Failed to load the data point type. {{ error ? formatAxiosErrorMessage(error) : '' }}
        </Message>
        <template v-else-if="dataPointType">
          <h3 class="mt-0 mb-1" data-test="data-point-type-documentation-name">{{ dataPointType.name }}</h3>
          <p class="mt-0 text-color-secondary">ID: {{ dataPointType.dataPointType.id }}</p>
          <p data-test="data-point-type-documentation-definition">{{ dataPointType.businessDefinition }}</p>
          <p v-if="aliasExport" data-test="data-point-type-documentation-alias">
            Export alias: <code>{{ aliasExport }}</code>
          </p>
          <p>
            Base type:
            <a
              href="#"
              data-test="data-point-type-documentation-base-type"
              @click.prevent="emit('select-base-type', dataPointType.dataPointBaseType.id)"
            >
              {{ dataPointType.dataPointBaseType.id }}
            </a>
          </p>
          <p class="mb-1">Used in frameworks:</p>
          <ul class="mt-0 pl-4" data-test="data-point-type-documentation-used-by">
            <li v-for="framework in dataPointType.usedBy" :key="framework.id">
              <router-link :to="`/documentation/frameworks/${framework.id}`">{{ framework.id }}</router-link>
            </li>
          </ul>
          <template v-if="dataPointType.constraints?.length">
            <p class="mb-1">Constraints:</p>
            <ul class="mt-0 pl-4">
              <li v-for="constraint in dataPointType.constraints" :key="constraint">{{ constraint }}</li>
            </ul>
          </template>
          <template v-if="dataPointType.calculationRules.length">
            <p class="mb-1">Calculation rules:</p>
            <ul class="mt-0 pl-4">
              <li v-for="(rule, index) in dataPointType.calculationRules" :key="index">
                {{ rule.calculationMethod }} ({{ rule.inputs.join(', ') }})
              </li>
            </ul>
          </template>
        </template>
      </template>
    </Card>
    <Card v-if="dataPointType && !isError" data-test="data-point-raw-json-card">
      <template #title>Raw JSON</template>
      <template #content><RawJsonView :value="dataPointType" /></template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import Card from 'primevue/card';
import Message from 'primevue/message';
import RawJsonView from '@/components/resources/RawJsonView.vue';
import DatalandProgressSpinner from '@/components/general/DatalandProgressSpinner.vue';
import { useGetDataPointTypeSpecificationQuery } from '@/api-queries/specification-service/specification/useGetDataPointTypeSpecificationQuery.ts';
import { formatAxiosErrorMessage } from '@/utils/AxiosErrorMessageFormatter.ts';

const props = defineProps<{ dataPointTypeId: string; aliasExport?: string }>();
const emit = defineEmits<{ (e: 'select-base-type', id: string): void }>();
const {
  data: dataPointType,
  isPending,
  isError,
  error,
} = useGetDataPointTypeSpecificationQuery({ dataPointTypeId: () => props.dataPointTypeId });
</script>

<style scoped>
.doc-card {
  min-width: 0;
  overflow-wrap: anywhere;
}
</style>
