import type { DataAndMetaInformation } from '@/api-models/DataAndMetaInformation';
import {
  type AvailableMLDTDisplayObjectTypes,
  MLDTDisplayComponentName,
} from '@/components/resources/dataTable/MultiLayerDataTableCellDisplayer';
import type { MLDTCellConfig, MLDTConfig } from '@/components/resources/dataTable/MultiLayerDataTableConfiguration';
import { getFieldValueFromFrameworkDataset } from '@/components/resources/dataTable/conversion/Utils';
import { NO_DATA_PROVIDED, ONLY_AUXILIARY_DATA_PROVIDED } from '@/utils/Constants';
import type { DocumentationFields } from '@/utils/useFrameworkDocumentationFields';

export interface ComparisonColumn {
  companyId: string;
  companyName: string;
  status: 'available' | 'loading' | 'missing' | 'error';
}

interface ComparisonCell {
  content: AvailableMLDTDisplayObjectTypes;
  extremum?: 'Min' | 'Max';
}

export type ComparisonRows = ReadonlyMap<
  number,
  { children?: ComparisonRows; cells?: readonly (ComparisonCell | undefined)[] }
>;

type ComparisonValue = { value: number; unit: string } | { value: string | boolean };

/** Inspect scalar renderers only. In particular, a modal's button label is not its value. */
function scalarDisplayText(content: AvailableMLDTDisplayObjectTypes): string | undefined {
  switch (content.displayComponentName) {
    case MLDTDisplayComponentName.StringDisplayComponent:
    case MLDTDisplayComponentName.FreeTextDisplayComponent:
      return content.displayValue ?? undefined;
    case MLDTDisplayComponentName.DocumentLinkDisplayComponent:
      return content.displayValue.label;
    case MLDTDisplayComponentName.DataPointDisplayComponent:
      return content.displayValue.value;
    case MLDTDisplayComponentName.DataPointWrapperDisplayComponent:
    case MLDTDisplayComponentName.HighlightHiddenCellDisplay:
      return scalarDisplayText(content.displayValue.innerContents);
    default:
      return undefined;
  }
}

/** Check for metadata that is useful even when the KPI itself is missing. */
function hasAuxiliaryData(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const { quality, comment, dataSource } = value as Record<string, unknown>;
  if (hasText(quality) || hasText(comment)) return true;
  if (!dataSource || typeof dataSource !== 'object') return false;
  const { fileReference, page } = dataSource as Record<string, unknown>;
  return hasText(fileReference) || page != null;
}

/** Treat blank strings as missing data. */
function hasText(value: unknown): value is string {
  return typeof value === 'string' && !!value.trim();
}

/** Check an explicitly supplied modal payload; empty arrays and empty records show no details. */
function hasModalContent(value: unknown): boolean {
  if (typeof value === 'string') return !!value.trim();
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === 'object') return Object.keys(value).length > 0;
  return value != null;
}

/** Determine row emptiness independently of whether the data is comparable. */
function hasCellContent(content: AvailableMLDTDisplayObjectTypes): boolean {
  switch (content.displayComponentName) {
    case MLDTDisplayComponentName.HighlightHiddenCellDisplay:
      return hasCellContent(content.displayValue.innerContents);
    case MLDTDisplayComponentName.DataPointWrapperDisplayComponent:
      return hasAuxiliaryData(content.displayValue) || hasCellContent(content.displayValue.innerContents);
    case MLDTDisplayComponentName.DataPointDisplayComponent:
    case MLDTDisplayComponentName.DocumentLinkDisplayComponent:
      if (hasAuxiliaryData(content.displayValue)) return true;
      break;
    case MLDTDisplayComponentName.ModalLinkDisplayComponent:
    case MLDTDisplayComponentName.ModalLinkWithDataSourceDisplayComponent: {
      const data: Record<string, unknown> | undefined = content.displayValue.modalOptions?.data;
      if (
        content.displayComponentName === MLDTDisplayComponentName.ModalLinkWithDataSourceDisplayComponent &&
        hasAuxiliaryData(content.displayValue)
      ) {
        return true;
      }
      if (hasAuxiliaryData(data?.dataPointDisplay)) return true;
      const payloadKeys = ['listOfRowContents', 'values', 'input'].filter((key) => data && key in data);
      return payloadKeys.length ? payloadKeys.some((key) => hasModalContent(data?.[key])) : true;
    }
  }
  return scalarTextValue(content) !== undefined;
}

/** Ignore the missing-data placeholders used by scalar renderers. */
function scalarTextValue(content: AvailableMLDTDisplayObjectTypes): string | undefined {
  const text = scalarDisplayText(content);
  if (!hasText(text)) return undefined;
  const trimmed = text.trim();
  return trimmed === NO_DATA_PROVIDED || trimmed === ONLY_AUXILIARY_DATA_PROVIDED ? undefined : trimmed;
}

