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
} from "./templates";

export const PIPELINE_TEMPLATES: PipelineTemplate[] = [
  csvToParquet,
  filterAndExport,
  joinAndAggregate,
  scdType2,
  dataQuality,
  windowAnalytics,
  multiSourceUnion,
  splitAndRoute,
];
