export interface PipelineTemplate {
  id: string;
  name: string;
  description: string;
  nodeCount: number;
  category: string;
  yaml: string;
}

export {
  csvToParquet,
  filterAndExport,
  joinAndAggregate,
  scdType2,
  dataQuality,
  windowAnalytics,
  multiSourceUnion,
  splitAndRoute,
  sqlAnalytics,
  featureEngineering,
  pivotReport,
  apiEnrichment,
  conditionalTiering,
  medallionArchitecture,
  dataSampling,
  customer360,
} from "./templates";

import {
  csvToParquet,
  filterAndExport,
  joinAndAggregate,
  scdType2,
  dataQuality,
  windowAnalytics,
  multiSourceUnion,
  splitAndRoute,
  sqlAnalytics,
  featureEngineering,
  pivotReport,
  apiEnrichment,
  conditionalTiering,
  medallionArchitecture,
  dataSampling,
  customer360,
} from "./templates";

export const PIPELINE_TEMPLATES: PipelineTemplate[] = [
  csvToParquet,
  filterAndExport,
  dataSampling,
  joinAndAggregate,
  featureEngineering,
  multiSourceUnion,
  scdType2,
  medallionArchitecture,
  customer360,
  apiEnrichment,
  dataQuality,
  sqlAnalytics,
  windowAnalytics,
  pivotReport,
  splitAndRoute,
  conditionalTiering,
];
