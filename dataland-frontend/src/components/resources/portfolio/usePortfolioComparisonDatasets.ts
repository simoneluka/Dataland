import { computed, type ComputedRef } from 'vue';
import { useQueries } from '@tanstack/vue-query';
import { isAxiosError } from 'axios';
import { QaStatus, type DataTypeEnum } from '@clients/backend';
import { useAllCompanyFrameworkDataQueryOptions } from '@/api-queries/backend/framework-data/useGetAllCompanyFrameworkDataQuery';
import type { DataAndMetaInformation } from '@/api-models/DataAndMetaInformation';
import type { ComparisonColumn } from '@/components/resources/dataTable/MultiLayerDataTableComparison';

interface ComparisonCompany {
  companyId: string;
  companyName: string;
  availableReportingPeriods: Record<string, string>;
}

interface PortfolioComparisonData {
  columns: ComparisonColumn[];
  datasets: DataAndMetaInformation<object>[];
}

/** Loads datasets for the portfolio companies and aligns them with stable company columns. */
export function usePortfolioComparisonDatasets(
  companies: ComputedRef<readonly ComparisonCompany[]>,
  framework: ComputedRef<DataTypeEnum | undefined>,
  period: ComputedRef<string | undefined>
): ComputedRef<PortfolioComparisonData> {
  const queryOptions = useAllCompanyFrameworkDataQueryOptions();
  const eligibleCompanies = computed(() => {
    const frameworkId = framework.value;
    const reportingPeriod = period.value;
    if (!frameworkId || !reportingPeriod) return [];
    return companies.value.filter((company) =>
      company.availableReportingPeriods[frameworkId]?.split(',').some((value) => value.trim() === reportingPeriod)
    );
  });
  const results = useQueries({
    queries: computed(() =>
      eligibleCompanies.value.map(({ companyId }) => ({
        ...queryOptions(framework.value, companyId),
        retry: (count: number, error: Error): boolean =>
          count < 1 && !(isAxiosError(error) && [401, 403, 404].includes(error.response?.status ?? 0)),
      }))
    ),
  });

  return computed(() => {
    const dataType = framework.value;
    const reportingPeriod = period.value;
    const result: PortfolioComparisonData = { columns: [], datasets: [] };
    if (!dataType || !reportingPeriod) return result;
    const byCompany = new Map(eligibleCompanies.value.map(({ companyId }, index) => [companyId, results.value[index]]));

    for (const { companyId, companyName } of companies.value) {
      const query = byCompany.get(companyId);
      const dataset = query?.data?.find(
        ({ metaInfo }) =>
          metaInfo.companyId === companyId && metaInfo.reportingPeriod === reportingPeriod && metaInfo.currentlyActive
      );
      let status: ComparisonColumn['status'] = 'missing';
      if (dataset) status = 'available';
      else if (query?.isPending) status = 'loading';
      else if (query?.isError && !(isAxiosError(query.error) && query.error.response?.status === 404)) status = 'error';
      result.columns.push({ companyId, companyName, status });
      result.datasets.push(
        dataset ?? {
          data: {},
          metaInfo: {
            companyId,
            dataType,
            reportingPeriod,
            dataId: '',
            uploadTime: 0,
            currentlyActive: false,
            qaStatus: QaStatus.Pending,
          },
        }
      );
    }
    return result;
  });
}
