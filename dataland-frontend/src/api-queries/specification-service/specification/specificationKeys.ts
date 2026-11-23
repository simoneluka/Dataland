export const specificationKeys = {
  all: ['specification'] as const,
  frameworkList: () => [...specificationKeys.all, 'frameworkList'] as const,
  frameworkById: (frameworkId: string | undefined) => [...specificationKeys.all, 'frameworkById', frameworkId] as const,
  dataPointTypeById: (dataPointTypeId: string | undefined) =>
    [...specificationKeys.all, 'dataPointTypeById', dataPointTypeId] as const,
  dataPointBaseTypeById: (dataPointBaseTypeId: string | undefined) =>
    [...specificationKeys.all, 'dataPointBaseTypeById', dataPointBaseTypeId] as const,
};
