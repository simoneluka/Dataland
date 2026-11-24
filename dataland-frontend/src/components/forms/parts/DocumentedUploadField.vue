<template>
  <div class="flex align-items-start gap-2">
    <div class="field-content flex-1"><slot /></div>
    <DataPointDocumentationLink
      v-if="frameworkId && isDocumented"
      :framework-id="frameworkId"
      :path="path"
      :label="label"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';
import DataPointDocumentationLink from '@/components/resources/DataPointDocumentationLink.vue';
import { uploadDocumentationFieldsKey } from '@/utils/useFrameworkDocumentationFields.ts';

const props = defineProps<{ path: string; label: string }>();
const fields = inject(uploadDocumentationFieldsKey, undefined);
const frameworkId = computed(() => fields?.value.frameworkId);
const isDocumented = computed(() => fields?.value.byPath.has(props.path));
</script>

<style scoped>
.field-content {
  min-width: 0;
}
</style>