/** Read the KPI value without including its source, quality or comment. */
function comparisonValue<T>(
  cell: MLDTCellConfig<T>,
  dataset: T,
  content: AvailableMLDTDisplayObjectTypes,
  path?: string
): ComparisonValue | undefined {
  if (content.displayComponentName === MLDTDisplayComponentName.HighlightHiddenCellDisplay) {
    return comparisonValue(cell, dataset, content.displayValue.innerContents, path);
  }
  const text = scalarTextValue(content);
  if (!text) return undefined;
  const isNumericField =
    /currency|decimal|integer|number|percentage/i.test(cell.uploadComponentName ?? '') ||
    /^(base|extended)(currency|decimal|integer)/i.test(cell.dataPointTypeId ?? '');
  if (!path) {
    // Formatted numeric strings can round distinct values to the same text. Never use them as numbers.
    // An unverified link or wrapper may display a filename or quality label in place of a KPI.
    return !isNumericField &&
      (content.displayComponentName === MLDTDisplayComponentName.StringDisplayComponent ||
        content.displayComponentName === MLDTDisplayComponentName.FreeTextDisplayComponent)
      ? { value: text }
      : undefined;
  }

  const raw: unknown = getFieldValueFromFrameworkDataset(path, dataset);
  if (raw == null) return undefined;
  const dataPoint = typeof raw === 'object' ? (raw as Record<string, unknown>) : undefined;
  if (dataPoint?.quality === 'NoDataFound') return undefined;
  const value = dataPoint ? (dataPoint.value ?? dataPoint.amount) : raw;
  if (typeof value === 'number' && Number.isFinite(value)) {
    const isCurrency =
      /currency/i.test(cell.uploadComponentName ?? '') ||
      /currency/i.test(cell.dataPointTypeId ?? '') ||
      (dataPoint != null && 'currency' in dataPoint);
    const unit = isCurrency ? dataPoint?.currency : dataPoint?.unit;
    if (isCurrency || (dataPoint && 'unit' in dataPoint)) {
      if (typeof unit !== 'string' || !unit.trim()) return undefined;
      return { value, unit: unit.trim() };
    }
    // A fixed unit is shared by all values of the same KPI row.
    return { value, unit: '' };
  }
  if (!isNumericField) {
    if (typeof value === 'boolean') return { value };
    if (hasText(value)) return { value: value.trim() };
  }
  return undefined;
}

interface ComparisonOptions {
  differencesOnly: boolean;
  hideEmptyFields: boolean;
  documentationFields?: DocumentationFields;
}

/** Build the visible section tree once, preserving the original config indices at every level. */
export function buildComparisonRows<T>(
  config: MLDTConfig<T>,
  datasets: readonly DataAndMetaInformation<T>[],
  columns: readonly ComparisonColumn[],
  options: ComparisonOptions
): { rows: ComparisonRows; hasData: boolean } {
  let hasData = false;
  const paths = new Map<string, string | undefined>();
  for (const [path, field] of options.documentationFields?.byPath ?? []) {
    // A reused type ID does not uniquely identify the value rendered by a row.
    paths.set(field.id, paths.has(field.id) ? undefined : path);
  }

  /** Visit applicable datasets only, leaving unavailable columns in their original positions. */
  function visit(config: MLDTConfig<T>, datasets: readonly (DataAndMetaInformation<T> | undefined)[]): ComparisonRows {
    const rows = new Map<number, { children?: ComparisonRows; cells?: (ComparisonCell | undefined)[] }>();
    for (const [index, entry] of config.entries()) {
      const applicable = datasets.map((dataset) =>
        dataset && entry.shouldDisplay(dataset.data) ? dataset : undefined
      );
      if (!applicable.some(Boolean)) continue;
      if (entry.type === 'section') {
        const children = visit(entry.children, applicable);
        if (children.size) rows.set(index, { children });
      } else {
        const contents = applicable.map((dataset) => (dataset ? entry.valueGetter(dataset.data) : undefined));
        const populated = contents.some((content) => content && hasCellContent(content));
        hasData ||= populated;
        if (options.hideEmptyFields && !populated) continue;
        const cells = buildComparisonCells(
          entry,
          applicable,
          contents,
          options.differencesOnly,
          paths.get(entry.dataPointTypeId ?? '')
        );
        if (cells) rows.set(index, { cells });
      }
    }
    return rows;
  }

  const rows = visit(
    config,
    datasets.map((dataset, index) => (columns[index]?.status === 'available' ? dataset : undefined))
  );
  return { rows, hasData };
}

/** Find differences within comparable groups and label extrema only for an unambiguous numeric row. */
function buildComparisonCells<T>(
  entry: MLDTCellConfig<T>,
  datasets: readonly (DataAndMetaInformation<T> | undefined)[],
  contents: readonly (AvailableMLDTDisplayObjectTypes | undefined)[],
  differencesOnly: boolean,
  path?: string
): (ComparisonCell | undefined)[] | undefined {
  const groups = new Map<string, Set<number | string | boolean>>();
  const cells = contents.map((content, index) => {
    const dataset = datasets[index];
    if (!dataset || !content) return undefined;
    const comparison = comparisonValue(entry, dataset.data, content, path);
    if (comparison) {
      const group = 'unit' in comparison ? `number:${comparison.unit}` : typeof comparison.value;
      const values = groups.get(group) ?? new Set();
      values.add(comparison.value);
      groups.set(group, values);
    }
    return { content, comparison };
  });
  if (differencesOnly && ![...groups.values()].some((values) => values.size > 1)) return undefined;

  const numbers = cells.flatMap((cell) => (typeof cell?.comparison?.value === 'number' ? [cell.comparison.value] : []));
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  if (groups.size !== 1 || numbers.length < 2 || min === max) return cells;

  return cells.map((cell) => {
    if (!cell) return undefined;
    const value = cell.comparison?.value;
    return { content: cell.content, extremum: value === min ? 'Min' : value === max ? 'Max' : undefined };
  });
}
