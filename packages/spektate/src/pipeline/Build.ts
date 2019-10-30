import { IRepository } from "../repository/Repository";
import { IPipelineStages } from "./PipelineStage";

export interface IBuild {
  buildNumber: string;
  id: string;
  author: string;
  queueTime: Date;
  result: string;
  status: string;
  sourceBranch: string;
  sourceVersion: string;
  sourceVersionURL: string;
  startTime: Date;
  finishTime: Date;
  URL: string;
  repository?: IRepository;
  lastUpdateTime?: Date;
  timelineURL: string;
  stages?: IPipelineStages;
}
