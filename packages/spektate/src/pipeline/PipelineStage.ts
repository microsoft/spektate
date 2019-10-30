export interface IPipelineStage {
  name: string;
  id: string;
  state: string;
  result: string;
  order: number;
}
export interface IPipelineStages {
  [order: number]: IPipelineStage;
}
