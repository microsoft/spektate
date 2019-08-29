import { IStatusProps } from "azure-devops-ui/Status";
import Deployment from "./models/Deployment";
import { Author } from "./models/repository/Author";
import { Tag } from "./models/repository/Tag";

export interface IStatusIndicatorData {
  statusProps: IStatusProps;
  label: string;
}
export interface IAuthors {
  [commitId: string]: Author;
}
export interface IDashboardState {
  deployments: Deployment[];
  manifestSync?: Tag;
  authors: IAuthors;
}
export interface IDeploymentField {
  deploymentId: string;
  service: string;
  startTime?: Date;
  imageTag?: string;
  srcCommitId?: string;
  srcBranchName?: string;
  srcCommitURL?: string;
  srcPipelineId?: string;
  srcPipelineURL?: string;
  srcPipelineResult?: string;
  dockerPipelineId?: string;
  dockerPipelineURL?: string;
  environment?: string;
  dockerPipelineResult?: string;
  hldCommitId?: string;
  hldCommitURL?: string;
  hldPipelineId?: string;
  hldPipelineURL?: string;
  hldPipelineResult?: string;
  duration: string;
  status: string;
  clusterSync?: boolean;
  clusterSyncDate?: Date;
  endTime?: Date;
  authorName?: string;
  authorURL?: string;
}
