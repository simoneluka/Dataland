<template>
  <Card class="doc-card w-full" data-test="framework-documentation-page">
    <template #title>
      <span data-test="framework-documentation-name">{{ framework?.name ?? frameworkId }}</span>
    </template>
    <template #content>
      <div v-if="isPending" class="flex justify-content-center py-4"><DatalandProgressSpinner /></div>
      <Message v-else-if="isError" severity="error" data-test="framework-documentation-error">
        Failed to load the framework. {{ error ? formatAxiosErrorMessage(error) : '' }}
      </Message>
      <template v-else-if="framework">
        <p class="mt-0" data-test="framework-documentation-definition">{{ framework.businessDefinition }}</p>
        <p v-if="framework.referencedReportJsonPath">
          Referenced report JSON path: <code>{{ framework.referencedReportJsonPath }}</code>
        </p>
        <Message v-if="!treeNodes" severity="warn" data-test="framework-documentation-schema-error">
          The schema of this framework could not be read.
        </Message>
        <Tree
          v-else
          v-model:selectionKeys="selectionKeys"
          v-model:expandedKeys="expandedKeys"
          :value="treeNodes"
          selectionMode="single"
          filter
          filterMode="lenient"
          filterPlaceholder="Search data points"
          data-test="framework-documentation-tree"
          @node-select="onNodeSelect"
          @node-unselect="emit('select-data-point-type', undefined)"
        />
      </template>
    </template>
  </Card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import Card from 'primevue/card';
import Message from 'primevue/message';
import Tree from 'primevue/tree';
import type { TreeNode } from 'primevue/treenode';
import DatalandProgressSpinner from '@/components/general/DatalandProgressSpinner.vue';
import { useGetFrameworkSpecificationQuery } from '@/api-queries/specification-service/specification/useGetFrameworkSpecificationQuery.ts';
import { formatAxiosErrorMessage } from '@/utils/AxiosErrorMessageFormatter.ts';
import { buildFrameworkSchemaTree, type DataPointLeafData } from '@/utils/FrameworkSchemaParser.ts';

const props = defineProps<{ frameworkId: string; selectedPath?: string }>();
const emit = defineEmits<{
  (e: 'select-data-point-type', id: string | undefined, aliasExport?: string, path?: string): void;
}>();

const selectionKeys = ref<Record<string, boolean>>({});
const expandedKeys = ref<Record<string, boolean>>({});
const {
  data: framework,
  isPending,
  isError,
  error,
} = useGetFrameworkSpecificationQuery({ frameworkId: () => props.frameworkId });

const treeNodes = computed<TreeNode[] | undefined>(() => {
  if (!framework.value) return [];
  try {
    return buildFrameworkSchemaTree(framework.value.schema);
  } catch {
    return undefined;
  }
});

watch(
  () => props.frameworkId,
  () => {
    selectionKeys.value = {};
    expandedKeys.value = {};
  }
);

watch(
  () => [props.frameworkId, props.selectedPath] as const,
  ([, path]) => {
    selectionKeys.value = path ? { [path]: true } : {};
    const segments = path?.split('.') ?? [];
    for (let index = 1; index < segments.length; index++) {
      expandedKeys.value[segments.slice(0, index).join('.')] = true;
    }
  },
  { immediate: true }
);

/**
 * Forwards the data point type id of the selected leaf.
 *
 * @param node the selected tree node
 */
function onNodeSelect(node: TreeNode): void {
  const { id, aliasExport } = node.data as DataPointLeafData;
  emit('select-data-point-type', id, aliasExport, node.key);
}
</script>

<style scoped>
.doc-card {
  min-width: 0;
  overflow-wrap: anywhere;
}

.doc-card :deep(.p-tree-node-label) {
  min-width: 0;
}
</style>
