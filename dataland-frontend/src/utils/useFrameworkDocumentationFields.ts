import { computed, type InjectionKey, type ComputedRef } from 'vue';
import { useGetFrameworkSpecificationQuery } from '@/api-queries/specification-service/specification/useGetFrameworkSpecificationQuery.ts';
import { useListFrameworkSpecificationsQuery } from '@/api-queries/specification-service/specification/useListFrameworkSpecificationsQuery.ts';
import { buildFrameworkSchemaTree, type DataPointLeafData } from '@/utils/FrameworkSchemaParser.ts';
import type { TreeNode } from 'primevue/treenode';

export interface DocumentationFields {
  frameworkId: string | undefined;
  byPath: ReadonlyMap<string, DataPointLeafData>;
  pathByTypeId: ReadonlyMap<string, string>;
}

export const uploadDocumentationFieldsKey: InjectionKey<ComputedRef<DocumentationFields>> = Symbol();

/**
 * Indexes documented fields by schema path and type ID. The first occurrence is used when only the type ID is known.
 * @param frameworkId the current framework ID
 * @returns the documentation field index
 */
export function useFrameworkDocumentationFields(
  frameworkId: () => string | undefined
): ComputedRef<DocumentationFields> {
  const { data: frameworks } = useListFrameworkSpecificationsQuery();
  const documentedFrameworkId = computed(() => {
    const id = frameworkId();
    return frameworks.value?.find((entry) => entry.framework.id === id)?.framework.id;
  });
  const { data: specification } = useGetFrameworkSpecificationQuery({ frameworkId: documentedFrameworkId });

  return computed(() => {
    const byPath = new Map<string, DataPointLeafData>();
    const pathByTypeId = new Map<string, string>();
    const index: DocumentationFields = { frameworkId: documentedFrameworkId.value, byPath, pathByTypeId };
    if (!specification.value) return index;
    let nodes: TreeNode[];
    try {
      nodes = buildFrameworkSchemaTree(specification.value.schema);
    } catch {
      return index;
    }

    /** @param entries the schema tree nodes to index */
    function visit(entries: TreeNode[]): void {
      for (const node of entries) {
        if (node.leaf) {
          const field = node.data as DataPointLeafData;
          byPath.set(node.key, field);
          if (!pathByTypeId.has(field.id)) pathByTypeId.set(field.id, node.key);
        }
        if (node.children) visit(node.children);
      }
    }
    visit(nodes);
    return index;
  });
}
