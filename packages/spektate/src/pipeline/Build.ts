import { IAzureDevOpsRepo } from "../repository/IAzureDevOpsRepo";
import { IGitHub } from "../repository/IGitHub";
import { IGitlabRepo } from "../repository/IGitlabRepo";
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
  repository?: IGitHub | IAzureDevOpsRepo | IGitlabRepo;
  lastUpdateTime?: Date;
  timelineURL: string;
  stages?: IPipelineStages;
}

export const copy = (build: IBuild): IBuild | undefined => {
  if (!build) {
    return undefined;
  }
  const newBuild: IBuild = {
    URL: build.URL,
    author: build.author,
    buildNumber: build.buildNumber,
    finishTime: build.finishTime,
    id: build.id,
    lastUpdateTime: build.lastUpdateTime,
    queueTime: build.queueTime,
    repository: build.repository,
    result: build.result,
    sourceBranch: build.sourceBranch,
    sourceVersion: build.sourceVersion,
    sourceVersionURL: build.sourceVersionURL,
    stages: build.stages,
    startTime: build.startTime,
    status: build.status,
    timelineURL: build.timelineURL
  };
  return newBuild;
};
