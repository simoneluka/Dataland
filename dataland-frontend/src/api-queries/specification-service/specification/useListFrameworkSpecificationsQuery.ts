import { useQuery, type UseQueryOptions, type UseQueryReturnType } from '@tanstack/vue-query';
import { useApiClient } from '@/utils/useApiClient';
import { specificationKeys } from '@/api-queries/specification-service/specification/specificationKeys';
import { type SimpleFrameworkSpecification } from '@clients/specificationservice';

/**
 * Vue Query hook that lists all framework specifications (id, reference and name) known to the specification service.
 *
 * @param options - Additional TanStack query options.
 * @returns Vue Query result containing the list of {@link SimpleFrameworkSpecification}.
 */
export function useListFrameworkSpecificationsQuery(
  options: Omit<UseQueryOptions<SimpleFrameworkSpecification[], Error>, 'queryKey' | 'queryFn'> = {}
): UseQueryReturnType<SimpleFrameworkSpecification[], Error> {
  const apiClientProvider = useApiClient();

  return useQuery<SimpleFrameworkSpecification[], Error>({
    queryKey: specificationKeys.frameworkList(),
    queryFn: async () => {
      const response = await apiClientProvider.apiClients.specificationController.listFrameworkSpecifications();
      return response.data;
    },
    ...options,
  });
}
